# 停车场管理系统后端

这是一个基于Node.js和Express的停车场管理系统后端API，提供完整的停车场管理功能。

## 功能特性

- 用户认证与授权
- 停车场管理
- 停车位管理
- 实时导航
- 数据模拟
- 财务管理
- 数据分析
- 系统管理

## 技术栈

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
cd parking-admin-backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
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

5. 启动服务
```bash
# 生产模式
npm start

# 开发模式
npm run dev

# Windows批处理启动
start.bat
```

## 项目结构

```
backend/
├── controllers/          # 控制器
├── middleware/           # 中间件
├── models/              # 数据模型
├── routes/              # 路由定义
├── scripts/             # 脚本文件
├── utils/               # 工具函数
├── logs/                # 日志文件
├── uploads/             # 上传文件
├── .env.example         # 环境变量示例
├── init-db.js           # 数据库初始化脚本
├── init-db.bat          # 数据库初始化批处理
├── start.bat            # 启动脚本
├── start-dev.bat        # 开发模式启动脚本
├── server.js            # 服务器入口文件
├── package.json         # 项目配置
└── README.md            # 项目说明
```

## API文档

详细的API文档请参考 [API.md](./API.md)

## 默认账户

系统初始化后会创建一个默认管理员账户：
- 用户名: `admin`
- 密码: `admin123`

## 开发指南

### 添加新API

1. 在 `models/` 目录下定义数据模型
2. 在 `controllers/` 目录下实现控制器逻辑
3. 在 `routes/` 目录下定义路由
4. 在 `middleware/` 目录下添加必要的中间件（如认证、验证等）

### 数据库操作

使用Mongoose进行数据库操作，示例：

```javascript
const User = require('../models/User')

// 查询用户
const users = await User.find({ isActive: true })

// 创建用户
const user = new User({
  username: 'test',
  email: 'test@example.com',
  password: 'hashedPassword'
})
await user.save()

// 更新用户
await User.findByIdAndUpdate(userId, { profile: { firstName: 'Test' } })

// 删除用户
await User.findByIdAndDelete(userId)
```

### 错误处理

系统提供统一的错误处理机制，在控制器中使用：

```javascript
try {
  // 业务逻辑
} catch (error) {
  next(error)
}
```

### 日志记录

使用Winston进行日志记录：

```javascript
const logger = require('../utils/logger')

logger.info('信息日志')
logger.warn('警告日志')
logger.error('错误日志')
```

## 部署

### 使用PM2部署

1. 安装PM2
```bash
npm install -g pm2
```

2. 启动应用
```bash
pm2 start server.js --name parking-api
```

3. 查看状态
```bash
pm2 status
```

### 使用Docker部署

1. 构建镜像
```bash
docker build -t parking-api .
```

2. 运行容器
```bash
docker run -d -p 3000:3000 --name parking-api parking-api
```

## 测试

运行测试：
```bash
npm test
```

运行测试并监听文件变化：
```bash
npm run test:watch
```

## 许可证

MIT License