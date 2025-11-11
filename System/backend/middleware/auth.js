const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')

// 基础认证中间件
const auth = async (req, res, next) => {
  // 从请求头获取token
  const authHeader = req.header('Authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      message: '访问被拒绝，未提供令牌'
    })
  }
  
  const token = authHeader.substring(7) // 移除 'Bearer ' 前缀
  
  try {
    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret')
    
    // 获取用户详细信息
    const admin = await Admin.findById(decoded.id).select('-password')
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户不存在，请重新登录'
      })
    }
    
    // 检查用户状态
    if (admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用，请联系管理员'
      })
    }
    
    // 将用户信息添加到请求对象
    req.user = admin
    
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '令牌已过期，请重新登录'
      })
    } else {
      return res.status(401).json({
        success: false,
        message: '令牌无效'
      })
    }
  }
}

// 检查用户角色
const checkRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证用户'
      })
    }

    // 如果roles是字符串，转换为数组
    const allowedRoles = Array.isArray(roles) ? roles : [roles]
    
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: '权限不足，无法执行此操作'
      })
    }

    next()
  }
}

// 检查用户权限
const checkPermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证用户'
      })
    }

    // 超级管理员拥有所有权限
    if (req.user.role === 'super_admin') {
      return next()
    }

    // 检查用户是否有特定权限
    const userPermissions = req.user.permissions || []
    
    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        success: false,
        message: `权限不足，需要 ${permission} 权限`
      })
    }

    next()
  }
}

// 检查资源访问权限
const checkResourceAccess = (resourceType, action = 'view') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: '未认证用户'
      })
    }

    // 超级管理员拥有所有资源的访问权限
    if (req.user.role === 'super_admin') {
      return next()
    }

    // 根据资源类型和操作检查权限
    let hasPermission = false
    const permission = `${resourceType}:${action}`
    
    // 检查用户是否有特定权限
    const userPermissions = req.user.permissions || []
    hasPermission = userPermissions.includes(permission)
    
    // 如果没有特定权限，检查是否有通用权限
    if (!hasPermission && action === 'view') {
      hasPermission = userPermissions.includes(`${resourceType}:manage`)
    }
    
    if (!hasPermission) {
      return res.status(403).json({
        success: false,
        message: `权限不足，无法${action} ${resourceType} 资源`
      })
    }

    next()
  }
}

// 记录操作日志
const logOperation = (operation, resourceType) => {
  return (req, res, next) => {
    // 保存原始的res.json方法
    const originalJson = res.json
    
    // 重写res.json方法以捕获响应
    res.json = function(data) {
      // 如果操作成功，记录日志
      if (data.success && req.user) {
        const logData = {
          userId: req.user._id,
          username: req.user.username,
          operation,
          resourceType,
          resourceIds: [],
          details: {
            method: req.method,
            url: req.originalUrl,
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            requestBody: req.body,
            params: req.params,
            query: req.query
          },
          timestamp: new Date()
        }

        // 尝试提取资源ID
        if (req.params.id) {
          logData.resourceIds.push(req.params.id)
        }
        
        // 如果是批量操作，从请求体中提取ID
        if (req.body.spaceIds && Array.isArray(req.body.spaceIds)) {
          logData.resourceIds = [...logData.resourceIds, ...req.body.spaceIds]
        }

        // 异步保存日志，不阻塞响应
        saveOperationLog(logData).catch(err => {
          console.error('保存操作日志失败:', err)
        })
      }
      
      // 调用原始的json方法
      return originalJson.call(this, data)
    }
    
    next()
  }
}

// 保存操作日志的辅助函数
const saveOperationLog = async (logData) => {
  try {
    // 动态导入操作日志模型
    const OperationLog = require('../models/OperationLog')
    const log = new OperationLog(logData)
    await log.save()
  } catch (error) {
    console.error('保存操作日志失败:', error)
  }
}

module.exports = {
  auth,
  checkRole,
  checkPermission,
  checkResourceAccess,
  logOperation
}