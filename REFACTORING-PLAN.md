# TCC 停车场管理系统 - 重构计划

> 时间预算: 1周 (5-7个工作日)
> 目标: 统一代码规范、合并重复代码、提升性能、逐步引入TypeScript

---

## 重构后的目标架构

```
tcc/
├── shared/                          # 共享代码库 (新建)
│   ├── constants/                   # 常量定义
│   │   ├── statusMappings.ts        # 状态映射
│   │   └── errorCodes.ts            # 错误码
│   ├── middleware/                  # 通用中间件
│   │   ├── pagination.ts            # 分页中间件
│   │   ├── validateObjectId.ts      # ObjectId验证
│   │   ├── asyncHandler.ts          # 异步错误处理
│   │   └── requestLogger.ts         # 请求日志
│   ├── services/                    # 共享服务
│   │   ├── dataModelMapping.ts      # 数据模型映射
│   │   └── baseApiAdapter.ts        # API适配器基类
│   ├── utils/                       # 工具函数
│   │   ├── escapeRegex.ts           # 正则转义
│   │   ├── logger.ts                # 统一日志
│   │   └── cache.ts                 # 缓存工具
│   ├── models/                      # 共享模型 (可选)
│   │   └── ParkingSpace.ts          # 统一的车位模型
│   └── types/                       # TypeScript类型定义
│       ├── api.d.ts                 # API请求/响应类型
│       ├── models.d.ts              # 数据模型类型
│       └── common.d.ts              # 通用类型
│
├── backend/                         # TCC小程序后端
│   ├── tsconfig.json                # TypeScript配置
│   └── src/                         # 源码目录 (重构后)
│       ├── controllers/
│       ├── routes/
│       └── server.ts
│
├── System/
│   ├── backend/                     # System管理后端
│   │   ├── tsconfig.json
│   │   └── src/
│   └── frontend/                    # System管理前端 (Vue)
│       └── src/
│           ├── api/                 # 清理重复API
│           ├── stores/              # 扩展Pinia stores
│           └── composables/         # Vue组合式函数
│
└── frontend/                        # 微信小程序
    └── miniprogram/
        └── utils/
            └── request.js           # 统一请求封装
```

---

## 第一天: 基础设施搭建

### 1.1 初始化 shared 目录结构

```bash
# 创建目录结构
mkdir -p shared/{constants,middleware,services,utils,types}

# 初始化 package.json
cd shared && npm init -y

# 安装 TypeScript 相关依赖
npm install typescript @types/node --save-dev
```

### 1.2 配置 TypeScript

创建 `shared/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "resolveJsonModule": true
  },
  "include": ["./**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 1.3 创建常量文件

创建 `shared/constants/statusMappings.ts`:
```typescript
// 车位状态映射
export const SPACE_STATUS = {
  AVAILABLE: 'available',
  OCCUPIED: 'occupied',
  RESERVED: 'reserved',
  MAINTENANCE: 'maintenance'
} as const;

export type SpaceStatus = typeof SPACE_STATUS[keyof typeof SPACE_STATUS];

// 中英文状态映射
export const STATUS_CN_TO_EN: Record<string, SpaceStatus> = {
  '空闲': SPACE_STATUS.AVAILABLE,
  '占用': SPACE_STATUS.OCCUPIED,
  '预定': SPACE_STATUS.RESERVED,
  '维护': SPACE_STATUS.MAINTENANCE
};

export const STATUS_EN_TO_CN: Record<SpaceStatus, string> = {
  [SPACE_STATUS.AVAILABLE]: '空闲',
  [SPACE_STATUS.OCCUPIED]: '占用',
  [SPACE_STATUS.RESERVED]: '预定',
  [SPACE_STATUS.MAINTENANCE]: '维护'
};

// 状态转换函数
export function toEnglishStatus(cnStatus: string): SpaceStatus {
  return STATUS_CN_TO_EN[cnStatus] || SPACE_STATUS.AVAILABLE;
}

