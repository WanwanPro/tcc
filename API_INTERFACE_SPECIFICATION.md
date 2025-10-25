# API接口规范文档

## 概述

本文档定义了智能停车场导航系统中微信小程序后端与System后台之间的API接口规范，确保两个系统之间的数据交换格式一致，提高系统的可维护性和扩展性。

## 通用规范

### 1. 请求格式

所有API请求应遵循以下格式：

```json
{
  "method": "GET|POST|PUT|DELETE",
  "url": "/api/endpoint",
  "headers": {
    "Content-Type": "application/json",
    "Authorization": "Bearer <token>"
  },
  "body": {
    // 请求参数
  }
}
```

### 2. 响应格式

所有API响应应遵循以下格式：

```json
{
  "success": true|false,
  "message": "操作结果描述",
  "data": {
    // 响应数据
  },
  "error": {
    "code": "ERROR_CODE",
    "message": "错误详情"
  }
}
```

### 3. 分页格式

列表类API应支持分页，参数和响应格式如下：

**请求参数：**
- `page`: 页码，从1开始，默认为1
- `limit`: 每页数量，默认为20，最大为100

**响应格式：**
```json
{
  "success": true,
  "data": {
    "items": [],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 100,
      "pages": 5
    }
  }
}
```

## 数据模型规范

### 1. 停车场数据模型

```json
{
  "id": "停车场唯一标识",
  "name": "停车场名称",
  "address": "停车场地址",
  "description": "停车场描述",
  "totalSpaces": 100,
  "operatingHours": {
    "open": "08:00",
    "close": "22:00"
  },
  "facilities": ["充电桩", "无障碍车位"],
  "contact": {
    "phone": "联系电话",
    "email": "联系邮箱"
  },
  "status": "active|inactive|maintenance",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 2. 停车位数据模型

```json
{
  "id": "停车位唯一标识",
  "spaceId": "停车位编号",
  "floorId": "楼层ID",
  "lotId": "停车场ID",
  "area": "区域",
  "type": "standard|disabled|electric|vip",
  "position": {
    "x": 100,
    "y": 200
  },
  "status": "available|occupied|reserved|maintenance",
  "currentNode": "当前导航节点ID",
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 3. 导航路径数据模型

```json
{
  "id": "路径唯一标识",
  "pathId": "路径编号",
  "name": "路径名称",
  "description": "路径描述",
  "lotId": "停车场ID",
  "startNode": {
    "id": "起始节点ID",
    "nodeId": "节点编号",
    "name": "节点名称",
    "type": "entrance|exit|elevator|stairs|intersection|parking",
    "position": {
      "x": 100,
      "y": 200,
      "floor": 1
    }
  },
  "endNode": {
    "id": "结束节点ID",
    "nodeId": "节点编号",
    "name": "节点名称",
    "type": "entrance|exit|elevator|stairs|intersection|parking",
    "position": {
      "x": 300,
      "y": 400,
      "floor": 1
    }
  },
  "nodes": [
    {
      "nodeId": "节点ID",
      "distance": 10.5,
      "estimatedTime": 30,
      "instructions": "直行10米"
    }
  ],
  "totalDistance": 50.5,
  "totalTime": 120,
  "pathType": "shortest|fastest|accessible",
  "isActive": true,
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

### 4. 地图节点数据模型

```json
{
  "id": "节点唯一标识",
  "nodeId": "节点编号",
  "name": "节点名称",
  "type": "entrance|exit|elevator|stairs|intersection|parking",
  "position": {
    "x": 100,
    "y": 200,
    "floor": 1
  },
  "lotId": "停车场ID",
  "floorId": "楼层ID",
  "connections": [
    {
      "nodeId": "连接节点ID",
      "distance": 10.5,
      "biDirectional": true
    }
  ],
  "isActive": true,
  "createdAt": "创建时间",
  "updatedAt": "更新时间"
}
```

## API接口列表

### 1. 停车场管理接口

#### 1.1 获取停车场列表

- **接口地址**: `GET /api/parking/lots`
- **接口描述**: 获取停车场列表，支持分页和筛选
- **请求参数**:
  - `page`: 页码，从1开始，默认为1
  - `limit`: 每页数量，默认为10，最大为100
  - `status`: 停车场状态筛选
  - `search`: 搜索关键词（名称或地址）
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      "lots": [
        {
          // 停车场数据模型
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 10,
        "total": 50,
        "pages": 5
      }
    }
  }
  ```

#### 1.2 获取单个停车场

- **接口地址**: `GET /api/parking/lots/{id}`
- **接口描述**: 获取指定停车场的详细信息
- **请求参数**:
  - `id`: 停车场ID
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      // 停车场数据模型
    }
  }
  ```

#### 1.3 获取停车位列表

- **接口地址**: `GET /api/parking/spaces`
- **接口描述**: 获取停车位列表，支持分页和筛选
- **请求参数**:
  - `page`: 页码，从1开始，默认为1
  - `limit`: 每页数量，默认为20，最大为100
  - `lotId`: 停车场ID
  - `floorId`: 楼层ID
  - `status`: 停车位状态筛选
  - `type`: 停车位类型筛选
  - `area`: 区域筛选
  - `search`: 搜索关键词（编号或区域）
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      "spaces": [
        {
          // 停车位数据模型
        }
      ],
      "pagination": {
        "page": 1,
        "limit": 20,
        "total": 200,
        "pages": 10
      }
    }
  }
  ```

