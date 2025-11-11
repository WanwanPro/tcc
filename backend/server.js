const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
const path = require('path')
require('dotenv').config()

// 导入路由
const userRoutes = require('./routes/userRoutes')
const parkingRoutes = require('./routes/spaceRoutes')
const pathRoutes = require('./routes/pathRoutes')
const imageRoutes = require('./routes/imageRoutes')

// 导入中间件
// const { errorHandler } = require('./middleware/errorHandler')
// const { notFound } = require('./middleware/notFound')

// 创建Express应用
const app = express()

// 跨域配置
app.use(cors({
  origin: ['http://localhost:3001', 'http://localhost:5002', 'https://servicewechat.com', 'https://tcb-api.tencentcloudapi.com'],
  credentials: true
}))

// 解析JSON
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true, limit: '10mb' }))

// 静态文件服务
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
// app.use(express.static(path.join(__dirname, 'public')))

// API路由
app.use('/api/users', userRoutes)
app.use('/api/spaces', parkingRoutes)
app.use('/api/paths', pathRoutes)
app.use('/api/images', imageRoutes)

// 健康检查
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  })
})

// 404处理
// app.use(notFound)

// 错误处理
// app.use(errorHandler)

// 数据库连接
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_system', {
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
const PORT = process.env.PORT || 3001

const startServer = async () => {
  await connectDB()
  
  // 监听所有网络接口 (0.0.0.0)，允许局域网访问
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
    console.log(`Local: http://localhost:${PORT}`)
    console.log(`Network: http://192.168.0.78:${PORT}`)
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