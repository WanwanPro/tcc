const express = require('express');
const router = express.Router();
const pathController = require('../controllers/pathController');

// 计算最优路径
router.post('/plan', pathController.calculateOptimalPath);

// 实时路径调整
router.post('/adjust', pathController.adjustPath);

module.exports = router;