#### 1.4 更新停车位状态

- **接口地址**: `PUT /api/parking/spaces/{id}/status`
- **接口描述**: 更新指定停车位的状态
- **请求参数**:
  - `id`: 停车位ID
  - `status`: 新状态（available|occupied|reserved|maintenance）
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "停车位状态更新成功",
    "data": {
      // 停车位数据模型
    }
  }
  ```

### 2. 导航路径接口

#### 2.1 计算导航路径

- **接口地址**: `POST /api/navigation/calculate-path`
- **接口描述**: 根据起点和终点计算导航路径
- **请求参数**:
  ```json
  {
    "startPoint": {
      "x": 100,
      "y": 200,
      "floor": 1
    },
    "endPoint": {
      "x": 300,
      "y": 400,
      "floor": 2
    },
    "lotId": "停车场ID",
    "pathType": "shortest|fastest|accessible"
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      "path": {
        // 导航路径数据模型
      }
    }
  }
  ```

#### 2.2 从入口到停车位导航

- **接口地址**: `POST /api/navigation/entrance-to-space`
- **接口描述**: 计算从停车场入口到指定停车位的导航路径
- **请求参数**:
  ```json
  {
    "lotId": "停车场ID",
    "spaceId": "停车位ID",
    "entranceId": "入口ID（可选，默认使用主入口）",
    "pathType": "shortest|fastest|accessible"
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      "navigation": {
        "path": {
          // 导航路径数据模型
        },
        "instructions": [
          {
            "step": 1,
            "instruction": "从入口直行20米",
            "distance": 20,
            "direction": "straight"
          }
        ]
      }
    }
  }
  ```

#### 2.3 保存导航路径

- **接口地址**: `POST /api/navigation/save-path`
- **接口描述**: 保存导航路径，供后续使用
- **请求参数**:
  ```json
  {
    "pathId": "路径编号",
    "name": "路径名称",
    "description": "路径描述",
    "lotId": "停车场ID",
    "startNode": "起始节点ID",
    "endNode": "结束节点ID",
    "nodes": [
      {
        "nodeId": "节点ID",
        "distance": 10.5,
        "estimatedTime": 30,
        "instructions": "直行10米"
      }
    ],
    "pathType": "shortest|fastest|accessible",
    "isActive": true
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "导航路径保存成功",
    "data": {
      // 导航路径数据模型
    }
  }
  ```

### 3. 数据同步接口

#### 3.1 从微信小程序同步停车位数据到System后台

- **接口地址**: `POST /api/parking/lots/{id}/sync-from-miniprogram`
- **接口描述**: 将微信小程序的停车位数据同步到System后台
- **请求参数**:
  - `id`: 停车场ID
  ```json
  {
    "spaces": [
      {
        // 停车位数据模型
      }
    ]
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "数据同步成功",
    "data": {
      "synced": 50,
      "created": 10,
      "updated": 40,
      "failed": 0
    }
  }
  ```

#### 3.2 从System后台同步停车位数据到微信小程序

- **接口地址**: `POST /api/parking/lots/{id}/sync-to-miniprogram`
- **接口描述**: 将System后台的停车位数据同步到微信小程序
- **请求参数**:
  - `id`: 停车场ID
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "数据同步成功",
    "data": {
      "spaces": [
        {
          // 停车位数据模型
        }
      ]
    }
  }
  ```

