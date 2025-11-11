const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const Transaction = require('../models/Transaction');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpace = require('../models/ParkingSpace');
const User = require('../models/User');
const mongoose = require('mongoose');

// 所有路由都需要认证
router.use(auth);

// 获取停车记录列表
router.get('/records', [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('status').optional().isIn(['all', 'pending', 'paid', 'refunded', 'failed']).withMessage('状态值无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query = { type: 'parking' };
    
    if (req.query.status && req.query.status !== 'all') {
      query.paymentStatus = req.query.status;
    }
    
    if (req.query.parkingLotId) {
      query.lotId = req.query.parkingLotId;
    }
    
    if (req.query.vehicleNumber) {
      query.vehicleNumber = { $regex: req.query.vehicleNumber, $options: 'i' };
    }
    
    if (req.query.userId) {
      query.userId = req.query.userId;
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.entryTime = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    // 执行查询
    const records = await Transaction.find(query)
      .populate('lotId', 'name address')
      .populate('spaceId', 'spaceId area')
      .populate('userId', 'username phone')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Transaction.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        records,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    console.error('获取停车记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 获取单个停车记录
router.get('/records/:id', [
  param('id').isMongoId().withMessage('记录ID格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const record = await Transaction.findById(req.params.id)
      .populate('lotId', 'name address operatingHours')
      .populate('spaceId', 'spaceId area type')
      .populate('userId', 'username phone email')
      .populate('pricingRule', 'name rates')
      .populate('processedBy', 'username');
    
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '停车记录不存在'
      });
    }
    
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('获取停车记录详情失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 创建停车记录
router.post('/records', [
  body('vehicleNumber').notEmpty().withMessage('车牌号不能为空'),
  body('lotId').isMongoId().withMessage('停车场ID格式不正确'),
  body('spaceId').optional().isMongoId().withMessage('停车位ID格式不正确'),
  body('userId').notEmpty().withMessage('用户ID不能为空'),
  body('paymentMethod').isIn(['cash', 'card', 'mobile', 'prepaid']).withMessage('支付方式无效'),
  body('amount').isNumeric().withMessage('金额必须是数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const {
      vehicleNumber,
      lotId,
      spaceId,
      userId,
      entryTime,
      exitTime,
      paymentMethod,
      amount,
      pricingRule,
      notes
    } = req.body;
    
    // 验证停车场是否存在
    const parkingLot = await ParkingLot.findById(lotId);
    if (!parkingLot) {
      return res.status(400).json({
        success: false,
        message: '停车场不存在'
      });
    }
    
    // 验证停车位是否存在（如果提供）
    if (spaceId) {
      const parkingSpace = await ParkingSpace.findById(spaceId);
      if (!parkingSpace) {
        return res.status(400).json({
          success: false,
          message: '停车位不存在'
        });
      }
    }
    
    // 生成交易ID
    const transactionId = 'PRK' + Date.now();
    
    // 计算停车时长（分钟）
    let duration = 0;
    if (entryTime && exitTime) {
      duration = Math.floor((new Date(exitTime) - new Date(entryTime)) / (1000 * 60));
    }
    
    // 创建停车记录
    const record = new Transaction({
      transactionId,
      type: 'parking',
      userId,
      vehicleNumber,
      lotId,
      spaceId,
      entryTime: entryTime || new Date(),
      exitTime,
      duration,
      amount,
      paymentMethod,
      pricingRule,
      notes,
      totalAmount: amount
    });
    
    await record.save();
    
    // 如果有停车位，更新停车位状态
    if (spaceId) {
      await ParkingSpace.findByIdAndUpdate(spaceId, {
        status: exitTime ? 'available' : 'occupied'
      });
    }
    
    res.status(201).json({
      success: true,
      message: '停车记录创建成功',
      data: record
    });
  } catch (error) {
    console.error('创建停车记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 更新停车记录
router.put('/records/:id', [
  param('id').isMongoId().withMessage('记录ID格式不正确'),
  body('paymentStatus').optional().isIn(['pending', 'paid', 'refunded', 'failed']).withMessage('支付状态无效'),
  body('paymentMethod').optional().isIn(['cash', 'card', 'mobile', 'prepaid']).withMessage('支付方式无效'),
  body('amount').optional().isNumeric().withMessage('金额必须是数字')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const record = await Transaction.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '停车记录不存在'
      });
    }
    
    const {
      exitTime,
      paymentStatus,
      paymentMethod,
      amount,
      notes,
      processedBy
    } = req.body;
    
    // 更新字段
    if (exitTime) {
      record.exitTime = exitTime;
      // 重新计算停车时长
      if (record.entryTime) {
        record.duration = Math.floor((new Date(exitTime) - new Date(record.entryTime)) / (1000 * 60));
      }
    }
    
    if (paymentStatus) {
      record.paymentStatus = paymentStatus;
      if (paymentStatus === 'paid' && !record.paymentTime) {
        record.paymentTime = new Date();
      }
    }
    
    if (paymentMethod) record.paymentMethod = paymentMethod;
    if (amount) record.amount = amount;
    if (notes) record.notes = notes;
    if (processedBy) record.processedBy = processedBy;
    
    await record.save();
    
    // 如果有停车位且状态变为已支付，更新停车位状态
    if (record.spaceId && paymentStatus === 'paid' && exitTime) {
      const updatedSpace = await ParkingSpace.findByIdAndUpdate(record.spaceId, {
        status: 'available'
      }, { new: true });
      
      // 自动同步到TCC后端（微信小程序）
      if (updatedSpace && updatedSpace.spaceId) {
        try {
          const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService');
          await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
            updatedSpace.spaceId,
            'available'
          );
          console.log(`[自动同步-记录] 车位 ${updatedSpace.spaceId} 状态已同步到微信小程序后端: available`);
        } catch (syncError) {
          console.error(`[自动同步-记录] 同步失败:`, syncError.message);
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: '停车记录更新成功',
      data: record
    });
  } catch (error) {
    console.error('更新停车记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 删除停车记录
router.delete('/records/:id', [
  param('id').isMongoId().withMessage('记录ID格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const record = await Transaction.findById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: '停车记录不存在'
      });
    }
    
    // 如果有停车位且记录是占用状态，释放停车位
    if (record.spaceId && record.paymentStatus !== 'paid' && !record.exitTime) {
      await ParkingSpace.findByIdAndUpdate(record.spaceId, {
        status: 'available'
      });
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.status(200).json({
      success: true,
      message: '停车记录删除成功'
    });
  } catch (error) {
    console.error('删除停车记录失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

// 获取停车统计数据
router.get('/statistics', [
  query('period').optional().isIn(['today', 'week', 'month', 'year']).withMessage('统计周期无效')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '参数验证失败',
        errors: errors.array()
      });
    }

    const { period = 'month', parkingLotId } = req.query;
    
    // 构建时间范围
    let startDate, endDate;
    const now = new Date();
    
    switch (period) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
        break;
      case 'week':
        startDate = new Date(now);
        startDate.setDate(now.getDate() - now.getDay());
        startDate.setHours(0, 0, 0, 0);
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 7);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31);
        endDate.setHours(23, 59, 59, 999);
        break;
    }
    
    // 构建查询条件
    const matchCondition = {
      type: 'parking',
      entryTime: { $gte: startDate, $lte: endDate }
    };
    
    if (parkingLotId) {
      matchCondition.lotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    // 总收入
    const totalRevenueResult = await Transaction.aggregate([
      { $match: { ...matchCondition, paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // 总车流量
    const totalTrafficResult = await Transaction.aggregate([
      { $match: matchCondition },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]);
    
    // 平均停车时长（分钟）
    const avgDurationResult = await Transaction.aggregate([
      { $match: { ...matchCondition, exitTime: { $exists: true } } },
      { $group: { _id: null, avg: { $avg: '$duration' } } }
    ]);
    
    // 车位使用率
    let occupancyRate = 0;
    if (parkingLotId) {
      const totalSpaces = await ParkingSpace.countDocuments({ lotId: parkingLotId });
      const occupiedSpaces = await ParkingSpace.countDocuments({ lotId: parkingLotId, status: 'occupied' });
      occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;
    } else {
      const totalSpaces = await ParkingSpace.countDocuments();
      const occupiedSpaces = await ParkingSpace.countDocuments({ status: 'occupied' });
      occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;
    }
    
    // 收入趋势数据
    let groupFormat;
    switch (period) {
      case 'today':
        groupFormat = { $hour: '$entryTime' };
        break;
      case 'week':
        groupFormat = { $dayOfWeek: '$entryTime' };
        break;
      case 'month':
        groupFormat = { $dayOfMonth: '$entryTime' };
        break;
      case 'year':
        groupFormat = { $month: '$entryTime' };
        break;
    }
    
    const revenueTrend = await Transaction.aggregate([
      { $match: { ...matchCondition, paymentStatus: 'paid' } },
      { $group: { _id: groupFormat, revenue: { $sum: '$amount' } } },
      { $sort: { _id: 1 } }
    ]);
    
    // 车流量趋势数据
    const trafficTrend = await Transaction.aggregate([
      { $match: matchCondition },
      { $group: { _id: groupFormat, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    
    // 车位使用情况
    const spaceUsage = await ParkingSpace.aggregate([
      ...(parkingLotId ? [{ $match: { lotId: mongoose.Types.ObjectId(parkingLotId) } }] : []),
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // 高峰时段分析
    const peakHours = await Transaction.aggregate([
      { $match: matchCondition },
      { $group: { _id: { $hour: '$entryTime' }, count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
    
    res.status(200).json({
      success: true,
      data: {
        totalRevenue: totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0,
        totalTraffic: totalTrafficResult.length > 0 ? totalTrafficResult[0].total : 0,
        avgDuration: avgDurationResult.length > 0 ? Math.round(avgDurationResult[0].avg) : 0,
        occupancyRate,
        revenueTrend,
        trafficTrend,
        spaceUsage,
        peakHours
      }
    });
  } catch (error) {
    console.error('获取停车统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    });
  }
});

module.exports = router;