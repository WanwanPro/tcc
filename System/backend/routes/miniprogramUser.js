const express = require('express')
const Admin = require('../models/Admin')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const router = express.Router()

// 用户登录（微信小程序API）
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      })
    }
    
    // 查找管理员
    const admin = await Admin.findOne({ username })
    
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password)
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }
    
    // 生成JWT令牌
    const token = jwt.sign(
      { id: admin._id, username: admin.username },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )
    
    res.status(200).json({
      success: true,
      data: {
        token,
        user: {
          id: admin._id,
          username: admin.username,
          email: admin.email,
          role: admin.role
        }
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取用户信息（微信小程序API）
router.get('/info/:userId', async (req, res) => {
  try {
    const { userId } = req.params
    
    // 查找管理员
    const admin = await Admin.findById(userId).select('-password')
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: admin
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

module.exports = router