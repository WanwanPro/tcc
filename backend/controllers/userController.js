const User = require('../models/User');
const jwt = require('jsonwebtoken');

// 用户登录
exports.login = async (req, res) => {
  try {
    const { code } = req.body;
    
    // 这里应该调用微信接口验证code获取openid
    // 为了简化，我们生成一个模拟的openid
    const openid = `openid_${Date.now()}`;
    
    // 查找或创建用户
    let user = await User.findOne({ openid });
    
    if (!user) {
      user = new User({
        userId: `user_${Date.now()}`,
        openid,
        nickname: '新用户',
        avatar: ''
      });
      await user.save();
    }
    
    // 检查JWT_SECRET是否存在
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      console.warn('警告: JWT_SECRET未设置，使用默认密钥（仅用于开发环境）');
    }
    
    // 生成JWT token
    const token = jwt.sign(
      { userId: user.userId, openid: user.openid },
      jwtSecret || 'default_dev_secret_change_in_production',
      { expiresIn: '24h' }
    );
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        user: {
          userId: user.userId,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar
        },
        token
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      message: '登录失败',
      error: error.message
    });
  }
};

// 获取用户信息
exports.getUserInfo = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await User.findOne({ userId });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }
    
    res.json({
      success: true,
      message: '获取用户信息成功',
      data: user
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({
      success: false,
      message: '获取用户信息失败',
      error: error.message
    });
  }
};