#### 3.3 更新停车位状态并同步

- **接口地址**: `PUT /api/parking/spaces/{id}/status-with-sync`
- **接口描述**: 更新停车位状态并同步到微信小程序
- **请求参数**:
  - `id`: 停车位ID
  ```json
  {
    "status": "available|occupied|reserved|maintenance"
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "停车位状态更新并同步成功",
    "data": {
      // 停车位数据模型
    }
  }
  ```

### 4. 微信小程序专用接口

#### 4.1 获取所有车位状态

- **接口地址**: `GET /api/miniprogram/spaces`
- **接口描述**: 获取所有车位状态，供微信小程序使用
- **请求参数**:
  - `lotId`: 停车场ID（可选）
  - `floorId`: 楼层ID（可选）
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      "spaces": [
        {
          // 停车位数据模型
        }
      ]
    }
  }
  ```

#### 4.2 更新车位状态

- **接口地址**: `POST /api/miniprogram/spaces/update`
- **接口描述**: 更新车位状态，并同步到System后台
- **请求参数**:
  ```json
  {
    "spaceId": "停车位ID",
    "status": "available|occupied|reserved|maintenance"
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "车位状态更新成功",
    "data": {
      // 停车位数据模型
    }
  }
  ```

#### 4.3 同步所有车位数据到System后台

- **接口地址**: `POST /api/miniprogram/spaces/sync`
- **接口描述**: 将微信小程序的所有车位数据同步到System后台
- **请求参数**:
  ```json
  {
    "lotId": "停车场ID"
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "数据同步成功",
    "data": {
      "synced": 50,
      "created": 10,
      "updated": 40,
      "failed": 0
    }
  }
  ```

#### 4.4 计算最优路径

- **接口地址**: `POST /api/miniprogram/path/plan`
- **接口描述**: 计算从起点到终点的最优路径
- **请求参数**:
  ```json
  {
    "startPoint": {
      "x": 100,
      "y": 200,
      "floor": 1
    },
    "endPoint": {
      "x": 300,
      "y": 400,
      "floor": 2
    },
    "lotId": "停车场ID",
    "pathType": "shortest|fastest|accessible",
    "useSystemApi": true
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      "path": {
        // 导航路径数据模型
      }
    }
  }
  ```

#### 4.5 实时路径调整

- **接口地址**: `POST /api/miniprogram/path/adjust`
- **接口描述**: 根据实时情况调整路径
- **请求参数**:
  ```json
  {
    "pathId": "路径ID",
    "currentPosition": {
      "x": 150,
      "y": 250,
      "floor": 1
    },
    "obstacles": [
      {
        "x": 200,
        "y": 300,
        "floor": 1,
        "type": "temporary_obstacle"
      }
    ]
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "data": {
      "adjustedPath": {
        // 导航路径数据模型
      }
    }
  }
  ```

#### 4.6 用户登录

- **接口地址**: `POST /api/miniprogram/user/login`
- **接口描述**: 微信小程序用户登录
- **请求参数**:
  ```json
  {
    "code": "微信登录凭证"
  }
  ```
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "登录成功",
    "data": {
      "user": {
        "userId": "用户ID",
        "openid": "微信openid",
        "nickname": "用户昵称",
        "avatar": "用户头像URL"
      },
      "token": "JWT令牌"
    }
  }
  ```

#### 4.7 获取用户信息

- **接口地址**: `GET /api/miniprogram/user/{userId}`
- **接口描述**: 获取用户信息
- **请求参数**:
  - `userId`: 用户ID
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "获取用户信息成功",
    "data": {
      // 用户数据模型
    }
  }
  ```

#### 4.8 处理停车场图像

- **接口地址**: `POST /api/miniprogram/image/process`
- **接口描述**: 处理上传的停车场图像，识别车位状态
- **请求参数**:
  - `image`: 图像文件（multipart/form-data）
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "图像处理成功",
    "data": {
      "spaces": [
        {
          "spaceId": "停车位ID",
          "status": "available|occupied",
          "confidence": 0.95
        }
      ]
    }
  }
  ```

