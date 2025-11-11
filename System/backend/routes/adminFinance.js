const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { body, param, query, validationResult } = require('express-validator');
const Finance = require('../models/Finance');
const Transaction = require('../models/Transaction');
const User = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpace = require('../models/ParkingSpace');
const mongoose = require('mongoose');

// 获取财务概览数据
router.get('/overview', auth, async (req, res) => {
  try {
    const { parkingLotId, startDate, endDate } = req.query;
    
    // 构建查询条件
    const matchCondition = { status: 'completed' };
    
    if (parkingLotId) {
      matchCondition.parkingLotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    if (startDate && endDate) {
      matchCondition.exitTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 获取总收入
    const totalRevenueResult = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // 获取今日收入
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const todayRevenueResult = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          status: 'completed',
          createdAt: {
            $gte: todayStart,
            $lte: todayEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // 获取本月收入
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date();
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);
    monthEnd.setHours(23, 59, 59, 999);
    
    const monthRevenueResult = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          status: 'completed',
          createdAt: {
            $gte: monthStart,
            $lte: monthEnd
          }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    // 获取总交易笔数
    const totalTransactionsResult = await Transaction.countDocuments({ 
      type: 'parking',
      status: 'completed' 
    });
    
    res.json({
      success: true,
      data: {
        totalRevenue: totalRevenueResult.length > 0 ? totalRevenueResult[0].total.toFixed(2) : '0.00',
        todayRevenue: todayRevenueResult.length > 0 ? todayRevenueResult[0].total.toFixed(2) : '0.00',
        monthRevenue: monthRevenueResult.length > 0 ? monthRevenueResult[0].total.toFixed(2) : '0.00',
        totalTransactions: totalTransactionsResult
      }
    });
  } catch (error) {
    console.error('获取财务概览失败:', error);
    res.status(500).json({
      success: false,
      message: '获取财务概览失败',
      error: error.message
    });
  }
});

// 获取财务交易记录
router.get('/transactions', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间'),
  query('type').optional().isIn(['all', 'income', 'expense']).withMessage('类型必须是all、income或expense')
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

    const { page = 1, limit = 20, type = 'all', parkingLotId, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    let matchCondition = {};
    
    if (type !== 'all') {
      matchCondition.type = type;
    }
    
    if (parkingLotId) {
      matchCondition.parkingLotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 查询交易记录
    const transactions = await Finance.find(matchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('relatedId', 'licensePlate')
      .populate('parkingLotId', 'name');
    
    // 获取总数
    const total = await Finance.countDocuments(matchCondition);
    
    res.json({
      success: true,
      data: {
        transactions,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取交易记录失败:', error);
    res.status(500).json({
      success: false,
      message: '获取交易记录失败',
      error: error.message
    });
  }
});

// 获取收入趋势数据
router.get('/revenue-trend', auth, [
  query('period').optional().isIn(['day', 'week', 'month', 'year']).withMessage('周期必须是day、week、month或year')
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

    const { period = 'month', parkingLotId, startDate, endDate } = req.query;
    
    // 构建查询条件
    const matchCondition = { 
      type: 'parking',
      status: 'completed'
    };
    
    if (parkingLotId) {
      matchCondition.lotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 根据周期设置分组格式
    let groupFormat;
    switch (period) {
      case 'day':
        groupFormat = { $dayOfMonth: '$createdAt' };
        break;
      case 'week':
        groupFormat = { $week: '$createdAt' };
        break;
      case 'month':
        groupFormat = { $month: '$createdAt' };
        break;
      case 'year':
        groupFormat = { $year: '$createdAt' };
        break;
    }
    
    // 聚合查询
    const result = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取收入趋势失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收入趋势失败',
      error: error.message
    });
  }
});

// 获取收入分布数据
router.get('/revenue-distribution', auth, async (req, res) => {
  try {
    const { parkingLotId, startDate, endDate } = req.query;
    
    // 构建查询条件
    const matchCondition = { 
      type: 'parking',
      status: 'completed'
    };
    
    if (parkingLotId) {
      matchCondition.lotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 按停车场分组聚合
    const result = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $lookup: {
          from: 'parkinglots',
          localField: 'lotId',
          foreignField: '_id',
          as: 'parkingLot'
        }
      },
      { $unwind: '$parkingLot' },
      {
        $group: {
          _id: '$parkingLot.name',
          totalRevenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ]);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取收入分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收入分布失败',
      error: error.message
    });
  }
});

// 获取支付方式分布数据
router.get('/payment-method-distribution', auth, async (req, res) => {
  try {
    const { parkingLotId, startDate, endDate } = req.query;
    
    // 构建查询条件
    const matchCondition = { 
      type: 'parking',
      status: 'completed'
    };
    
    if (parkingLotId) {
      matchCondition.lotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 按支付方式分组聚合
    const result = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalRevenue: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取支付方式分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付方式分布失败',
      error: error.message
    });
  }
});

// 获取支出数据
router.get('/expenses', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
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

    const { page = 1, limit = 20, startDate, endDate } = req.query;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const matchCondition = { type: 'expense' };
    
    if (startDate && endDate) {
      matchCondition.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 查询支出记录
    const expenses = await Finance.find(matchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 获取总数
    const total = await Finance.countDocuments(matchCondition);
    
    res.json({
      success: true,
      data: {
        expenses,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取支出数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支出数据失败',
      error: error.message
    });
  }
});

// 创建支出记录
router.post('/expenses', auth, [
  body('category').notEmpty().withMessage('支出分类不能为空'),
  body('amount').isFloat({ min: 0 }).withMessage('金额必须是非负数'),
  body('description').notEmpty().withMessage('描述不能为空')
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

    const { category, amount, description, paymentMethod } = req.body;
    
    // 创建支出记录
    const expense = new Finance({
      type: 'expense',
      category,
      amount,
      description,
      paymentMethod,
      transactionId: `EXP-${Date.now()}`
    });
    
    await expense.save();
    
    res.json({
      success: true,
      message: '支出记录创建成功',
      data: expense
    });
  } catch (error) {
    console.error('创建支出记录失败:', error);
    res.status(500).json({
      success: false,
      message: '创建支出记录失败',
      error: error.message
    });
  }
});

// 更新支出记录
router.put('/expenses/:id', auth, [
  param('id').isMongoId().withMessage('支出ID格式不正确'),
  body('category').optional().notEmpty().withMessage('支出分类不能为空'),
  body('amount').optional().isFloat({ min: 0 }).withMessage('金额必须是非负数'),
  body('description').optional().notEmpty().withMessage('描述不能为空')
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

    const { id } = req.params;
    const { category, amount, description, paymentMethod } = req.body;
    
    // 查找支出记录
    const expense = await Finance.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: '支出记录不存在'
      });
    }
    
    // 更新支出记录
    if (category !== undefined) expense.category = category;
    if (amount !== undefined) expense.amount = amount;
    if (description !== undefined) expense.description = description;
    if (paymentMethod !== undefined) expense.paymentMethod = paymentMethod;
    
    await expense.save();
    
    res.json({
      success: true,
      message: '支出记录更新成功',
      data: expense
    });
  } catch (error) {
    console.error('更新支出记录失败:', error);
    res.status(500).json({
      success: false,
      message: '更新支出记录失败',
      error: error.message
    });
  }
});

