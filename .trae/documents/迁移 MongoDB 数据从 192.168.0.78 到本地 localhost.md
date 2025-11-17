## 前置准备
- 安装 MongoDB Database Tools（含 `mongodump`/`mongorestore`），并加入 PATH
- 确认源库可访问：`ping 192.168.0.78`、端口 `27017` 未被防火墙阻挡
- 确认本地 MongoDB 已启动：`mongosh mongodb://localhost:27017` 执行 `use parking_system; db.stats()`
- 若源库启用认证，准备好 `-u/-p` 及 `--authenticationDatabase`（通常为 `admin`）

## 迁移策略选择
- 标准全量离线迁移（推荐）：短暂停写或在业务低峰执行，保证一致性
- 如源库为副本集且需尽量减少停机：使用 `--oplog`/`--oplogReplay`（需要源为副本集）

## 导出（源：192.168.0.78）
- 导出单数据库（parking_system）：
  - 无认证：`mongodump --host 192.168.0.78 --port 27017 --db parking_system --out dump/parking_system --gzip`
  - 有认证：`mongodump --host 192.168.0.78 --port 27017 --db parking_system -u <user> -p <pass> --authenticationDatabase admin --out dump/parking_system --gzip`
- 如需同时导出该库的用户与角色：增加 `--dumpDbUsersAndRoles`
- 如需最小文件数量：使用归档：`mongodump --host 192.168.0.78 --port 27017 --db parking_system --archive=dump/parking_system.archive --gzip`
- 如源为副本集且需持续增量：`mongodump ... --oplog`（与归档/目录任选其一）

## 导入（目标：localhost）
- 导入到本地同名库：
  - 目录导入：`mongorestore --host localhost --port 27017 --db parking_system --drop dump/parking_system --gzip`
  - 归档导入：`mongorestore --host localhost --port 27017 --db parking_system --archive=dump/parking_system.archive --gzip --drop`
- 如导出了用户与角色：添加 `--restoreDbUsersAndRoles`
- 注意 `--drop` 会先删除本地库中同名集合，确保干净迁移；如需保留本地数据，则去掉 `--drop`

## 验证与一致性检查
- 集合与文档数对比：
  - 源库与目标库分别执行 `db.getCollectionInfos()` 与 `db.<collection>.countDocuments()`（抽样对比关键集合，如 `admins`、`parkingspaces`、`parkinglots`）
- 索引检查：`db.<collection>.getIndexes()`，确认索引数量与字段一致
- 应用验证：
  - 后台健康接口：`http://localhost:5001/api/health`
  - 小程序后端健康接口：`http://localhost:3001/health`
  - 后台登录：`admin / 123456`（若已迁入原有账号，使用原账号密码）

## 应用配置确认
- 应用连接优先使用环境变量 `UNIFIED_MONGODB_URI` 或 `MONGODB_URI`
- 迁移完成后确保其设置为：`mongodb://localhost:27017/parking_system`
- 管理前端代理目标（`System/frontend/vite.config.js`）与后端端口（5001）保持一致

## 变更流与副本集（可选）
- 如需开启 MongoDB Change Streams（实时订阅），需将本地 MongoDB 初始化为副本集并设置 `ENABLE_CHANGE_STREAMS=1`
- 单机开发默认禁用变更流以避免错误；功能不受影响

## 回滚与故障处理
- 保留导出文件（dump/archive）作为回滚依据
- 常见问题：
  - 工具未安装：`mongodump not recognized` → 安装并配置 PATH
  - 认证失败：检查用户权限与 `--authenticationDatabase`
  - 网络问题：确认源地址连通与防火墙规则
  - 文档/索引不一致：重新导出导入或单独修复索引

## 执行顺序
1) 安装工具与连通性检查
2) 执行 `mongodump` 导出源库（可选 `--gzip`/`--archive`/`--oplog`）
3) 执行 `mongorestore` 导入到本地库（可选 `--drop` 保证干净状态）
4) 验证集合、索引与应用功能
5) 将应用环境变量指向本地库并重启应用

请确认后我将按上述方案开始执行（并在你的机器上输出每一步的日志）。