#### 4.9 获取最新的车位状态

- **接口地址**: `GET /api/miniprogram/image/status`
- **接口描述**: 获取最新的车位状态（基于图像识别）
- **响应数据**:
  ```json
  {
    "success": true,
    "message": "获取车位状态成功",
    "data": {
      "spaces": [
        {
          // 停车位数据模型
        }
      ],
      "updatedAt": "最后更新时间"
    }
  }
  ```

## 错误代码

| 错误代码 | HTTP状态码 | 描述 |
|---------|-----------|------|
| SUCCESS | 200 | 操作成功 |
| CREATED | 201 | 资源创建成功 |
| BAD_REQUEST | 400 | 请求参数错误 |
| UNAUTHORIZED | 401 | 未授权访问 |
| FORBIDDEN | 403 | 禁止访问 |
| NOT_FOUND | 404 | 资源不存在 |
| CONFLICT | 409 | 资源冲突 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |
| SERVICE_UNAVAILABLE | 503 | 服务不可用 |
| VALIDATION_ERROR | 4001 | 数据验证失败 |
| AUTHENTICATION_FAILED | 4002 | 身份验证失败 |
| AUTHORIZATION_FAILED | 4003 | 权限验证失败 |
| RESOURCE_NOT_FOUND | 4004 | 资源不存在 |
| RESOURCE_CONFLICT | 4005 | 资源冲突 |
| RATE_LIMIT_EXCEEDED | 4006 | 请求频率超限 |
| EXTERNAL_API_ERROR | 4007 | 外部API调用失败 |
| DATA_SYNC_FAILED | 4008 | 数据同步失败 |
| PATH_CALCULATION_FAILED | 4009 | 路径计算失败 |
| IMAGE_PROCESSING_FAILED | 4010 | 图像处理失败 |

## 数据转换规范

为了确保微信小程序后端和System后台之间的数据一致性，需要使用`dataModelMappingService`进行数据模型转换：

### 1. 停车位数据转换

- **微信小程序 -> System**: `dataModelMappingService.mapParkingSpaceToSystem(miniprogramSpace)`
- **System -> 微信小程序**: `dataModelMappingService.mapParkingSpaceToMiniprogram(systemSpace)`
- **批量转换**: `dataModelMappingService.batchMapParkingSpacesToSystem(miniprogramSpaces)`

### 2. 路径数据转换

- **微信小程序 -> System**: `dataModelMappingService.mapPathToSystem(miniprogramPath)`
- **System -> 微信小程序**: `dataModelMappingService.mapPathToMiniprogram(systemPath)`

### 3. 点位数据转换

- **微信小程序 -> System**: `dataModelMappingService.mapPointToSystem(miniprogramPoint)`
- **System -> 微信小程序**: `dataModelMappingService.mapPointToMiniprogram(systemPoint)`

### 4. 状态数据转换

- **微信小程序 -> System**: `dataModelMappingService.mapStatusToSystem(miniprogramStatus)`
- **System -> 微信小程序**: `dataModelMappingService.mapStatusToMiniprogram(systemStatus)`

## 版本控制

API版本通过URL路径进行控制：
- v1: `/api/v1/...`
- v2: `/api/v2/...`

当前版本为v1，所有API路径默认为v1版本。

## 安全规范

1. 所有API（除登录接口外）都需要进行身份验证
2. 使用JWT进行身份验证，令牌有效期为24小时
3. 敏感操作需要进行权限验证
4. 所有API请求都需要进行频率限制，防止恶意攻击
5. 所有输入数据都需要进行验证和过滤，防止注入攻击

## 测试规范

1. 所有API都需要编写单元测试和集成测试
2. 测试覆盖率应达到80%以上
3. 需要编写API文档和示例代码
4. 需要进行性能测试和压力测试

## 部署规范

1. API需要部署在HTTPS环境下
2. 需要配置CORS，允许微信小程序域名访问
3. 需要配置日志记录，记录所有API请求和响应
4. 需要配置监控和告警，及时发现和解决问题