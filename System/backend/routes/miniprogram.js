const express = require('express')
const ParkingSpace = require('../models/ParkingSpace')
const router = express.Router()

// 获取所有停车位状态（微信小程序API）
router.get('/', async (req, res) => {
  try {
    // 查询所有停车位
    const spaces = await ParkingSpace.find({})
      .populate('lotId', 'name')
      .sort({ floorId: 1, spaceId: 1 })
    
    // 转换数据格式以适应前端需求
    const formattedSpaces = spaces.map(space => ({
      spaceId: space.spaceId,
      floorId: space.floorId,
      area: space.area,
      status: space.status, // 空闲、占用、维修中
      type: space.type,
      position: space.position,
      lotName: space.lotId ? space.lotId.name : '未知停车场'
    }))
    
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
    
    space.status = status
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