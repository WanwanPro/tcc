# 项目环境配置说明

本文档用于说明本项目在“本地开发环境”和“云上部署环境”下应该如何配置环境变量，以及为什么要这样配置。核心目标只有一个：

- 同一套代码，可以同时支持本地运行和云上运行
- 切换数据库地址、服务地址、跨域地址时，不需要反复改代码
- 后续无论是上宝塔、微信云托管，还是其他容器平台，都只改配置，不改业务逻辑

## 一、为什么要做环境配置分离

当前项目是一个前后端分离、并且包含两个后端服务的系统，主要由以下部分组成：

- `backend`：小程序后端服务
- `System/backend`：管理后台后端服务
- `System/frontend`：管理后台前端
- `frontend/miniprogram`：小程序前端
- `shared`：两个后端共享的公共代码

这意味着系统运行时至少会涉及下面几类地址：

- 小程序后端自己的数据库地址
- 管理后端自己的数据库地址
- 两个后端互相调用时的接口地址
- 管理前端访问后端时的接口地址
- 本地开发时的 `localhost` 地址
- 云上部署时的域名或公网地址

如果这些地址直接写死在代码里，就会出现这些问题：

- 本地能跑，线上不能跑
- 上线前改成云地址后，本地又不能跑
- 本地调试和线上联调来回切换时，需要频繁改代码
- 很容易把生产地址、生产密码误提交进仓库

因此，正确做法是：

- 代码里只保留“读取环境变量”的逻辑
- 不同环境下使用不同配置值

也就是说，数据库地址、服务地址、JWT 密钥、跨域白名单，都应该由环境变量决定，而不是由代码写死。

## 二、项目中相关文件的作用

本项目推荐使用以下文件来管理环境配置：

- `backend/.env`
  - 小程序后端的本地开发配置
- `backend/.env.example`
  - 小程序后端的配置模板
- `System/backend/.env`
  - 管理后端的本地开发配置
- `System/backend/.env.example`
  - 管理后端的配置模板

建议遵循下面的使用规则：

- `.env`
  - 用于你当前机器上的实际运行
  - 可以写本地数据库、临时测试账号等
  - 不建议提交到公开仓库
- `.env.example`
  - 只保留模板和值示例
  - 不放真实密码、真实密钥
  - 用来告诉团队成员或未来的你“这个项目需要哪些环境变量”

如果后面部署到云平台：

- 宝塔：环境变量可以写在运行环境或启动脚本中
- 微信云托管：直接在平台界面配置环境变量
- Docker：通过 `-e`、平台配置或编排文件注入

不建议把本地 `.env` 直接原样拷到线上。

## 三、环境划分建议

建议至少区分两个环境：

### 1. 本地开发环境

适用于：

- 你在本机开发前后端
- 数据库跑在本机
- 管理前端通过 Vite 启动
- 两个后端也都本地启动

典型特征：

- 数据库地址通常是 `127.0.0.1`
- 接口地址通常是 `localhost`
- 允许使用调试日志
- 允许使用演示账户和模拟数据

### 2. 云上部署环境

适用于：

- 微信云托管
- 宝塔服务器
- Docker 容器
- 其他云服务器或托管平台

典型特征：

- 数据库地址变成云 MongoDB
- 跨域地址变成正式域名
- JWT 密钥必须换成强随机字符串
- 默认管理员账号密码必须改掉
- 上传目录不能再依赖长期本地磁盘

## 四、小程序后端 `backend` 配置说明

下面是小程序后端最重要的变量说明。

### 1. 运行环境相关

`NODE_ENV`

- 本地：`development`
- 云上：`production`

作用：

- 区分开发模式和生产模式
- 某些日志输出、错误处理、调试逻辑会参考这个值

`PORT`

- 本地通常使用：`3001`
- 云上通常也可以继续用：`3001`
- 如果云平台强制分配端口，则按平台要求填写

作用：

- 决定小程序后端服务监听的端口

### 2. 数据库相关

`MONGODB_URI`

- 本地示例：`mongodb://127.0.0.1:27017/parking_system`
- 云上示例：`mongodb://用户名:密码@云数据库地址:27017/parking_system?authSource=admin`

作用：

