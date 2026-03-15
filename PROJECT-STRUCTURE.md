# TCC智能停车场管理系统 - 项目结构详细文档

## 一、项目概述

TCC智能停车场管理系统是一个功能完整的停车场管理解决方案，包含以下三个主要组件：

1. **TCC小程序后端** (`backend/`) - 为微信小程序提供API服务
2. **System管理后端** (`System/backend/`) - 为管理前端提供API服务  
3. **System管理前端** (`System/frontend/`) - 基于Vue 3的管理界面

---

## 二、目录结构

```
tcc/
├── backend/                          # TCC小程序后端 (Node.js + Express)
│   ├── .env                         # 环境变量配置
│   ├── server.js                    # 服务器入口文件
│   ├── package.json                 # 项目依赖配置
│   ├── controllers/                 # 控制器层
│   │   ├── imageController.js       # 图片处理控制器
│   │   ├── pathController.js       # 路径导航控制器
│   │   ├── spaceController.js      # 车位管理控制器
│   │   └── userController.js       # 用户管理控制器
│   ├── models/                      # 数据模型层
│   │   ├── ParkingSpace.js         # 车位数据模型
│   │   ├── Path.js                 # 路径数据模型
│   │   └── User.js                 # 用户数据模型
│   ├── routes/                      # 路由配置
│   │   ├── imageRoutes.js          # 图片API路由
│   │   ├── pathRoutes.js           # 路径API路由
│   │   ├── spaceRoutes.js          # 车位API路由
│   │   └── userRoutes.js           # 用户API路由
│   ├── services/                    # 服务层
│   │   ├── apiAdapterService.js    # API适配服务
│   │   ├── dataMappingService.js   # 数据映射服务
│   │   ├── dataModelMappingService.js    # 数据模型映射服务
│   │   ├── dataSyncService.js      # 数据同步服务
│   │   ├── imageRecognitionService.js  # 图像识别服务
│   │   └── pathService.js          # 路径规划服务
│   ├── utils/                       # 工具函数
│   │   ├── imageProcessor.js       # 图片处理工具
│   │   └── pathPlanner.js          # 路径规划工具
│   ├── tests/                       # 测试文件
│   └── scripts/                     # 脚本文件
│
├── frontend/
│   └── miniprogram/                 # 微信小程序前端
│       ├── app.js                   # 小程序入口文件
│       ├── app.json                 # 小程序配置
│       ├── project.config.json      # 小程序项目配置
│       ├── project.private.config.json  # 私有配置
│       ├── pages/                   # 页面目录
│       ├── assets/                  # 静态资源
│       └── utils/                   # 工具函数
│           └── render-engine.js    # 渲染引擎
│
├── System/                          # 后台管理系统
│   ├── backend/                     # 管理后端 (Node.js + Express)
│   │   ├── .env                    # 环境变量配置
│   │   ├── server.js               # 服务器入口文件
│   │   ├── package.json            # 项目依赖配置
│   │   ├── controllers/            # 控制器 (40+个)
│   │   ├── models/                 # 数据模型
│   │   ├── routes/                 # 路由配置 (40+个)
│   │   ├── middleware/             # 中间件
│   │   ├── services/               # 服务层
│   │   ├── utils/                  # 工具函数
│   │   ├── scripts/                # 脚本文件
│   │   └── config/                 # 配置目录
│   │
│   └── frontend/                   # 管理前端 (Vue 3 + Vite)
│       ├── .env                    # 环境变量配置
│       ├── vite.config.js          # Vite配置文件
│       ├── package.json            # 项目依赖配置
│       ├── index.html              # 入口HTML
│       ├── nginx.conf              # Nginx配置
│       ├── public/                  # 公共资源
│       └── src/                     # 源代码
│           ├── main.js             # 应用入口
│           ├── App.vue             # 根组件
│           ├── api/                # API接口封装
│           ├── components/         # 公共组件
│           ├── layout/             # 布局组件
│           ├── router/             # 路由配置
│           ├── stores/             # 状态管理
│           ├── utils/             # 工具函数
│           └── views/             # 页面视图
│               ├── dashboard/     # 仪表板
│               ├── parking/      # 停车管理
│               ├── users/        # 用户管理
│               ├── finance/      # 财务管理
│               ├── analytics/    # 数据分析
│               └── system/       # 系统设置
│
├── config/                          # 公共配置目录
│   ├── project.config.json         # 小程序项目配置
│   ├── project.private.config.json # 私有配置
│   ├── system-admin-api.json      # System管理API规范
│   ├── tcc-api.json               # TCC小程序API规范
│   └── tcc1date1.json             # TCC1停车场数据
│
├── scripts/                         # 项目脚本
│   ├── convert-geojson-to-js.js   # GeoJSON转JS
│   ├── convert-navgraph-to-js.js # 导航图转JS
│   ├── convert-tcc-data.js        # TCC数据转换
│   ├── convert-to-geojson.js      # 转换为GeoJSON
│   ├── generate-map-data.js       # 生成地图数据
│   ├── generate-navigation-graph.js # 生成导航图
│   └── test-navigation-system.js  # 导航系统测试
│
├── tools/                           # 工具脚本
│   ├── start_all.py                # Python启动脚本 (推荐)
│   ├── start-all.bat               # 批处理启动脚本
│   ├── open-firewall-3001.bat     # 开放防火墙端口
│   ├── test-db-connection.js      # 数据库连接测试
│   ├── test-database-connections.js # 多数据库连接测试
│   ├── test-login.js              # 登录测试
│   ├── verify-local-mongo.js      # 本地MongoDB验证
│   ├── migrate-admin-to-unified.js # 管理员迁移
│   ├── generate-api-docs.js       # API文档生成
│   ├── export-api-docs.js         # API文档导出
│   └── detailed-debug-login.js    # 登录调试
│
├── shared/                          # 共享模块
│   ├── dal/                        # 数据访问层
│   │   ├── atomic.js              # 原子操作
│   │   └── mongo.js               # MongoDB连接
│   └── changeStreams/             # Change Stream监听
│       └── index.js               # 变更流处理
│
├── docs/                            # 项目文档
│   ├── STARTUP-GUIDE.md           # 启动指南
│   ├── QUICKSTART.md              # 快速开始
│   ├── DATABASE-INIT-COMPLETE.md  # 数据库初始化
│   ├── DATA-SYNC-GUIDE.md         # 数据同步指南
│   ├── NAVIGATION-SYSTEM-README.md # 导航系统说明
│   ├── API-README.md              # API说明
│   ├── MONGODB-CONFIG.md          # MongoDB配置
│   └── ... (其他文档)
│
├── dump_78/                         # 数据库备份 (源服务器192.168.0.78)
│   ├── parking_system/            # TCC数据库备份
│   │   ├── users.bson.gz
│   │   ├── parkingspaces.bson.gz
│   │   ├── paths.bson.gz
│   │   └── admins.bson.gz
│   └── parking_admin/             # System数据库备份
│       ├── users.bson.gz
│       ├── parkingspaces.bson.gz
│       ├── transactions.bson.gz
│       ├── roles.bson.gz
│       ├── mapnodes.bson.gz
│       ├── navigationpaths.bson.gz
│       └── ... (其他集合)
│
├── node_modules/                    # Node.js依赖 (根目录工具)
├── .gitignore                      # Git忽略文件
├── README.md                       # 项目说明
├── PROJECT-STRUCTURE.md            # 项目结构文档
├── CODE-OPTIMIZATION-REPORT.md   # 代码优化报告
├── REFACTORING-PLAN.md            # 重构计划
└── DATABASE-CONSOLIDATION-SUMMARY.md # 数据库整合总结
```

