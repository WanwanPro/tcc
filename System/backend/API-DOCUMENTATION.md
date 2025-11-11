# 智能停车场导航系统 - 后端API文档

## 概述

本文档描述了智能停车场导航系统的后端API接口，包括车位推荐、路径规划、反向寻车和个人中心等功能。

## 基础信息

- 基础URL: `http://localhost:5000/api`
- 数据格式: JSON
- 认证方式: Token认证

## API接口列表

### 1. 健康检查

**GET** `/health`

检查API服务是否正常运行。

**响应示例:**
```json
{
  "status": "success",
  "message": "API is running",
  "timestamp": "2023-11-20T12:00:00.000Z"
}
```

### 2. 车位推荐

#### 2.1 获取推荐车位

**GET** `/recommendation/parking-spaces`

根据用户位置和偏好推荐空闲车位。

**请求参数:**
- `latitude` (float, 必需): 用户纬度
- `longitude` (float, 必需): 用户经度
- `radius` (int, 可选): 搜索半径(米)，默认1000
- `limit` (int, 可选): 返回数量限制，默认5
- `vehicleType` (string, 可选): 车辆类型
- `preferences` (string[], 可选): 用户偏好，如["near_elevator", "indoor", "wide"]

**响应示例:**
```json
{
  "success": true,
  "message": "获取推荐车位成功",
  "data": {
    "spaces": [
      {
        "id": "space_1",
        "spaceNumber": "A101",
        "floor": "1F",
        "section": "A区",
        "isAvailable": true,
        "distance": 50,
        "estimatedWalkingTime": 2,
        "features": ["靠近电梯", "宽敞车位"]
      }
    ],
    "count": 1
  }
}
```

#### 2.2 获取车位统计

**GET** `/recommendation/parking-spaces/stats`

获取指定停车场的车位统计信息。

**请求参数:**
- `parkingLotId` (string, 必需): 停车场ID

**响应示例:**
```json
{
  "success": true,
  "message": "获取车位统计成功",
  "data": {
    "totalSpaces": 200,
    "availableSpaces": 85,
    "occupiedSpaces": 115,
    "availabilityByFloor": [
      {
        "floor": "1F",
        "total": 100,
        "available": 40,
        "occupied": 60
      }
    ]
  }
}
```

#### 2.3 获取停车场地图

**GET** `/recommendation/parking-lots/{parkingLotId}/map`

获取指定停车场的地图数据。

**响应示例:**
```json
{
  "success": true,
  "message": "获取停车场地图成功",
  "data": {
    "parkingLot": {
      "id": "lot_1",
      "name": "TCC停车场",
      "floors": ["1F", "2F", "B1"]
    },
    "mapData": {
      "nodes": [
        {
          "id": "node_1",
          "x": 100,
          "y": 200,
          "floor": "1F",
          "type": "entrance",
          "name": "主入口"
        }
      ],
      "edges": [
        {
          "from": "node_1",
          "to": "node_2",
          "weight": 10
        }
      ]
    }
  }
}
```

### 3. 路径规划

#### 3.1 计算导航路径

**POST** `/navigation/calculate`

计算从起点到终点的导航路径。

**请求体:**
```json
{
  "startNodeId": "entrance_1",
  "endNodeId": "space_A101",
  "userId": "user_123",
  "options": {
    "avoidStairs": false,
    "preferElevator": true
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "路径计算成功",
  "data": {
    "path": [
      {
        "x": 10,
        "y": 20,
        "floor": "1F",
        "instruction": "向前直行"
      }
    ],
    "distance": 100,
    "estimatedTime": 3,
    "pathId": "path_123"
  }
}
```

#### 3.2 获取已保存的导航路径

**GET** `/navigation/saved/{userId}`

获取用户已保存的导航路径。

