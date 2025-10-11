const express = require('express');
const router = express.Router();
const imageController = require('../controllers/imageController');
const multer = require('multer');

// 配置文件上传
const upload = multer({ storage: multer.memoryStorage() });

// 上传并处理停车场图像
router.post('/process', upload.single('image'), imageController.processImage);

// 获取最新的车位状态
router.get('/status', imageController.getParkingStatus);

module.exports = router;