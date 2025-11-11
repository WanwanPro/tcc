# 车位管理模块设计文档

## 1. 现有系统分析

### 1.1 已实现功能
- **后端API**：已实现完整的CRUD接口
  - 停车场管理：`/api/parking/lots` (增删改查)
  - 车位管理：`/api/parking/spaces` (增删改查)
  - 统计数据：`/api/parking/stats/:lotId`
  - 数据同步：与微信小程序后端同步功能

- **前端界面**：已有车位管理页面
  - 车位列表展示
  - 筛选功能（区域、状态、编号）
  - 添加/编辑/删除操作
  - 分页功能

### 1.2 数据模型
- **ParkingSpace模型**：包含完整字段
  - 基本信息：spaceId, lotId, floorId, area
  - 状态信息：type, status
  - 位置信息：position, dimensions
  - 扩展信息：features

## 2. 增强设计

### 2.1 数据库模型优化

#### 2.1.1 车位操作日志模型 (新增)
```javascript
const parkingSpaceLogSchema = new mongoose.Schema({
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpace', required: true },
  lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  operation: { 
    type: String, 
    enum: ['create', 'update', 'delete', 'status_change'], 
    required: true 
  },
  previousState: { type: mongoose.Schema.Types.Mixed },
  newState: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now },
  ipAddress: { type: String },
  userAgent: { type: String }
});
```

#### 2.1.2 车位状态变更记录模型 (新增)
```javascript
const parkingSpaceStatusHistorySchema = new mongoose.Schema({
  spaceId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingSpace', required: true },
  lotId: { type: mongoose.Schema.Types.ObjectId, ref: 'ParkingLot', required: true },
  previousStatus: { type: String, required: true },
  newStatus: { type: String, required: true },
  changeTime: { type: Date, default: Date.now },
  changeReason: { type: String },
  source: { 
    type: String, 
    enum: ['manual', 'sensor', 'system', 'sync'], 
    default: 'manual' 
  },
  operatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});
```

### 2.2 API接口增强

#### 2.2.1 车位状态批量更新接口
```javascript
POST /api/parking/spaces/batch-update
Body: {
  spaceIds: ["id1", "id2", ...],
  updates: {
    status: "available", // 或其他字段
    // 其他可更新字段
  }
}
```

#### 2.2.2 车位操作日志查询接口
```javascript
GET /api/parking/spaces/logs?spaceId=xxx&operation=xxx&startDate=xxx&endDate=xxx
```

#### 2.2.3 车位状态变更历史接口
```javascript
GET /api/parking/spaces/:id/status-history
```

#### 2.2.4 车位状态统计接口 (增强)
```javascript
GET /api/parking/spaces/stats?lotId=xxx&groupBy=area|type|floor
```

### 2.3 前端功能增强

#### 2.3.1 车位状态可视化
- **停车场地图视图**：直观显示车位布局和状态
- **状态颜色编码**：
  - 绿色：可用
  - 红色：占用
  - 黄色：预订
  - 灰色：维护
- **实时状态更新**：WebSocket实现实时状态推送

#### 2.3.2 批量操作功能
- **批量选择**：支持多选车位进行批量操作
- **批量状态更新**：一键更新多个车位状态
- **批量导入/导出**：支持Excel导入导出车位数据

#### 2.3.3 操作历史与审计
- **操作日志查看**：查看车位操作历史
- **状态变更追踪**：追踪车位状态变更记录
- **操作者信息**：显示操作者和操作时间

#### 2.3.4 高级筛选与搜索
- **多条件组合筛选**：支持多条件组合筛选
- **模糊搜索**：支持车位编号、区域等模糊搜索
- **保存筛选条件**：支持保存常用筛选条件

### 2.4 权限控制增强

#### 2.4.1 角色权限细分
- **管理员**：所有权限
- **操作员**：查看、编辑车位状态
- **查看者**：仅查看权限

#### 2.4.2 操作权限控制
- **功能级权限**：控制不同功能的访问权限
- **数据级权限**：控制特定停车场或区域的访问权限
- **操作审计**：记录所有操作日志

### 2.5 实时功能实现

#### 2.5.1 WebSocket实时通信
```javascript
// 客户端订阅车位状态变更
socket.emit('subscribe_parking_spaces', { lotId: 'xxx' });

// 服务端推送状态变更
socket.emit('parking_space_status_changed', {
  spaceId: 'xxx',
  status: 'occupied',
  timestamp: 'xxx'
});
```

#### 2.5.2 状态变更通知
- **浏览器通知**：状态变更时弹出通知
- **声音提醒**：关键状态变更时播放提示音
- **消息中心**：记录所有通知消息

## 3. 实施计划

### 3.1 第一阶段：数据库模型和API增强
1. 创建车位操作日志模型
2. 创建车位状态变更历史模型
3. 实现批量更新API
4. 实现日志查询API
5. 实现状态统计API增强

### 3.2 第二阶段：前端功能增强
1. 实现车位地图视图
2. 实现批量操作功能
3. 实现操作历史查看
4. 实现高级筛选与搜索

### 3.3 第三阶段：实时功能和权限控制
1. 实现WebSocket实时通信
2. 实现状态变更通知
3. 实现细粒度权限控制
4. 实现操作审计功能

### 3.4 第四阶段：测试与优化
1. 功能测试
2. 性能测试
3. 用户体验优化
4. 文档完善

## 4. 技术实现要点

### 4.1 数据库优化
- 为常用查询字段添加索引
- 使用聚合管道优化统计查询
- 实现数据分页和懒加载

### 4.2 前端性能优化
- 使用虚拟滚动处理大量车位数据
- 实现数据缓存和状态管理
- 使用防抖和节流优化频繁操作

### 4.3 实时通信优化
- 使用房间概念管理不同停车场的订阅
- 实现断线重连机制
- 优化消息推送频率

## 5. 预期效果

1. **管理效率提升**：通过批量操作和高级筛选，提高管理效率
2. **实时监控能力**：通过实时状态更新，实现实时监控
3. **操作可追溯**：通过操作日志和状态历史，实现操作可追溯
4. **权限可控**：通过细粒度权限控制，确保数据安全
5. **用户体验优化**：通过直观的界面和实时反馈，提升用户体验