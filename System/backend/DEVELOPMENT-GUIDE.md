# 智能停车场导航系统 - 开发文档

## 项目概述

智能停车场导航系统是一个基于微信小程序的智能停车解决方案，提供车位推荐、路径规划、反向寻车等功能。后端服务基于Node.js和Express框架开发，使用MongoDB作为数据存储。

## 技术栈

- **后端框架**: Node.js + Express.js
- **数据库**: MongoDB + Mongoose
- **认证**: JWT (JSON Web Token)
- **API文档**: RESTful API
- **测试**: Jest + Supertest
- **部署**: PM2 + Nginx

## 项目结构

```
backend/
├── controllers/           # 控制器层
│   ├── authController.js      # 认证控制器
│   ├── userController.js      # 用户控制器
│   ├── parkingController.js   # 停车场控制器
│   ├── pathfindingController.js # 路径规划控制器
│   ├── findCarController.js   # 反向寻车控制器
│   └── userProfileController.js # 个人中心控制器
├── models/               # 数据模型
│   ├── index.js              # 模型索引
│   ├── User.js               # 用户模型
│   ├── ParkingLot.js         # 停车场模型
│   ├── ParkingSpace.js       # 车位模型
│   ├── ParkingRecord.js      # 停车记录模型
│   ├── NavigationPath.js     # 导航路径模型
│   └── miniprogram.js        # 小程序相关模型
├── routes/               # 路由定义
│   ├── auth.js               # 认证路由
│   ├── users.js              # 用户路由
│   ├── parkingLots.js        # 停车场路由
│   ├── parkingSpaces.js      # 车位路由
│   ├── pathfinding.js        # 路径规划路由
│   ├── findCar.js            # 反向寻车路由
│   └── userProfile.js        # 个人中心路由
├── middleware/           # 中间件
│   ├── auth.js               # 认证中间件
│   ├── validation.js        # 数据验证中间件
│   └── errorHandler.js       # 错误处理中间件
├── utils/                # 工具函数
│   ├── pathfinding.js        # 路径规划算法
│   ├── recommendation.js     # 车位推荐算法
│   ├── wechat.js             # 微信API工具
│   └── helpers.js            # 通用辅助函数
├── config/               # 配置文件
│   ├── database.js           # 数据库配置
│   ├── jwt.js                # JWT配置
│   └── constants.js          # 常量定义
├── scripts/              # 脚本文件
│   ├── init-database.js      # 数据库初始化脚本
│   ├── seed-data.js          # 种子数据脚本
│   └── backup-db.sh          # 数据库备份脚本
├── tests/                # 测试文件
│   ├── unit/                 # 单元测试
│   ├── integration/          # 集成测试
│   └── fixtures/             # 测试数据
├── logs/                 # 日志文件
├── .env                  # 环境变量
├── .gitignore           # Git忽略文件
├── package.json         # 项目依赖
├── server.js            # 服务器入口文件
├── ecosystem.config.js  # PM2配置文件
├── API-DOCUMENTATION.md # API文档
├── DEPLOYMENT-GUIDE.md  # 部署指南
└── README.md            # 项目说明
```

## 核心功能模块

### 1. 认证模块

认证模块负责处理用户登录、注册和权限验证。支持微信小程序登录和游客模式。

**主要功能**:
- 微信小程序登录
- 游客模式登录
- JWT令牌生成与验证
- 权限中间件

**关键文件**:
- `controllers/authController.js`
- `middleware/auth.js`
- `utils/wechat.js`

### 2. 用户管理模块

用户管理模块负责处理用户信息的增删改查，包括用户基本信息和车辆信息管理。

**主要功能**:
- 用户信息管理
- 车辆信息管理
- 收藏停车场管理
- 用户反馈处理

**关键文件**:
- `controllers/userController.js`
- `controllers/userProfileController.js`
- `models/miniprogram.js`

### 3. 停车场管理模块

停车场管理模块负责处理停车场和车位信息的管理，包括实时状态更新和统计。