export function toChineseStatus(enStatus: SpaceStatus): string {
  return STATUS_EN_TO_CN[enStatus] || '空闲';
}
```

创建 `shared/constants/errorCodes.ts`:
```typescript
export const ERROR_CODES = {
  // 通用错误
  INTERNAL_ERROR: { code: 'E001', message: '服务器内部错误' },
  INVALID_PARAMS: { code: 'E002', message: '参数无效' },
  NOT_FOUND: { code: 'E003', message: '资源不存在' },
  
  // 认证错误
  UNAUTHORIZED: { code: 'E101', message: '未授权访问' },
  TOKEN_EXPIRED: { code: 'E102', message: 'Token已过期' },
  INVALID_CREDENTIALS: { code: 'E103', message: '用户名或密码错误' },
  
  // 业务错误
  SPACE_NOT_AVAILABLE: { code: 'E201', message: '车位不可用' },
  DUPLICATE_RESERVATION: { code: 'E202', message: '重复预约' }
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
```

### 1.4 任务清单

- [ ] 创建 shared 目录结构
- [ ] 配置 TypeScript
- [ ] 创建 statusMappings.ts
- [ ] 创建 errorCodes.ts
- [ ] 配置 backend 和 System/backend 引用 shared

---

## 第二天: 创建通用中间件

### 2.1 分页中间件

创建 `shared/middleware/pagination.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

declare global {
  namespace Express {
    interface Request {
      pagination: PaginationParams;
    }
  }
}

export function pagination(defaultLimit = 20, maxLimit = 100) {
  return (req: Request, res: Response, next: NextFunction) => {
    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    let limit = parseInt(req.query.limit as string) || defaultLimit;
    limit = Math.min(Math.max(1, limit), maxLimit);
    
    req.pagination = {
      page,
      limit,
      skip: (page - 1) * limit
    };
    
    next();
  };
}

// 分页响应辅助函数
export function paginatedResponse<T>(
  data: T[],
  total: number,
  pagination: PaginationParams
) {
  return {
    success: true,
    data,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit),
      hasNext: pagination.page * pagination.limit < total,
      hasPrev: pagination.page > 1
    }
  };
}
```

### 2.2 ObjectId 验证中间件

创建 `shared/middleware/validateObjectId.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export function validateObjectId(paramName = 'id') {
  return (req: Request, res: Response, next: NextFunction) => {
    const id = req.params[paramName];
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: `缺少参数: ${paramName}`
      });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: `无效的${paramName}格式`
      });
    }
    
    next();
  };
}

// 验证多个ID参数
export function validateObjectIds(...paramNames: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    for (const paramName of paramNames) {
      const id = req.params[paramName] || req.body[paramName];
      if (id && !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({
          success: false,
          message: `无效的${paramName}格式`
        });
      }
    }
    next();
  };
}
```

### 2.3 异步错误处理

创建 `shared/middleware/asyncHandler.ts`:
```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

/**
 * 包装异步路由处理器，自动捕获错误
 */
export function asyncHandler(fn: AsyncRequestHandler): RequestHandler {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * 统一错误处理中间件
 */
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error(`[${req.method}] ${req.path} - Error:`, err);

  // Mongoose 验证错误
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: '数据验证失败',
      errors: Object.values(err.errors).map((e: any) => e.message)
    });
  }

  // Mongoose CastError (无效ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      success: false,
      message: '无效的ID格式'
    });
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      message: 'Token无效'
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token已过期'
    });
  }

  // 默认服务器错误
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? '服务器错误' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
}
```

### 2.4 任务清单

- [ ] 创建 pagination.ts
- [ ] 创建 validateObjectId.ts
- [ ] 创建 asyncHandler.ts
- [ ] 在两个后端引入并使用这些中间件

---

## 第三天: 创建共享工具和服务

### 3.1 正则转义工具

创建 `shared/utils/escapeRegex.ts`:
```typescript
/**
 * 转义正则表达式特殊字符，防止ReDoS攻击
 */
