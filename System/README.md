# 智能停车场管理系统

这是一个完整的智能停车场管理系统，包含前端和后端两部分，提供停车场管理、用户管理、财务管理、数据分析等功能。

## 系统概述

系统采用前后端分离架构，前端基于React和Ant Design构建，后端基于Node.js和Express构建，使用MongoDB作为数据存储。

## 功能特性

- 用户认证与权限管理
- 停车场实时监控
- 停车位管理
- 智能导航系统
- 财务管理
- 数据分析与报表
- 系统配置管理

## 技术栈

### 前端
- React 18
- TypeScript
- Ant Design
- Redux Toolkit
- React Router
- Axios
- ECharts

### 后端
- Node.js
- Express.js
- MongoDB + Mongoose
- JWT认证
- bcryptjs密码加密
- Winston日志
- Multer文件上传
- node-cron定时任务

## 快速开始

### 环境要求

- Node.js 14.0+
- MongoDB 4.0+
- npm 6.0+

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd parking-management-system
```

2. 安装后端依赖
```bash
cd backend
npm install
```

3. 配置后端环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置数据库连接等信息：
```
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://192.168.0.78:27017/parking_admin
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h
```

4. 初始化数据库
```bash
# Windows
init-db.bat

# 或使用npm命令
npm run init-db
```

5. 启动后端服务
```bash
# 开发模式
npm run dev

# 或使用批处理脚本
start-dev.bat
```

6. 安装前端依赖
```bash
cd ../frontend
npm install
```

7. 配置前端环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置API地址：
```
REACT_APP_API_URL=http://localhost:3000/api
```

8. 启动前端服务
```bash
npm start
```

## 默认账户

系统初始化后会创建一个默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

## 项目结构

```
parking-management-system/
├── backend/                 # 后端代码
│   ├── controllers/         # 控制器
│   ├── middleware/          # 中间件
│   ├── models/              # 数据模型
│   ├── routes/              # 路由定义
│   ├── scripts/             # 脚本文件
│   ├── utils/               # 工具函数
│   ├── logs/                # 日志文件
│   ├── uploads/             # 上传文件
│   ├── .env.example         # 环境变量示例
│   ├── init-db.js           # 数据库初始化脚本
│   ├── init-db.bat          # 数据库初始化批处理
│   ├── start.bat            # 启动脚本
│   ├── start-dev.bat        # 开发模式启动脚本
│   ├── server.js            # 服务器入口文件
│   ├── package.json         # 项目配置
│   ├── README.md            # 后端说明
│   └── API.md               # API文档
├── frontend/                # 前端代码
│   ├── public/              # 静态资源
│   ├── src/
│   │   ├── components/      # 通用组件
│   │   ├── pages/           # 页面组件
│   │   ├── hooks/           # 自定义钩子
│   │   ├── services/        # API服务
│   │   ├── store/           # Redux状态管理
│   │   ├── utils/           # 工具函数
│   │   ├── types/           # TypeScript类型定义
│   │   ├── styles/          # 样式文件
│   │   ├── App.tsx          # 应用根组件
│   │   └── index.tsx        # 应用入口
│   ├── package.json         # 项目配置
│   └── README.md            # 前端说明
└── README.md                # 项目总体说明
```

## API文档

详细的API文档请参考 [backend/API.md](./backend/API.md)

## 部署

### 使用Docker Compose部署

1. 构建并启动所有服务
```bash
docker-compose up -d
```

2. 查看服务状态
```bash
docker-compose ps
```

### 手动部署

1. 部署后端
```bash
cd backend
npm install --production
npm run build
pm2 start server.js --name parking-api
```

2. 部署前端
```bash
cd frontend
npm install
npm run build
# 将build目录下的文件部署到Web服务器
```

## 开发指南

### 后端开发

1. 在 `models/` 目录下定义数据模型
2. 在 `controllers/` 目录下实现控制器逻辑
3. 在 `routes/` 目录下定义路由
4. 在 `middleware/` 目录下添加必要的中间件

### 前端开发

1. 在 `src/pages/` 目录下创建页面组件
2. 在 `src/components/` 目录下创建通用组件
3. 在 `src/services/` 目录下添加API服务
4. 在 `src/store/` 目录下管理状态

## 测试

### 后端测试
```bash
cd backend
npm test
```

### 前端测试
```bash
cd frontend
npm test
```

## 贡献

欢迎提交Issue和Pull Request来改进这个项目。

## 许可证

MIT License