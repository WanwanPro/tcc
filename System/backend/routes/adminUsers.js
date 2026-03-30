const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

// 获取用户列表
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      keyword,
      status,
      userType,
      dateRange,
      sort = '+id'
    } = req.query;

    // 构建查询条件
    const query = {};

    // 关键词搜索
    if (keyword) {
      query.$or = [
        { name: { $regex: keyword, $options: 'i' } },
        { phone: { $regex: keyword, $options: 'i' } },
        { vehicleNumber: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 状态筛选
    if (status) {
      query.status = status;
    }

    // 用户类型筛选
    if (userType) {
      query.userType = userType;
    }

    // 注册日期范围筛选
    if (dateRange && Array.isArray(dateRange) && dateRange.length === 2) {
      query.createdAt = {
        $gte: new Date(dateRange[0]),
        $lte: new Date(dateRange[1])
      };
    }

    // 排序
    const sortOptions = {};
    const sortField = sort.substring(1);
    const sortOrder = sort.charAt(0) === '+' ? 1 : -1;
    sortOptions[sortField] = sortOrder;

    // 分页查询
    const skip = (page - 1) * limit;
    const users = await User.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));

    // 获取总数
    const total = await User.countDocuments(query);

    res.json({
      success: true,
      data: {
        items: users,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户列表失败',
      error: error.message
    });
  }
});

// 获取用户详情
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户详情失败',
      error: error.message
    });
  }
});

// 创建用户
router.post('/', auth, async (req, res) => {
  try {
    const { name, phone, password, vehicleNumber, userType = 'regular', status = 'active', avatar } = req.body;

    // 验证必填字段
    if (!name || !phone || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名、手机号和密码是必填项'
      });
    }

    // 检查手机号是否已存在
    const existingUser = await User.findOne({ phone });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: '该手机号已被注册'
      });
    }

    // 加密密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 创建新用户
    const newUser = new User({
      name,
      phone,
      password: hashedPassword,
      vehicleNumber,
      userType,
      status,
      avatar
    });

    await newUser.save();

    // 返回用户信息（不包含密码）
    const userResponse = newUser.toObject();
    delete userResponse.password;

    res.status(201).json({
      success: true,
      message: '用户创建成功',
      data: userResponse
    });
  } catch (error) {
    console.error('创建用户失败:', error);
    res.status(500).json({
      success: false,
      message: '创建用户失败',
      error: error.message
    });
  }
});

// 更新用户
router.put('/:id', auth, async (req, res) => {
  try {
    const { name, phone, vehicleNumber, userType, status, avatar } = req.body;

    // 查找用户
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 如果更新手机号，检查是否已被其他用户使用
    if (phone && phone !== user.phone) {
      const existingUser = await User.findOne({ phone, _id: { $ne: req.params.id } });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: '该手机号已被其他用户使用'
        });
      }
    }

    // 更新用户信息
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (vehicleNumber !== undefined) user.vehicleNumber = vehicleNumber;
    if (userType) user.userType = userType;
    if (status) user.status = status;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    // 返回用户信息（不包含密码）
    const userResponse = user.toObject();
    delete userResponse.password;

    res.json({
      success: true,
      message: '用户信息更新成功',
      data: userResponse
    });
  } catch (error) {
    console.error('更新用户失败:', error);
    res.status(500).json({
      success: false,
      message: '更新用户失败',
      error: error.message
    });
  }
});

// 删除用户
router.delete('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 检查用户是否有未完成的停车记录
    const activeParkingRecord = await Transaction.findOne({
      userId: req.params.id,
      type: 'parking',
      exitTime: null
    });

    if (activeParkingRecord) {
      return res.status(400).json({
        success: false,
        message: '该用户有未完成的停车记录，无法删除'
      });
    }

    await User.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: '用户删除成功'
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    res.status(500).json({
      success: false,
      message: '删除用户失败',
      error: error.message
    });
  }
});

// 获取用户统计数据
router.get('/:id/stats', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    // 获取用户总停车次数
    const totalParkingCount = await Transaction.countDocuments({ userId, type: 'parking' });

    // 获取用户总停车时长（分钟）
    const parkingRecords = await Transaction.find({
      userId,
      type: 'parking',
      exitTime: { $ne: null }
    });
    let totalParkingDuration = 0;
    let totalAmount = 0;

    parkingRecords.forEach(record => {
      const entryTime = new Date(record.entryTime);
      const exitTime = new Date(record.exitTime);
      const duration = Math.floor((exitTime - entryTime) / (1000 * 60)); // 分钟
      totalParkingDuration += duration;
      totalAmount += record.amount || 0;
    });

    // 计算平均停车时长
    const avgParkingDuration = totalParkingCount > 0 ? Math.floor(totalParkingDuration / totalParkingCount) : 0;

    res.json({
      success: true,
      data: {
        totalParkingCount,
        totalParkingDuration: Math.floor(totalParkingDuration / 60), // 转换为小时
        totalAmount,
        avgParkingDuration: Math.floor(avgParkingDuration / 60) // 转换为小时
      }
    });
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计数据失败',
      error: error.message
    });
  }
});

