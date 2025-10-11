# 停车场管理系统后端 API 文档

## 概述

本文档描述了停车场管理系统的后端API接口。系统基于Node.js和Express框架构建，使用MongoDB作为数据存储。

## 基础信息

- **基础URL**: `http://localhost:3000/api`
- **认证方式**: JWT Bearer Token
- **数据格式**: JSON

## 认证

大多数API需要认证。在请求头中包含JWT令牌：

```
Authorization: Bearer <your-jwt-token>
```

## API 端点

### 认证相关

#### 用户登录
- **URL**: `/api/auth/login`
- **方法**: POST
- **描述**: 用户登录获取访问令牌
- **请求体**:
```json
{
  "username": "admin",
  "password": "admin123"
}
```
- **响应**:
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "60f7b3b3b3b3b3b3b3b3b3b3",
      "username": "admin",
      "email": "admin@parking.com",
      "role": "admin"
    }
  }
}
```

#### 用户注册
- **URL**: `/api/auth/register`
- **方法**: POST
- **描述**: 新用户注册
- **请求体**:
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "password123",
  "profile": {
    "firstName": "张",
    "lastName": "三"
  }
}
```

#### 获取当前用户信息
- **URL**: `/api/auth/me`
- **方法**: GET
- **描述**: 获取当前登录用户信息
- **认证**: 需要

#### 刷新令牌
- **URL**: `/api/auth/refresh`
- **方法**: POST
- **描述**: 刷新访问令牌
- **认证**: 需要

#### 用户登出
- **URL**: `/api/auth/logout`
- **方法**: POST
- **描述**: 用户登出
- **认证**: 需要

### 用户管理

#### 获取用户列表
- **URL**: `/api/users`
- **方法**: GET
- **描述**: 获取用户列表（分页）
- **认证**: 需要
- **查询参数**:
  - `page`: 页码（默认1）
  - `limit`: 每页数量（默认10）
  - `search`: 搜索关键词
  - `role`: 角色筛选

#### 获取用户详情
- **URL**: `/api/users/:id`
- **方法**: GET
- **描述**: 获取指定用户详情
- **认证**: 需要

#### 更新用户信息
- **URL**: `/api/users/:id`
- **方法**: PUT
- **描述**: 更新用户信息
- **认证**: 需要

#### 删除用户
- **URL**: `/api/users/:id`
- **方法**: DELETE
- **描述**: 删除用户
- **认证**: 需要

### 停车场管理

#### 获取停车场列表
- **URL**: `/api/parking-lots`
- **方法**: GET
- **描述**: 获取停车场列表
- **认证**: 需要

#### 获取停车场详情
- **URL**: `/api/parking-lots/:id`
- **方法**: GET
- **描述**: 获取指定停车场详情
- **认证**: 需要

#### 创建停车场
- **URL**: `/api/parking-lots`
- **方法**: POST
- **描述**: 创建新停车场
- **认证**: 需要
- **请求体**:
```json
{
  "name": "新停车场",
  "address": "北京市海淀区中关村大街1号",
  "totalSpaces": 150,
  "floors": 2,
  "operatingHours": {
    "open": "06:00",
    "close": "22:00"
  },
  "pricing": {
    "hourly": 6,
    "daily": 50,
    "monthly": 1000
  }
}
```

#### 更新停车场信息
- **URL**: `/api/parking-lots/:id`
- **方法**: PUT
- **描述**: 更新停车场信息
- **认证**: 需要

#### 删除停车场
- **URL**: `/api/parking-lots/:id`
- **方法**: DELETE
- **描述**: 删除停车场
- **认证**: 需要

### 停车位管理

#### 获取停车位列表
- **URL**: `/api/parking-spaces`
- **方法**: GET
- **描述**: 获取停车位列表
- **认证**: 需要
- **查询参数**:
  - `parkingLotId`: 停车场ID
  - `floor`: 楼层
  - `section`: 区域
  - `status`: 状态筛选
  - `type`: 类型筛选

#### 获取停车位详情
- **URL**: `/api/parking-spaces/:id`
- **方法**: GET
- **描述**: 获取指定停车位详情
- **认证**: 需要

#### 更新停车位状态
- **URL**: `/api/parking-spaces/:id/status`
- **方法**: PUT
- **描述**: 更新停车位状态
- **认证**: 需要
- **请求体**:
```json
{
  "status": "occupied",
  "vehicleInfo": {
    "licensePlate": "京A12345",
    "entryTime": "2023-06-15T08:30:00Z",
    "estimatedExitTime": "2023-06-15T12:30:00Z"
  }
}
```

#### 批量更新停车位
- **URL**: `/api/parking-spaces/batch`
- **方法**: PUT
- **描述**: 批量更新停车位
- **认证**: 需要