---

## 三、核心模块详解

### 3.1 TCC小程序后端 (backend/)

#### 技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB (Mongoose ODM)
- **认证**: JWT (jsonwebtoken)
- **图片处理**: Multer + OpenCV

#### 核心功能模块

| 模块 | 功能描述 | 关键文件 |
|------|----------|----------|
| 用户管理 | 小程序用户登录、认证 | `userController.js`, `userRoutes.js` |
| 车位管理 | 车位状态查询、预订 | `spaceController.js`, `spaceRoutes.js` |
| 路径导航 | 导航路径计算、引导 | `pathController.js`, `pathRoutes.js` |
| 图片识别 | 车牌识别、车辆检测 | `imageController.js`, `imageRoutes.js` |
| 数据同步 | 与System后台数据同步 | `dataSyncService.js` |
| API适配 | 统一不同系统间的API差异 | `apiAdapterService.js` |

#### API端点

```
/api/users/*        - 用户相关API
/api/spaces/*      - 车位相关API
/api/paths/*       - 路径相关API
/api/images/*      - 图片处理API
/health            - 健康检查
```

### 3.2 System管理后端 (System/backend/)

#### 技术栈
- **运行时**: Node.js
- **框架**: Express.js
- **数据库**: MongoDB
- **安全**: Helmet, Rate Limiting
- **日志**: Morgan
- **压缩**: Compression

#### 核心功能模块

| 模块 | 功能描述 | 路由前缀 |
|------|----------|----------|
| 认证管理 | 管理员登录、权限管理 | `/api/admin/auth/*` |
| 用户管理 | 用户列表、权限分配 | `/api/admin/users/*` |
| 停车管理 | 车位管理、区域管理 | `/api/admin/parking/*` |
| 地图管理 | 地图节点、导航路径 | `/api/admin/map/*` |
| 导航管理 | 导航配置、路径规划 | `/api/admin/navigation/*` |
| 财务管理 | 交易记录、费用统计 | `/api/admin/finance/*` |
| 数据分析 | 报表统计、趋势分析 | `/api/admin/analytics/*` |
| 系统管理 | 系统配置、日志管理 | `/api/admin/system/*` |
| 小程序API | 为小程序提供数据 | `/api/spaces/*`, `/api/path/*`, `/api/users/*` |

