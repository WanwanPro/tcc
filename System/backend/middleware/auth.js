const jwt = require('jsonwebtoken')

const auth = (req, res, next) => {
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
    
    // 将用户信息添加到请求对象
    req.user = decoded
    
    next()
  } catch (error) {
    res.status(401).json({
      success: false,
      message: '令牌无效'
    })
  }
}

module.exports = auth