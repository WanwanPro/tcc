const express = require('express')
const bcrypt = require('bcryptjs')
const Admin = require('../models/Admin')
const auth = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 获取管理员列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.role) {
      query.role = req.query.role
    }
    
    if (req.query.status) {
      query.status = req.query.status
    }
    
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const users = await Admin.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await Admin.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
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

// 获取单个管理员
router.get('/:id', async (req, res) => {
  try {
    const user = await Admin.findById(req.params.id).select('-password')
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: user
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建管理员
router.post('/', async (req, res) => {
  try {
    const { username, password, name, email, role, permissions } = req.body
    
    // 验证输入
    if (!username || !password || !name || !email) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查用户名是否已存在
    const existingUsername = await Admin.findOne({ username })
    if (existingUsername) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }
    
    // 检查邮箱是否已存在
    const existingEmail = await Admin.findOne({ email })
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: '邮箱已存在'
      })
    }
    
    // 创建新管理员
    const user = new Admin({
      username,
      password,
      name,
      email,
      role: role || 'operator',
      permissions: permissions || []
    })
    
    await user.save()
    
    res.status(201).json({
      success: true,
      message: '管理员创建成功',
      data: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status
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

// 更新管理员
router.put('/:id', async (req, res) => {
  try {
    const { name, email, role, permissions, status } = req.body
    
    // 查找用户
    const user = await Admin.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    // 如果更新邮箱，检查是否已存在
    if (email && email !== user.email) {
      const existingEmail = await Admin.findOne({ email })
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        })
      }
    }
    
    // 更新字段
    if (name) user.name = name
    if (email) user.email = email
    if (role) user.role = role
    if (permissions) user.permissions = permissions
    if (status) user.status = status
    
    await user.save()
    
    res.status(200).json({
      success: true,
      message: '管理员更新成功',
      data: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: user.permissions,
        status: user.status
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

// 重置密码
router.put('/:id/reset-password', async (req, res) => {
  try {
    const { newPassword } = req.body
    
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: '新密码长度至少为6个字符'
      })
    }
    
    // 查找用户
    const user = await Admin.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    // 更新密码
    user.password = newPassword
    await user.save()
    
    res.status(200).json({
      success: true,
      message: '密码重置成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除管理员
router.delete('/:id', async (req, res) => {
  try {
    // 查找用户
    const user = await Admin.findById(req.params.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    // 防止删除自己
    if (req.user.id === req.params.id) {
      return res.status(400).json({
        success: false,
        message: '不能删除自己的账户'
      })
    }
    
    await Admin.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '管理员删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新个人资料
router.put('/profile', async (req, res) => {
  try {
    const { name, email, avatar } = req.body
    
    // 查找用户
    const user = await Admin.findById(req.user.id)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }
    
    // 如果更新邮箱，检查是否已存在
    if (email && email !== user.email) {
      const existingEmail = await Admin.findOne({ email })
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        })
      }
    }
    
    // 更新字段
    if (name) user.name = name
    if (email) user.email = email
    if (avatar) user.avatar = avatar
    
    await user.save()
    
    res.status(200).json({
      success: true,
      message: '个人资料更新成功',
      data: {
        id: user._id,
        username: user.username,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role
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

module.exports = router