### 3.3 System管理前端 (System/frontend/)

#### 技术栈
- **框架**: Vue 3
- **构建工具**: Vite
- **UI组件**: Element Plus (推测)
- **状态管理**: Pinia (推测)
- **路由**: Vue Router

#### 页面模块

```
views/
├── dashboard/          # 仪表板首页
├── parking/           # 停车管理
│   ├── ParkingLots   # 停车场管理
│   ├── ParkingSpaces # 车位管理
│   └── Records       # 停车记录
├── users/             # 用户管理
├── finance/           # 财务管理
│   ├── Transactions  # 交易记录
│   └── Statistics    # 财务报表
├── analytics/         # 数据分析
│   ├── RealTime      # 实时数据
│   └── Reports       # 报表中心
└── system/            # 系统管理
    ├── Admins        # 管理员管理
    ├── Roles         # 角色管理
    └── Settings      # 系统设置
```

---

## 四、项目脚本和工具

### 4.1 启动脚本

| 脚本 | 说明 | 使用方法 |
|------|------|----------|
| `tools/start_all.py` | Python统一启动脚本 (推荐) | `py tools/start_all.py` |
| `tools/start-all.bat` | 批处理启动脚本 | 双击运行 |
| `System/backend/start.bat` | 单独启动System后端 | 双击运行 |
| `System/backend/start-dev.bat` | 开发模式启动System后端 | 双击运行 |

### 4.2 数据库工具

| 脚本 | 说明 |
|------|------|
| `tools/test-db-connection.js` | 测试TCC数据库连接 |
| `tools/test-database-connections.js` | 测试多个数据库连接 |
| `tools/verify-local-mongo.js` | 验证本地MongoDB状态 |
| `tools/migrate-admin-to-unified.js` | 迁移管理员数据 |

### 4.3 数据处理脚本

| 脚本 | 说明 |
|------|------|
| `scripts/convert-tcc-data.js` | 转换TCC数据格式 |
| `scripts/generate-map-data.js` | 生成地图数据 |
| `scripts/generate-navigation-graph.js` | 生成导航图 |
| `scripts/convert-to-geojson.js` | 转换为GeoJSON格式 |
| `scripts/convert-geojson-to-js.js` | 转换GeoJSON为JS |

### 4.4 测试脚本

| 脚本 | 说明 |
|------|------|
| `tools/test-login.js` | 登录测试 |
| `tools/debug-test-login.js` | 登录调试 |
| `tools/detailed-debug-login.js` | 详细登录调试 |
| `scripts/test-navigation-system.js` | 导航系统测试 |

---

## 五、端口配置

### 5.1 服务端口

| 服务 | 端口 | 访问地址 | 说明 |
|------|------|----------|------|
| TCC小程序后端 | **3001** | http://localhost:3001 | 为小程序提供API |
| System管理后端 | **5001** | http://localhost:5001 | 为管理前端提供API |
| System管理前端 | **5002/5003/5004/5173** | http://localhost:5002 | Vue开发服务器 |
| MongoDB | **27017** | localhost:27017 | 数据库服务 |

### 5.2 CORS允许的源

```
http://localhost:3001    - TCC后端
http://localhost:5002    - System前端
http://localhost:5003    - System前端(备用)
https://servicewechat.com - 微信小程序
https://tcb-api.tencentcloudapi.com - 腾讯云API
```

### 5.3 环境变量配置

**TCC后端 (.env)**:
```env
PORT=5000 (实际使用3001)
MONGODB_URI=mongodb://localhost:27017/parking_system
UNIFIED_MONGODB_URI=mongodb://127.0.0.1:27017/parking_system
JWT_SECRET=your_jwt_secret_key_here_miniprogram
CORS_ORIGIN=http://localhost:5002
SYSTEM_API_URL=http://localhost:5001/api
```

**System后端 (.env)**:
```env
PORT=3000 (实际使用5001)
MONGODB_URI=mongodb://localhost:27017/parking_admin
JWT_SECRET=your_jwt_secret_key_here
CORS_ORIGIN=http://localhost:5002
```

**System前端 (.env)**:
```env
VITE_API_BASE_URL=http://localhost:5001/api
VITE_APP_TITLE=智能停车场管理系统
```

---

## 六、数据库配置

### 6.1 MongoDB连接

```
地址: localhost:27017
TCC数据库: parking_system
System数据库: parking_admin
```

