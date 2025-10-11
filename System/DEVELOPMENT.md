# 开发指南

本文档提供了智能停车场管理系统的开发指南，包括环境搭建、代码结构、开发规范等。

## 开发环境搭建

### 前置要求

- Node.js 14.0+
- MongoDB 4.0+
- npm 6.0+
- Git
- VS Code（推荐）

### 1. 克隆项目

```bash
git clone <repository-url>
cd parking-management-system
```

### 2. 后端开发环境

```bash
# 进入后端目录
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
# 配置数据库连接、JWT密钥等

# 初始化数据库
npm run init-db

# 启动开发服务器
npm run dev
```

### 3. 前端开发环境

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑环境变量
# 配置API地址等

# 启动开发服务器
npm start
```

## 项目结构

### 后端结构

```
backend/
├── controllers/          # 控制器
│   ├── authController.js
│   ├── userController.js
│   ├── parkingLotController.js
│   └── ...
├── middleware/           # 中间件
│   ├── auth.js
│   ├── errorHandler.js
│   ├── notFound.js
│   └── ...
├── models/              # 数据模型
│   ├── User.js
│   ├── ParkingLot.js
│   ├── ParkingSpace.js
│   └── ...
├── routes/              # 路由定义
│   ├── auth.js
│   ├── users.js
│   ├── parkingLots.js
│   └── ...
├── scripts/             # 脚本文件
│   ├── initDatabase.js
│   └── init-mongo.js
├── utils/               # 工具函数
│   ├── logger.js
│   ├── validation.js
│   ├── upload.js
│   └── cron.js
├── logs/                # 日志文件
├── uploads/             # 上传文件
├── .env.example         # 环境变量示例
├── init-db.js           # 数据库初始化脚本
├── server.js            # 服务器入口文件
└── package.json         # 项目配置
```

### 前端结构

```
frontend/
├── public/              # 静态资源
│   ├── index.html
│   └── favicon.ico
├── src/
│   ├── components/      # 通用组件
│   │   ├── Layout/
│   │   ├── Charts/
│   │   └── Forms/
│   ├── pages/           # 页面组件
│   │   ├── Dashboard/
│   │   ├── Users/
│   │   ├── ParkingLots/
│   │   └── ...
│   ├── hooks/           # 自定义钩子
│   │   ├── useAuth.js
│   │   └── useApi.js
│   ├── services/        # API服务
│   │   ├── api.js
│   │   ├── authService.js
│   │   └── userService.js
│   ├── store/           # Redux状态管理
│   │   ├── index.js
│   │   ├── slices/
│   │   └── middleware/
│   ├── utils/           # 工具函数
│   │   ├── constants.js
│   │   └── helpers.js
│   ├── types/           # TypeScript类型定义
│   │   ├── auth.ts
│   │   └── api.ts
│   ├── styles/          # 样式文件
│   │   ├── globals.css
│   │   └── variables.css
│   ├── App.tsx          # 应用根组件
│   └── index.tsx        # 应用入口
├── package.json         # 项目配置
└── README.md            # 项目说明
```

## 开发规范

### 1. 代码风格

#### JavaScript/TypeScript

- 使用ES6+语法
- 使用ESLint和Prettier进行代码格式化
- 使用驼峰命名法
- 常量使用大写字母和下划线
- 函数和变量使用有意义的名称

#### CSS

- 使用BEM命名规范
- 使用CSS变量
- 避免内联样式
- 使用响应式设计

### 2. Git工作流

#### 分支策略

- `main`: 主分支，用于生产环境
- `develop`: 开发分支，用于集成功能
- `feature/*`: 功能分支，用于开发新功能
- `bugfix/*`: 修复分支，用于修复bug
- `release/*`: 发布分支，用于发布准备

#### 提交规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

类型（type）：
- `feat`: 新功能
- `fix`: 修复bug
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动

示例：
```
feat(auth): 添加JWT认证功能

实现了基于JWT的用户认证，包括登录、注册和令牌刷新功能。

Closes #123
```

### 3. API设计规范

#### RESTful API

- 使用HTTP动词表示操作：
  - `GET`: 获取资源
  - `POST`: 创建资源
  - `PUT`: 更新资源
  - `DELETE`: 删除资源

- 使用名词表示资源：
  - `/api/users`: 用户资源
  - `/api/parking-lots`: 停车场资源

- 使用HTTP状态码表示结果：
  - `200`: 成功
  - `201`: 创建成功
  - `400`: 请求错误
  - `401`: 未认证
  - `403`: 无权限
  - `404`: 资源不存在
  - `500`: 服务器错误

#### 响应格式

```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 响应数据
  },
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 100
  }
}
```

错误响应：
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "请求参数验证失败",
    "details": [
      {
        "field": "email",
        "message": "邮箱格式不正确"
      }
    ]
  }
}
```

## 开发流程

### 1. 功能开发

1. 创建功能分支
```bash
git checkout -b feature/new-feature
```

2. 开发功能
- 后端：模型 → 控制器 → 路由 → 中间件
- 前端：组件 → 页面 → 路由 → 状态管理

3. 编写测试
- 后端：单元测试、集成测试
- 前端：组件测试、端到端测试

4. 提交代码
```bash
git add .
git commit -m "feat: 添加新功能"
git push origin feature/new-feature
```

5. 创建Pull Request
- 填写PR模板
- 等待代码审查
- 根据反馈修改代码

6. 合并代码
```bash
git checkout develop
git pull origin develop
git merge feature/new-feature
git push origin develop
```

### 2. Bug修复

1. 创建修复分支
```bash
git checkout -b bugfix/fix-bug
```

2. 修复bug
- 定位问题
- 编写测试用例
- 修复代码
- 确保测试通过

3. 提交代码
```bash
git add .
git commit -m "fix: 修复登录问题"
git push origin bugfix/fix-bug
```

4. 创建Pull Request并合并

## 测试

### 1. 后端测试

#### 单元测试

使用Jest进行单元测试：

```javascript
// tests/controllers/authController.test.js
const request = require('supertest')
const app = require('../../server')

describe('Auth Controller', () => {
  test('用户登录成功', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'admin',
        password: 'admin123'
      })
    
    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.token).toBeDefined()
  })
})
```

#### 集成测试

```javascript
// tests/integration/auth.test.js
const request = require('supertest')
const app = require('../../server')

describe('Auth Integration', () => {
  test('完整登录流程', async () => {
    // 注册用户
    await request(app)
      .post('/api/auth/register')
      .send({
        username: 'testuser',
        email: 'test@example.com',
        password: 'password123'
      })
    
    // 登录
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        username: 'testuser',
        password: 'password123'
      })
    
    expect(loginResponse.status).toBe(200)
    expect(loginResponse.body.data.token).toBeDefined()
    
    // 获取用户信息
    const meResponse = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${loginResponse.body.data.token}`)
    
    expect(meResponse.status).toBe(200)
    expect(meResponse.body.data.user.username).toBe('testuser')
  })
})
```

### 2. 前端测试

#### 组件测试

使用React Testing Library进行组件测试：

```javascript
// src/components/__tests__/LoginForm.test.js
import { render, screen, fireEvent } from '@testing-library/react'
import LoginForm from '../LoginForm'

test('登录表单提交', () => {
  const mockSubmit = jest.fn()
  render(<LoginForm onSubmit={mockSubmit} />)
  
  // 填写表单
  fireEvent.change(screen.getByLabelText(/用户名/i), {
    target: { value: 'testuser' }
  })
  fireEvent.change(screen.getByLabelText(/密码/i), {
    target: { value: 'password123' }
  })
  
  // 提交表单
  fireEvent.click(screen.getByRole('button', { name: /登录/i }))
  
  // 验证提交
  expect(mockSubmit).toHaveBeenCalledWith({
    username: 'testuser',
    password: 'password123'
  })
})
```

#### 端到端测试

使用Cypress进行端到端测试：

```javascript
// cypress/integration/login.spec.js
describe('登录功能', () => {
  it('用户可以成功登录', () => {
    cy.visit('/login')
    
    cy.get('input[name="username"]').type('admin')
    cy.get('input[name="password"]').type('admin123')
    cy.get('button[type="submit"]').click()
    
    cy.url().should('include', '/dashboard')
    cy.get('[data-testid="user-menu"]').should('contain', 'admin')
  })
})
```

## 调试

### 1. 后端调试

使用VS Code调试后端：

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/backend/server.js",
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "runtimeExecutable": "nodemon"
    }
  ]
}
```

### 2. 前端调试

使用React Developer Tools和Redux DevTools进行前端调试。

## 性能优化

### 1. 后端优化

- 使用数据库索引
- 实现缓存机制
- 使用连接池
- 优化查询
- 实现分页

### 2. 前端优化

- 代码分割
- 懒加载
- 缓存策略
- 图片优化
- 减少重渲染

## 常见问题

### 1. 跨域问题

后端配置CORS中间件：

```javascript
const cors = require('cors')

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}))
```

### 2. 认证问题

确保JWT令牌正确设置：

```javascript
// 前端
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`

// 后端
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '')
  
  if (!token) {
    return res.status(401).json({ success: false, error: { message: '访问被拒绝' } })
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    next()
  } catch (error) {
    res.status(401).json({ success: false, error: { message: '令牌无效' } })
  }
}
```

## 资源链接

- [Node.js文档](https://nodejs.org/docs/)
- [Express.js文档](https://expressjs.com/)
- [React文档](https://reactjs.org/docs/)
- [Ant Design文档](https://ant.design/docs/react/introduce-cn)
- [MongoDB文档](https://docs.mongodb.com/)
- [Mongoose文档](https://mongoosejs.com/docs/)