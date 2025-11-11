const { MiniProgramUser, Vehicle, ParkingRecord, FavoriteParkingLot, UserFeedback } = require('../models')

/**
 * 微信小程序用户登录/注册
 */
const wxLogin = async (req, res) => {
  try {
    const { code, userInfo } = req.body

    if (!code) {
      return res.status(400).json({
        success: false,
        message: '缺少登录凭证code'
      })
    }

    // 这里应该调用微信API获取openid和session_key
    // 简化处理，假设已经获取到openid
    // 实际项目中需要使用微信小程序登录API
    const mockOpenId = `mock_openid_${Date.now()}`
    
    // 查找或创建用户
    let user = await MiniProgramUser.findOne({ openId: mockOpenId })
    
    if (!user) {
      // 创建新用户
      user = new MiniProgramUser({
        openId: mockOpenId,
        nickName: userInfo?.nickName || '微信用户',
        avatarUrl: userInfo?.avatarUrl || '',
        gender: userInfo?.gender || 0,
        isGuest: false,
        lastLoginTime: new Date(),
        loginCount: 1
      })
      
      await user.save()
    } else {
      // 更新用户信息和登录统计
      if (userInfo) {
        user.nickName = userInfo.nickName || user.nickName
        user.avatarUrl = userInfo.avatarUrl || user.avatarUrl
        user.gender = userInfo.gender !== undefined ? userInfo.gender : user.gender
      }
      
      user.lastLoginTime = new Date()
      user.loginCount += 1
      await user.save()
    }

    // 生成用户token（简化处理）
    const token = `token_${user._id}_${Date.now()}`

    res.status(200).json({
      success: true,
      message: '登录成功',
      data: {
        token,
        userInfo: {
          id: user._id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          gender: user.gender,
          phone: user.phone,
          totalParkingCount: user.totalParkingCount,
          statistics: user.statistics
        }
      }
    })
  } catch (error) {
    console.error('微信登录失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 游客模式登录
 */
const guestLogin = async (req, res) => {
  try {
    // 创建临时游客用户
    const guestUser = new MiniProgramUser({
      openId: `guest_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      nickName: '游客用户',
      isGuest: true,
      lastLoginTime: new Date(),
      loginCount: 1
    })
    
    await guestUser.save()
    
    // 生成临时token
    const token = `guest_token_${guestUser._id}_${Date.now()}`

    res.status(200).json({
      success: true,
      message: '游客模式登录成功',
      data: {
        token,
        userInfo: {
          id: guestUser._id,
          nickName: guestUser.nickName,
          isGuest: true
        }
      }
    })
  } catch (error) {
    console.error('游客登录失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 获取用户信息
 */
const getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params

    const user = await MiniProgramUser.findById(userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    res.status(200).json({
      success: true,
      message: '获取用户信息成功',
      data: {
        id: user._id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        phone: user.phone,
        isGuest: user.isGuest,
        totalParkingCount: user.totalParkingCount,
        statistics: user.statistics,
        createdAt: user.createdAt
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 更新用户信息
 */
const updateUserInfo = async (req, res) => {
  try {
    const { userId } = req.params
    const { nickName, avatarUrl, gender, phone } = req.body

    const user = await MiniProgramUser.findById(userId)
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 更新用户信息
    if (nickName !== undefined) user.nickName = nickName
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl
    if (gender !== undefined) user.gender = gender
    if (phone !== undefined) user.phone = phone

    await user.save()

    res.status(200).json({
      success: true,
      message: '更新用户信息成功',
      data: {
        id: user._id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        gender: user.gender,
        phone: user.phone
      }
    })
  } catch (error) {
    console.error('更新用户信息失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 获取用户车辆列表
 */
const getUserVehicles = async (req, res) => {
  try {
    const { userId } = req.params

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 获取用户车辆
    const vehicles = await Vehicle.find({ 
      userId, 
      isActive: true 
    }).sort({ isDefault: -1, createdAt: -1 })

    res.status(200).json({
      success: true,
      message: '获取用户车辆成功',
      data: {
        vehicles,
        count: vehicles.length
      }
    })
  } catch (error) {
    console.error('获取用户车辆失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 添加用户车辆
 */
const addUserVehicle = async (req, res) => {
  try {
    const { userId } = req.params
    const { licensePlate, vehicleType, brand, model, color, isDefault } = req.body

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 检查车牌号是否已存在
    const existingVehicle = await Vehicle.findOne({ licensePlate })
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: '该车牌号已存在'
      })
    }

    // 如果设置为默认车辆，先将其他车辆设为非默认
    if (isDefault) {
      await Vehicle.updateMany(
        { userId },
        { isDefault: false }
      )
    }

    // 创建新车辆
    const newVehicle = new Vehicle({
      userId,
      licensePlate,
      vehicleType,
      brand,
      model,
      color,
      isDefault: isDefault || false
    })

    await newVehicle.save()

    res.status(201).json({
      success: true,
      message: '添加车辆成功',
      data: newVehicle
    })
  } catch (error) {
    console.error('添加车辆失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 更新用户车辆
 */
const updateUserVehicle = async (req, res) => {
  try {
    const { userId, vehicleId } = req.params
    const { licensePlate, vehicleType, brand, model, color, isDefault } = req.body

    // 验证车辆是否存在且属于该用户
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId })
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: '车辆不存在或不属于该用户'
      })
    }

    // 如果设置为默认车辆，先将其他车辆设为非默认
    if (isDefault && !vehicle.isDefault) {
      await Vehicle.updateMany(
        { userId, _id: { $ne: vehicleId } },
        { isDefault: false }
      )
    }

    // 更新车辆信息
    if (licensePlate !== undefined) vehicle.licensePlate = licensePlate
    if (vehicleType !== undefined) vehicle.vehicleType = vehicleType
    if (brand !== undefined) vehicle.brand = brand
    if (model !== undefined) vehicle.model = model
    if (color !== undefined) vehicle.color = color
    if (isDefault !== undefined) vehicle.isDefault = isDefault

    await vehicle.save()

    res.status(200).json({
      success: true,
      message: '更新车辆成功',
      data: vehicle
    })
  } catch (error) {
    console.error('更新车辆失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 删除用户车辆
 */
const deleteUserVehicle = async (req, res) => {
  try {
    const { userId, vehicleId } = req.params

    // 验证车辆是否存在且属于该用户
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId })
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: '车辆不存在或不属于该用户'
      })
    }

    // 检查是否有正在进行的停车记录
    const activeParkingRecord = await ParkingRecord.findOne({
      vehicleId,
      status: 'parking'
    })

    if (activeParkingRecord) {
      return res.status(400).json({
        success: false,
        message: '该车辆有正在进行的停车记录，无法删除'
      })
    }

    // 软删除，设置为不活跃
    vehicle.isActive = false
    await vehicle.save()

    res.status(200).json({
      success: true,
      message: '删除车辆成功'
    })
  } catch (error) {
    console.error('删除车辆失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 获取用户收藏的停车场
 */
const getUserFavoriteParkingLots = async (req, res) => {
  try {
    const { userId } = req.params

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 获取用户收藏的停车场
    const favorites = await FavoriteParkingLot.find({ userId })
      .populate({
        path: 'parkingLotId',
        select: 'name address totalSpaces availableSpaces operatingHours features coordinates'
      })
      .sort({ addedAt: -1 })

    res.status(200).json({
      success: true,
      message: '获取收藏停车场成功',
      data: {
        favorites: favorites.map(fav => ({
          id: fav._id,
          parkingLot: fav.parkingLotId,
          addedAt: fav.addedAt
        })),
        count: favorites.length
      }
    })
  } catch (error) {
    console.error('获取收藏停车场失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 添加收藏停车场
 */
const addFavoriteParkingLot = async (req, res) => {
  try {
    const { userId } = req.params
    const { parkingLotId } = req.body

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 检查是否已收藏
    const existingFavorite = await FavoriteParkingLot.findOne({ userId, parkingLotId })
    if (existingFavorite) {
      return res.status(400).json({
        success: false,
        message: '已收藏该停车场'
      })
    }

    // 添加收藏
    const newFavorite = new FavoriteParkingLot({
      userId,
      parkingLotId
    })

    await newFavorite.save()

    res.status(201).json({
      success: true,
      message: '添加收藏成功',
      data: newFavorite
    })
  } catch (error) {
    console.error('添加收藏停车场失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 删除收藏停车场
 */
const deleteFavoriteParkingLot = async (req, res) => {
  try {
    const { userId, favoriteId } = req.params

    // 验证收藏是否存在且属于该用户
    const favorite = await FavoriteParkingLot.findOne({ _id: favoriteId, userId })
    if (!favorite) {
      return res.status(404).json({
        success: false,
        message: '收藏记录不存在'
      })
    }

    // 删除收藏
    await FavoriteParkingLot.deleteOne({ _id: favoriteId })

    res.status(200).json({
      success: true,
      message: '取消收藏成功'
    })
  } catch (error) {
    console.error('删除收藏停车场失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 提交用户反馈
 */
const submitUserFeedback = async (req, res) => {
  try {
    const { userId } = req.params
    const { type, content, images, contactInfo } = req.body

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 创建反馈
    const newFeedback = new UserFeedback({
      userId,
      type,
      content,
      images,
      contactInfo
    })

    await newFeedback.save()

    res.status(201).json({
      success: true,
      message: '提交反馈成功',
      data: newFeedback
    })
  } catch (error) {
    console.error('提交用户反馈失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

module.exports = {
  wxLogin,
  guestLogin,
  getUserInfo,
  updateUserInfo,
  getUserVehicles,
  addUserVehicle,
  updateUserVehicle,
  deleteUserVehicle,
  getUserFavoriteParkingLots,
  addFavoriteParkingLot,
  deleteFavoriteParkingLot,
  submitUserFeedback
}