export function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * 创建安全的MongoDB正则查询
 */
export function safeRegexQuery(search: string, options = 'i') {
  return { $regex: escapeRegex(search), $options: options };
}
```

### 3.2 缓存工具

创建 `shared/utils/cache.ts`:
```typescript
import NodeCache from 'node-cache';

interface CacheOptions {
  stdTTL?: number;      // 默认过期时间(秒)
  checkperiod?: number; // 检查过期的间隔
  maxKeys?: number;     // 最大键数量
}

class CacheManager {
  private cache: NodeCache;

  constructor(options: CacheOptions = {}) {
    this.cache = new NodeCache({
      stdTTL: options.stdTTL || 60,
      checkperiod: options.checkperiod || 120,
      maxKeys: options.maxKeys || 1000
    });
  }

  get<T>(key: string): T | undefined {
    return this.cache.get<T>(key);
  }

  set<T>(key: string, value: T, ttl?: number): boolean {
    if (ttl !== undefined) {
      return this.cache.set(key, value, ttl);
    }
    return this.cache.set(key, value);
  }

  del(key: string | string[]): number {
    return this.cache.del(key);
  }

  flush(): void {
    this.cache.flushAll();
  }

  /**
   * 获取或设置缓存 (cache-aside pattern)
   */
  async getOrSet<T>(
    key: string,
    fetchFn: () => Promise<T>,
    ttl?: number
  ): Promise<T> {
    const cached = this.get<T>(key);
    if (cached !== undefined) {
      return cached;
    }

    const value = await fetchFn();
    this.set(key, value, ttl);
    return value;
  }
}

// 导出单例实例
export const statsCache = new CacheManager({ stdTTL: 60 });   // 统计缓存 60秒
export const userCache = new CacheManager({ stdTTL: 300 });   // 用户缓存 5分钟
export const configCache = new CacheManager({ stdTTL: 3600 }); // 配置缓存 1小时

export { CacheManager };
```

### 3.3 统一日志工具

创建 `shared/utils/logger.ts`:
```typescript
import winston from 'winston';
import path from 'path';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// 自定义日志格式
const logFormat = printf(({ level, message, timestamp, stack, requestId }) => {
  const reqId = requestId ? `[${requestId}]` : '';
  const stackTrace = stack ? `\n${stack}` : '';
  return `${timestamp} ${level} ${reqId}: ${message}${stackTrace}`;
});

// 创建 logger 实例
function createLogger(service: string) {
  const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service },
    format: combine(
      errors({ stack: true }),
      timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
    ),
    transports: [
      // 控制台输出
      new winston.transports.Console({
        format: combine(colorize(), logFormat)
      }),
      // 错误日志文件
      new winston.transports.File({
        filename: path.join('logs', `${service}-error.log`),
        level: 'error',
        format: logFormat
      }),
      // 所有日志文件
      new winston.transports.File({
        filename: path.join('logs', `${service}-combined.log`),
        format: logFormat
      })
    ]
  });

  return logger;
}

// 导出预配置的 logger
export const tccLogger = createLogger('tcc-backend');
export const systemLogger = createLogger('system-backend');

export { createLogger };
```

### 3.4 数据模型映射服务

创建 `shared/services/dataModelMapping.ts`:
```typescript
import { SpaceStatus, toEnglishStatus, toChineseStatus } from '../constants/statusMappings';

