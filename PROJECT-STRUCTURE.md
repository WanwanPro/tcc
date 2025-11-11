# 智能停车场管理系统项目结构文档

## 项目概述

本项目是一个智能停车场管理系统，包含两个主要子系统：
1. **TCC小程序系统** - 面向用户的微信小程序，提供停车导航、车位查找等功能
2. **System管理系统** - 后台管理系统，用于停车场的运营管理、数据分析等

## 目录结构

```
tcc/
├── backend/                  # TCC小程序后端
├── config/                   # 配置文件目录
├── docs/                     # 文档目录
├── frontend/                 # TCC小程序前端
├── scripts/                  # 项目脚本
├── System/                   # System管理系统
│   ├── backend/              # System管理后端
│   └── frontend/             # System管理前端
├── tools/                    # 工具脚本目录
├── start-all.ps1             # 启动所有服务的PowerShell脚本
└── README.md                 # 项目说明文档
```

## 核心模块详解

### 1. TCC小程序系统

#### 1.1 后端 (tcc/backend/)
- **主要功能**: 为微信小程序提供API接口
- **技术栈**: Node.js + Express + MongoDB
- **核心模块**:
  - `server.js` - 服务入口文件
  - `controllers/` - 控制器层，处理业务逻辑
  - `models/` - 数据模型，定义数据结构
  - `routes/` - 路由配置，定义API端点
  - `services/` - 服务层，处理复杂业务逻辑
  - `utils/` - 工具函数
  - `tests/` - 测试文件

#### 1.2 前端 (tcc/frontend/miniprogram/)
- **主要功能**: 微信小程序前端界面
- **技术栈**: 微信小程序原生开发
- **核心模块**:
  - `app.js` - 小程序入口文件
  - `pages/` - 页面文件
    - `index/` - 首页
    - `map/` - 地图页面
    - `navigation/` - 导航页面
    - `profile/` - 个人中心页面
  - `assets/` - 静态资源
  - `utils/` - 工具函数

### 2. System管理系统

#### 2.1 后端 (tcc/System/backend/)
- **主要功能**: 后台管理系统后端，提供管理API接口
- **技术栈**: Node.js + Express + MongoDB
- **核心模块**:
  - `server.js` - 服务入口文件
  - `controllers/` - 控制器层
    - `authController.js` - 认证相关
    - `parkingController.js` - 停车管理相关
    - `userController.js` - 用户管理相关
    - `financeController.js` - 财务管理相关
    - `analyticsController.js` - 数据分析相关
    - 等其他控制器
  - `models/` - 数据模型
    - `Admin.js` - 管理员模型
    - `User.js` - 用户模型
    - `ParkingSpace.js` - 车位模型
    - `Transaction.js` - 交易模型
    - 等其他模型
  - `routes/` - 路由配置
  - `middleware/` - 中间件
  - `services/` - 服务层
  - `utils/` - 工具函数
  - `scripts/` - 脚本文件

#### 2.2 前端 (tcc/System/frontend/)
- **主要功能**: 后台管理系统前端界面
- **技术栈**: Vue 3 + Vite
- **核心模块**:
  - `index.html` - 入口HTML文件
  - `src/` - 源代码目录
    - `main.js` - 应用入口
    - `App.vue` - 根组件
    - `api/` - API接口封装
    - `components/` - 公共组件
    - `layout/` - 布局组件
    - `router/` - 路由配置
    - `stores/` - 状态管理
    - `utils/` - 工具函数
    - `views/` - 页面视图
      - `dashboard/` - 仪表板
      - `parking/` - 停车管理
      - `users/` - 用户管理
      - `finance/` - 财务管理
      - `analytics/` - 数据分析
      - `system/` - 系统设置

### 3. 项目脚本和工具

#### 3.1 启动脚本
- `start-all.bat` - 启动所有服务（TCC后端、System后端、System前端）
- `start-all-unified.bat` - 统一窗口启动所有服务
- `start-tcc-backend.bat` - 启动TCC后端
- `start-system-backend.bat` - 启动System后端
- `start-system.bat` - 启动System前端
- `stop-all.bat` - 停止所有服务

#### 3.2 项目脚本 (tcc/scripts/)
- 数据转换和处理脚本
- 地图数据生成脚本
- 导航路径计算脚本

## 端口配置

- **TCC小程序后端**: 3001端口
- **System管理后端**: 5001端口
- **System管理前端**: 5002端口

## 数据库配置

项目使用MongoDB作为数据库，包含以下主要集合：
- 用户数据 (Users)
- 车位数据 (ParkingSpaces)
- 交易记录 (Transactions)
- 管理员数据 (Admins)
- 系统配置 (SystemConfigs)
- 地图节点 (MapNodes)
- 导航路径 (NavigationPaths)

## 部署相关文件

- `DEPLOYMENT-DOCUMENTATION.md` - 部署文档
- `DEPLOYMENT-GUIDE.md` - 部署指南
- `Dockerfile` - Docker配置文件
- `docker-compose.yml` - Docker编排文件
- `nginx.conf` - Nginx配置文件