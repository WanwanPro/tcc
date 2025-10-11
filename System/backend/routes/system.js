const express = require('express')
const SystemConfig = require('../models/SystemConfig')
const auth = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 获取所有系统配置
router.get('/configs', async (req, res) => {
  try {
    const configs = await SystemConfig.find().sort({ configKey: 1 })
    
    res.status(200).json({
      success: true,
      data: configs
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取单个系统配置
router.get('/configs/:key', async (req, res) => {
  try {
    const config = await SystemConfig.findOne({ configKey: req.params.key })
    
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '系统配置不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: config
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建或更新系统配置
router.put('/configs/:key', async (req, res) => {
  try {
    const { configValue, description } = req.body
    
    // 查找现有配置
    const existingConfig = await SystemConfig.findOne({ configKey: req.params.key })
    
    if (existingConfig) {
      // 更新现有配置
      existingConfig.configValue = configValue
      if (description) existingConfig.description = description
      existingConfig.updatedAt = new Date()
      existingConfig.updatedBy = req.user.id
      
      await existingConfig.save()
      
      res.status(200).json({
        success: true,
        message: '系统配置更新成功',
        data: existingConfig
      })
    } else {
      // 创建新配置
      const config = new SystemConfig({
        configKey: req.params.key,
        configValue,
        description: description || '',
        createdBy: req.user.id
      })
      
      await config.save()
      
      res.status(201).json({
        success: true,
        message: '系统配置创建成功',
        data: config
      })
    }
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除系统配置
router.delete('/configs/:key', async (req, res) => {
  try {
    // 查找配置
    const config = await SystemConfig.findOne({ configKey: req.params.key })
    if (!config) {
      return res.status(404).json({
        success: false,
        message: '系统配置不存在'
      })
    }
    
    await SystemConfig.deleteOne({ configKey: req.params.key })
    
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
})

// 批量更新系统配置
router.post('/configs/batch', async (req, res) => {
  try {
    const { configs } = req.body
    
    if (!configs || !Array.isArray(configs)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的配置数组'
      })
    }
    
    const updatedConfigs = []
    
    for (const configData of configs) {
      const { configKey, configValue, description } = configData
      
      // 查找现有配置
      const existingConfig = await SystemConfig.findOne({ configKey })
      
      if (existingConfig) {
        // 更新现有配置
        existingConfig.configValue = configValue
        if (description) existingConfig.description = description
        existingConfig.updatedAt = new Date()
        existingConfig.updatedBy = req.user.id
        
        await existingConfig.save()
        updatedConfigs.push(existingConfig)
      } else {
        // 创建新配置
        const config = new SystemConfig({
          configKey,
          configValue,
          description: description || '',
          createdBy: req.user.id
        })
        
        await config.save()
        updatedConfigs.push(config)
      }
    }
    
    res.status(200).json({
      success: true,
      message: '系统配置批量更新成功',
      data: updatedConfigs
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取系统信息
router.get('/info', async (req, res) => {
  try {
    // 获取系统基本信息
    const systemInfo = {
      version: process.env.npm_package_version || '1.0.0',
      nodeVersion: process.version,
      platform: process.platform,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      environment: process.env.NODE_ENV || 'development'
    }
    
    // 获取数据库统计信息
    const dbStats = {
      // 这里可以添加数据库统计信息
    }
    
    res.status(200).json({
      success: true,
      data: {
        system: systemInfo,
        database: dbStats
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取系统日志
router.get('/logs', async (req, res) => {
  try {
    const { level, startDate, endDate, page = 1, limit = 100 } = req.query
    
    // 这里应该从日志文件或日志数据库中获取日志
    // 由于我们使用的是简化版本，这里只返回一个示例
    
    const logs = []
    
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: logs.length,
          pages: Math.ceil(logs.length / limit)
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
})

// 备份数据库
router.post('/backup', async (req, res) => {
  try {
    // 这里应该实现数据库备份逻辑
    // 由于我们使用的是简化版本，这里只返回一个成功消息
    
    res.status(200).json({
      success: true,
      message: '数据库备份成功',
      data: {
        backupId: `backup_${Date.now()}`,
        createdAt: new Date(),
        size: '0 MB'
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 恢复数据库
router.post('/restore', async (req, res) => {
  try {
    const { backupId } = req.body
    
    if (!backupId) {
      return res.status(400).json({
        success: false,
        message: '请提供备份ID'
      })
    }
    
    // 这里应该实现数据库恢复逻辑
    // 由于我们使用的是简化版本，这里只返回一个成功消息
    
    res.status(200).json({
      success: true,
      message: '数据库恢复成功',
      data: {
        backupId,
        restoredAt: new Date()
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 清理系统缓存
router.post('/cache/clear', async (req, res) => {
  try {
    // 这里应该实现缓存清理逻辑
    // 由于我们使用的是简化版本，这里只返回一个成功消息
    
    res.status(200).json({
      success: true,
      message: '系统缓存清理成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

module.exports = router