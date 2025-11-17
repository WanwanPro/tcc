## 目标
- 将服务器 `192.168.0.78` 上的两个数据库 `parking_admin` 与 `parking_system` 迁移到本地 `localhost:27017`。
- 保留数据完整性与索引，兼容当前代码中使用的连接方式与环境变量。

## 现状与依赖
- 代码中广泛使用环境变量：`MONGODB_URI`、`UNIFIED_MONGODB_URI` 等；默认本地无认证直连（如 `mongodb://localhost:27017/parking_system`）。
- 容器示例使用 `mongo:4.4`，带认证：`admin/password` 与 `authSource=admin`。
- 客户端库为 `mongoose 7.x` 与 `mongodb 5.x/6.x`，与 MongoDB 4.4/5.x/6.x 均可兼容。

## 迁移前检查
1. 确认远端是否启用认证与用户：若需要，准备 `--username`、`--password`、`--authenticationDatabase`。
2. 确认远端版本（示例镜像 `4.4`），在本地安装匹配或更高版本的 Database Tools（`mongodump`/`mongorestore`）。
3. 评估数据量与停机窗口：如可读写影响较小，优先使用离线导出导入。

## 推荐方案（离线导出/导入）
### A. 在本地直接从远端导出
- 安装工具：Windows 安装 MongoDB Database Tools（含 `mongodump.exe`、`mongorestore.exe`）。
- 导出 `parking_admin`：
  - 无认证：`mongodump --host 192.168.0.78 --port 27017 --db parking_admin --gzip --out dump_78`
  - 有认证：`mongodump --uri "mongodb://admin:password@192.168.0.78:27017/parking_admin?authSource=admin" --gzip --out dump_78`
- 导出 `parking_system`：
  - 无认证：`mongodump --host 192.168.0.78 --port 27017 --db parking_system --gzip --out dump_78`
  - 有认证：`mongodump --uri "mongodb://admin:password@192.168.0.78:27017/parking_system?authSource=admin" --gzip --out dump_78`
- 导入到本地：
  - `mongorestore --host localhost --port 27017 --db parking_admin --drop --gzip dump_78/parking_admin`
  - `mongorestore --host localhost --port 27017 --db parking_system --drop --gzip dump_78/parking_system`

### B. 使用归档单文件（便于拷贝/留存）
- 导出归档：
  - `mongodump --uri "mongodb://192.168.0.78:27017" --archive=parking_all.archive --gzip --nsInclude=parking_admin.* --nsInclude=parking_system.*`
- 导入归档到本地：
  - `mongorestore --host localhost --port 27017 --archive=parking_all.archive --gzip --drop`

### C. 容器环境（如使用 `System/docker-compose.yml`）
- 本地启动 `mongo:4.4` 并映射端口 `27017`，设置：
  - `MONGO_INITDB_ROOT_USERNAME=admin`、`MONGO_INITDB_ROOT_PASSWORD=password`、`MONGO_INITDB_DATABASE=parking_admin`
- 导入时使用带认证的本地 URI：
  - `mongorestore --uri "mongodb://admin:password@localhost:27017/parking_admin?authSource=admin" --drop --gzip dump_78/parking_admin`
  - `mongorestore --uri "mongodb://admin:password@localhost:27017/parking_system?authSource=admin" --drop --gzip dump_78/parking_system`

## 验证
- 使用 `mongosh` 连接本地：
  - 无认证：`mongosh "mongodb://localhost:27017"`
  - 有认证：`mongosh "mongodb://admin:password@localhost:27017/?authSource=admin"`
- 检查库与集合：
  - `show dbs`
  - `use parking_admin; db.getCollectionNames()`
  - `use parking_system; db.getCollectionNames()`
- 样例数据量校验：对关键集合执行 `db.<collection>.countDocuments()` 与远端对比。

## 应用配置切换
- 本地运行时将 `.env` 的 `MONGODB_URI` 指向本地：
  - `System/backend/.env` 与 `backend/.env`：`MONGODB_URI=mongodb://localhost:27017/parking_system`（或 `parking_admin`，视服务模块）
- 如使用共享封装（`shared/dal/mongo.js`）默认已支持 `localhost:27017`，也可通过 `UNIFIED_MONGODB_URI` 覆盖。
- 若以容器运行，后端应改用带认证的 URI：`mongodb://admin:password@localhost:27017/<db>?authSource=admin`。

## 回滚与安全
- 保留 `dump_78` 与归档文件以便回滚。
- 不导入 `system.*` 与 `local.*` 命名空间，避免内部集合冲突（上述命令默认不会包含）。
- 如远端启用 TLS，导出时附加证书参数：`--ssl --sslCAFile <ca.pem> --sslPEMKeyFile <client.pem>`。

## 交付内容
- 迁移脚本与命令清单（如上）。
- 验证清单（库、集合、记录数抽样）。
- 配置修改位点与建议（`.env` 与容器 URI）。

请确认采用“离线导出/导入”的推荐方案，或告知需要调整为容器化方案（带认证）或归档单文件方案，以便我据此执行具体迁移并完成验证。