**主要功能**:
- 停车场信息管理
- 车位状态管理
- 车位统计信息
- 停车场地图数据

**关键文件**:
- `controllers/parkingController.js`
- `models/ParkingLot.js`
- `models/ParkingSpace.js`

### 4. 车位推荐模块

车位推荐模块负责根据用户位置和偏好推荐合适的空闲车位。

**主要功能**:
- 基于位置的车位推荐
- 基于偏好的车位筛选
- 车位统计信息
- 停车场地图数据

**关键文件**:
- `controllers/recommendationController.js`
- `utils/recommendation.js`

### 5. 路径规划模块

路径规划模块负责计算从起点到终点的最优路径，使用A*算法进行路径搜索。

**主要功能**:
- A*路径规划算法
- 路径计算与优化
- 路径保存与管理
- 路径可视化数据

**关键文件**:
- `controllers/pathfindingController.js`
- `utils/pathfinding.js`
- `models/NavigationPath.js`

### 6. 反向寻车模块

反向寻车模块负责帮助用户找到停车位置，包括停车位置标记和反向路径规划。

**主要功能**:
- 停车位置标记
- 停车记录管理
- 反向路径规划
- 停车历史记录

**关键文件**:
- `controllers/findCarController.js`
- `models/ParkingRecord.js`

## 数据模型

### 用户模型 (MiniProgramUser)

```javascript
{
  _id: ObjectId,
  openid: String,           // 微信openid
  nickName: String,          // 昵称
  avatarUrl: String,        // 头像URL
  gender: Number,           // 性别
  phone: String,            // 手机号
  isGuest: Boolean,         // 是否游客
  totalParkingCount: Number, // 总停车次数
  createdAt: Date,
  updatedAt: Date
}
```

### 车辆模型 (MiniProgramVehicle)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // 用户ID
  licensePlate: String,      // 车牌号
  vehicleType: String,       // 车辆类型
  brand: String,            // 品牌
  model: String,            // 型号
  color: String,            // 颜色
  isDefault: Boolean,       // 是否默认车辆
  createdAt: Date,
  updatedAt: Date
}
```

### 停车记录模型 (ParkingRecord)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // 用户ID
  vehicleId: ObjectId,      // 车辆ID
  parkingLotId: ObjectId,   // 停车场ID
  spaceId: ObjectId,        // 车位ID
  entryTime: Date,          // 入场时间
  exitTime: Date,           // 出场时间
  fee: Number,              // 停车费用
  paymentMethod: String,     // 支付方式
  notes: String,            // 备注
  createdAt: Date,
  updatedAt: Date
}
```

### 导航路径模型 (NavigationPath)

```javascript
{
  _id: ObjectId,
  userId: ObjectId,         // 用户ID
  name: String,             // 路径名称
  startNodeId: String,       // 起点节点ID
  endNodeId: String,         // 终点节点ID
  path: [                   // 路径点数组
    {
      x: Number,
      y: Number,
      floor: String,
      instruction: String
    }
  ],
  distance: Number,         // 路径距离
  estimatedTime: Number,     // 预计时间
  options: Object,          // 路径选项
  createdAt: Date,
  updatedAt: Date
}
```

## API设计原则

1. **RESTful风格**: 使用标准的HTTP方法和状态码
2. **统一响应格式**: 所有API返回统一的JSON格式
3. **版本控制**: 通过URL路径进行版本控制
4. **错误处理**: 统一的错误处理和错误响应
5. **认证授权**: 使用JWT进行身份认证和授权
6. **数据验证**: 对请求数据进行严格验证
7. **分页支持**: 列表接口支持分页查询
8. **缓存策略**: 对不常变的数据实施缓存

## 开发规范

### 1. 代码风格

- 使用ESLint进行代码规范检查
- 使用Prettier进行代码格式化
- 遵循Airbnb JavaScript风格指南
- 使用语义化的变量和函数命名

### 2. 文件命名

- 控制器文件使用驼峰命名法，以Controller结尾
- 模型文件使用驼峰命名法，首字母大写
- 路由文件使用小写字母和连字符
- 工具函数文件使用小写字母和连字符

