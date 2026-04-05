# 微信云托管部署清单

本文档面向“项目即将验收、本地演示必须稳定”的场景编写。目标不是把本地项目改成线上项目，而是在**不影响本地运行**的前提下，新增一套可上云的部署能力。

## 一、总体部署方案

结合当前项目结构，推荐采用以下方案：

- 小程序前端：继续通过微信开发者工具上传与发布
- 小程序后端：部署为微信云托管服务 `mini-api`
- 管理后台后端：部署为微信云托管服务 `admin-api`
- 管理后台前端：优先部署到静态托管，或后续再使用前端镜像
- 数据库：继续使用已经准备好的云 MongoDB

当前项目结构：

- `backend`：小程序后端
- `System/backend`：管理后台后端
- `System/frontend`：管理后台前端
- `shared`：共享代码
- `deploy/docker`：新增的云部署 Dockerfile

## 二、部署前原则

为了确保本地验收演示不受影响，请始终遵守以下原则：

- 不替换当前本地 `.env`
- 不删除现有本地启动脚本
- 不修改现有本地端口约定
- 云上部署文件全部放在新增目录中
- 云平台环境变量与本地 `.env` 分离管理

## 三、云托管服务拆分建议

### 1. 服务一：小程序后端

- 服务名建议：`mini-api`
- 对应目录：`backend`
- Dockerfile：`deploy/docker/backend.Dockerfile`
- 容器端口：`3001`

### 2. 服务二：管理后台后端

- 服务名建议：`admin-api`
- 对应目录：`System/backend`
- Dockerfile：`deploy/docker/admin-backend.Dockerfile`
- 容器端口：`5001`

### 3. 管理后台前端

优先建议：

- 先用静态托管部署 `System/frontend` 的构建产物 `dist`

如果后面确实要容器化：

- Dockerfile：`deploy/docker/admin-frontend.Dockerfile`
- 容器端口：`80`

## 四、构建前检查项

在开始部署前，请先确认以下内容：

- 云 MongoDB 已导入 `parking_system`
- 云 MongoDB 已导入 `parking_admin`
- 云 MongoDB 账号密码可正常连接
- 数据库白名单已放通云托管服务访问
- 本地演示版本仍然能正常启动
- 代码仓库中没有把真实生产密码写入 `.env.example`

## 五、镜像构建方式

这套 Dockerfile 采用“仓库根目录作为构建上下文”的方式，原因是：

- `backend` 依赖根目录 `shared`
- `System/backend` 也依赖根目录 `shared`

因此构建命令要在仓库根目录执行，并使用 `-f` 指定 Dockerfile。

### 1. 构建小程序后端镜像

```bash
docker build -f deploy/docker/backend.Dockerfile -t tcc-mini-api .
```

### 2. 构建管理后台后端镜像

```bash
docker build -f deploy/docker/admin-backend.Dockerfile -t tcc-admin-api .
```

### 3. 构建管理后台前端镜像

```bash
docker build -f deploy/docker/admin-frontend.Dockerfile -t tcc-admin-web .
```

## 六、微信云托管部署步骤

### 步骤 1：创建 CloudBase 环境

在微信云开发 / 云托管控制台中：

- 新建环境
- 记录环境 ID
- 开启云托管能力

### 步骤 2：创建后端服务

先创建两个服务：

- `mini-api`
- `admin-api`

建议先分别部署后端，暂时不要把所有内容一次性塞到一个服务里。

### 步骤 3：选择镜像构建方式

可以选择：

- 由平台拉代码构建
- 本地构建后推送镜像

如果平台直接从代码仓库构建，注意：

- 构建上下文要能访问仓库根目录
- Dockerfile 路径要填写为 `deploy/docker/backend.Dockerfile` 或 `deploy/docker/admin-backend.Dockerfile`

### 步骤 4：配置端口

- `mini-api`：`3001`
- `admin-api`：`5001`

平台健康检查和入口配置也要与此保持一致。

### 步骤 5：配置环境变量

不要上传本地 `.env` 文件，直接在云托管平台里为每个服务填写环境变量。

具体变量清单见本文档后面的“云上环境变量清单”。

### 步骤 6：首次部署后验证

先验证后端：

- 小程序后端能否正常启动
- 管理后端能否正常启动
- 能否成功连接云 MongoDB

再验证接口：

- 健康检查接口
- 登录接口
- 列表接口
- 统计接口

最后再验证前端。

## 七、管理前端部署建议

当前阶段为了稳定，建议：

- 本地演示仍然使用你现在的本地启动方式
- 云上管理前端优先采用静态托管

部署流程：

1. 进入 `System/frontend`
2. 执行 `npm install`
3. 执行 `npm run build`
4. 上传 `dist` 到静态托管
5. 配置 `/api` 转发到管理后台服务

这样比直接容器化整个前端更稳，也更省心。

## 八、建议的发布顺序

为了不影响验收，建议按以下顺序推进：

