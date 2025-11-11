const express = require('express')
const ParkingSpace = require('../models/ParkingSpace')
const dataModelMappingService = require('../services/dataModelMappingService')
const router = express.Router()

// 获取所有停车位状态（微信小程序API）
router.get('/', async (req, res) => {
  try {
    // 查询所有停车位
    const spaces = await ParkingSpace.find({})
      .populate('lotId', 'name')
      .sort({ floorId: 1, spaceId: 1 })
    
    // 使用数据模型映射服务转换为微信小程序格式（确保状态为中文）
    const formattedSpaces = spaces.map(space => {
      const mappedSpace = dataModelMappingService.mapParkingSpaceToMiniprogram(space);
      // 补充额外字段
      mappedSpace.floorId = space.floorId;
      mappedSpace.area = space.area;
      mappedSpace.type = space.type;
      mappedSpace.lotName = space.lotId ? space.lotId.name : '未知停车场';
      return mappedSpace;
    })
    
    res.status(200).json({
      success: true,
      data: formattedSpaces
    })
  } catch (error) {
    console.error('获取停车位信息失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新停车位状态（微信小程序API）
router.post('/update', async (req, res) => {
  try {
    const { spaceId, status } = req.body
    
    if (!spaceId || !status) {
      return res.status(400).json({
        success: false,
        message: '请提供停车位ID和状态'
      })
    }
    
    // 查找并更新停车位
    const space = await ParkingSpace.findOne({ spaceId })
    
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    // 将微信小程序的中文状态转换为System后台的英文状态
    const systemStatus = dataModelMappingService.mapStatusToSystem(status);
    space.status = systemStatus
    space.lastUpdated = new Date()
    await space.save()
    
    res.status(200).json({
      success: true,
      message: '停车位状态更新成功',
      data: space
    })
  } catch (error) {
    console.error('更新停车位状态失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

module.exports = router