- 小程序后端主数据库连接地址

`UNIFIED_MONGODB_URI`

- 本地一般和 `MONGODB_URI` 一样
- 云上一般也和 `MONGODB_URI` 一样

作用：

- 当前项目里共享 DAL 会优先读取这个变量
- 如果配置了它，就会覆盖默认的 `MONGODB_URI`

建议：

- 如果你当前没有特别复杂的多库统一方案，就让它与 `MONGODB_URI` 保持一致

`SYSTEM_MONGODB_URI`

- 本地示例：`mongodb://127.0.0.1:27017/parking_admin`
- 云上示例：`mongodb://用户名:密码@云数据库地址:27017/parking_admin?authSource=admin`

作用：

- 供跨库同步、兼容接口或脚本访问管理端数据库时使用

`ADMIN_MONGODB_URI`

作用：

- 与 `SYSTEM_MONGODB_URI` 类似，属于兼容性别名
- 建议与 `SYSTEM_MONGODB_URI` 保持一致

### 3. 认证相关

`JWT_SECRET`

- 本地可以用临时开发密钥
- 云上必须使用强随机字符串

作用：

- 用于签发和校验 JWT

注意：

- 线上千万不要继续使用默认或示例值
- 一旦泄露，令牌校验将失去安全性

`JWT_EXPIRES_IN`

- 常见值：`24h`

作用：

- 控制 JWT 的有效时间

### 4. 跨域与接口联调相关

`CORS_ORIGIN`

- 本地一般为：`http://localhost:5002`
- 云上一般为：管理前端正式域名，例如 `https://admin.example.com`

作用：

- 限制允许访问该后端的前端来源

`SYSTEM_API_URL`

- 本地一般为：`http://localhost:5001/api`
- 云上一般为：管理端 API 的正式地址

作用：

- 小程序后端内部调用管理后端时使用

`SYSTEM_API_TOKEN`

作用：

- 如果已经提前拿到了有效 Bearer Token，可以直接使用该值

建议：

- 本地联调时可以留空
- 线上建议谨慎使用，尽量避免长期固定令牌

`SYSTEM_API_USERNAME`
`SYSTEM_API_PASSWORD`

作用：

- 当没有 `SYSTEM_API_TOKEN` 时，用于自动登录管理端获取访问能力

建议：

- 本地调试可用测试账号
- 云上尽量避免把真实高权限账号长期硬写在配置中

### 5. 日志与上传

`LOG_LEVEL`

- 常用值：`info`

作用：

- 控制日志输出等级

`UPLOAD_PATH`

- 本地一般为：`./uploads`

作用：

- 文件上传落地目录

注意：

- 本地开发没问题
- 云上容器环境里只适合暂时使用
- 长期建议迁移到对象存储

`MAX_FILE_SIZE`

- 示例值：`5242880`

作用：

- 控制上传文件最大字节数

### 6. 功能开关

`ENABLE_CHANGE_STREAMS`

- 建议本地默认：`0`
- 云上首版也建议：`0`

作用：

- 控制是否启用 MongoDB change streams

建议：

- 在数据库、副本集和实时更新逻辑完全确认前，先不要启用

## 五、管理后端 `System/backend` 配置说明

管理后端与小程序后端类似，但它多了一些管理系统专属配置。

### 1. 运行环境相关

`NODE_ENV`

- 本地：`development`
- 云上：`production`

`PORT`

- 本地通常为：`5001`
- 云上也可继续使用：`5001`

### 2. 数据库相关

`MONGODB_URI`

- 本地：`mongodb://127.0.0.1:27017/parking_admin`
- 云上：指向云端 `parking_admin`

作用：

- 管理系统主数据库连接地址

`UNIFIED_MONGODB_URI`

作用：

- 当前管理后端也会优先读取这个变量
- 通常与 `MONGODB_URI` 保持一致即可

`TCC_MONGODB_URI`

- 本地：`mongodb://127.0.0.1:27017/parking_system`
- 云上：指向云端 `parking_system`

作用：

- 管理后端跨库读取小程序系统数据时使用

### 3. 管理员初始化相关

`DEFAULT_ADMIN_USERNAME`
`DEFAULT_ADMIN_PASSWORD`
`DEFAULT_ADMIN_NAME`