1. 保持本地演示链路不动
2. 完成 Dockerfile 和 `.dockerignore`
3. 先部署 `mini-api`
4. 再部署 `admin-api`
5. 用接口测试工具验证两个后端
6. 最后再部署管理前端静态站
7. 最后再联调小程序与管理后台

## 九、当前阶段不建议立即做的事

为了避免影响本地稳定性，以下内容暂时不建议在验收前大改：

- 不合并两个后端服务
- 不重构共享代码路径
- 不把本地 `.env` 改成云配置
- 不强制把所有本地地址改成线上地址
- 不立即改上传逻辑到新存储方式
- 不立即启用 change streams

## 十、云上环境变量清单

### 1. 小程序后端 `mini-api`

建议在云托管中配置如下变量：

| 变量名 | 示例值 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `3001` | 服务监听端口 |
| `MONGODB_URI` | `mongodb://<user>:<password>@<host>:27017/parking_system?authSource=<db或admin>` | 小程序主库 |
| `UNIFIED_MONGODB_URI` | 与 `MONGODB_URI` 相同 | 共享 DAL 使用 |
| `SYSTEM_MONGODB_URI` | `mongodb://<user>:<password>@<host>:27017/parking_admin?authSource=<db或admin>` | 访问管理端数据库 |
| `ADMIN_MONGODB_URI` | 与 `SYSTEM_MONGODB_URI` 相同 | 兼容性别名 |
| `JWT_SECRET` | 强随机字符串 | JWT 密钥 |
| `JWT_EXPIRES_IN` | `24h` | JWT 有效期 |
| `CORS_ORIGIN` | `https://admin.example.com` | 管理前端正式域名 |
| `SYSTEM_API_URL` | `https://admin-api.example.com/api` | 管理端 API 地址 |
| `SYSTEM_API_TOKEN` | 可留空 | 如果有固定 token 可填 |
| `SYSTEM_API_USERNAME` | 生产管理员账号 | 无 token 时使用 |
| `SYSTEM_API_PASSWORD` | 强密码 | 无 token 时使用 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `UPLOAD_PATH` | `./uploads` | 临时上传目录 |
| `MAX_FILE_SIZE` | `5242880` | 上传限制 |
| `ENABLE_CHANGE_STREAMS` | `0` | 首版建议关闭 |

### 2. 管理后台后端 `admin-api`

建议在云托管中配置如下变量：

| 变量名 | 示例值 | 说明 |
| --- | --- | --- |
| `NODE_ENV` | `production` | 生产环境 |
| `PORT` | `5001` | 服务监听端口 |
| `MONGODB_URI` | `mongodb://<user>:<password>@<host>:27017/parking_admin?authSource=<db或admin>` | 管理端主库 |
| `UNIFIED_MONGODB_URI` | 与 `MONGODB_URI` 相同 | 当前服务也会读取 |
| `TCC_MONGODB_URI` | `mongodb://<user>:<password>@<host>:27017/parking_system?authSource=<db或admin>` | 小程序数据库 |
| `JWT_SECRET` | 强随机字符串 | JWT 密钥 |
| `JWT_EXPIRES_IN` | `24h` | JWT 有效期 |
| `CORS_ORIGIN` | `https://admin.example.com` | 前端正式域名 |
| `DEFAULT_ADMIN_USERNAME` | 正式管理员账号 | 初始化管理员使用 |
| `DEFAULT_ADMIN_PASSWORD` | 强密码 | 初始化管理员使用 |
| `DEFAULT_ADMIN_NAME` | `系统管理员` | 管理员显示名 |
| `TCC_API_URL` | `https://mini-api.example.com/api` | 小程序后端正式地址 |
| `WECHAT_APP_ID` | 按需填写 | 微信能力接入 |
| `WECHAT_APP_SECRET` | 按需填写 | 微信能力接入 |
| `LOG_LEVEL` | `info` | 日志级别 |
| `UPLOAD_PATH` | `./uploads` | 临时上传目录 |
| `MAX_FILE_SIZE` | `5242880` | 上传限制 |
| `SIMULATION_INTERVAL` | `60000` | 演示/模拟用途 |
| `ENABLE_CHANGE_STREAMS` | `0` | 首版建议关闭 |

## 十一、上线后验证清单

部署完成后，建议按以下顺序验证：

1. 查看容器日志，确认无数据库连接报错
2. 访问健康检查接口
3. 验证管理端登录
4. 验证管理端列表、统计、公告等页面
5. 验证小程序接口
6. 验证上传功能
7. 验证跨域是否正常
8. 验证正式域名下接口返回是否稳定

## 十二、与本地演示的关系

这套微信云托管部署文件是新增能力，不会自动替换你当前本地运行方式。也就是说：

- 本地继续用原有启动方式演示
- 云上使用新增 Dockerfile 和云环境变量部署
- 两套环境可以并行存在

这样即使云上部署暂时未完全调通，也不会影响你本地验收。

