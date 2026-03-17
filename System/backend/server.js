const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const morgan = require('morgan')
const compression = require('compression')
const path = require('path')
require('dotenv').config()

// 导入路由
const authRoutes = require('./routes/auth')
const userRoutes = require('./routes/users')
const parkingRoutes = require('./routes/parking')
const enhancedParkingRoutes = require('./routes/enhancedParking')
const mapRoutes = require('./routes/map')
const navigationRoutes = require('./routes/navigation')
const simulationRoutes = require('./routes/simulation')
const financeRoutes = require('./routes/finance')
const systemRoutes = require('./routes/system')
const analyticsRoutes = require('./routes/analytics')
const importTcc1DataRoutes = require('./routes/importTcc1Data')
const adminParkingRoutes = require('./routes/adminParking')
const adminSpacesRoutes = require('./routes/adminSpaces')
const adminUsersRoutes = require('./routes/adminUsers')
const adminStatisticsRoutes = require('./routes/adminStatistics')
const adminFinanceRoutes = require('./routes/adminFinance')
const adminSystemRoutes = require('./routes/adminSystem')
const adminUserRoutes = require('./routes/adminUser')
const adminRecordsRoutes = require('./routes/adminRecords')
const adminNoticeRoutes = require('./routes/adminNotice')
const adminEventsRoutes = require('./routes/adminEvents')
// 微信小程序专用路由
const miniprogramRoutes = require('./routes/miniprogram')
const miniprogramPathRoutes = require('./routes/miniprogramPath')
const miniprogramUserRoutes = require('./routes/miniprogramUser')
const publicNoticeRoutes = require('./routes/publicNotice')
// 新增小程序功能路由
const userProfileRoutes = require('./routes/userProfile')
const recommendationRoutes = require('./routes/recommendation')
const pathfindingRoutes = require('./routes/pathfinding')
const findCarRoutes = require('./routes/findCar')

// 导入中间件
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')

// 创建Express应用
const app = express()

function matchesApiPrefix(req, prefixes) {
  const candidates = [
    req.originalUrl || '',
    req.baseUrl || '',
    req.path || '',
    `${req.baseUrl || ''}${req.path || ''}`
  ]

  return prefixes.some(prefix => candidates.some(candidate => candidate.startsWith(prefix)))
}

// 安全中间件
app.use(helmet())

// 跨域配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || ['http://localhost:3001', 'http://localhost:5002', 'http://localhost:5003'],
  credentials: true
}))

// 请求限制 - 对登录接口使用更宽松的限制
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 50, // 登录接口：15分钟内最多50次
  message: 'Too many login requests, please try again later.',
  skipSuccessfulRequests: true, // 成功请求不计入限制
})

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 300, // 其他接口：15分钟内最多300个请求（提高限制以支持实时刷新）
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // 微信小程序前台会高频轮询这些只读/轻量接口，
    // 同时 3001 兼容层也会转发到这里，不能再被管理后台限流误伤。
    return matchesApiPrefix(req, [
      '/api/spaces',
      '/spaces',
      '/api/path',
      '/path',
      '/api/navigation',
      '/navigation',
      '/api/find-car',
      '/find-car',
      '/api/recommendation',
      '/recommendation'
    ]);
  }
})

// 登录接口使用更宽松的限制
app.use('/api/admin/auth/login', authLimiter)
// 其他接口使用常规限制
app.use('/api/', apiLimiter)

// 日志中间件
app.use(morgan('combined'))

// 压缩中间件
app.use(compression())

// 解析JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))

// API路由
app.use('/api/admin/auth', authRoutes)
app.use('/api/admin/users', userRoutes)
app.use('/api/admin/parking', parkingRoutes)
app.use('/api/admin/parking-enhanced', enhancedParkingRoutes)
app.use('/api/admin/map', mapRoutes)
app.use('/api/admin/navigation', navigationRoutes)
app.use('/api/admin/simulation', simulationRoutes)
app.use('/api/admin/finance', financeRoutes)
app.use('/api/admin/system', systemRoutes)
app.use('/api/admin/analytics', analyticsRoutes)
app.use('/api/admin/import', importTcc1DataRoutes)
app.use('/api/admin/parking-lots', adminParkingRoutes)
app.use('/api/admin/parking-spaces', adminSpacesRoutes)
app.use('/api/admin/users', adminUsersRoutes)
app.use('/api/admin/statistics', adminStatisticsRoutes)
app.use('/api/admin/finance', adminFinanceRoutes)
app.use('/api/admin/system', adminSystemRoutes)
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/records', adminRecordsRoutes)
app.use('/api/admin/system/notices', adminNoticeRoutes)
app.use('/api/admin/events', adminEventsRoutes)
// 微信小程序专用路由
app.use('/api/spaces', miniprogramRoutes)
app.use('/api/path', miniprogramPathRoutes)
app.use('/api/users', miniprogramUserRoutes)
app.use('/api/notices', publicNoticeRoutes)
// 新增小程序功能路由
app.use('/api/user', userProfileRoutes)
app.use('/api/recommendation', recommendationRoutes)
app.use('/api/navigation', pathfindingRoutes)
app.use('/api/find-car', findCarRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  })
})

// 404处理
app.use(notFound)

// 错误处理
app.use(errorHandler)

const { subscribe } = require('../../shared/changeStreams')
const Admin = require('./models/Admin')

// 启动服务器
const PORT = process.env.PORT || 5001

const startServer = async () => {
  const uri = process.env.UNIFIED_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_admin'
  const conn = await mongoose.connect(uri)
  try {
    const username = process.env.DEFAULT_ADMIN_USERNAME || 'admin'
    const password = process.env.DEFAULT_ADMIN_PASSWORD || '123456'
    const name = process.env.DEFAULT_ADMIN_NAME || '系统管理员'
    let admin = await Admin.findOne({ username })
    if (!admin) {
      admin = new Admin({ username, password, name, email: 'admin@example.com', role: 'admin', permissions: ['all'], status: 'active' })
      await admin.save()
      console.log(`[Seed] 默认管理员已创建: ${username}`)
    }
  } catch (e) {
    console.log(`[SeedWarning] 默认管理员创建失败: ${e && e.message ? e.message : e}`)
  }
  try {
    if (process.env.ENABLE_CHANGE_STREAMS === '1') {
      subscribe(['parkingspaces'], () => {})
    }
  } catch (e) {
    console.log(`[ChangeStreamDisabled] ${e && e.message ? e.message : e}`)
  }
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
  })
}

startServer()

// 处理未捕获的异常
process.on('uncaughtException', (err) => {
  console.log(`UNCAUGHT EXCEPTION: ${err}`)
  process.exit(1)
})

// 处理未处理的Promise拒绝
process.on('unhandledRejection', (err) => {
  console.log(`UNHANDLED REJECTION: ${err}`)
  process.exit(1)
})