作用：

- 管理后端启动时，如果没有对应管理员账号，可能会根据这些值尝试创建默认管理员

建议：

- 本地开发可使用简单测试值
- 云上必须改成正式值
- 如果系统已经初始化完成，后续也要保留强密码，不能继续使用示例密码

### 4. 小程序联调相关

`TCC_API_URL`

- 本地：`http://localhost:3001/api`
- 云上：小程序后端正式地址

作用：

- 管理后端调用小程序后端接口时使用

`WECHAT_APP_ID`
`WECHAT_APP_SECRET`

作用：

- 用于微信相关登录或能力接入

建议：

- 本地没有接微信登录时可以留空
- 云上如果启用微信能力，再填真实值
- 不要把真实密钥写到公开仓库

### 5. 日志、上传与模拟

`LOG_LEVEL`

- 建议本地：`info`
- 云上：`info` 或 `warn`

`UPLOAD_PATH`

- 本地：`./uploads`
- 云上：临时目录或平台允许的路径

`MAX_FILE_SIZE`

- 示例值：`5242880`

`SIMULATION_INTERVAL`

- 示例值：`60000`

作用：

- 控制数据模拟的定时刷新间隔

建议：

- 本地和演示环境可以开启
- 正式环境如果不需要演示功能，可以按策略关闭或不使用

`ENABLE_CHANGE_STREAMS`

- 与小程序后端一致
- 首版上线建议保持 `0`

## 六、本地环境与云上环境对照表

### 1. 小程序后端 `backend`

| 变量名 | 本地开发建议值 | 云上部署建议值 | 说明 |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | `production` | 区分开发和生产 |
| `PORT` | `3001` | `3001` 或平台端口 | 服务监听端口 |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/parking_system` | `mongodb://<user>:<password>@<host>:27017/parking_system?authSource=<db或admin>` | 小程序主库 |
| `UNIFIED_MONGODB_URI` | 与 `MONGODB_URI` 相同 | 与 `MONGODB_URI` 相同 | 共享 DAL 使用 |
| `SYSTEM_MONGODB_URI` | `mongodb://127.0.0.1:27017/parking_admin` | 指向云端 `parking_admin` | 管理端数据库 |
| `ADMIN_MONGODB_URI` | 与 `SYSTEM_MONGODB_URI` 相同 | 与 `SYSTEM_MONGODB_URI` 相同 | 兼容性别名 |
| `JWT_SECRET` | 本地调试密钥 | 强随机密钥 | 生产必须更换 |
| `JWT_EXPIRES_IN` | `24h` | `24h` | 令牌有效期 |
| `CORS_ORIGIN` | `http://localhost:5002` | 管理前端正式域名 | 跨域白名单 |
| `SYSTEM_API_URL` | `http://localhost:5001/api` | 管理端正式 API 地址 | 小程序后端调用管理端时使用 |
| `SYSTEM_API_TOKEN` | 留空 | 可选 | 有 token 时可直接用 |
| `SYSTEM_API_USERNAME` | `admin` | 生产管理员账号 | 无 token 时使用 |
| `SYSTEM_API_PASSWORD` | 测试密码 | 强密码 | 避免写真实长期密码进仓库 |
| `LOG_LEVEL` | `info` | `info`/`warn` | 日志级别 |
| `UPLOAD_PATH` | `./uploads` | 临时目录或云存储方案 | 云上建议逐步改对象存储 |
| `MAX_FILE_SIZE` | `5242880` | `5242880` | 上传大小限制 |
| `ENABLE_CHANGE_STREAMS` | `0` | `0` | 首版建议关闭 |

### 2. 管理后端 `System/backend`

