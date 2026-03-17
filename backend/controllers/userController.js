const User = require('../models/User');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'default_dev_secret_change_in_production';

const buildUserInfo = (user, extra = {}) => ({
  id: user.userId,
  userId: user.userId,
  openid: user.openid,
  nickName: extra.nickName || user.nickname || '微信用户',
  nickname: extra.nickName || user.nickname || '微信用户',
  avatarUrl: extra.avatarUrl || user.avatar || '',
  avatar: extra.avatarUrl || user.avatar || '',
  isGuest: !!extra.isGuest
});

const signToken = (user) => jwt.sign(
  { userId: user.userId, openid: user.openid },
  JWT_SECRET,
  { expiresIn: '24h' }
);

const resolveUserByToken = async (authHeader = '') => {
  if (!authHeader.startsWith('Bearer ')) {
    throw new Error('未提供有效令牌');
  }

  const token = authHeader.substring(7);
  const decoded = jwt.verify(token, JWT_SECRET);
  const user = await User.findOne({ userId: decoded.userId });

  if (!user) {
    throw new Error('用户不存在');
  }

  return { user, token };
};

// 用户登录
exports.login = async (req, res) => {
  try {
    const { code, userInfo, devOpenId } = req.body;
    let isNewUser = false;
    
    // 开发环境优先使用 devOpenId 保持用户稳定，避免每次登录创建新账号
    const openid = devOpenId || code || `openid_${Date.now()}`;
    
    // 查找或创建用户
    let user = await User.findOne({ openid });
    
    if (!user) {
      isNewUser = true;
      user = new User({
        userId: `user_${Date.now()}`,
        openid,
        nickname: '新用户',
        avatar: ''
      });
      await user.save();
    }

    if (userInfo) {
      user.nickname = userInfo.nickName || user.nickname;
      user.avatar = userInfo.avatarUrl || user.avatar;
      await user.save();
    }

    const token = signToken(user);
    const normalizedUserInfo = buildUserInfo(user, {
      nickName: userInfo?.nickName,
      avatarUrl: userInfo?.avatarUrl,
      isGuest: false
    });
    
    res.json({
      success: true,
      message: '登录成功',
      data: {
        userInfo: normalizedUserInfo,
        token,
        isNewUser
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

// 游客登录
exports.guestLogin = async (req, res) => {
  try {
    const guestOpenId = `guest_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const user = new User({
      userId: `guest_${Date.now()}`,
      openid: guestOpenId,
      nickname: '游客用户',
      avatar: ''
    });

    await user.save();

    res.json({
      success: true,
      message: '游客登录成功',
      data: {
        userInfo: buildUserInfo(user, {
          nickName: '游客用户',
          avatarUrl: '',
          isGuest: true
        }),
        token: signToken(user),
        isNewUser: true
      }
    });
  } catch (error) {
    console.error('游客登录错误:', error);
    res.status(500).json({
      success: false,
      message: '游客登录失败',
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

// 获取当前登录用户信息
exports.getCurrentUser = async (req, res) => {
  try {
    const { user } = await resolveUserByToken(req.header('Authorization') || '');

    res.json({
      success: true,
      message: '获取用户信息成功',
      data: buildUserInfo(user, {
        isGuest: user.userId.startsWith('guest_')
      })
    });
  } catch (error) {
    console.error('获取当前用户信息错误:', error);
    res.status(401).json({
      success: false,
      message: error.message || '获取用户信息失败',
      error: error.message
    });
  }
};
