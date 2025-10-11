# 停车场管理系统前端

这是停车场管理系统的前端部分，基于React和Ant Design构建。

## 功能特性

- 用户认证与权限管理
- 停车场实时监控
- 停车位管理
- 导航地图
- 财务报表
- 数据分析
- 系统设置

## 技术栈

- React 18
- TypeScript
- Ant Design
- React Router
- Axios
- Redux Toolkit
- ECharts
- React Query

## 快速开始

### 环境要求

- Node.js 14.0+
- npm 6.0+

### 安装步骤

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
```bash
cp .env.example .env
```

编辑 `.env` 文件，配置API地址等信息：
```
REACT_APP_API_URL=http://localhost:3000/api
REACT_APP_MAP_API_KEY=your_map_api_key
```

4. 启动开发服务器
```bash
npm start
```

## 项目结构

```
frontend/
├── public/              # 静态资源
├── src/
│   ├── components/      # 通用组件
│   ├── pages/           # 页面组件
│   ├── hooks/           # 自定义钩子
│   ├── services/        # API服务
│   ├── store/           # Redux状态管理
│   ├── utils/           # 工具函数
│   ├── types/           # TypeScript类型定义
│   ├── styles/          # 样式文件
│   ├── App.tsx          # 应用根组件
│   └── index.tsx        # 应用入口
├── package.json         # 项目配置
└── README.md            # 项目说明
```

## 开发指南

### 添加新页面

1. 在 `src/pages/` 目录下创建页面组件
2. 在 `src/types/` 目录下定义类型
3. 在 `src/services/` 目录下添加API服务
4. 在 `src/components/` 目录下创建通用组件（如有需要）
5. 在路由配置中添加新页面

### 状态管理

使用Redux Toolkit进行状态管理：

```typescript
import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface UserState {
  currentUser: User | null
  isLoading: boolean
  error: string | null
}

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User>) => {
      state.currentUser = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    }
  }
})

export const { setCurrentUser, setLoading, setError } = userSlice.actions
export default userSlice.reducer
```

### API调用

使用Axios进行API调用：

```typescript
import { apiClient } from '../utils/api'

export const userService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', credentials)
    return response.data
  },
  
  getUsers: async (params?: UserQueryParams): Promise<UserListResponse> => {
    const response = await apiClient.get('/users', { params })
    return response.data
  },
  
  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const response = await apiClient.put(`/users/${id}`, userData)
    return response.data
  }
}
```

## 部署

### 构建生产版本

```bash
npm run build
```

### 使用Nginx部署

1. 构建项目
2. 将构建后的文件部署到Nginx服务器
3. 配置Nginx反向代理

## 许可证

MIT License