| 变量名 | 本地开发建议值 | 云上部署建议值 | 说明 |
| --- | --- | --- | --- |
| `NODE_ENV` | `development` | `production` | 区分开发和生产 |
| `PORT` | `5001` | `5001` 或平台端口 | 服务监听端口 |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/parking_admin` | `mongodb://<user>:<password>@<host>:27017/parking_admin?authSource=<db或admin>` | 管理端主库 |
| `UNIFIED_MONGODB_URI` | 与 `MONGODB_URI` 相同 | 与 `MONGODB_URI` 相同 | 当前服务也会读取 |
| `TCC_MONGODB_URI` | `mongodb://127.0.0.1:27017/parking_system` | 指向云端 `parking_system` | 小程序数据库地址 |
| `JWT_SECRET` | 本地调试密钥 | 强随机密钥 | 生产必须更换 |
| `JWT_EXPIRES_IN` | `24h` | `24h` | 令牌有效期 |
| `CORS_ORIGIN` | `http://localhost:5002` | 管理前端正式域名 | 跨域白名单 |
| `DEFAULT_ADMIN_USERNAME` | `admin` | 正式管理员账号 | 初始化管理员使用 |
| `DEFAULT_ADMIN_PASSWORD` | 测试密码 | 强密码 | 生产必须更换 |
| `DEFAULT_ADMIN_NAME` | `系统管理员` | `系统管理员` 或自定义名称 | 显示名称 |
| `TCC_API_URL` | `http://localhost:3001/api` | 小程序后端正式地址 | 管理端调用小程序后端 |
| `WECHAT_APP_ID` | 留空 | 真实 AppID | 用到微信能力时再填 |
| `WECHAT_APP_SECRET` | 留空 | 真实 Secret | 仅放在线上密钥配置中 |
| `LOG_LEVEL` | `info` | `info`/`warn` | 日志级别 |
| `UPLOAD_PATH` | `./uploads` | 临时目录或云存储方案 | 云上建议逐步改对象存储 |
| `MAX_FILE_SIZE` | `5242880` | `5242880` | 上传大小限制 |
| `SIMULATION_INTERVAL` | `60000` | `60000` 或按策略关闭 | 模拟数据使用 |
| `ENABLE_CHANGE_STREAMS` | `0` | `0` | 首版建议关闭 |

## 七、前端地址配置建议

### 1. 管理前端 `System/frontend`

管理前端当前更适合继续使用相对路径访问接口，也就是：

- 前端代码中保留 `/api`
- 本地开发由 Vite 代理到本地后端
- 云上部署由 Nginx、网关或云托管路由转发到正式后端

这样做的好处是：

- 前端代码不需要随着环境变化反复修改
- 本地和线上访问路径保持一致
- 运维层更容易统一管理接口转发

本地建议：

- 前端地址：`http://localhost:5002`
- 代理目标：`http://localhost:5001`

云上建议：

- 前端使用正式域名，例如 `https://admin.example.com`
- `/api` 由网关转发到管理后端或对应服务

### 2. 小程序前端

小程序端不能在正式环境使用 `localhost`，因此建议：

- 本地调试阶段：使用本地地址、内网穿透地址或测试域名
- 云上阶段：统一切换为正式 API 域名

建议把小程序请求基地址也做成可配置项，不要写死在代码里。

## 八、推荐的配置与部署顺序

为了避免“边部署边返工”，建议按下面顺序推进：

1. 先完善并确认 `backend/.env.example`
2. 再完善并确认 `System/backend/.env.example`
3. 本地填写各自 `.env`，确保本机能跑通
4. 检查代码里残留的 `localhost`、默认密钥和默认密码回退
5. 再整理 Dockerfile
6. 最后在云平台中配置正式环境变量并部署

## 九、上线前重点检查项

上线前请重点确认以下内容：

- `JWT_SECRET` 是否已替换为强随机字符串
- 默认管理员账号和密码是否已替换
- 是否仍有 `localhost` 被用于生产环境
- `CORS_ORIGIN` 是否已改为正式前端域名
- `MONGODB_URI` 是否已改为云数据库地址
- `ENABLE_CHANGE_STREAMS` 是否仍保持关闭
- 上传目录是否只是临时方案

## 十、结论

这套环境配置的核心思想是：

- 本地开发与云上部署使用同一套代码
- 通过环境变量切换数据库、服务地址和安全配置
- 不通过修改源码来切换运行环境

只要你后面遵循这套规则，那么：

- 本地数据库可以继续开发使用
- 云数据库可以单独用于测试或生产
- 前后端地址切换不会破坏本地开发
- Docker、宝塔、微信云托管都可以共用同一套配置思路
