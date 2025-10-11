const Transaction = require('../models/Transaction')
const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const BillingRule = require('../models/BillingRule')
const { generatePagination, generateId, calculateParkingFee } = require('../utils/helpers')

// 获取所有交易记录
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.spaceId) {
      query.spaceId = req.query.spaceId
    }
    
    if (req.query.licensePlate) {
      query.licensePlate = { $regex: req.query.licensePlate, $options: 'i' }
    }
    
    if (req.query.status) {
      query.status = req.query.status
    }
    
    if (req.query.paymentMethod) {
      query.paymentMethod = req.query.paymentMethod
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      }
    }
    
    // 执行查询
    const transactions = await Transaction.find(query)
      .populate('lotId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await Transaction.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        transactions,
        pagination: generatePagination(page, limit, total)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取单个交易记录
const getTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id)
      .populate('lotId', 'name address')
    
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
}

// 创建交易记录
const createTransaction = async (req, res) => {
  try {
    const { 
      transactionId, lotId, spaceId, licensePlate, entryTime, 
      exitTime, amount, paymentMethod, status, properties 
    } = req.body
    
    // 验证输入
    if (!transactionId || !lotId || !spaceId || !licensePlate || !entryTime || !amount) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查停车场是否存在
    const parkingLot = await ParkingLot.findById(lotId)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 检查停车位是否存在
    const parkingSpace = await ParkingSpace.findOne({ spaceId, lotId })
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    // 检查交易ID是否已存在
    const existingTransaction = await Transaction.findOne({ transactionId })
    
    if (existingTransaction) {
      return res.status(400).json({
        success: false,
        message: '交易ID已存在'
      })
    }
    
    // 创建新交易记录
    const transaction = new Transaction({
      transactionId,
      lotId,
      spaceId,
      licensePlate,
      entryTime: new Date(entryTime),
      exitTime: exitTime ? new Date(exitTime) : null,
      amount,
      paymentMethod: paymentMethod || 'cash',
      status: status || 'pending',
      properties: properties || {}
    })
    
    await transaction.save()
    
    // 返回交易记录信息
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('lotId', 'name')
    
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
}

// 更新交易记录
const updateTransaction = async (req, res) => {
  try {
    const { 
      exitTime, amount, paymentMethod, status, properties 
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
    if (exitTime) transaction.exitTime = new Date(exitTime)
    if (amount !== undefined) transaction.amount = amount
    if (paymentMethod) transaction.paymentMethod = paymentMethod
    if (status) transaction.status = status
    if (properties) transaction.properties = properties
    
    await transaction.save()
    
    // 返回交易记录信息
    const populatedTransaction = await Transaction.findById(transaction._id)
      .populate('lotId', 'name')
    
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
}

// 删除交易记录
const deleteTransaction = async (req, res) => {
  try {
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
}

// 获取收入统计
const getRevenueStats = async (req, res) => {
  try {
    const { lotId, startDate, endDate, groupBy = 'day' } = req.query
    
    // 构建查询条件
    const matchQuery = { status: 'completed' }
    
    if (lotId) {
      matchQuery.lotId = lotId
    }
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    // 构建分组条件
    let groupFormat
    
    switch (groupBy) {
      case 'hour':
        groupFormat = { $dateToString: { format: "%Y-%m-%d %H:00:00", date: "$createdAt" } }
        break
      case 'day':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
        break
      case 'week':
        groupFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } }
        break
      case 'month':
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } }
        break
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }
    }
    
    // 执行聚合查询
    const revenueStats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: "$amount" }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 计算总收入和总交易数
    const totalResult = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: "$amount" }
        }
      }
    ])
    
    const totalStats = totalResult.length > 0 ? totalResult[0] : {
      totalRevenue: 0,
      transactionCount: 0,
      avgAmount: 0
    }
    
    res.status(200).json({
      success: true,
      data: {
        revenueStats,
        totalStats,
        groupBy
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取支付方式统计
const getPaymentMethodStats = async (req, res) => {
  try {
    const { lotId, startDate, endDate } = req.query
    
    // 构建查询条件
    const matchQuery = { status: 'completed' }
    
    if (lotId) {
      matchQuery.lotId = lotId
    }
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    // 执行聚合查询
    const paymentStats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          percentage: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])
    
    // 计算总交易数
    const totalTransactions = paymentStats.reduce((sum, stat) => sum + stat.count, 0)
    
    // 计算百分比
    paymentStats.forEach(stat => {
      stat.percentage = totalTransactions > 0 ? (stat.count / totalTransactions * 100).toFixed(2) : 0
    })
    
    res.status(200).json({
      success: true,
      data: {
        paymentStats,
        totalTransactions
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取停车场收入统计
const getLotRevenueStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query
    
    // 构建查询条件
    const matchQuery = { status: 'completed' }
    
    if (startDate && endDate) {
      matchQuery.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }
    
    // 执行聚合查询
    const lotRevenueStats = await Transaction.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: "$lotId",
          totalRevenue: { $sum: "$amount" },
          transactionCount: { $sum: 1 },
          avgAmount: { $avg: "$amount" }
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
          _id: 1,
          lotId: "$_id",
          lotName: "$lotInfo.name",
          lotAddress: "$lotInfo.address",
          totalRevenue: 1,
          transactionCount: 1,
          avgAmount: 1
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])
    
    res.status(200).json({
      success: true,
      data: lotRevenueStats
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 计算停车费用
const calculateFee = async (req, res) => {
  try {
    const { lotId, entryTime, exitTime } = req.body
    
    // 验证输入
    if (!lotId || !entryTime || !exitTime) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID、入场时间和出场时间'
      })
    }
    
    // 检查停车场是否存在
    const parkingLot = await ParkingLot.findById(lotId)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 获取计费规则
    const billingRule = await BillingRule.findOne({ lotId })
    
    if (!billingRule) {
      return res.status(404).json({
        success: false,
        message: '停车场计费规则不存在'
      })
    }
    
    // 计算停车费用
    const entryDate = new Date(entryTime)
    const exitDate = new Date(exitTime)
    
    if (exitDate <= entryDate) {
      return res.status(400).json({
        success: false,
        message: '出场时间必须晚于入场时间'
      })
    }
    
    const duration = Math.ceil((exitDate - entryDate) / (1000 * 60)) // 分钟
    const fee = calculateParkingFee(duration, billingRule)
    
    res.status(200).json({
      success: true,
      data: {
        lotId,
        lotName: parkingLot.name,
        entryTime: entryDate,
        exitTime: exitDate,
        duration: {
          minutes: duration,
          hours: Math.ceil(duration / 60),
          formatted: `${Math.floor(duration / 60)}小时${duration % 60}分钟`
        },
        fee,
        billingRule: {
          name: billingRule.name,
          baseRate: billingRule.baseRate,
          baseTime: billingRule.baseTime,
          additionalRate: billingRule.additionalRate,
          additionalTime: billingRule.additionalTime,
          maxDailyRate: billingRule.maxDailyRate
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
}

// 获取计费规则
const getBillingRules = async (req, res) => {
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
    
    // 执行查询
    const billingRules = await BillingRule.find(query)
      .populate('lotId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await BillingRule.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        billingRules,
        pagination: generatePagination(page, limit, total)
      }
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取单个计费规则
const getBillingRule = async (req, res) => {
  try {
    const billingRule = await BillingRule.findById(req.params.id)
      .populate('lotId', 'name address')
    
    if (!billingRule) {
      return res.status(404).json({
        success: false,
        message: '计费规则不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: billingRule
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建计费规则
const createBillingRule = async (req, res) => {
  try {
    const { 
      ruleId, lotId, name, description, baseRate, baseTime, 
      additionalRate, additionalTime, maxDailyRate, isActive, properties 
    } = req.body
    
    // 验证输入
    if (!ruleId || !lotId || !name || !baseRate || !baseTime || !additionalRate || !additionalTime) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查停车场是否存在
    const parkingLot = await ParkingLot.findById(lotId)
    
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 检查规则ID是否已存在
    const existingRule = await BillingRule.findOne({ ruleId, lotId })
    
    if (existingRule) {
      return res.status(400).json({
        success: false,
        message: '该停车场下已存在此规则ID'
      })
    }
    
    // 创建新计费规则
    const billingRule = new BillingRule({
      ruleId,
      lotId,
      name,
      description: description || '',
      baseRate,
      baseTime,
      additionalRate,
      additionalTime,
      maxDailyRate: maxDailyRate || null,
      isActive: isActive !== undefined ? isActive : true,
      properties: properties || {}
    })
    
    await billingRule.save()
    
    // 返回计费规则信息
    const populatedRule = await BillingRule.findById(billingRule._id)
      .populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: '计费规则创建成功',
      data: populatedRule
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 更新计费规则
const updateBillingRule = async (req, res) => {
  try {
    const { 
      name, description, baseRate, baseTime, additionalRate, 
      additionalTime, maxDailyRate, isActive, properties 
    } = req.body
    
    // 查找计费规则
    const billingRule = await BillingRule.findById(req.params.id)
    
    if (!billingRule) {
      return res.status(404).json({
        success: false,
        message: '计费规则不存在'
      })
    }
    
    // 更新字段
    if (name) billingRule.name = name
    if (description) billingRule.description = description
    if (baseRate) billingRule.baseRate = baseRate
    if (baseTime) billingRule.baseTime = baseTime
    if (additionalRate) billingRule.additionalRate = additionalRate
    if (additionalTime) billingRule.additionalTime = additionalTime
    if (maxDailyRate !== undefined) billingRule.maxDailyRate = maxDailyRate
    if (isActive !== undefined) billingRule.isActive = isActive
    if (properties) billingRule.properties = properties
    
    await billingRule.save()
    
    // 返回计费规则信息
    const populatedRule = await BillingRule.findById(billingRule._id)
      .populate('lotId', 'name')
    
    res.status(200).json({
      success: true,
      message: '计费规则更新成功',
      data: populatedRule
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 删除计费规则
const deleteBillingRule = async (req, res) => {
  try {
    const billingRule = await BillingRule.findById(req.params.id)
    
    if (!billingRule) {
      return res.status(404).json({
        success: false,
        message: '计费规则不存在'
      })
    }
    
    await BillingRule.findByIdAndDelete(req.params.id)
    
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
}

module.exports = {
  getTransactions,
  getTransaction,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getRevenueStats,
  getPaymentMethodStats,
  getLotRevenueStats,
  calculateFee,
  getBillingRules,
  getBillingRule,
  createBillingRule,
  updateBillingRule,
  deleteBillingRule
}