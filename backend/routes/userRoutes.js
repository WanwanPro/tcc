const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// 用户登录
router.post('/login', userController.login);

// 游客登录
router.post('/guest', userController.guestLogin);

// 获取当前用户信息
router.get('/me', userController.getCurrentUser);

// 获取用户信息
router.get('/info/:userId', userController.getUserInfo);

module.exports = router;