// 获取用户停车记录
router.get('/:id/parking-records', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const userId = req.params.id;

    // 分页查询
    const skip = (page - 1) * limit;
    const transactions = await Transaction.find({ 
      userId,
      type: 'parking'
    })
      .populate('lotId', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // 格式化返回数据
    const formattedRecords = transactions.map(record => {
      const entryTime = new Date(record.createdAt);
      const exitTime = record.updatedAt ? new Date(record.updatedAt) : null;
      let duration = '';

      if (exitTime) {
        const diffMinutes = Math.floor((exitTime - entryTime) / (1000 * 60));
        const hours = Math.floor(diffMinutes / 60);
        const minutes = diffMinutes % 60;
        duration = `${hours}小时${minutes}分钟`;
      }

      return {
        id: record._id,
        parkingLotName: record.lotId ? record.lotId.name : '未知停车场',
        spaceNumber: record.spaceNumber || '未知车位',
        entryTime: record.createdAt,
        exitTime: record.updatedAt,
        duration,
        amount: record.amount || 0
      };
    });

    // 获取总数
    const total = await Transaction.countDocuments({ 
      userId,
      type: 'parking'
    });

    res.json({
      success: true,
      data: {
        items: formattedRecords,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取用户停车记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户停车记录失败',
      error: error.message
    });
  }
});

// 获取用户统计数据（用于仪表盘）
router.get('/statistics', auth, async (req, res) => {
  try {
    // 总用户数
    const totalUsers = await User.countDocuments();

    // 活跃用户数
    const activeUsers = await User.countDocuments({ status: 'active' });

    // 禁用用户数
    const disabledUsers = await User.countDocuments({ status: 'disabled' });

    // 黑名单用户数
    const blacklistedUsers = await User.countDocuments({ status: 'blacklist' });

    // 按用户类型统计
    const regularUsers = await User.countDocuments({ userType: 'regular' });
    const vipUsers = await User.countDocuments({ userType: 'vip' });
    const monthlyUsers = await User.countDocuments({ userType: 'monthly' });

    // 最近30天注册用户数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        disabledUsers,
        blacklistedUsers,
        userTypes: {
          regular: regularUsers,
          vip: vipUsers,
          monthly: monthlyUsers
        },
        recentUsers
      }
    });
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计数据失败',
      error: error.message
    });
  }
});

// 批量更新用户状态
router.post('/batch-update-status', auth, async (req, res) => {
  try {
    const { userIds, status } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供用户ID列表'
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供状态'
      });
    }

    // 批量更新用户状态
    const result = await User.updateMany(
      { _id: { $in: userIds } },
      { status }
    );

    res.json({
      success: true,
      message: `成功更新${result.modifiedCount}个用户的状态`,
      data: {
        modifiedCount: result.modifiedCount
      }
    });
  } catch (error) {
    console.error('批量更新用户状态失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新用户状态失败',
      error: error.message
    });
  }
});

// 重置用户密码
router.post('/:id/reset-password', auth, async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        success: false,
        message: '请提供新密码'
      });
    }

    // 查找用户
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      });
    }

    // 加密新密码
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 更新密码
    user.password = hashedPassword;
    await user.save();

    res.json({
      success: true,
      message: '密码重置成功'
    });
  } catch (error) {
    console.error('重置用户密码失败:', error);
    res.status(500).json({
      success: false,
      message: '重置用户密码失败',
      error: error.message
    });
  }
});

// 发送用户通知
router.post('/send-notification', auth, async (req, res) => {
  try {
    const { userIds, title, content, type = 'system' } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供用户ID列表'
      });
    }

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '请提供通知标题和内容'
      });
    }

    // 这里应该实现通知发送逻辑
    // 例如：保存到通知表、发送推送通知、发送短信等

    res.json({
      success: true,
      message: '通知发送成功',
      data: {
        sentCount: userIds.length
      }
    });
  } catch (error) {
    console.error('发送用户通知失败:', error);
    res.status(500).json({
      success: false,
      message: '发送用户通知失败',
      error: error.message
    });
  }
});

module.exports = router;
