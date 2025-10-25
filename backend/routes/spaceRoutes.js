const express = require('express');
const router = express.Router();
const spaceController = require('../controllers/spaceController');

// 获取车位状态
router.get('/', spaceController.getAllSpaces);

// 更新车位状态
router.post('/update', spaceController.updateSpaceStatus);

// 同步所有车位数据到System后台
router.post('/sync', spaceController.syncAllSpacesToSystem);

module.exports = router;