### 6.2 数据集合 (parking_system)

| 集合名 | 说明 |
|--------|------|
| users | 小程序用户 |
| parkingspaces | 车位信息 |
| paths | 导航路径 |
| admins | 管理员 |

### 6.3 数据集合 (parking_admin)

| 集合名 | 说明 |
|--------|------|
| users | 用户管理 |
| admins | 管理员 |
| parkingspaces | 车位信息 |
| parkingspacelogs | 车位变更日志 |
| parkingrecords | 停车记录 |
| transactions | 交易记录 |
| parkinglots | 停车场 |
| parkingareas | 停车区域 |
| mapnodes | 地图节点 |
| navigationpaths | 导航路径 |
| roles | 角色 |
| systemlogs | 系统日志 |
| systemsettings | 系统设置 |
| systemconfigs | 系统配置 |
| userfeedbacks | 用户反馈 |
| pricingrules | 定价规则 |
| miniprogramusers | 小程序用户 |
| miniprogramvehicles | 小程序车辆 |
| simulationhistories | 模拟历史 |

---

## 七、部署相关文件

### 7.1 Docker配置

| 文件 | 位置 | 说明 |
|------|------|------|
| `Dockerfile` | `System/backend/` | System后端Docker镜像 |
| `Dockerfile` | `System/frontend/` | System前端Docker镜像 |
| `docker-compose.yml` | `System/` | Docker编排配置 |

### 7.2 Nginx配置

| 文件 | 位置 | 说明 |
|------|------|------|
| `nginx.conf` | `System/nginx/` | Nginx配置 |
| `nginx.conf` | `System/frontend/` | 前端Nginx配置 |

### 7.3 部署脚本

| 文件 | 位置 | 说明 |
|------|------|------|
| `deploy.sh` | `System/` | Linux部署脚本 |
| `deploy.bat` | `System/` | Windows部署脚本 |
| `init-db.bat` | `System/backend/` | 数据库初始化 |

### 7.4 部署文档

| 文件 | 说明 |
|------|------|
| `docs/STARTUP-GUIDE.md` | 启动指南 |
| `docs/QUICKSTART.md` | 快速开始 |
| `System/DEPLOYMENT.md` | 部署文档 |
| `System/DEPLOYMENT-DOCUMENTATION.md` | 部署详细文档 |
| `System/DEPLOYMENT-GUIDE.md` | 部署指南 |

---

## 八、启动流程

### 8.1 一键启动 (推荐)

```bash
# 使用Python脚本 (推荐)
py tools/start_all.py

# 或使用批处理
tools\start-all.bat
```

启动脚本会自动：
1. 检查并安装依赖 (npm install)
2. 清理占用端口的进程
3. 启动TCC小程序后端 (端口3001)
4. 启动System管理后端 (端口5001)
5. 启动System管理前端 (端口5002+)
6. 自动打开微信开发者工具 (如果已安装)

### 8.2 手动启动

```bash
# 1. 启动MongoDB
mongod

# 2. 启动TCC后端
cd backend
npm run dev

# 3. 启动System后端
cd System/backend
npm run dev

# 4. 启动System前端
cd System/frontend
npm run dev
```

### 8.3 访问地址

- TCC小程序后端: http://localhost:3001
- TCC API健康检查: http://localhost:3001/health
- System管理后端: http://localhost:5001
- System API健康检查: http://localhost:5001/api/health
- System管理前端: http://localhost:5002

---

## 九、依赖技术栈

### 9.1 后端依赖

**TCC后端** (`backend/package.json`):
- express ^4.18.2
- mongoose ^7.5.0
- jsonwebtoken ^9.0.2
- cors ^2.8.5
- dotenv ^16.3.1
- multer ^1.4.5-lts.1
- axios ^1.12.2
- bcryptjs ^2.4.3
- @u4/opencv4nodejs ^6.5.2 (图像处理)

**System后端**:
- express
- mongoose
- helmet (安全)
- express-rate-limit (限流)
- morgan (日志)
- compression (压缩)

### 9.2 前端依赖

**微信小程序**:
- 微信小程序原生开发
- Map组件 (地图)
- wx.navigateTo (导航)

**System前端**:
- Vue 3
- Vite
- Element Plus (推测)
- Pinia (状态管理)

---

## 十、注意事项

1. **首次运行**: 确保运行 `npm install` 安装依赖
2. **MongoDB**: 确保MongoDB服务正在运行
3. **端口占用**: 如遇到端口占用，使用 `tools/start_all.py` 会自动清理
4. **微信开发者工具**: 需要安装微信开发者工具才能自动打开小程序
5. **数据库迁移**: 如需从远程服务器迁移数据，使用 `dump_78/` 目录下的备份文件

---

*文档最后更新: 2026-02-27*
