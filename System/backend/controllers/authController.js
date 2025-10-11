const Admin = require('../models/Admin')
const generateToken = require('../utils/generateToken')
const { comparePassword } = require('../utils/password')

// 登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body

    // 验证输入
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '请提供用户名和密码'
      })
    }

    // 查找用户
    const admin = await Admin.findOne({ username })

    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 验证密码
    const isPasswordValid = await comparePassword(password, admin.password)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      })
    }

    // 生成JWT令牌
    const token = generateToken(admin._id)

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        admin: {
          id: admin._id,
          username: admin.username,
          name: admin.name,
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
}

// 获取当前用户信息
const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.user.id).select('-password')

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
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 登出
const logout = async (req, res) => {
  try {
    // 在实际应用中，可以将令牌加入黑名单
    res.status(200).json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 修改密码
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    // 验证输入
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供当前密码和新密码'
      })
    }

    // 查找用户
    const admin = await Admin.findById(req.user.id)

    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 验证当前密码
    const isPasswordValid = await comparePassword(currentPassword, admin.password)

    if (!isPasswordValid) {
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
}

module.exports = {
  login,
  getMe,
  logout,
  changePassword
}