**响应示例:**
```json
{
  "success": true,
  "message": "获取已保存路径成功",
  "data": {
    "paths": [
      {
        "id": "path_123",
        "name": "到A101车位",
        "startPoint": "主入口",
        "endPoint": "A101车位",
        "createdAt": "2023-11-20T12:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### 3.3 删除导航路径

**DELETE** `/navigation/{pathId}`

删除指定的导航路径。

**响应示例:**
```json
{
  "success": true,
  "message": "删除路径成功"
}
```

### 4. 反向寻车

#### 4.1 标记停车位置

**POST** `/find-car/mark`

标记用户停车位置。

**请求体:**
```json
{
  "userId": "user_123",
  "vehicleId": "vehicle_456",
  "parkingLotId": "lot_1",
  "spaceId": "space_789",
  "entryTime": "2023-11-20T09:30:00.000Z",
  "notes": "靠近柱子"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "标记停车位置成功",
  "data": {
    "parkingRecordId": "record_123",
    "parkingLot": {
      "id": "lot_1",
      "name": "TCC停车场"
    },
    "space": {
      "id": "space_789",
      "spaceNumber": "A101",
      "floor": "1F"
    }
  }
}
```

#### 4.2 结束停车

**POST** `/find-car/end`

结束停车记录。

**请求体:**
```json
{
  "parkingRecordId": "record_123",
  "exitTime": "2023-11-20T17:30:00.000Z",
  "fee": {
    "amount": 25.00,
    "paymentMethod": "wechat"
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "结束停车成功",
  "data": {
    "parkingRecord": {
      "id": "record_123",
      "duration": 480,
      "fee": 25.00
    }
  }
}
```

#### 4.3 查找车辆位置

**GET** `/find-car/find/{userId}`

查找用户当前停车的位置。

**响应示例:**
```json
{
  "success": true,
  "message": "获取车辆位置成功",
  "data": {
    "hasActiveParking": true,
    "parkingRecord": {
      "id": "record_123",
      "parkingLot": {
        "id": "lot_1",
        "name": "TCC停车场",
        "address": "北京市朝阳区建国路88号"
      },
      "space": {
        "id": "space_789",
        "spaceNumber": "A101",
        "floor": "1F",
        "section": "A区"
      },
      "entryTime": "2023-11-20T09:30:00.000Z",
      "vehicle": {
        "licensePlate": "京A12345",
        "brand": "大众",
        "model": "帕萨特"
      }
    }
  }
}
```

#### 4.4 生成反向寻车路径

**POST** `/find-car/find-path`

生成从当前位置到停车位置的反向寻车路径。

**请求体:**
```json
{
  "userId": "user_123",
  "currentNodeId": "entrance_1",
  "parkingRecordId": "record_123"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "生成反向寻车路径成功",
  "data": {
    "path": [
      {
        "x": 10,
        "y": 20,
        "floor": "1F",
        "instruction": "向前直行"
      }
    ],
    "distance": 80,
    "estimatedTime": 2,
    "pathId": "find_car_path_123"
  }
}
```

#### 4.5 获取停车历史记录

**GET** `/find-car/history/{userId}`

获取用户的停车历史记录。

**请求参数:**
- `page` (int, 可选): 页码，默认1
- `limit` (int, 可选): 每页数量，默认10

**响应示例:**
```json
{
  "success": true,
  "message": "获取停车历史成功",
  "data": {
    "records": [
      {
        "id": "record_123",
        "parkingLot": {
          "id": "lot_1",
          "name": "TCC停车场"
        },
        "space": {
          "spaceNumber": "A101",
          "floor": "1F"
        },
        "entryTime": "2023-11-20T09:30:00.000Z",
        "exitTime": "2023-11-20T17:30:00.000Z",
        "duration": 480,
        "fee": 25.00
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "pages": 2
    }
  }
}
```

### 5. 个人中心

#### 5.1 微信登录

**POST** `/user/login`

微信小程序用户登录。

**请求体:**
```json
{
  "code": "wx_code_123",
  "userInfo": {
    "nickName": "张三",
    "avatarUrl": "https://example.com/avatar.jpg",
    "gender": 1
  }
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "登录成功",
  "data": {
    "token": "token_123",
    "userInfo": {
      "id": "user_123",
      "nickName": "张三",
      "avatarUrl": "https://example.com/avatar.jpg",
      "gender": 1,
      "totalParkingCount": 5,
      "statistics": {
        "totalParkingTime": 2400,
        "totalParkingFee": 125.00
      }
    }
  }
}
```

#### 5.2 游客模式登录

**POST** `/user/guest`

游客模式登录。

**响应示例:**
```json
{
  "success": true,
  "message": "游客模式登录成功",
  "data": {
    "token": "guest_token_123",
    "userInfo": {
      "id": "user_123",
      "nickName": "游客用户",
      "isGuest": true
    }
  }
}
```

#### 5.3 获取用户信息

**GET** `/user/{userId}`

获取用户详细信息。

**响应示例:**
```json
{
  "success": true,
  "message": "获取用户信息成功",
  "data": {
    "id": "user_123",
    "nickName": "张三",
    "avatarUrl": "https://example.com/avatar.jpg",
    "gender": 1,
    "phone": "13800138000",
    "isGuest": false,
    "totalParkingCount": 5,
    "statistics": {
      "totalParkingTime": 2400,
      "totalParkingFee": 125.00
    },
    "createdAt": "2023-10-20T12:00:00.000Z"
  }
}
```

#### 5.4 更新用户信息

**PUT** `/user/{userId}`

更新用户信息。

**请求体:**
```json
{
  "nickName": "李四",
  "avatarUrl": "https://example.com/new_avatar.jpg",
  "gender": 1,
  "phone": "13900139000"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "更新用户信息成功",
  "data": {
    "id": "user_123",
    "nickName": "李四",
    "avatarUrl": "https://example.com/new_avatar.jpg",
    "gender": 1,
    "phone": "13900139000"
  }
}
```

#### 5.5 获取用户车辆列表

**GET** `/user/{userId}/vehicles`

获取用户的所有车辆。

**响应示例:**
```json
{
  "success": true,
  "message": "获取用户车辆成功",
  "data": {
    "vehicles": [
      {
        "id": "vehicle_123",
        "licensePlate": "京A12345",
        "vehicleType": "sedan",
        "brand": "大众",
        "model": "帕萨特",
        "color": "黑色",
        "isDefault": true,
        "createdAt": "2023-10-20T12:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### 5.6 添加用户车辆

**POST** `/user/{userId}/vehicles`

添加新车辆。

**请求体:**
```json
{
  "licensePlate": "京B67890",
  "vehicleType": "suv",
  "brand": "奥迪",
  "model": "Q5",
  "color": "白色",
  "isDefault": false
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "添加车辆成功",
  "data": {
    "id": "vehicle_456",
    "userId": "user_123",
    "licensePlate": "京B67890",
    "vehicleType": "suv",
    "brand": "奥迪",
    "model": "Q5",
    "color": "白色",
    "isDefault": false,
    "createdAt": "2023-11-20T12:00:00.000Z"
  }
}
```

#### 5.7 更新用户车辆

**PUT** `/user/{userId}/vehicles/{vehicleId}`

更新车辆信息。

**请求体:**
```json
{
  "licensePlate": "京B67891",
  "vehicleType": "suv",
  "brand": "奥迪",
  "model": "Q5",
  "color": "银色",
  "isDefault": true
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "更新车辆成功",
  "data": {
    "id": "vehicle_456",
    "userId": "user_123",
    "licensePlate": "京B67891",
    "vehicleType": "suv",
    "brand": "奥迪",
    "model": "Q5",
    "color": "银色",
    "isDefault": true
  }
}
```

#### 5.8 删除用户车辆

**DELETE** `/user/{userId}/vehicles/{vehicleId}`

删除用户车辆。

**响应示例:**
```json
{
  "success": true,
  "message": "删除车辆成功"
}
```

#### 5.9 获取用户收藏的停车场

**GET** `/user/{userId}/favorites`

获取用户收藏的停车场列表。

**响应示例:**
```json
{
  "success": true,
  "message": "获取收藏停车场成功",
  "data": {
    "favorites": [
      {
        "id": "favorite_123",
        "parkingLot": {
          "id": "lot_1",
          "name": "TCC停车场",
          "address": "北京市朝阳区建国路88号",
          "totalSpaces": 200,
          "availableSpaces": 85,
          "operatingHours": "06:00-23:00",
          "features": ["室内", "监控", "充电桩"],
          "coordinates": {
            "latitude": 39.9042,
            "longitude": 116.4074
          }
        },
        "addedAt": "2023-11-15T12:00:00.000Z"
      }
    ],
    "count": 1
  }
}
```

#### 5.10 添加收藏停车场

**POST** `/user/{userId}/favorites`

添加收藏停车场。

**请求体:**
```json
{
  "parkingLotId": "lot_2"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "添加收藏成功",
  "data": {
    "id": "favorite_456",
    "userId": "user_123",
    "parkingLotId": "lot_2",
    "addedAt": "2023-11-20T12:00:00.000Z"
  }
}
```

#### 5.11 删除收藏停车场

**DELETE** `/user/{userId}/favorites/{favoriteId}`

删除收藏的停车场。

**响应示例:**
```json
{
  "success": true,
  "message": "取消收藏成功"
}
```

#### 5.12 提交用户反馈

**POST** `/user/{userId}/feedback`

提交用户反馈。

**请求体:**
```json
{
  "type": "suggestion",
  "content": "建议增加更多充电桩",
  "images": ["https://example.com/image1.jpg"],
  "contactInfo": "13800138000"
}
```

**响应示例:**
```json
{
  "success": true,
  "message": "提交反馈成功",
  "data": {
    "id": "feedback_123",
    "userId": "user_123",
    "type": "suggestion",
    "content": "建议增加更多充电桩",
    "images": ["https://example.com/image1.jpg"],
    "contactInfo": "13800138000",
    "status": "pending",
    "createdAt": "2023-11-20T12:00:00.000Z"
  }
}
```

## 错误响应格式

所有API在出错时都会返回统一的错误响应格式：

```json
{
  "success": false,
  "message": "错误描述",
  "error": "详细错误信息"
}
```

常见HTTP状态码：
- 200: 请求成功
- 201: 创建成功
- 400: 请求参数错误
- 401: 未授权
- 404: 资源不存在
- 500: 服务器内部错误