// 类型定义
export interface SystemParkingSpace {
  _id: string;
  spaceId: string;
  spaceNumber: string;
  status: SpaceStatus;
  lotId: string;
  floor: number;
  zone: string;
  position: { x: number; y: number };
  type: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MiniprogramParkingSpace {
  spaceId: string;
  status: string; // 中文状态
  position: { x: number; y: number };
  floor?: number;
  zone?: string;
}

/**
 * 将管理系统车位数据转换为小程序格式
 */
export function mapToMiniprogram(space: SystemParkingSpace): MiniprogramParkingSpace {
  return {
    spaceId: space.spaceId,
    status: toChineseStatus(space.status),
    position: space.position,
    floor: space.floor,
    zone: space.zone
  };
}

/**
 * 将小程序车位数据转换为管理系统格式
 */
export function mapToSystem(
  space: MiniprogramParkingSpace,
  lotId: string
): Partial<SystemParkingSpace> {
  return {
    spaceId: space.spaceId,
    status: toEnglishStatus(space.status),
    position: space.position,
    floor: space.floor,
    zone: space.zone,
    lotId
  };
}

/**
 * 批量转换
 */
export function batchMapToMiniprogram(spaces: SystemParkingSpace[]): MiniprogramParkingSpace[] {
  return spaces.map(mapToMiniprogram);
}

export function batchMapToSystem(
  spaces: MiniprogramParkingSpace[],
  lotId: string
): Partial<SystemParkingSpace>[] {
  return spaces.map(s => mapToSystem(s, lotId));
}
```

### 3.5 任务清单

- [ ] 创建 escapeRegex.ts
- [ ] 创建 cache.ts (需要 `npm install node-cache`)
- [ ] 创建 logger.ts (需要 `npm install winston`)
- [ ] 创建 dataModelMapping.ts
- [ ] 删除两个后端中的重复实现

---

## 第四天: 重构后端代码

### 4.1 为后端添加 TypeScript 支持

在 `backend/` 目录:
```bash
npm install typescript ts-node @types/node @types/express --save-dev
npm install tsconfig-paths --save-dev
```

创建 `backend/tsconfig.json`:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "paths": {
      "@shared/*": ["../shared/*"]
    },
    "baseUrl": "."
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 4.2 重构 server.js -> server.ts

创建 `backend/src/server.ts`:
```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import dotenv from 'dotenv';

import { errorHandler } from '@shared/middleware/asyncHandler';
import { tccLogger as logger } from '@shared/utils/logger';

// 路由
import userRoutes from './routes/userRoutes';
import spaceRoutes from './routes/spaceRoutes';
import pathRoutes from './routes/pathRoutes';

dotenv.config();

const app: Application = express();

// 中间件
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:5002'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// 请求日志
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/users', userRoutes);
app.use('/api/spaces', spaceRoutes);
app.use('/api/paths', pathRoutes);

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use(errorHandler);

// 数据库连接
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    logger.info('MongoDB connected');
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// 优雅关闭
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, shutting down gracefully`);
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 启动服务
const PORT = process.env.PORT || 3001;

connectDB().then(() => {
  app.listen(PORT, () => {
    logger.info(`TCC Backend running on port ${PORT}`);
  });
});

export default app;
```

### 4.3 添加数据库索引

更新 `backend/src/models/ParkingSpace.ts`:
```typescript
import mongoose, { Schema, Document } from 'mongoose';

export interface IParkingSpace extends Document {
  spaceId: string;
  status: '空闲' | '占用' | '预定';
  position: { x: number; y: number };
  floor?: number;
  zone?: string;
  lastUpdated: Date;
}

const parkingSpaceSchema = new Schema<IParkingSpace>({
  spaceId: { type: String, required: true, unique: true },
  status: { 
    type: String, 
    enum: ['空闲', '占用', '预定'], 
    default: '空闲' 
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  floor: Number,
  zone: String,
  lastUpdated: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// 添加索引
parkingSpaceSchema.index({ spaceId: 1 });
parkingSpaceSchema.index({ status: 1 });
parkingSpaceSchema.index({ floor: 1, zone: 1 });
parkingSpaceSchema.index({ 'position.x': 1, 'position.y': 1 });

export default mongoose.model<IParkingSpace>('ParkingSpace', parkingSpaceSchema);
```

### 4.4 重构 Controller 使用新中间件

示例 `backend/src/controllers/spaceController.ts`:
```typescript
import { Request, Response } from 'express';
import ParkingSpace from '../models/ParkingSpace';
import { paginatedResponse } from '@shared/middleware/pagination';
import { statsCache } from '@shared/utils/cache';
import { tccLogger as logger } from '@shared/utils/logger';

export const getAllSpaces = async (req: Request, res: Response) => {
  const { page, limit, skip } = req.pagination;
  
  const [spaces, total] = await Promise.all([
    ParkingSpace.find().skip(skip).limit(limit).lean(),
    ParkingSpace.countDocuments()
  ]);

  res.json(paginatedResponse(spaces, total, req.pagination));
};

export const getSpaceStats = async (req: Request, res: Response) => {
  // 使用缓存
  const stats = await statsCache.getOrSet('space-stats', async () => {
    const result = await ParkingSpace.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    return result.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {} as Record<string, number>);
  }, 30); // 缓存30秒

  res.json({ success: true, data: stats });
};

export const updateSpaceStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const space = await ParkingSpace.findByIdAndUpdate(
    id,
    { status, lastUpdated: new Date() },
    { new: true, runValidators: true }
  );

  if (!space) {
    return res.status(404).json({ success: false, message: '车位不存在' });
  }

  // 清除缓存
  statsCache.del('space-stats');

  logger.info(`Space ${space.spaceId} status updated to ${status}`);
  res.json({ success: true, data: space });
};
```

### 4.5 任务清单

- [ ] 安装 TypeScript 依赖
- [ ] 创建 tsconfig.json
- [ ] 重构 server.js -> server.ts
- [ ] 添加数据库索引到所有模型
- [ ] 重构 controllers 使用新中间件
- [ ] 更新 package.json scripts

---

## 第五天: 重构前端代码

### 5.1 清理重复的 API 定义

重构 `System/frontend/src/api/parking.js`:
```javascript
import request from '@/utils/request'

const BASE_URL = '/api/admin/parking'

// ========== 停车场管理 ==========
export const parkingLotApi = {
  getList: (params) => request.get(`${BASE_URL}/lots`, { params }),
  getById: (id) => request.get(`${BASE_URL}/lots/${id}`),
  create: (data) => request.post(`${BASE_URL}/lots`, data),
  update: (id, data) => request.put(`${BASE_URL}/lots/${id}`, data),
  delete: (id) => request.delete(`${BASE_URL}/lots/${id}`),
  getStats: (id) => request.get(`${BASE_URL}/lots/${id}/stats`)
}

// ========== 车位管理 ==========
export const parkingSpaceApi = {
  getList: (params) => request.get(`${BASE_URL}/spaces`, { params }),
  getById: (id) => request.get(`${BASE_URL}/spaces/${id}`),
  create: (data) => request.post(`${BASE_URL}/spaces`, data),
  update: (id, data) => request.put(`${BASE_URL}/spaces/${id}`, data),
  delete: (id) => request.delete(`${BASE_URL}/spaces/${id}`),
  batchUpdateStatus: (data) => request.post(`${BASE_URL}/spaces/batch-status`, data),
  getStats: () => request.get(`${BASE_URL}/spaces/stats`)
}

// 兼容旧的导出方式
export const getParkingLots = parkingLotApi.getList
export const getParkingSpaces = parkingSpaceApi.getList
export const updateParkingSpace = parkingSpaceApi.update
export const batchUpdateSpaceStatus = parkingSpaceApi.batchUpdateStatus
```

### 5.2 创建 Pinia Store

创建 `System/frontend/src/stores/parking.js`:
```javascript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { parkingSpaceApi, parkingLotApi } from '@/api/parking'

export const useParkingStore = defineStore('parking', () => {
  // 状态
  const spaces = ref([])
  const lots = ref([])
  const loading = ref(false)
  const lastFetched = ref(null)

  // 计算属性
  const spaceStats = computed(() => {
    const stats = { available: 0, occupied: 0, reserved: 0, total: 0 }
    spaces.value.forEach(space => {
      stats.total++
      if (space.status === 'available') stats.available++
      else if (space.status === 'occupied') stats.occupied++
      else if (space.status === 'reserved') stats.reserved++
    })
    return stats
  })

  const occupancyRate = computed(() => {
    if (spaceStats.value.total === 0) return 0
    return Math.round((spaceStats.value.occupied / spaceStats.value.total) * 100)
  })

  // 方法
  async function fetchSpaces(params = {}) {
    loading.value = true
    try {
      const res = await parkingSpaceApi.getList(params)
      spaces.value = res.data || []
      lastFetched.value = new Date()
      return res
    } finally {
      loading.value = false
    }
  }

  async function fetchLots() {
    const res = await parkingLotApi.getList()
    lots.value = res.data || []
    return res
  }

  async function updateSpaceStatus(id, status) {
    const res = await parkingSpaceApi.update(id, { status })
    // 更新本地状态
    const index = spaces.value.findIndex(s => s._id === id)
    if (index !== -1) {
      spaces.value[index] = { ...spaces.value[index], status }
    }
    return res
  }

  function clearCache() {
    spaces.value = []
    lots.value = []
    lastFetched.value = null
  }

  return {
    // 状态
    spaces,
    lots,
    loading,
    lastFetched,
    // 计算属性
    spaceStats,
    occupancyRate,
    // 方法
    fetchSpaces,
    fetchLots,
    updateSpaceStatus,
    clearCache
  }
})
```

### 5.3 创建组合式函数

创建 `System/frontend/src/composables/useSpaceStatus.js`:
```javascript
import { computed } from 'vue'

const STATUS_CONFIG = {
  available: { type: 'success', text: '空闲', color: '#67C23A' },
  occupied: { type: 'danger', text: '占用', color: '#F56C6C' },
  reserved: { type: 'warning', text: '预定', color: '#E6A23C' },
  maintenance: { type: 'info', text: '维护', color: '#909399' }
}

export function useSpaceStatus() {
  const getStatusType = (status) => STATUS_CONFIG[status]?.type || 'info'
  const getStatusText = (status) => STATUS_CONFIG[status]?.text || status
  const getStatusColor = (status) => STATUS_CONFIG[status]?.color || '#909399'

  return {
    getStatusType,
    getStatusText,
    getStatusColor,
    STATUS_CONFIG
  }
}
```

### 5.4 任务清单

- [ ] 重构 api/parking.js 删除重复
- [ ] 统一 API 路径前缀
- [ ] 创建 stores/parking.js
- [ ] 创建 composables/useSpaceStatus.js
- [ ] 更新组件使用新的 store 和 composables

---

## 第六天: 重构小程序代码

### 6.1 创建统一请求封装

创建 `frontend/miniprogram/utils/request.js`:
```javascript
const app = getApp()

const request = (options) => {
  return new Promise((resolve, reject) => {
    const { showLoading = true, loadingText = '加载中...' } = options

    if (showLoading) {
      wx.showLoading({ title: loadingText, mask: true })
    }

    wx.request({
      url: app.globalData.baseUrl + options.url,
      method: options.method || 'GET',
      data: options.data,
      header: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${wx.getStorageSync('token')}`,
        ...options.header
      },
      success: (res) => {
        if (showLoading) wx.hideLoading()

        if (res.statusCode >= 200 && res.statusCode < 300) {
          if (res.data.success !== false) {
            resolve(res.data)
          } else {
            wx.showToast({ title: res.data.message || '请求失败', icon: 'none' })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          // Token 过期，跳转登录
          wx.removeStorageSync('token')
          wx.redirectTo({ url: '/pages/login/login' })
          reject({ message: '登录已过期' })
        } else {
          wx.showToast({ title: '服务器错误', icon: 'none' })
          reject(res.data)
        }
      },
      fail: (err) => {
        if (showLoading) wx.hideLoading()
        wx.showToast({ title: '网络错误', icon: 'none' })
        reject(err)
      }
    })
  })
}