### 3. 注释规范

- 使用JSDoc格式编写函数注释
- 复杂逻辑添加行内注释
- 模块开头添加模块说明注释

### 4. 错误处理

- 使用统一的错误处理中间件
- 自定义错误类型和错误码
- 记录详细的错误日志
- 返回用户友好的错误信息

## 测试策略

### 1. 单元测试

- 使用Jest进行单元测试
- 测试覆盖所有工具函数和核心逻辑
- 模拟外部依赖和数据库操作

### 2. 集成测试

- 使用Supertest进行API集成测试
- 测试所有API接口的输入输出
- 验证API之间的数据流转

### 3. 测试数据

- 使用固定的测试数据
- 测试前后清理测试数据
- 使用工厂模式生成测试对象

## 性能优化

### 1. 数据库优化

- 创建适当的索引
- 使用聚合查询减少数据传输
- 实施数据分页
- 使用连接池管理数据库连接

### 2. 缓存策略

- 使用Redis缓存热点数据
- 实施查询结果缓存
- 设置合理的缓存过期时间
- 使用缓存预热策略

### 3. 代码优化

- 使用异步编程提高并发性能
- 避免阻塞I/O操作
- 优化循环和递归算法
- 使用流处理大数据量

## 安全措施

### 1. 认证授权

- 使用JWT进行身份认证
- 实施基于角色的访问控制
- 设置合理的令牌过期时间
- 实施令牌刷新机制

### 2. 数据验证

- 对所有输入数据进行验证
- 使用参数化查询防止SQL注入
- 对敏感数据进行加密存储
- 实施输入长度和格式限制

### 3. 安全头部

- 设置安全相关的HTTP头部
- 使用HTTPS进行数据传输
- 实施CORS策略
- 防止CSRF攻击

## 监控与日志

### 1. 日志管理

- 使用Winston进行日志记录
- 分级记录不同类型的日志
- 实施日志轮转策略
- 集中化日志收集

### 2. 性能监控

- 监控API响应时间
- 跟踪系统资源使用情况
- 设置性能告警阈值
- 定期分析性能瓶颈

### 3. 错误监控

- 实时捕获和报告错误
- 跟踪错误发生频率和趋势
- 设置错误告警机制
- 定期分析错误原因

## 部署流程

### 1. 环境准备

- 准备生产环境服务器
- 安装必要的软件和依赖
- 配置网络和安全设置
- 设置数据库和缓存服务

### 2. 代码部署

- 使用Git进行版本控制
- 实施CI/CD自动化部署
- 使用蓝绿部署或滚动更新
- 部署前进行自动化测试

### 3. 运维管理

- 使用PM2管理Node.js进程
- 配置Nginx反向代理
- 设置SSL证书
- 实施数据备份策略

## 常见问题

### 1. 开发环境问题

**Q: 如何解决"Cannot find module"错误？**
A: 检查模块是否已安装，运行`npm install`安装依赖。

**Q: 数据库连接失败怎么办？**
A: 检查MongoDB服务是否启动，确认连接字符串是否正确。

### 2. 部署问题

**Q: 如何处理端口被占用？**
A: 使用`lsof -i :端口号`查找占用进程，或修改应用端口。

**Q: 如何设置环境变量？**
A: 创建`.env`文件，或使用系统环境变量。

### 3. 性能问题

**Q: API响应慢怎么办？**
A: 检查数据库查询是否优化，考虑添加索引或使用缓存。

**Q: 内存占用过高怎么办？**
A: 检查是否存在内存泄漏，优化代码逻辑，增加服务器内存。

## 贡献指南

1. Fork项目仓库
2. 创建功能分支
3. 提交代码变更
4. 编写测试用例
5. 提交Pull Request
6. 等待代码审查

## 许可证

本项目采用MIT许可证，详见LICENSE文件。

## 联系方式

- 项目维护者: [Your Name]
- 邮箱: [your.email@example.com]
- 项目地址: [https://github.com/your-repo/parking-navigation-system]