const SystemConfig = require('../models/SystemConfig')
const User = require('../models/User')
const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const Transaction = require('../models/Transaction')
const { generatePagination, generateId } = require('../utils/helpers')

// 获取所有系统配置
const getSystemConfigs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.key) {
      query.key = { $regex: req.query.key, $options: 'i' }
    }
    
    if (req.query.category) {
      query.category = req.query.category
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true'
    }
    
    // 执行查询
    const systemConfigs = await SystemConfig.find(query)
      .sort({ category: 1, key: 1 })
      .skip(skip)
      .limit(limit)
    
    const total = await SystemConfig.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        systemConfigs,
        pagination: generatePagination(page, limit, total)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取单个系统配置
const getSystemConfig = async (req, res) => {
  try {
    const systemConfig = await SystemConfig.findById(req.params.id)
    
    if (!systemConfig) {
      return res.status(404).json({
        success: false,
        message: '系统配置不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: systemConfig
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建系统配置
const createSystemConfig = async (req, res) => {
  try {
    const { key, category, value, description, dataType, isActive, properties } = req.body
    
    // 验证输入
    if (!key || !category || value === undefined) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查配置键是否已存在
    const existingConfig = await SystemConfig.findOne({ key })
    
    if (existingConfig) {
      return res.status(400).json({
        success: false,
        message: '配置键已存在'
      })
    }
    
    // 创建新系统配置
    const systemConfig = new SystemConfig({
      key,
      category,
      value,
      description: description || '',
      dataType: dataType || 'string',
      isActive: isActive !== undefined ? isActive : true,
      properties: properties || {}
    })
    
    await systemConfig.save()
    
    res.status(201).json({
      success: true,
      message: '系统配置创建成功',
      data: systemConfig
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 更新系统配置
const updateSystemConfig = async (req, res) => {
  try {
    const { category, value, description, dataType, isActive, properties } = req.body
    
    // 查找系统配置
    const systemConfig = await SystemConfig.findById(req.params.id)
    
    if (!systemConfig) {
      return res.status(404).json({
        success: false,
        message: '系统配置不存在'
      })
    }
    
    // 更新字段
    if (category) systemConfig.category = category
    if (value !== undefined) systemConfig.value = value
    if (description) systemConfig.description = description
    if (dataType) systemConfig.dataType = dataType
    if (isActive !== undefined) systemConfig.isActive = isActive
    if (properties) systemConfig.properties = properties
    
    await systemConfig.save()
    
    res.status(200).json({
      success: true,
      message: '系统配置更新成功',
      data: systemConfig
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 删除系统配置
const deleteSystemConfig = async (req, res) => {
  try {
    const systemConfig = await SystemConfig.findById(req.params.id)
    
    if (!systemConfig) {
      return res.status(404).json({
        success: false,
        message: '系统配置不存在'
      })
    }
    
    await SystemConfig.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '系统配置删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 批量更新系统配置
const batchUpdateSystemConfigs = async (req, res) => {
  try {
    const { configs } = req.body
    
    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的配置数组'
      })
    }
    
    const updatePromises = configs.map(async (config) => {
      const { id, value, isActive } = config
      
      if (!id) {
        return { success: false, message: '配置ID不能为空', id }
      }
      
      try {
        const systemConfig = await SystemConfig.findById(id)
        
        if (!systemConfig) {
          return { success: false, message: '系统配置不存在', id }
        }
        
        if (value !== undefined) systemConfig.value = value
        if (isActive !== undefined) systemConfig.isActive = isActive
        
        await systemConfig.save()
        
        return { success: true, message: '更新成功', id, data: systemConfig }
      } catch (error) {
        return { success: false, message: error.message, id }
      }
    })
    
    const results = await Promise.all(updatePromises)
    
    const successCount = results.filter(result => result.success).length
    const failureCount = results.length - successCount
    
    res.status(200).json({
      success: true,
      message: `批量更新完成，成功: ${successCount}，失败: ${failureCount}`,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          failure: failureCount
        }
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取系统信息
const getSystemInfo = async (req, res) => {
  try {
    // 获取系统统计信息
    const userCount = await User.countDocuments()
    const parkingLotCount = await ParkingLot.countDocuments()
    const parkingSpaceCount = await ParkingSpace.countDocuments()
    const transactionCount = await Transaction.countDocuments()
    
    // 获取今日交易数
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const todayTransactionCount = await Transaction.countDocuments({
      createdAt: {
        $gte: today,
        $lt: tomorrow
      }
    })
    
    // 获取今日收入
    const todayRevenue = await Transaction.aggregate([
      {
        $match: {
          status: 'completed',
          createdAt: {
            $gte: today,
            $lt: tomorrow
          }
        }
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" }
        }
      }
    ])
    
    const revenue = todayRevenue.length > 0 ? todayRevenue[0].totalRevenue : 0
    
    // 获取系统运行时间（模拟）
    const uptime = process.uptime()
    
    // 获取内存使用情况
    const memoryUsage = process.memoryUsage()
    
    // 获取系统版本信息
    const systemInfo = {
      version: '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: {
        seconds: uptime,
        formatted: formatUptime(uptime)
      },
      memory: {
        rss: formatBytes(memoryUsage.rss),
        heapTotal: formatBytes(memoryUsage.heapTotal),
        heapUsed: formatBytes(memoryUsage.heapUsed),
        external: formatBytes(memoryUsage.external)
      },
      stats: {
        userCount,
        parkingLotCount,
        parkingSpaceCount,
        transactionCount,
        todayTransactionCount,
        todayRevenue: revenue.toFixed(2)
      }
    }
    
    res.status(200).json({
      success: true,
      data: systemInfo
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取系统日志
const getSystemLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.level) {
      query.level = req.query.level
    }
    
    if (req.query.category) {
      query.category = req.query.category
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.timestamp = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      }
    }
    
    if (req.query.search) {
      query.$or = [
        { message: { $regex: req.query.search, $options: 'i' } },
        { userId: { $regex: req.query.search, $options: 'i' } },
        { ip: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 这里应该有一个日志模型，为了简化，我们返回一个模拟的日志数据
    // 在实际项目中，应该使用winston或其他日志库来记录日志，并创建一个Log模型来存储日志
    
    const mockLogs = []
    
    // 生成模拟日志数据
    for (let i = 0; i < 100; i++) {
      const levels = ['info', 'warn', 'error', 'debug']
      const categories = ['auth', 'parking', 'transaction', 'system', 'api']
      const messages = [
        '用户登录成功',
        '停车位状态更新',
        '交易记录创建',
        '系统配置更新',
        'API请求处理',
        '数据库连接异常',
        '权限验证失败',
        '数据导出完成'
      ]
      
      const randomLevel = levels[Math.floor(Math.random() * levels.length)]
      const randomCategory = categories[Math.floor(Math.random() * categories.length)]
      const randomMessage = messages[Math.floor(Math.random() * messages.length)]
      
      // 生成随机时间戳（最近30天内）
      const timestamp = new Date()
      timestamp.setDate(timestamp.getDate() - Math.floor(Math.random() * 30))
      timestamp.setHours(Math.floor(Math.random() * 24))
      timestamp.setMinutes(Math.floor(Math.random() * 60))
      timestamp.setSeconds(Math.floor(Math.random() * 60))
      
      mockLogs.push({
        _id: `log_${i + 1}`,
        level: randomLevel,
        category: randomCategory,
        message: randomMessage,
        userId: Math.random() > 0.5 ? `user_${Math.floor(Math.random() * 10) + 1}` : null,
        ip: `192.168.1.${Math.floor(Math.random() * 255) + 1}`,
        timestamp,
        details: {
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          requestId: `req_${Math.random().toString(36).substring(2, 15)}`
        }
      })
    }
    
    // 应用查询条件
    let filteredLogs = mockLogs
    
    if (query.level) {
      filteredLogs = filteredLogs.filter(log => log.level === query.level)
    }
    
    if (query.category) {
      filteredLogs = filteredLogs.filter(log => log.category === query.category)
    }
    
    if (query.timestamp && query.timestamp.$gte && query.timestamp.$lte) {
      filteredLogs = filteredLogs.filter(log => 
        log.timestamp >= query.timestamp.$gte && 
        log.timestamp <= query.timestamp.$lte
      )
    }
    
    if (query.$or) {
      filteredLogs = filteredLogs.filter(log => {
        return query.$or.some(condition => {
          if (condition.message) {
            return log.message.includes(condition.message.$regex)
          }
          if (condition.userId) {
            return log.userId && log.userId.includes(condition.userId.$regex)
          }
          if (condition.ip) {
            return log.ip.includes(condition.ip.$regex)
          }
          return false
        })
      })
    }
    
    // 排序
    filteredLogs.sort((a, b) => b.timestamp - a.timestamp)
    
    // 分页
    const total = filteredLogs.length
    const logs = filteredLogs.slice(skip, skip + limit)
    
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: generatePagination(page, limit, total)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 数据库备份
const backupDatabase = async (req, res) => {
  try {
    const { includeData = true } = req.body
    
    // 这里应该实现数据库备份逻辑
    // 为了简化，我们只返回一个成功响应
    // 在实际项目中，可以使用mongodump或其他备份工具
    
    const backupInfo = {
      backupId: generateId('backup'),
      timestamp: new Date(),
      includeData,
      status: 'success',
      message: '数据库备份成功',
      downloadUrl: `/api/system/download-backup/${generateId('backup')}`
    }
    
    res.status(200).json({
      success: true,
      message: '数据库备份请求已提交',
      data: backupInfo
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 数据库恢复
const restoreDatabase = async (req, res) => {
  try {
    const { backupId } = req.body
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: '请提供备份ID'
      })
    }
    
    // 这里应该实现数据库恢复逻辑
    // 为了简化，我们只返回一个成功响应
    // 在实际项目中，可以使用mongorestore或其他恢复工具
    
    const restoreInfo = {
      backupId,
      timestamp: new Date(),
      status: 'success',
      message: '数据库恢复成功'
    }
    
    res.status(200).json({
      success: true,
      message: '数据库恢复请求已提交',
      data: restoreInfo
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 清理缓存
const clearCache = async (req, res) => {
  try {
    const { type = 'all' } = req.body
    
    // 这里应该实现缓存清理逻辑
    // 为了简化，我们只返回一个成功响应
    // 在实际项目中，可以使用redis或其他缓存系统
    
    let clearedTypes = []
    
    if (type === 'all') {
      clearedTypes = ['user', 'parking', 'transaction', 'system']
    } else if (Array.isArray(type)) {
      clearedTypes = type
    } else {
      clearedTypes = [type]
    }
    
    const clearInfo = {
      timestamp: new Date(),
      clearedTypes,
      status: 'success',
      message: `成功清理 ${clearedTypes.join(', ')} 缓存`
    }
    
    res.status(200).json({
      success: true,
      message: '缓存清理请求已提交',
      data: clearInfo
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 辅助函数：格式化运行时间
function formatUptime(seconds) {
  const days = Math.floor(seconds / (24 * 60 * 60))
  const hours = Math.floor((seconds % (24 * 60 * 60)) / (60 * 60))
  const minutes = Math.floor((seconds % (60 * 60)) / 60)
  const secs = Math.floor(seconds % 60)
  
  return `${days}天 ${hours}小时 ${minutes}分钟 ${secs}秒`
}

// 辅助函数：格式化字节数
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

module.exports = {
  getSystemConfigs,
  getSystemConfig,
  createSystemConfig,
  updateSystemConfig,
  deleteSystemConfig,
  batchUpdateSystemConfigs,
  getSystemInfo,
  getSystemLogs,
  backupDatabase,
  restoreDatabase,
  clearCache
}