// 便捷方法
request.get = (url, data, options = {}) => 
  request({ url, data, method: 'GET', ...options })

request.post = (url, data, options = {}) => 
  request({ url, data, method: 'POST', ...options })

request.put = (url, data, options = {}) => 
  request({ url, data, method: 'PUT', ...options })

request.delete = (url, data, options = {}) => 
  request({ url, data, method: 'DELETE', ...options })

module.exports = request
```

### 6.2 创建 API 模块

创建 `frontend/miniprogram/api/space.js`:
```javascript
const request = require('../utils/request')

module.exports = {
  // 获取所有车位
  getSpaces: () => request.get('/spaces'),
  
  // 获取车位状态统计
  getStats: () => request.get('/spaces/stats'),
  
  // 获取单个车位详情
  getSpaceById: (id) => request.get(`/spaces/${id}`),
  
  // 预约车位
  reserveSpace: (spaceId) => request.post('/spaces/reserve', { spaceId })
}
```

### 6.3 重构环境配置

更新 `frontend/miniprogram/app.js`:
```javascript
// 环境配置
const ENV_CONFIG = {
  development: {
    baseUrl: 'http://localhost:3001/api'
  },
  production: {
    baseUrl: 'https://your-domain.com/api'  // 生产环境地址
  }
}

