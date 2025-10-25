const express = require('express')
const mongoose = require('mongoose')
const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const auth = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 获取停车场列表
router.get('/lots', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.status) {
      query.status = req.query.status
    }
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { address: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const lots = await ParkingLot.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await ParkingLot.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        lots,
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

// 获取单个停车场
router.get('/lots/:id', async (req, res) => {
  try {
    const lot = await ParkingLot.findById(req.params.id)
      .populate('floors.spaces')
      .populate('floors.nodes')
      .populate('pricingRules')
    
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: lot
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建停车场
router.post('/lots', async (req, res) => {
  try {
    const { name, address, description, totalSpaces, operatingHours, facilities, contact } = req.body
    
    // 验证输入
    if (!name || !address || !totalSpaces) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 创建新停车场
    const lot = new ParkingLot({
      name,
      address,
      description,
      totalSpaces,
      operatingHours,
      facilities,
      contact
    })
    
    await lot.save()
    
    res.status(201).json({
      success: true,
      message: '停车场创建成功',
      data: lot
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新停车场
router.put('/lots/:id', async (req, res) => {
  try {
    const { name, address, description, totalSpaces, operatingHours, facilities, contact, status } = req.body
    
    // 查找停车场
    const lot = await ParkingLot.findById(req.params.id)
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 更新字段
    if (name) lot.name = name
    if (address) lot.address = address
    if (description) lot.description = description
    if (totalSpaces) lot.totalSpaces = totalSpaces
    if (operatingHours) lot.operatingHours = operatingHours
    if (facilities) lot.facilities = facilities
    if (contact) lot.contact = contact
    if (status) lot.status = status
    
    await lot.save()
    
    res.status(200).json({
      success: true,
      message: '停车场更新成功',
      data: lot
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除停车场
router.delete('/lots/:id', async (req, res) => {
  try {
    // 查找停车场
    const lot = await ParkingLot.findById(req.params.id)
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
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
})

// 获取停车位列表
router.get('/spaces', async (req, res) => {
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
    
    if (req.query.status) {
      query.status = req.query.status
    }
    
    if (req.query.type) {
      query.type = req.query.type
    }
    
    if (req.query.area) {
      query.area = req.query.area
    }
    
    if (req.query.search) {
      query.$or = [
        { spaceId: { $regex: req.query.search, $options: 'i' } },
        { area: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const spaces = await ParkingSpace.find(query)
      .populate('lotId', 'name')
      .populate('currentNode', 'nodeId type')
      .sort({ floorId: 1, spaceId: 1 })
      .skip(skip)
      .limit(limit)
    
    const total = await ParkingSpace.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        spaces,
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

// 获取单个停车位
router.get('/spaces/:id', async (req, res) => {
  try {
    const space = await ParkingSpace.findById(req.params.id)
      .populate('lotId', 'name address')
      .populate('currentNode', 'nodeId type position')
    
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: space
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建停车位
router.post('/spaces', async (req, res) => {
  try {
    const { spaceId, floorId, lotId, area, type, position, currentNode } = req.body
    
    // 验证输入
    if (!spaceId || !floorId || !lotId || !area || !position) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查停车位ID是否已存在
    const existingSpace = await ParkingSpace.findOne({ spaceId })
    if (existingSpace) {
      return res.status(400).json({
        success: false,
        message: '停车位ID已存在'
      })
    }
    
    // 创建新停车位
    const space = new ParkingSpace({
      spaceId,
      floorId,
      lotId,
      area,
      type: type || 'standard',
      position,
      currentNode
    })
    
    await space.save()
    
    res.status(201).json({
      success: true,
      message: '停车位创建成功',
      data: space
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 批量创建停车位
router.post('/spaces/batch', async (req, res) => {
  try {
    const { lotId, floorId, area, startNumber, endNumber, prefix, type, positionTemplate } = req.body
    
    // 验证输入
    if (!lotId || !floorId || !area || !startNumber || !endNumber) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    const spaces = []
    
    for (let i = startNumber; i <= endNumber; i++) {
      const spaceId = prefix ? `${prefix}${i}` : `${area}${i}`
      
      // 检查停车位ID是否已存在
      const existingSpace = await ParkingSpace.findOne({ spaceId })
      if (existingSpace) {
        continue // 跳过已存在的停车位
      }
      
      // 计算位置
      let position = { x: 0, y: 0 }
      if (positionTemplate) {
        const row = Math.floor((i - startNumber) / positionTemplate.columns)
        const col = (i - startNumber) % positionTemplate.columns
        position = {
          x: positionTemplate.startX + col * positionTemplate.spacingX,
          y: positionTemplate.startY + row * positionTemplate.spacingY
        }
      }
      
      spaces.push({
        spaceId,
        floorId,
        lotId,
        area,
        type: type || 'standard',
        position
      })
    }
    
    if (spaces.length === 0) {
      return res.status(400).json({
        success: false,
        message: '没有创建新的停车位，可能所有停车位已存在'
      })
    }
    
    const createdSpaces = await ParkingSpace.insertMany(spaces)
    
    res.status(201).json({
      success: true,
      message: `成功创建 ${createdSpaces.length} 个停车位`,
      data: createdSpaces
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新停车位
router.put('/spaces/:id', async (req, res) => {
  try {
    const { area, type, position, currentNode, status } = req.body
    
    // 查找停车位
    const space = await ParkingSpace.findById(req.params.id)
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    // 更新字段
    if (area) space.area = area
    if (type) space.type = type
    if (position) space.position = position
    if (currentNode) space.currentNode = currentNode
    if (status) space.status = status
    
    await space.save()
    
    res.status(200).json({
      success: true,
      message: '停车位更新成功',
      data: space
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除停车位
router.delete('/spaces/:id', async (req, res) => {
  try {
    // 查找停车位
    const space = await ParkingSpace.findById(req.params.id)
    if (!space) {
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
})

// 获取停车场统计数据
router.get('/stats/:lotId', async (req, res) => {
  try {
    const lotId = req.params.lotId
    
    // 获取停车场信息
    const lot = await ParkingLot.findById(lotId)
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 获取停车位统计
    const totalSpaces = await ParkingSpace.countDocuments({ lotId })
    const availableSpaces = await ParkingSpace.countDocuments({ lotId, status: 'available' })
    const occupiedSpaces = await ParkingSpace.countDocuments({ lotId, status: 'occupied' })
    const reservedSpaces = await ParkingSpace.countDocuments({ lotId, status: 'reserved' })
    const maintenanceSpaces = await ParkingSpace.countDocuments({ lotId, status: 'maintenance' })
    
    // 按区域统计
    const areaStats = await ParkingSpace.aggregate([
      { $match: { lotId: new mongoose.Types.ObjectId(lotId) } },
      { $group: { _id: '$area', total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } } } }
    ])
    
    // 按类型统计
    const typeStats = await ParkingSpace.aggregate([
      { $match: { lotId: new mongoose.Types.ObjectId(lotId) } },
      { $group: { _id: '$type', total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } } } }
    ])
    
    // 按楼层统计
    const floorStats = await ParkingSpace.aggregate([
      { $match: { lotId: new mongoose.Types.ObjectId(lotId) } },
      { $group: { _id: '$floorId', total: { $sum: 1 }, available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } } } }
    ])
    
    res.status(200).json({
      success: true,
      data: {
        lot: {
          id: lot._id,
          name: lot.name,
          address: lot.address
        },
        totalSpaces,
        availableSpaces,
        occupiedSpaces,
        reservedSpaces,
        maintenanceSpaces,
        occupancyRate: totalSpaces > 0 ? (occupiedSpaces / totalSpaces * 100).toFixed(2) : 0,
        areaStats,
        typeStats,
        floorStats
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