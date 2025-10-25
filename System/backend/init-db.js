const initializeDatabase = require('./scripts/initDatabase')
const mongoose = require('mongoose')

// 连接数据库并初始化
const runInit = async () => {
  try {
    // 从环境变量或使用默认值获取数据库URI
    const dbUri = process.env.MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_admin'
    
    // 连接数据库
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    
    console.log('已连接到数据库')
    
    // 初始化数据库
    const success = await initializeDatabase()
    
    if (success) {
      console.log('数据库初始化成功完成')
    } else {
      console.error('数据库初始化失败')
    }
    
    // 关闭数据库连接
    await mongoose.connection.close()
    console.log('数据库连接已关闭')
    
    // 退出进程
    process.exit(success ? 0 : 1)
  } catch (error) {
    console.error('初始化过程中出错:', error)
    process.exit(1)
  }
}

// 加载环境变量
require('dotenv').config()

// 运行初始化
runInit()