// 获取当前环境
const getEnv = () => {
  const envVersion = __wxConfig.envVersion || 'release'
  return envVersion === 'release' ? 'production' : 'development'
}

App({
  globalData: {
    baseUrl: ENV_CONFIG[getEnv()].baseUrl,
    userInfo: null,
    token: null
  },

  onLaunch() {
    // 检查登录状态
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
    }
  }
})
```

### 6.4 任务清单

- [ ] 创建 utils/request.js
- [ ] 创建 api/space.js 等API模块
- [ ] 重构环境配置
- [ ] 更新页面使用新的请求封装
- [ ] 移除全局变量，改用 Page data

---

## 第七天: 测试与文档

### 7.1 测试清单

- [ ] 运行所有后端单元测试
- [ ] 测试 TCC 小程序后端 API
- [ ] 测试 System 管理后端 API
- [ ] 测试前端页面功能
- [ ] 测试小程序功能
- [ ] 性能测试（索引效果）

### 7.2 更新文档

- [ ] 更新 README.md
- [ ] 更新 PROJECT-STRUCTURE.md
- [ ] 创建 CHANGELOG.md 记录变更

### 7.3 清理工作

- [ ] 删除旧的重复代码文件
- [ ] 删除未使用的依赖
- [ ] 删除调试用的 console.log
- [ ] 代码格式化

---

## 命令速查

```bash
# 安装 shared 依赖
cd shared && npm install

# 编译 TypeScript
cd shared && npx tsc

# 后端开发模式 (需要 ts-node)
cd backend && npm run dev

# 后端构建
cd backend && npm run build

# 运行测试
cd backend && npm test

# 代码格式化
npx prettier --write "**/*.{ts,js,vue}"

# 检查 TypeScript 类型
npx tsc --noEmit
```

---

## 风险与注意事项

1. **渐进式迁移**: 不要一次性迁移所有代码到 TypeScript，先从 shared 目录开始
2. **保持兼容**: 新代码需要兼容旧代码，使用 CommonJS 导出
3. **测试覆盖**: 重构前确保有足够的测试覆盖
4. **备份**: 重构前提交所有更改到 Git
5. **分支策略**: 在新分支进行重构，完成后合并

---

## 预期收益

| 指标 | 重构前 | 重构后 |
|------|--------|--------|
| 代码重复率 | ~30% | <10% |
| 数据库查询性能 | 无索引 | 有索引，提升50%+ |
| 缓存命中 | 无 | 统计接口缓存60秒 |
| 类型安全 | 无 | TypeScript 覆盖共享代码 |
| 错误处理 | 分散 | 统一中间件 |

---

*计划创建时间: 2026-01-25*
