const express = require('express')
const router = express.Router()
const {
  getRecommendedParkingSpaces,
  getParkingSpaceStats,
  getParkingLotMap
} = require('../controllers/recommendationController')

// 获取推荐车位
router.get('/parking-spaces', getRecommendedParkingSpaces)

// 获取车位统计
router.get('/parking-spaces/stats', getParkingSpaceStats)

// 获取停车场地图
router.get('/parking-lots/:parkingLotId/map', getParkingLotMap)

module.exports = router