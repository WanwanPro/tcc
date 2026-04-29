# TCC 智能停车场管理系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D14.0-green.svg)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/mongodb-%3E%3D4.0-green.svg)](https://www.mongodb.com/)

## 目录

- [系统概述](#系统概述)
- [系统架构](#系统架构)
- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [项目结构](#项目结构)
- [快速开始](#快速开始)
- [环境配置](#环境配置)
- [API 文档](#api-文档)
- [部署指南](#部署指南)
- [开发指南](#开发指南)
- [常见问题](#常见问题)
- [许可证](#许可证)

---

## 系统概述

TCC 智能停车场管理系统是一个全栈式的停车场管理解决方案，包含微信小程序客户端和 Web 管理后台两个主要部分。系统采用前后端分离架构，提供停车位实时监控、智能导航、财务管理、数据分析等功能。

### 主要组件

| 组件 | 描述 | 端口 | 技术栈 |
|------|------|------|--------|
| **TCC 小程序后端** | 为微信小程序提供 API 服务 | 3001 | Node.js + Express |
| **System 管理后端** | 为管理前端提供 API 服务 | 5001 | Node.js + Express |
| **System 管理前端** | Web 管理后台界面 | 5002 | Vue 3 + Element Plus |
| **TCC 微信小程序** | 用户端停车引导与导航 | - | 微信小程序 |

---

## 功能特性

### 停车场管理
- 实时车位状态监控
- 车位分布可视化展示
- 车位使用统计分析
- 区域化管理支持

### 智能导航
- 室内路径规划算法
- 实时导航指引
- 最优车位推荐
- 反向寻车功能

### 用户管理
- 微信用户认证
- 角色权限控制
- 用户行为分析
- 黑名单管理

### 财务管理
- 停车费用计算
- 支付记录管理
- 财务报表生成
- 收费规则配置

### 数据分析
- 车流趋势分析
- 收入统计报表
- 车位利用率分析
- 数据可视化展示

### 系统配置
- 参数灵活配置
- 操作日志记录
- 系统健康监控
- 定时任务管理

---

## 技术栈

### 后端技术

| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | >= 14.0 | 运行时环境 |
| Express.js | ^4.18.2 | Web 框架 |
| MongoDB | >= 4.0 | 数据库 |
| Mongoose | ^7.x | ODM 库 |
| JWT | ^9.0.x | 身份认证 |
| bcryptjs | ^2.4.3 | 密码加密 |
| CORS | ^2.8.5 | 跨域处理 |
| dotenv | ^16.3.1 | 环境变量 |
| multer | ^1.4.5 | 文件上传 |
| node-cron | ^3.0.2 | 定时任务 |
| winston | ^3.10.0 | 日志管理 |

### 前端技术（管理后台）

| 技术 | 版本 | 用途 |
|------|------|------|
| Vue 3 | ^3.3.4 | 前端框架 |
| Vite | ^4.4.5 | 构建工具 |
| Element Plus | ^2.3.8 | UI 组件库 |
| Pinia | ^2.1.6 | 状态管理 |
| Vue Router | ^4.2.4 | 路由管理 |
| Axios | ^1.4.0 | HTTP 客户端 |
| ECharts | ^5.4.3 | 数据可视化 |
| Leaflet | ^1.9.4 | 地图组件 |
| Day.js | ^1.11.9 | 日期处理 |

### 微信小程序

| 技术 | 用途 |
|------|------|
| 微信小程序原生框架 | 基础框架 |
| 微信云开发 | 云服务支持 |
| 腾讯地图 SDK | 地图导航 |

---

## 项目结构

```
tcc/
├── backend/                    # TCC 小程序后端 (Node.js)
│   ├── controllers/            # 控制器层
│   ├── models/                 # 数据模型
│   ├── routes/                 # 路由定义
│   ├── services/               # 业务服务
│   ├── utils/                  # 工具函数
│   ├── scripts/                # 脚本文件
│   ├── tests/                  # 测试文件
│   ├── .env.example            # 环境变量示例
│   ├── server.js               # 服务器入口
│   ├── package.json            # 依赖配置
│   └── README.md               # 后端说明
│
├── frontend/                   # 前端代码
│   └── miniprogram/            # 微信小程序
│       ├── pages/              # 页面组件
│       ├── utils/              # 工具函数
│       ├── assets/             # 静态资源
│       ├── app.js              # 应用入口
│       ├── app.json            # 应用配置
│       └── project.config.json # 项目配置
│
├── System/                     # 后台管理系统
│   ├── backend/                # 管理后端 (Node.js)
│   │   ├── controllers/        # 控制器层
│   │   ├── models/             # 数据模型
│   │   ├── routes/             # 路由定义
│   │   ├── middleware/         # 中间件
│   │   ├── utils/              # 工具函数
│   │   ├── scripts/            # 脚本文件
│   │   ├── logs/               # 日志目录
│   │   ├── uploads/            # 上传文件
│   │   ├── .env.example        # 环境变量示例
│   │   ├── init-db.js          # 数据库初始化
│   │   ├── server.js           # 服务器入口
│   │   ├── package.json        # 依赖配置
│   │   ├── API.md              # API 文档
│   │   └── README.md           # 后端说明
│   │
│   └── frontend/               # 管理前端 (Vue 3)
│       ├── src/
│       │   ├── api/            # API 接口
│       │   ├── components/     # 通用组件
│       │   ├── views/          # 页面视图
│       │   ├── router/         # 路由配置
│       │   ├── stores/         # Pinia 状态
│       │   ├── utils/          # 工具函数
│       │   ├── plugins/        # 插件配置
│       │   ├── assets/         # 静态资源
│       │   ├── styles/         # 样式文件
│       │   ├── App.vue         # 根组件
│       │   └── main.js         # 应用入口
│       ├── public/             # 公共静态文件
│       ├── index.html          # HTML 模板
│       ├── vite.config.js      # Vite 配置
│       ├── package.json        # 依赖配置
│       └── README.md           # 前端说明
│
├── tools/                      # 工具脚本
│   ├── start_all.py            # 启动脚本
│   └── ...
│
├── docs/                       # 文档目录
├── scripts/                    # 部署脚本
├── deploy/                     # 部署配置
│
├── start-all.bat               # Windows 启动脚本
├── stop-all.bat                # Windows 停止脚本
├── docker-compose.yml          # Docker 编排
└── README.md                   # 项目说明
```

---

## 快速开始

### 环境要求

- **Node.js**: >= 14.0 (推荐 16.x 或更高)
- **npm**: >= 6.0
- **MongoDB**: >= 4.0
- **Git**: 最新版本
- **微信开发者工具**: (用于小程序开发)

### 安装步骤

#### 1. 克隆项目

```bash
git clone <repository-url>
cd tcc
```

#### 2. 一键启动（推荐）

**Windows:**
```batch
start-all.bat
```

**Linux/Mac:**
```bash
python tools/start_all.py
```

该脚本会自动：
- 检查并安装各模块的 npm 依赖
- 清理可能被占用的端口
- 依次启动所有服务
- 显示服务启动状态

#### 3. 手动启动

##### 3.1 安装依赖

```bash
cd backend && npm install
cd ../System/backend && npm install
cd ../frontend && npm install
```

##### 3.2 配置环境变量

```bash
# TCC 小程序后端配置
cd ../../backend
cp .env.example .env

# System 管理后端配置
cd ../System/backend
cp .env.example .env

# System 管理前端配置
cd ../frontend
cp .env.example .env
```

##### 3.3 初始化数据库

```bash
cd System/backend
npm run init-db
```

##### 3.4 启动服务

```bash
# 终端 1 - TCC 小程序后端 (端口 3001)
cd backend && npm run dev

# 终端 2 - System 管理后端 (端口 5001)
cd System/backend && npm run dev

# 终端 3 - System 管理前端 (端口 5002)
cd System/frontend && npm run dev
```

#### 4. 访问系统

| 服务 | 地址 | 说明 |
|------|------|------|
| TCC 小程序后端 API | http://localhost:3001 | 微信小程序接口 |
| System 管理后端 API | http://localhost:5001 | 管理后台接口 |
| System 管理前端 | http://localhost:5002 | Web 管理界面 |

#### 5. 默认账户

- **用户名**: admin
- **密码**: admin123

⚠️ **安全提示**: 首次登录后请立即修改默认密码！

---

## 环境配置

### TCC 小程序后端 (.env)

```bash
NODE_ENV=development
PORT=3001
MONGODB_URI=mongodb://127.0.0.1:27017/parking_system
JWT_SECRET=your_jwt_secret_key
```

### System 管理后端 (.env)

```bash
NODE_ENV=development
PORT=5001
MONGODB_URI=mongodb://127.0.0.1:27017/parking_admin
JWT_SECRET=your_jwt_secret_key
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=admin123
```

### System 管理前端 (.env)

```bash
VITE_APP_TITLE=智能停车场管理系统
VITE_API_BASE_URL=http://localhost:5001/api
VITE_APP_ENV=development
```

---

## API 文档

### TCC 小程序后端 (Port 3001)

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/users/login | POST | 用户登录 |
| /api/spaces | GET | 获取车位列表 |
| /api/paths/navigate | POST | 获取导航路径 |
| /api/images/upload | POST | 上传图片 |

### System 管理后端 (Port 5001)

| 端点 | 方法 | 描述 |
|------|------|------|
| /api/admin/login | POST | 管理员登录 |
| /api/admin/users | GET/POST | 用户管理 |
| /api/admin/spaces | GET/POST/PUT/DELETE | 车位管理 |
| /api/admin/finance | GET | 财务管理 |
| /api/admin/statistics | GET | 统计数据 |

详细 API 文档请参考：
- [TCC 小程序后端 API](./backend/API.md)
- [System 管理后端 API](./System/backend/API.md)

---

## 部署指南

### Docker 部署

```bash
docker-compose up -d
docker-compose ps
```

### 生产环境部署

#### 后端部署

```bash
cd backend
npm install --production
pm2 start server.js --name tcc-backend
```

#### 前端部署

```bash
cd System/frontend
npm install
npm run build
# 将 dist 目录部署到 Nginx
```

---

## 开发指南

### 后端开发

1. 在 routes/ 目录创建路由文件
2. 在 controllers/ 目录实现控制器逻辑
3. 在 models/ 目录定义或更新数据模型

### 前端开发

1. 在 src/views/ 目录创建 Vue 组件
2. 在 src/router/index.js 添加路由配置
3. 在 src/api/ 目录添加 API 调用

### 微信小程序开发

1. 使用微信开发者工具打开 frontend/miniprogram 目录
2. 配置 project.config.json 中的 AppID
3. 在微信开发者工具中预览和调试

---

## 常见问题

### Q1: 端口被占用怎么办？

```bash
# Windows - 停止所有服务
stop-all.bat

# 或者手动查找并结束占用端口的进程
netstat -ano | findstr :3001
taskkill /F /PID <pid>
```

### Q2: MongoDB 连接失败？

检查项:
1. MongoDB 服务是否启动
2. 连接字符串是否正确
3. 数据库权限是否配置

### Q3: 依赖安装失败？

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# 使用淘宝镜像
npm config set registry https://registry.npmmirror.com
```

---

## 贡献指南

欢迎贡献代码！请遵循以下步骤：

1. Fork 本仓库
2. 创建特性分支 (git checkout -b feature/AmazingFeature)
3. 提交更改 (git commit -m 'Add some AmazingFeature')
4. 推送到分支 (git push origin feature/AmazingFeature)
5. 开启 Pull Request

---

## 许可证

本项目采用 MIT 许可证 - 查看 LICENSE 文件了解详情。

---

<div align="center">

**Made with ❤️ by the TCC Team**

</div>
