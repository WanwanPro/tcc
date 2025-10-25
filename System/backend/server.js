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
const mapRoutes = require('./routes/map')
const navigationRoutes = require('./routes/navigation')
const simulationRoutes = require('./routes/simulation')
const financeRoutes = require('./routes/finance')
const systemRoutes = require('./routes/system')
const analyticsRoutes = require('./routes/analytics')
const importTcc1DataRoutes = require('./routes/importTcc1Data')
// 微信小程序专用路由
const miniprogramRoutes = require('./routes/miniprogram')
const miniprogramPathRoutes = require('./routes/miniprogramPath')
const miniprogramUserRoutes = require('./routes/miniprogramUser')

// 导入中间件
const { errorHandler } = require('./middleware/errorHandler')
const { notFound } = require('./middleware/notFound')

// 创建Express应用
const app = express()

// 安全中间件
app.use(helmet())

// 跨域配置
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3001',
  credentials: true
}))

// 请求限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
})
app.use('/api/', limiter)

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
app.use('/api/admin/map', mapRoutes)
app.use('/api/admin/navigation', navigationRoutes)
app.use('/api/admin/simulation', simulationRoutes)
app.use('/api/admin/finance', financeRoutes)
app.use('/api/admin/system', systemRoutes)
app.use('/api/admin/analytics', analyticsRoutes)
app.use('/api/admin/import', importTcc1DataRoutes)
// 微信小程序专用路由
app.use('/api/spaces', miniprogramRoutes)
app.use('/api/path', miniprogramPathRoutes)
app.use('/api/users', miniprogramUserRoutes)

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

// 数据库连接
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log(`MongoDB Connected: ${conn.connection.host}`)
  } catch (error) {
    console.error(`Error: ${error.message}`)
    process.exit(1)
  }
}

// 启动服务器
const PORT = process.env.PORT || 5000

const startServer = async () => {
  await connectDB()
  
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