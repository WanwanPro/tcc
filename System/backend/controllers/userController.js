const Admin = require('../models/Admin')
const { hashPassword } = require('../utils/password')

// 获取所有管理员
const getAdmins = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.role) {
      query.role = req.query.role
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true'
    }
    
    if (req.query.search) {
      query.$or = [
        { username: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const admins = await Admin.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await Admin.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        admins,
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
}

// 获取单个管理员
const getAdmin = async (req, res) => {
  try {
    const admin = await Admin.findById(req.params.id).select('-password')
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: admin
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建管理员
const createAdmin = async (req, res) => {
  try {
    const { username, password, name, email, role, permissions } = req.body
    
    // 验证输入
    if (!username || !password || !name || !role) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查用户名是否已存在
    const existingAdmin = await Admin.findOne({ username })
    
    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: '用户名已存在'
      })
    }
    
    // 检查邮箱是否已存在
    if (email) {
      const existingEmail = await Admin.findOne({ email })
      
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        })
      }
    }
    
    // 创建新管理员
    const admin = new Admin({
      username,
      password: await hashPassword(password),
      name,
      email,
      role,
      permissions: permissions || []
    })
    
    await admin.save()
    
    // 返回管理员信息（不包含密码）
    const adminData = await Admin.findById(admin._id).select('-password')
    
    res.status(201).json({
      success: true,
      message: '管理员创建成功',
      data: adminData
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 更新管理员
const updateAdmin = async (req, res) => {
  try {
    const { username, name, email, role, permissions, isActive } = req.body
    
    // 查找管理员
    const admin = await Admin.findById(req.params.id)
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      })
    }
    
    // 检查用户名是否已被其他管理员使用
    if (username && username !== admin.username) {
      const existingAdmin = await Admin.findOne({ username })
      
      if (existingAdmin) {
        return res.status(400).json({
          success: false,
          message: '用户名已存在'
        })
      }
      
      admin.username = username
    }
    
    // 检查邮箱是否已被其他管理员使用
    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({ email })
      
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        })
      }
      
      admin.email = email
    }
    
    // 更新其他字段
    if (name) admin.name = name
    if (role) admin.role = role
    if (permissions) admin.permissions = permissions
    if (isActive !== undefined) admin.isActive = isActive
    
    await admin.save()
    
    // 返回管理员信息（不包含密码）
    const adminData = await Admin.findById(admin._id).select('-password')
    
    res.status(200).json({
      success: true,
      message: '管理员更新成功',
      data: adminData
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 重置管理员密码
const resetPassword = async (req, res) => {
  try {
    const { newPassword } = req.body
    
    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供新密码'
      })
    }
    
    // 查找管理员
    const admin = await Admin.findById(req.params.id)
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      })
    }
    
    // 更新密码
    admin.password = await hashPassword(newPassword)
    await admin.save()
    
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
}

// 删除管理员
const deleteAdmin = async (req, res) => {
  try {
    // 查找管理员
    const admin = await Admin.findById(req.params.id)
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      })
    }
    
    // 防止删除自己
    if (admin._id.toString() === req.user.id) {
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
}

// 更新个人资料
const updateProfile = async (req, res) => {
  try {
    const { name, email } = req.body
    
    // 查找管理员
    const admin = await Admin.findById(req.user.id)
    
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      })
    }
    
    // 检查邮箱是否已被其他管理员使用
    if (email && email !== admin.email) {
      const existingEmail = await Admin.findOne({ email })
      
      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: '邮箱已存在'
        })
      }
      
      admin.email = email
    }
    
    // 更新其他字段
    if (name) admin.name = name
    
    await admin.save()
    
    // 返回管理员信息（不包含密码）
    const adminData = await Admin.findById(admin._id).select('-password')
    
    res.status(200).json({
      success: true,
      message: '个人资料更新成功',
      data: adminData
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

module.exports = {
  getAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  resetPassword,
  deleteAdmin,
  updateProfile
}