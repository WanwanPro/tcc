const express = require('express')
const Transaction = require('../models/Transaction')
const ParkingLot = require('../models/ParkingLot')
const PricingRule = require('../models/PricingRule')
const auth = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 获取交易记录列表
router.get('/transactions', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.type) {
      query.type = req.query.type
    }
    
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus
    }
    
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod
    }
    
    if (req.query.startDate || req.query.endDate) {
      query.entryTime = {}
      if (req.query.startDate) {
        query.entryTime.$gte = new Date(req.query.startDate)
      }
      if (req.query.endDate) {
        query.entryTime.$lte = new Date(req.query.endDate)
      }
    }
    
    if (req.query.search) {
      query.$or = [
        { transactionId: { $regex: req.query.search, $options: 'i' } },
        { userId: { $regex: req.query.search, $options: 'i' } },
        { vehicleNumber: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const transactions = await Transaction.find(query)
      .populate('lotId', 'name address')
      .populate('spaceId', 'spaceId floorId')
      .populate('pricingRule', 'name')
      .populate('processedBy', 'name')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await Transaction.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取单个交易记录
router.get('/transactions/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('lotId', 'name address')
      .populate('spaceId', 'spaceId floorId area type')
      .populate('pricingRule', 'name rules')
      .populate('processedBy', 'name')
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: transaction
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建交易记录
router.post('/transactions', async (req, res) => {
  try {
    const { 
      type, userId, vehicleNumber, lotId, spaceId, entryTime, exitTime, 
      amount, paymentMethod, paymentStatus, pricingRule, breakdown, discount, tax, notes 
    } = req.body
    
    // 验证输入
    if (!type || !userId || !vehicleNumber || !lotId || !amount || !paymentMethod) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 计算总金额
    const totalAmount = amount - (discount || 0) + (tax || 0)
    
    // 计算停车时长（分钟）
    let duration = 0
    if (entryTime && exitTime) {
      duration = Math.floor((new Date(exitTime) - new Date(entryTime)) / (1000 * 60))
    }
    
    // 创建新交易记录
    const transaction = new Transaction({
      transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`,
      type,
      userId,
      vehicleNumber,
      lotId,
      spaceId,
      entryTime: entryTime || new Date(),
      exitTime,
      duration,
      amount,
      paymentMethod,
      paymentStatus: paymentStatus || 'pending',
      paymentTime: paymentStatus === 'paid' ? new Date() : undefined,
      pricingRule,
      breakdown,
      discount: discount || 0,
      tax: tax || 0,
      totalAmount,
      notes,
      processedBy: req.user.id
    })
    
    await transaction.save()
    
    // 返回完整的交易信息
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('lotId', 'name')
      .populate('spaceId', 'spaceId floorId')
      .populate('processedBy', 'name')
    
    res.status(201).json({
      success: true,
      message: '交易记录创建成功',
      data: populatedTransaction
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新交易记录
router.put('/transactions/:id', async (req, res) => {
  try {
    const { 
      exitTime, paymentStatus, paymentMethod, paymentTime, 
      breakdown, discount, tax, notes 
    } = req.body
    
    // 查找交易记录
    const transaction = await Transaction.findById(req.params.id)
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      })
    }
    
    // 更新字段
    if (exitTime) {
      transaction.exitTime = exitTime
      // 重新计算停车时长
      if (transaction.entryTime) {
        transaction.duration = Math.floor((new Date(exitTime) - new Date(transaction.entryTime)) / (1000 * 60))
      }
    }
    
    if (paymentStatus) {
      transaction.paymentStatus = paymentStatus
      if (paymentStatus === 'paid' && !transaction.paymentTime) {
        transaction.paymentTime = new Date()
      }
    }
    
    if (paymentMethod) transaction.paymentMethod = paymentMethod
    if (paymentTime) transaction.paymentTime = paymentTime
    if (breakdown) transaction.breakdown = breakdown
    if (discount !== undefined) transaction.discount = discount
    if (tax !== undefined) transaction.tax = tax
    if (notes) transaction.notes = notes
    
    // 重新计算总金额
    transaction.totalAmount = transaction.amount - transaction.discount + transaction.tax
    
    await transaction.save()
    
    // 返回完整的交易信息
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('lotId', 'name')
      .populate('spaceId', 'spaceId floorId')
      .populate('processedBy', 'name')
    
    res.status(200).json({
      success: true,
      message: '交易记录更新成功',
      data: populatedTransaction
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除交易记录
router.delete('/transactions/:id', async (req, res) => {
  try {
    // 查找交易记录
    const transaction = await Transaction.findById(req.params.id)
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: '交易记录不存在'
      })
    }
    
    await Transaction.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '交易记录删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取收入统计
router.get('/revenue/stats', async (req, res) => {
  try {
    const { lotId, startDate, endDate, groupBy } = req.query
    
    // 构建查询条件
    const matchCondition = {
      paymentStatus: 'paid'
    }
    
    if (lotId) {
      matchCondition.lotId = mongoose.Types.ObjectId(lotId)
    }
    
    if (startDate || endDate) {
      matchCondition.paymentTime = {}
      if (startDate) {
        matchCondition.paymentTime.$gte = new Date(startDate)
      }
      if (endDate) {
        matchCondition.paymentTime.$lte = new Date(endDate)
      }
    }
    
    // 确定分组方式
    let groupFormat = null
    switch (groupBy) {
      case 'day':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$paymentTime" } }
        break
      case 'week':
        groupFormat = { $dateToString: { format: "%Y-%U", date: "$paymentTime" } }
        break
      case 'month':
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$paymentTime" } }
        break
      case 'year':
        groupFormat = { $dateToString: { format: "%Y", date: "$paymentTime" } }
        break
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$paymentTime" } }
    }
    
    // 聚合查询
    const revenueStats = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: "$totalAmount" },
          totalTransactions: { $sum: 1 },
          averageTransactionAmount: { $avg: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 获取支付方式统计
    const paymentMethodStats = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { amount: -1 } }
    ])
    
    // 获取交易类型统计
    const transactionTypeStats = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
          amount: { $sum: "$totalAmount" }
        }
      },
      { $sort: { amount: -1 } }
    ])
    
    // 获取停车场收入统计
    const lotRevenueStats = await Transaction.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: "$lotId",
          totalRevenue: { $sum: "$totalAmount" },
          totalTransactions: { $sum: 1 }
        }
      },
      {
        $lookup: {
          from: "parkinglots",
          localField: "_id",
          foreignField: "_id",
          as: "lotInfo"
        }
      },
      { $unwind: "$lotInfo" },
      {
        $project: {
          lotId: "$_id",
          lotName: "$lotInfo.name",
          totalRevenue: 1,
          totalTransactions: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])
    
    res.status(200).json({
      success: true,
      data: {
        revenueStats,
        paymentMethodStats,
        transactionTypeStats,
        lotRevenueStats
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取计费规则列表
router.get('/pricing-rules', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true'
    }
    
    if (req.query.search) {
      query.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const pricingRules = await PricingRule.find(query)
      .populate('lotId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await PricingRule.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        pricingRules,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建计费规则
router.post('/pricing-rules', async (req, res) => {
  try {
    const { name, description, lotId, rules, specialRules, effectiveDate, expiryDate } = req.body
    
    // 验证输入
    if (!name || !lotId || !rules || rules.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 创建新计费规则
    const pricingRule = new PricingRule({
      name,
      description,
      lotId,
      rules,
      specialRules: specialRules || [],
      effectiveDate: effectiveDate || new Date(),
      expiryDate
    })
    
    await pricingRule.save()
    
    // 返回完整的计费规则信息
    const populatedPricingRule = await PricingRule.findById(pricingRule._id)
      .populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: '计费规则创建成功',
      data: populatedPricingRule
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新计费规则
router.put('/pricing-rules/:id', async (req, res) => {
  try {
    const { name, description, rules, specialRules, isActive, effectiveDate, expiryDate } = req.body
    
    // 查找计费规则
    const pricingRule = await PricingRule.findById(req.params.id)
    if (!pricingRule) {
      return res.status(404).json({
        success: false,
        message: '计费规则不存在'
      })
    }
    
    // 更新字段
    if (name) pricingRule.name = name
    if (description) pricingRule.description = description
    if (rules) pricingRule.rules = rules
    if (specialRules) pricingRule.specialRules = specialRules
    if (isActive !== undefined) pricingRule.isActive = isActive
    if (effectiveDate) pricingRule.effectiveDate = effectiveDate
    if (expiryDate) pricingRule.expiryDate = expiryDate
    
    await pricingRule.save()
    
    // 返回完整的计费规则信息
    const populatedPricingRule = await PricingRule.findById(pricingRule._id)
      .populate('lotId', 'name')
    
    res.status(200).json({
      success: true,
      message: '计费规则更新成功',
      data: populatedPricingRule
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除计费规则
router.delete('/pricing-rules/:id', async (req, res) => {
  try {
    // 查找计费规则
    const pricingRule = await PricingRule.findById(req.params.id)
    if (!pricingRule) {
      return res.status(404).json({
        success: false,
        message: '计费规则不存在'
      })
    }
    
    await PricingRule.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '计费规则删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

module.exports = router