// 删除支出记录
router.delete('/expenses/:id', auth, [
  param('id').isMongoId().withMessage('支出ID格式不正确')
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

    const { id } = req.params;
    
    // 查找支出记录
    const expense = await Finance.findById(id);
    if (!expense) {
      return res.status(404).json({
        success: false,
        message: '支出记录不存在'
      });
    }
    
    // 删除支出记录
    await Finance.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: '支出记录删除成功'
    });
  } catch (error) {
    console.error('删除支出记录失败:', error);
    res.status(500).json({
      success: false,
      message: '删除支出记录失败',
      error: error.message
    });
  }
});

// 获取财务报表
router.get('/reports', auth, [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须是正整数'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('每页数量必须在1-100之间')
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

    const { page = 1, limit = 20, type } = req.query;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const matchCondition = {};
    
    if (type) {
      matchCondition.type = type;
    }
    
    // 查询报表记录
    const reports = await Finance.find(matchCondition)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));
    
    // 获取总数
    const total = await Finance.countDocuments(matchCondition);
    
    res.json({
      success: true,
      data: {
        reports,
        total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取财务报表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取财务报表失败',
      error: error.message
    });
  }
});

// 生成财务报表
router.post('/reports/generate', auth, [
  body('reportType').notEmpty().withMessage('报表类型不能为空'),
  body('startDate').notEmpty().withMessage('开始日期不能为空'),
  body('endDate').notEmpty().withMessage('结束日期不能为空')
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

    const { reportType, startDate, endDate, parkingLotId } = req.body;
    
    // 构建查询条件
    const matchCondition = { status: 'completed' };
    
    if (parkingLotId) {
      matchCondition.parkingLotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    if (startDate && endDate) {
      matchCondition.exitTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 根据报表类型生成数据
    let reportData = {};
    
    switch (reportType) {
      case 'revenue':
        // 收入报表
        const revenueResult = await ParkingRecord.aggregate([
          { $match: matchCondition },
          {
            $group: {
              _id: null,
              totalRevenue: { $sum: '$fee' },
              totalTransactions: { $sum: 1 },
              avgFee: { $avg: '$fee' }
            }
          }
        ]);
        
        reportData = {
          totalRevenue: revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0,
          totalTransactions: revenueResult.length > 0 ? revenueResult[0].totalTransactions : 0,
          avgFee: revenueResult.length > 0 ? revenueResult[0].avgFee : 0
        };
        break;
        
      case 'expense':
        // 支出报表
        const expenseMatchCondition = { type: 'expense' };
        
        if (startDate && endDate) {
          expenseMatchCondition.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        
        const expenseResult = await Finance.aggregate([
          { $match: expenseMatchCondition },
          {
            $group: {
              _id: null,
              totalExpense: { $sum: '$amount' },
              totalTransactions: { $sum: 1 }
            }
          }
        ]);
        
        reportData = {
          totalExpense: expenseResult.length > 0 ? expenseResult[0].totalExpense : 0,
          totalTransactions: expenseResult.length > 0 ? expenseResult[0].totalTransactions : 0
        };
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的报表类型'
        });
    }
    
    // 创建报表记录
    const report = new Finance({
      type: 'report',
      category: reportType,
      amount: reportData.totalRevenue || reportData.totalExpense || 0,
      description: `${reportType}报表 (${startDate} 至 ${endDate})`,
      transactionId: `RPT-${Date.now()}`,
      relatedData: reportData
    });
    
    await report.save();
    
    res.json({
      success: true,
      message: '财务报表生成成功',
      data: {
        report,
        reportData
      }
    });
  } catch (error) {
    console.error('生成财务报表失败:', error);
    res.status(500).json({
      success: false,
      message: '生成财务报表失败',
      error: error.message
    });
  }
});

