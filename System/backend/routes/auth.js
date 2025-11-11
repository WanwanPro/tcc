const express = require('express')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const Admin = require('../models/Admin')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 登录路由
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body

    // 验证输入
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
    const isMatch = await admin.comparePassword(password)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 检查账户状态
    if (admin.status !== 'active') {
      return res.status(401).json({
        success: false,
        message: '账户已被禁用'
      })
    }

    // 更新最后登录时间
    admin.lastLogin = new Date()
    await admin.save()

    // 创建JWT
    const payload = {
      id: admin._id,
      username: admin.username,
      role: admin.role
    }

    const token = jwt.sign(
      payload,
      process.env.JWT_SECRET || 'your_jwt_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    )

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        user: {
          id: admin._id,
          username: admin.username,
          name: admin.name,
          email: admin.email,
          avatar: admin.avatar,
          role: admin.role,
          permissions: admin.permissions
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

// 获取当前用户信息
router.get('/info', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id)
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
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

// 获取当前用户信息 (兼容旧API)
router.get('/me', auth, async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id)
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.status(200).json({
      success: true,
      data: {
        id: admin._id,
        username: admin.username,
        name: admin.name,
        email: admin.email,
        avatar: admin.avatar,
        role: admin.role,
        permissions: admin.permissions,
        lastLogin: admin.lastLogin
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

// 登出路由
router.post('/logout', auth, (req, res) => {
  res.status(200).json({
    success: true,
    message: '登出成功'
  })
})

// 修改密码
router.put('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // 验证输入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码和新密码'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6个字符'
      })
    }

    // 查找管理员
    const admin = await Admin.findById(req.user.id)
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 验证当前密码
    const isMatch = await admin.comparePassword(currentPassword)
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '当前密码错误'
      })
    }

    // 更新密码
    admin.password = newPassword
    await admin.save()

    res.status(200).json({
      success: true,
      message: '密码修改成功'
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