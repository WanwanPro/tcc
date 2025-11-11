const express = require('express')
const router = express.Router()
const {
  calculateNavigationPath,
  getSavedNavigationPaths,
  deleteNavigationPath
} = require('../controllers/pathfindingController')

// 计算导航路径
router.post('/calculate', calculateNavigationPath)

// 获取已保存的导航路径
router.get('/saved/:userId', getSavedNavigationPaths)

// 删除导航路径
router.delete('/:pathId', deleteNavigationPath)

module.exports = router