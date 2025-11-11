const express = require('express')
const router = express.Router()
const {
  markParkingLocation,
  endParking,
  findVehicleLocation,
  generateFindCarPath,
  getParkingHistory
} = require('../controllers/findCarController')

// 标记停车位置
router.post('/mark', markParkingLocation)

// 结束停车
router.post('/end', endParking)

// 查找车辆位置
router.get('/find/:userId', findVehicleLocation)

// 生成反向寻车路径
router.post('/find-path', generateFindCarPath)

// 获取停车历史记录
router.get('/history/:userId', getParkingHistory)

module.exports = router