const express = require('express')
const router = express.Router()
const { miniprogramAuth } = require('../middleware/miniprogramAuth')
const {
  wxLogin,
  guestLogin,
  getCurrentUser,
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
} = require('../controllers/userProfileController')

// 用户登录相关
router.post('/login', wxLogin)
router.post('/guest', guestLogin)
router.get('/me', miniprogramAuth, getCurrentUser)
router.get('/:userId', getUserInfo)
router.put('/:userId', updateUserInfo)

// 用户车辆管理
router.get('/:userId/vehicles', getUserVehicles)
router.post('/:userId/vehicles', addUserVehicle)
router.put('/:userId/vehicles/:vehicleId', updateUserVehicle)
router.delete('/:userId/vehicles/:vehicleId', deleteUserVehicle)

// 用户收藏停车场
router.get('/:userId/favorites', getUserFavoriteParkingLots)
router.post('/:userId/favorites', addFavoriteParkingLot)
router.delete('/:userId/favorites/:favoriteId', deleteFavoriteParkingLot)

// 用户反馈
router.post('/:userId/feedback', submitUserFeedback)

module.exports = router
