## 现状总览
- 双后端：`System/backend` 连接 `parking_admin`（如 `System/backend/server.js:139`），`backend` 连接 `parking_system`（如 `backend/server.js:58`）。
- 使用 Mongoose 直连 MongoDB，存在双向同步脚本：`backend/scripts/sync-from-system-db.js`、`System/backend/scripts/sync-from-tcc-db.js`。
- 核心模型分散在 `System/backend/models/*`（例如 `ParkingSpace.js`、`User.js`、`SystemSettings.js`、`SystemLog.js`、`miniprogram.js`）。
- 未发现生产使用的 Change Streams，当前靠定时/脚本同步；启动脚本集中在 `tools/start-*.bat` 与 `start-all.ps1`（`c:\Users\wanan\Desktop\Sync\tcc\start-all.ps1:1`）。

## 目标与原则
- 统一单一 MongoDB 数据库实例与 Schema，供微信小程序与 System 后台共用。
- 保留历史数据的无损迁移路径；所有写操作具备原子性与一致性保证。
- 用 Change Streams 构建实时数据分发，替代定时同步；确保核心功能不受影响：实时车位状态、最优路径、用户轨迹、三维地图渲染。

## 统一数据模型设计
- 核心实体：
  - `ParkingLot`（停车场元信息、拓扑、楼层/区域、入口/出口、3D 资源绑定）
  - `ParkingSpace`（编号、所属场/楼层、几何位置信息、状态、传感器/摄像头绑定、最后更新时间）
  - `OccupancyEvent`（车位占用/释放事件流，来源设备、置信度、事件时间戳、关联车辆）
  - `Vehicle`（车牌、车辆类型、黑白名单、绑定用户）
  - `User`（账号、角色/权限、微信 openId/unionId 统一建模）
  - `Route`（导航路径结果、起终点、成本度量、生成策略、版本）
  - `NavigationTrace`（用户导航轨迹、采样点、进入/退出时间、路径偏移、关联设备）
  - `MapAsset3D`（三维资源、版本、LOD、切片索引、依赖关系）
- 统一字段原则：
  - 主键统一使用 `ObjectId`；业务外键显式引用（如 `lotId`、`spaceId`）。
  - 所有时间使用 `ISODate`；保留 `source`、`sourceId`、`schemaVersion` 与 `migratedAt` 便于追溯。
  - 管理端专属字段通过子文档 `admin`，小程序专属通过子文档 `miniprogram`；共有字段提升到根级。
- 版本化：为每个集合制定 `schemaVersion` 与迁移映射表，支持将来演进。

## 数据库整合与迁移方案
- 单库命名：`tcc_unified`（或既有 `parking_system` 作为统一库，具体以环境与运维约定确定）。
- 合并策略：
  - 映射表驱动字段合并（`parking_admin` → 新 Schema）；保留原始 `_id` 于 `legacy.adminId` 或 `legacy.systemId`，并建立去重键（如 `spaceCode@lotCode`）。
  - 先合并静态主数据（场、位、用户/角色、3D 资源），再合并动态事件（占用、轨迹）。
  - 冲突处理：优先 `parking_system` 实时数据；`parking_admin` 补充管理字段；所有冲突记录入审计集合 `MigrationAudit`。
- 迁移工具能力：
  - 幂等（基于去重键与 `migratedAt`）；断点续传；`dry-run` 与差异报告；批量大小可调；读写速率限流。
  - 校验：行级校验