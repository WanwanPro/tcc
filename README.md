# 智能停车场车位引导与智能导航系统

## 项目概述

本项目是一个基于微信小程序的智能停车场车位引导与导航系统，通过图像识别和深度学习技术提高车位状态识别准确率，结合动态路径规划算法，为用户提供高效、便捷的停车体验。

## 技术栈

- 前端：微信小程序原生开发
- 后端：Node.js + Express
- 数据库：MongoDB
- 图像识别：OpenCV + TensorFlow.js
- 路径规划：A*算法改进版
- 地图可视化：微信小程序地图组件

## 项目结构

```
.
├── backend                 # 后端代码
│   ├── controllers         # 控制器
│   ├── models              # 数据模型
│   ├── routes              # 路由
│   ├── services            # 业务逻辑
│   ├── middleware          # 中间件
│   ├── utils               # 工具函数
│   ├── config              # 配置文件
│   ├── server.js           # 服务入口文件
│   └── package.json        # 后端依赖配置
└── frontend                # 前端代码
    └── miniprogram         # 微信小程序代码
        ├── pages           # 页面文件
        ├── components      # 组件
        ├── utils           # 工具函数
        ├── assets          # 静态资源
        ├── config          # 配置文件
        ├── app.js          # 小程序入口文件
        ├── app.json        # 小程序配置文件
        └── project.config.json # 项目配置文件
```

## 功能模块

1. **用户界面模块**：提供车位查询、导航引导、用户设置等功能
2. **车位状态模块**：负责车位状态检测与更新
3. **路径规划模块**：计算最优路径并实时调整
4. **地图展示模块**：可视化停车场布局和导航路线
5. **用户管理模块**：处理用户注册、登录、偏好设置等

## 安装与运行

### 后端服务

1. 进入后端目录：
   ```
   cd backend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 启动服务：
   ```
   npm start
   ```

### 前端小程序

1. 使用微信开发者工具打开 `frontend/miniprogram` 目录
2. 在微信开发者工具中编译并预览小程序

## API接口

### 车位相关接口
- `GET /api/spaces` - 获取车位状态
- `POST /api/spaces/update` - 更新车位状态

### 路径规划接口
- `POST /api/path/plan` - 计算最优路径
- `POST /api/path/adjust` - 实时路径调整

### 用户相关接口
- `POST /api/user/login` - 用户登录
- `GET /api/user/info/:userId` - 获取用户信息

## 开发计划

- [x] 项目结构搭建
- [x] 后端API开发
- [x] 数据库模型设计
- [x] 微信小程序页面开发
- [x] 图像识别模块开发
- [x] 路径规划算法优化
- [x] 系统测试与优化
- [x] 部署上线

## 本地部署

### 环境准备

1. 安装Node.js（建议版本16或更高）
2. 安装MongoDB数据库并确保服务正常运行
3. 安装微信开发者工具

### 后端服务部署

1. 进入后端目录：
   ```
   cd backend
   ```

2. 安装依赖：
   ```
   npm install
   ```

3. 配置环境变量（修改 `.env` 文件）：
   ```
   NODE_ENV=development
   PORT=3000
   MONGODB_URI=mongodb://localhost:27017/parking_system
   JWT_SECRET=your_jwt_secret_key_here
   WECHAT_APP_ID=your_wechat_app_id
   WECHAT_APP_SECRET=your_wechat_app_secret
   ```

4. 启动服务：
   ```
   npm start
   ```
   或者使用开发模式（自动重启）：
   ```
   npm run dev
   ```

### 前端小程序部署

1. 使用微信开发者工具打开 `frontend/miniprogram` 目录
2. 在微信开发者工具中配置AppID（在 `project.config.json` 中）
3. 修改 `frontend/miniprogram/app.js` 中的全局配置，确保 `baseUrl` 指向本地后端服务：
   ```javascript
   globalData: {
     baseUrl: 'http://localhost:3000/api'
   }
   ```
4. 在微信开发者工具中编译并预览小程序

### 测试

1. 运行后端测试：
   ```
   cd backend
   npm test
   ```

2. 查看测试覆盖率：
   ```
   npm run test:coverage
   ```

## 注意事项

1. 需要安装MongoDB数据库并确保服务正常运行
2. 需要配置微信小程序的AppID
3. 图像识别模块需要额外的OpenCV和TensorFlow.js依赖