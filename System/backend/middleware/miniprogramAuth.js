const jwt = require('jsonwebtoken')
const { MiniProgramUser } = require('../models')

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret'

const miniprogramAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: '未提供登录令牌'
      })
    }

    const token = authHeader.slice(7)
    const decoded = jwt.verify(token, JWT_SECRET)

    if (decoded.type !== 'miniprogram') {
      return res.status(401).json({
        success: false,
        message: '登录令牌类型无效'
      })
    }

    const user = await MiniProgramUser.findById(decoded.id)
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: '用户不存在或已失效'
      })
    }

    req.miniprogramUser = user
    next()
  } catch (error) {
    const message = error.name === 'TokenExpiredError' ? '登录已过期，请重新登录' : '登录令牌无效'
    return res.status(401).json({
      success: false,
      message
    })
  }
}

module.exports = {
  miniprogramAuth
}
