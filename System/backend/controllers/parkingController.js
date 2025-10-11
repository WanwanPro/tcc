const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const { generatePagination } = require('../utils/helpers')

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
    const parkingSpaces = await ParkingSpace.find(query)
      .populate('lotId', 'name address')
      .sort({ floorId: 1, spaceId: 1 })
      .skip(skip)
      .limit(limit)
    
    const total = await ParkingSpace.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        parkingSpaces,
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
    
    // 更新字段
    if (area) parkingSpace.area = area
    if (type) parkingSpace.type = type
    if (status) parkingSpace.status = status
    if (position) parkingSpace.position = position
    if (dimensions) parkingSpace.dimensions = dimensions
    if (features) parkingSpace.features = features
    
    await parkingSpace.save()
    
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
  deleteParkingSpace
}