// 导出财务报表
router.get('/reports/export', auth, async (req, res) => {
  try {
    const { type, startDate, endDate, parkingLotId } = req.query;
    
    // 构建查询条件
    const matchCondition = { status: 'completed' };
    
    if (parkingLotId) {
      matchCondition.parkingLotId = mongoose.Types.ObjectId(parkingLotId);
    }
    
    if (startDate && endDate) {
      matchCondition.exitTime = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    
    // 根据类型导出数据
    let data = [];
    
    switch (type) {
      case 'revenue':
        // 导出收入数据
        data = await ParkingRecord.find(matchCondition)
          .populate('parkingLotId', 'name')
          .populate('spaceId', 'spaceNumber')
          .sort({ exitTime: -1 });
        break;
        
      case 'expense':
        // 导出支出数据
        const expenseMatchCondition = { type: 'expense' };
        
        if (startDate && endDate) {
          expenseMatchCondition.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          };
        }
        
        data = await Finance.find(expenseMatchCondition)
          .sort({ createdAt: -1 });
        break;
        
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的导出类型'
        });
    }
    
    // 这里应该实现实际的导出逻辑，例如生成Excel或CSV文件
    // 为了简化，这里只返回数据
    
    res.json({
      success: true,
      message: '财务报表导出成功',
      data
    });
  } catch (error) {
    console.error('导出财务报表失败:', error);
    res.status(500).json({
      success: false,
      message: '导出财务报表失败',
      error: error.message
    });
  }
});

module.exports = router;