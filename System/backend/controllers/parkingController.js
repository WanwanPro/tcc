const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const { generatePagination } = require('../utils/helpers')
const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService')
const dataModelMappingService = require('../services/dataModelMappingService')

// 获取所有停车场
const getParkingLots = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true'
    }
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { address: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const parkingLots = await ParkingLot.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await ParkingLot.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        parkingLots,
        pagination: generatePagination(page, limit, total)
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

// 获取单个停车场
const getParkingLot = async (req, res) => {
  try {
    const parkingLot = await ParkingLot.findById(req.params.id)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: parkingLot
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建停车场
const createParkingLot = async (req, res) => {
  try {
    const { 
      name, address, totalSpaces, floors, operatingHours, 
      pricingRules, contactInfo, description 
    } = req.body
    
    // 验证输入
    if (!name || !address || !totalSpaces) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 创建新停车场
    const parkingLot = new ParkingLot({
      name,
      address,
      totalSpaces,
      floors: floors || [],
      operatingHours: operatingHours || {
        monday: { open: '00:00', close: '23:59' },
        tuesday: { open: '00:00', close: '23:59' },
        wednesday: { open: '00:00', close: '23:59' },
        thursday: { open: '00:00', close: '23:59' },
        friday: { open: '00:00', close: '23:59' },
        saturday: { open: '00:00', close: '23:59' },
        sunday: { open: '00:00', close: '23:59' }
      },
      pricingRules: pricingRules || [],
      contactInfo: contactInfo || {},
      description: description || ''
    })
    
    await parkingLot.save()
    
    res.status(201).json({
      success: true,
      message: '停车场创建成功',
      data: parkingLot
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 更新停车场
const updateParkingLot = async (req, res) => {
  try {
    const { 
      name, address, totalSpaces, floors, operatingHours, 
      pricingRules, contactInfo, description, isActive 
    } = req.body
    
    // 查找停车场
    const parkingLot = await ParkingLot.findById(req.params.id)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 更新字段
    if (name) parkingLot.name = name
    if (address) parkingLot.address = address
    if (totalSpaces) parkingLot.totalSpaces = totalSpaces
    if (floors) parkingLot.floors = floors
    if (operatingHours) parkingLot.operatingHours = operatingHours
    if (pricingRules) parkingLot.pricingRules = pricingRules
    if (contactInfo) parkingLot.contactInfo = contactInfo
    if (description) parkingLot.description = description
    if (isActive !== undefined) parkingLot.isActive = isActive
    
    await parkingLot.save()
    
    res.status(200).json({
      success: true,
      message: '停车场更新成功',
      data: parkingLot
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 删除停车场
const deleteParkingLot = async (req, res) => {
  try {
    // 查找停车场
    const parkingLot = await ParkingLot.findById(req.params.id)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 检查是否有关联的停车位
    const spaceCount = await ParkingSpace.countDocuments({ lotId: req.params.id })
    
    if (spaceCount > 0) {
      return res.status(400).json({
        success: false,
        message: '该停车场下还有停车位，请先删除所有停车位'
      })
    }
    
    await ParkingLot.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '停车场删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取停车场统计数据
const getParkingLotStats = async (req, res) => {
  try {
    const { id } = req.params
    
    // 获取停车场信息
    const parkingLot = await ParkingLot.findById(id)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 获取停车位统计
    const totalSpaces = await ParkingSpace.countDocuments({ lotId: id })
    const occupiedSpaces = await ParkingSpace.countDocuments({ 
      lotId: id, 
      status: 'occupied' 
    })
    const availableSpaces = totalSpaces - occupiedSpaces
    const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0
    
    // 获取各楼层统计
    const floorStats = await ParkingSpace.aggregate([
      { $match: { lotId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$floorId',
          totalSpaces: { $sum: 1 },
          occupiedSpaces: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedSpaces', '$totalSpaces'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 获取各区域统计
    const areaStats = await ParkingSpace.aggregate([
      { $match: { lotId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$area',
          totalSpaces: { $sum: 1 },
          occupiedSpaces: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedSpaces', '$totalSpaces'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 获取各类型停车位统计
    const typeStats = await ParkingSpace.aggregate([
      { $match: { lotId: mongoose.Types.ObjectId(id) } },
      {
        $group: {
          _id: '$type',
          totalSpaces: { $sum: 1 },
          occupiedSpaces: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedSpaces', '$totalSpaces'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    res.status(200).json({
      success: true,
      data: {
        parkingLot: {
          id: parkingLot._id,
          name: parkingLot.name,
          address: parkingLot.address
        },
        overview: {
          totalSpaces,
          occupiedSpaces,
          availableSpaces,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        },
        floorStats,
        areaStats,
        typeStats
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

// 获取所有停车位
const getParkingSpaces = async (req, res) => {
  try {
    console.log('[getParkingSpaces] 收到请求:', {
      query: req.query,
      user: req.user ? req.user.username : '未认证'
    })
    
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.floorId) {
      query.floorId = req.query.floorId
    }
    
    if (req.query.area) {
      query.area = req.query.area
    }
    
    if (req.query.type) {
      query.type = req.query.type
    }
    
    if (req.query.status) {
      query.status = req.query.status
    }
    
    if (req.query.search) {
      query.$or = [
        { spaceId: { $regex: req.query.search, $options: 'i' } },
        { area: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    console.log('[getParkingSpaces] 查询条件:', JSON.stringify(query))
    
    // 先检查数据库总数
    const dbTotal = await ParkingSpace.countDocuments({})
    console.log('[getParkingSpaces] 数据库总车位数:', dbTotal)
    
    // 先测试不populate是否能查到数据
    const parkingSpacesRaw = await ParkingSpace.find(query)
      .sort({ floorId: 1, spaceId: 1 })
      .skip(skip)
      .limit(limit)
    
    console.log('[getParkingSpaces] 未populate时查到的数据:', parkingSpacesRaw.length)
    
    // 然后再populate
    const parkingSpaces = await ParkingSpace.find(query)
      .populate({
        path: 'lotId',
        select: 'name address',
        match: {} // 即使停车场不存在也返回车位数据
      })
      .sort({ floorId: 1, spaceId: 1 })
      .skip(skip)
      .limit(limit)
    
    const total = await ParkingSpace.countDocuments(query)
    
    console.log('[getParkingSpaces] 查询结果:', {
      queryTotal: total,
      dbTotal: dbTotal,
      returnedCount: parkingSpaces.length,
      firstSpace: parkingSpaces[0] ? {
        spaceId: parkingSpaces[0].spaceId,
        lotId: parkingSpaces[0].lotId,
        lotIdType: typeof parkingSpaces[0].lotId,
        area: parkingSpaces[0].area,
        status: parkingSpaces[0].status
      } : null
    })
    
    res.status(200).json({
      success: true,
      data: {
        spaces: parkingSpaces,
        pagination: generatePagination(page, limit, total)
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

// 获取单个停车位
const getParkingSpace = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id)
      .populate('lotId', 'name address')
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: parkingSpace
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建停车位
const createParkingSpace = async (req, res) => {
  try {
    const { 
      spaceId, lotId, floorId, area, type, status, 
      position, dimensions, features 
    } = req.body
    
    // 验证输入
    if (!spaceId || !lotId || !floorId) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查停车场是否存在
    const parkingLot = await ParkingLot.findById(lotId)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 检查停车位ID是否已存在
    const existingSpace = await ParkingSpace.findOne({ spaceId, lotId })
    
    if (existingSpace) {
      return res.status(400).json({
        success: false,
        message: '该停车场下已存在此停车位ID'
      })
    }
    
    // 创建新停车位
    const parkingSpace = new ParkingSpace({
      spaceId,
      lotId,
      floorId,
      area: area || '',
      type: type || 'standard',
      status: status || 'available',
      position: position || { x: 0, y: 0 },
      dimensions: dimensions || { width: 2.5, height: 5 },
      features: features || []
    })
    
    await parkingSpace.save()
    
    // 返回停车位信息
    const populatedSpace = await ParkingSpace.findById(parkingSpace._id)
      .populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: '停车位创建成功',
      data: populatedSpace
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 批量创建停车位
const createParkingSpaces = async (req, res) => {
  try {
    const { lotId, floorId, spaces } = req.body
    
    // 验证输入
    if (!lotId || !floorId || !spaces || !Array.isArray(spaces)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的停车场ID、楼层ID和停车位数组'
      })
    }
    
    // 检查停车场是否存在
    const parkingLot = await ParkingLot.findById(lotId)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 检查停车位ID是否已存在
    const existingSpaceIds = await ParkingSpace.find({ 
      lotId, 
      floorId,
      spaceId: { $in: spaces.map(s => s.spaceId) }
    }).select('spaceId')
    
    const existingIds = existingSpaceIds.map(s => s.spaceId)
    
    if (existingIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `以下停车位ID已存在: ${existingIds.join(', ')}`
      })
    }
    
    // 创建停车位
    const parkingSpaces = spaces.map(space => ({
      ...space,
      lotId,
      floorId,
      type: space.type || 'standard',
      status: space.status || 'available',
      dimensions: space.dimensions || { width: 2.5, height: 5 },
      features: space.features || []
    }))
    
    const createdSpaces = await ParkingSpace.insertMany(parkingSpaces)
    
    // 返回停车位信息
    const populatedSpaces = await ParkingSpace.find({
      _id: { $in: createdSpaces.map(s => s._id) }
    }).populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: `成功创建 ${createdSpaces.length} 个停车位`,
      data: populatedSpaces
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 更新停车位
const updateParkingSpace = async (req, res) => {
  try {
    const { 
      area, type, status, position, dimensions, features 
    } = req.body
    
    // 查找停车位
    const parkingSpace = await ParkingSpace.findById(req.params.id)
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    // 记录旧状态（用于同步）
    const oldStatus = parkingSpace.status
    const statusChanged = status && status !== oldStatus
    
    // 更新字段
    if (area) parkingSpace.area = area
    if (type) parkingSpace.type = type
    if (status) parkingSpace.status = status
    if (position) parkingSpace.position = position
    if (dimensions) parkingSpace.dimensions = dimensions
    if (features) parkingSpace.features = features
    
    await parkingSpace.save()
    
    // 如果状态发生变化，自动同步到TCC后端（微信小程序）
    if (statusChanged && parkingSpace.spaceId) {
      try {
        const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService')
        await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
          parkingSpace.spaceId,
          status
        )
        console.log(`[自动同步] 车位 ${parkingSpace.spaceId} 状态已同步到微信小程序后端: ${oldStatus} -> ${status}`)
      } catch (syncError) {
        console.error(`[自动同步] 同步失败:`, syncError.message)
        // 不影响主流程，只记录错误
      }
    }
    
    // 返回停车位信息
    const populatedSpace = await ParkingSpace.findById(parkingSpace._id)
      .populate('lotId', 'name')
    
    res.status(200).json({
      success: true,
      message: '停车位更新成功',
      data: populatedSpace
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 删除停车位
const deleteParkingSpace = async (req, res) => {
  try {
    // 查找停车位
    const parkingSpace = await ParkingSpace.findById(req.params.id)
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    await ParkingSpace.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '停车位删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 从微信小程序后端同步停车位数据
const syncParkingSpacesFromMiniprogram = async (req, res) => {
  try {
    const { parkingId } = req.params
    
    // 从微信小程序后端获取停车位数据
    const miniprogramSpaces = await miniprogramApiAdapter.getParkingSpacesFromMiniprogram(parkingId)
    
    // 获取System后台中该停车场的所有停车位
    const systemSpaces = await ParkingSpace.find({ lotId: parkingId })
    
    // 创建映射表，便于快速查找
    const systemSpacesMap = new Map()
    systemSpaces.forEach(space => {
      systemSpacesMap.set(space.spaceId, space)
    })
    
    // 统计信息
    let createdCount = 0
    let updatedCount = 0
    let skippedCount = 0
    const errors = []
    
    // 处理从微信小程序获取的每个停车位
    for (const miniprogramSpace of miniprogramSpaces) {
      try {
        // 使用数据模型映射服务将微信小程序数据转换为System格式
        const systemSpaceData = dataModelMappingService.mapParkingSpaceToSystem(miniprogramSpace)
        
        const systemSpace = systemSpacesMap.get(miniprogramSpace.spaceId)
        
        if (systemSpace) {
          // 更新现有停车位
          systemSpace.status = systemSpaceData.status
          systemSpace.position = systemSpaceData.position
          await systemSpace.save()
          updatedCount++
        } else {
          // 创建新停车位
          const newSpace = new ParkingSpace({
            spaceId: systemSpaceData.spaceId,
            lotId: parkingId,
            floorId: systemSpaceData.floorId || 1,
            area: systemSpaceData.area || '',
            type: systemSpaceData.type || 'standard',
            status: systemSpaceData.status,
            position: systemSpaceData.position || { x: 0, y: 0 },
            dimensions: systemSpaceData.dimensions || { width: 2.5, height: 5 },
            features: systemSpaceData.features || []
          })
          await newSpace.save()
          createdCount++
        }
      } catch (error) {
        console.error(`处理停车位 ${miniprogramSpace.spaceId} 时出错:`, error.message)
        errors.push({ spaceId: miniprogramSpace.spaceId, error: error.message })
      }
    }
    
    res.status(200).json({
      success: true,
      message: '数据同步完成',
      data: {
        total: miniprogramSpaces.length,
        created: createdCount,
        updated: updatedCount,
        skipped: skippedCount,
        errors: errors.length,
        errorDetails: errors
      }
    })
  } catch (error) {
    console.error('从微信小程序后端同步停车位数据失败:', error.message)
    res.status(500).json({
      success: false,
      message: '数据同步失败',
      error: error.message
    })
  }
}

// 同步停车位状态到微信小程序后端
const syncParkingSpacesToMiniprogram = async (req, res) => {
  try {
    const { parkingId } = req.params
    
    // 获取System后台中该停车场的所有停车位
    const systemSpaces = await ParkingSpace.find({ lotId: parkingId })
    
    // 使用数据模型映射服务将System数据转换为微信小程序格式
    const miniprogramSpaces = systemSpaces.map(space => 
      dataModelMappingService.mapParkingSpaceToMiniprogram(space)
    )
    
    // 同步到微信小程序后端
    const syncResult = await miniprogramApiAdapter.syncParkingSpacesToMiniprogram(miniprogramSpaces)
    
    res.status(200).json({
      success: true,
      message: '数据同步完成',
      data: syncResult
    })
  } catch (error) {
    console.error('同步停车位状态到微信小程序后端失败:', error.message)
    res.status(500).json({
      success: false,
      message: '数据同步失败',
      error: error.message
    })
  }
}

// 更新停车位状态并同步到微信小程序后端
const updateParkingSpaceStatusWithSync = async (req, res) => {
  try {
    const { status } = req.body
    
    // 查找停车位
    const parkingSpace = await ParkingSpace.findById(req.params.id)
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    // 更新System后台中的停车位状态
    parkingSpace.status = status
    await parkingSpace.save()
    
    // 同步到微信小程序后端
    try {
      // 使用数据模型映射服务转换状态
      const miniprogramStatus = dataModelMappingService.mapStatusToMiniprogram(status)
      await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
        parkingSpace.spaceId, 
        miniprogramStatus
      )
    } catch (syncError) {
      console.error('同步到微信小程序后端失败:', syncError.message)
      // 即使同步失败，也返回成功，但记录错误
      return res.status(200).json({
        success: true,
        message: '停车位状态更新成功，但同步到微信小程序后端失败',
        data: parkingSpace,
        syncError: syncError.message
      })
    }
    
    // 返回停车位信息
    const populatedSpace = await ParkingSpace.findById(parkingSpace._id)
      .populate('lotId', 'name')
    
    res.status(200).json({
      success: true,
      message: '停车位状态更新成功并已同步到微信小程序后端',
      data: populatedSpace
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
  getParkingLots,
  getParkingLot,
  createParkingLot,
  updateParkingLot,
  deleteParkingLot,
  getParkingLotStats,
  getParkingSpaces,
  getParkingSpace,
  createParkingSpace,
  createParkingSpaces,
  updateParkingSpace,
  deleteParkingSpace,
  syncParkingSpacesFromMiniprogram,
  syncParkingSpacesToMiniprogram,
  updateParkingSpaceStatusWithSync
}