### 导航管理

#### 获取地图节点
- **URL**: `/api/navigation/nodes`
- **方法**: GET
- **描述**: 获取地图节点列表
- **认证**: 需要

#### 创建地图节点
- **URL**: `/api/navigation/nodes`
- **方法**: POST
- **描述**: 创建新地图节点
- **认证**: 需要

#### 获取导航路径
- **URL**: `/api/navigation/routes`
- **方法**: GET
- **描述**: 获取导航路径列表
- **认证**: 需要

#### 计算导航路径
- **URL**: `/api/navigation/calculate`
- **方法**: POST
- **描述**: 计算两点间导航路径
- **认证**: 需要
- **请求体**:
```json
{
  "startNodeId": "60f7b3b3b3b3b3b3b3b3b3b3",
  "endNodeId": "60f7b3b3b3b3b3b3b3b3b3b4",
  "parkingLotId": "60f7b3b3b3b3b3b3b3b3b3b5",
  "vehicleType": "standard"
}
```

### 数据模拟

#### 获取模拟状态
- **URL**: `/api/simulation/status`
- **方法**: GET
- **描述**: 获取当前模拟状态
- **认证**: 需要

#### 启动/停止模拟
- **URL**: `/api/simulation/toggle`
- **方法**: POST
- **描述**: 启动或停止数据模拟
- **认证**: 需要

#### 更新模拟配置
- **URL**: `/api/simulation/config`
- **方法**: PUT
- **描述**: 更新模拟配置
- **认证**: 需要

#### 生成模拟数据
- **URL**: `/api/simulation/generate`
- **方法**: POST
- **描述**: 生成模拟数据
- **认证**: 需要

### 财务管理

#### 获取交易记录
- **URL**: `/api/finance/transactions`
- **方法**: GET
- **描述**: 获取交易记录列表
- **认证**: 需要

#### 创建交易记录
- **URL**: `/api/finance/transactions`
- **方法**: POST
- **描述**: 创建新交易记录
- **认证**: 需要

#### 获取财务统计
- **URL**: `/api/finance/statistics`
- **方法**: GET
- **描述**: 获取财务统计数据
- **认证**: 需要

#### 生成财务报表
- **URL**: `/api/finance/reports`
- **方法**: GET
- **描述**: 生成财务报表
- **认证**: 需要

### 数据分析

#### 获取停车率统计
- **URL**: `/api/analytics/occupancy`
- **方法**: GET
- **描述**: 获取停车率统计数据
- **认证**: 需要

#### 获取收入统计
- **URL**: `/api/analytics/revenue`
- **方法**: GET
- **描述**: 获取收入统计数据
- **认证**: 需要

#### 获取车流统计
- **URL**: `/api/analytics/traffic`
- **方法**: GET
- **描述**: 获取车流统计数据
- **认证**: 需要

#### 获取高峰时段分析
- **URL**: `/api/analytics/peak-hours`
- **方法**: GET
- **描述**: 获取高峰时段分析数据
- **认证**: 需要

### 系统管理

#### 获取系统配置
- **URL**: `/api/system/config`
- **方法**: GET
- **描述**: 获取系统配置列表
- **认证**: 需要

#### 更新系统配置
- **URL**: `/api/system/config`
- **方法**: PUT
- **描述**: 更新系统配置
- **认证**: 需要

#### 获取系统日志
- **URL**: `/api/system/logs`
- **方法**: GET
- **描述**: 获取系统日志
- **认证**: 需要

#### 获取系统状态
- **URL**: `/api/system/status`
- **方法**: GET
- **描述**: 获取系统运行状态
- **认证**: 需要

#### 备份数据
- **URL**: `/api/system/backup`
- **方法**: POST
- **描述**: 备份系统数据
- **认证**: 需要

## 错误响应

所有API在出错时返回统一格式的错误响应：

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

常见错误代码：
- `VALIDATION_ERROR`: 请求参数验证失败
- `AUTHENTICATION_FAILED`: 认证失败
- `AUTHORIZATION_DENIED`: 权限不足
- `RESOURCE_NOT_FOUND`: 资源不存在
- `DUPLICATE_RESOURCE`: 资源已存在
- `INTERNAL_ERROR`: 服务器内部错误

## 状态码

- `200`: 请求成功
- `201`: 创建成功
- `400`: 请求参数错误
- `401`: 未认证
- `403`: 权限不足
- `404`: 资源不存在
- `409`: 资源冲突
- `500`: 服务器内部错误

## 限制

- API请求频率限制：每分钟100次
- 文件上传大小限制：5MB
- 分页查询最大每页100条记录