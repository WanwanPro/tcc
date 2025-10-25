const express = require('express')
const mongoose = require('mongoose')
const Analytics = require('../models/Analytics')
const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const Transaction = require('../models/Transaction')
const auth = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 获取分析报告列表
router.get('/reports', async (req, res) => {
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
    
    if (req.query.period) {
      query.period = req.query.period
    }
    
    if (req.query.startDate || req.query.endDate) {
      query.createdAt = {}
      if (req.query.startDate) {
        query.createdAt.$gte = new Date(req.query.startDate)
      }
      if (req.query.endDate) {
        query.createdAt.$lte = new Date(req.query.endDate)
      }
    }
    
    if (req.query.search) {
      query.$or = [
        { title: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const reports = await Analytics.find(query)
      .populate('lotId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await Analytics.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        reports,
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

// 获取单个分析报告
router.get('/reports/:id', async (req, res) => {
  try {
    const report = await Analytics.findById(req.params.id)
      .populate('lotId', 'name address')
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '分析报告不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: report
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建分析报告
router.post('/reports', async (req, res) => {
  try {
    const { 
      title, description, lotId, type, period, startDate, endDate, 
      metrics, charts, insights, summary 
    } = req.body
    
    // 验证输入
    if (!title || !type || !period || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 创建新分析报告
    const report = new Analytics({
      title,
      description,
      lotId,
      type,
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics: metrics || {},
      charts: charts || [],
      insights: insights || [],
      summary,
      generatedBy: req.user.id
    })
    
    await report.save()
    
    // 返回完整的报告信息
    const populatedReport = await Analytics.findById(report._id)
      .populate('lotId', 'name')
      .populate('generatedBy', 'name')
    
    res.status(201).json({
      success: true,
      message: '分析报告创建成功',
      data: populatedReport
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新分析报告
router.put('/reports/:id', async (req, res) => {
  try {
    const { 
      title, description, metrics, charts, insights, summary 
    } = req.body
    
    // 查找报告
    const report = await Analytics.findById(req.params.id)
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '分析报告不存在'
      })
    }
    
    // 更新字段
    if (title) report.title = title
    if (description) report.description = description
    if (metrics) report.metrics = metrics
    if (charts) report.charts = charts
    if (insights) report.insights = insights
    if (summary) report.summary = summary
    
    await report.save()
    
    // 返回完整的报告信息
    const populatedReport = await Analytics.findById(report._id)
      .populate('lotId', 'name')
      .populate('generatedBy', 'name')
    
    res.status(200).json({
      success: true,
      message: '分析报告更新成功',
      data: populatedReport
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除分析报告
router.delete('/reports/:id', async (req, res) => {
  try {
    // 查找报告
    const report = await Analytics.findById(req.params.id)
    if (!report) {
      return res.status(404).json({
        success: false,
        message: '分析报告不存在'
      })
    }
    
    await Analytics.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '分析报告删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 生成停车场占用率分析报告
router.post('/reports/generate/occupancy', async (req, res) => {
  try {
    const { lotId, period, startDate, endDate } = req.body
    
    // 验证输入
    if (!lotId || !period || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 获取停车场信息
    const parkingLot = await ParkingLot.findById(lotId)
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 获取停车位总数
    const totalSpaces = await ParkingSpace.countDocuments({ lotId })
    
    // 获取已占用停车位数量
    const occupiedSpaces = await ParkingSpace.countDocuments({ 
      lotId, 
      status: 'occupied' 
    })
    
    // 计算占用率
    const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0
    
    // 获取各楼层占用情况
    const floorStats = await ParkingSpace.aggregate([
      { $match: { lotId: new mongoose.Types.ObjectId(lotId) } },
      {
        $group: {
          _id: '$floorId',
          totalSpaces: { $sum: 1 },
          occupiedSpaces: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedSpaces', '$totalSpaces'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 获取各区域占用情况
    const areaStats = await ParkingSpace.aggregate([
      { $match: { lotId: new mongoose.Types.ObjectId(lotId) } },
      {
        $group: {
          _id: '$area',
          totalSpaces: { $sum: 1 },
          occupiedSpaces: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedSpaces', '$totalSpaces'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 获取各类型停车位占用情况
    const typeStats = await ParkingSpace.aggregate([
      { $match: { lotId: new mongoose.Types.ObjectId(lotId) } },
      {
        $group: {
          _id: '$type',
          totalSpaces: { $sum: 1 },
          occupiedSpaces: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedSpaces', '$totalSpaces'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 创建图表数据
    const charts = [
      {
        id: 'occupancy-pie',
        type: 'pie',
        title: '停车场占用率',
        data: [
          { name: '已占用', value: occupiedSpaces },
          { name: '空闲', value: totalSpaces - occupiedSpaces }
        ]
      },
      {
        id: 'floor-bar',
        type: 'bar',
        title: '各楼层占用情况',
        xAxis: '楼层',
        yAxis: '占用率 (%)',
        data: floorStats.map(item => ({
          name: item._id,
          value: Math.round(item.occupancyRate * 100) / 100
        }))
      },
      {
        id: 'area-bar',
        type: 'bar',
        title: '各区域占用情况',
        xAxis: '区域',
        yAxis: '占用率 (%)',
        data: areaStats.map(item => ({
          name: item._id || '未分配区域',
          value: Math.round(item.occupancyRate * 100) / 100
        }))
      },
      {
        id: 'type-bar',
        type: 'bar',
        title: '各类型停车位占用情况',
        xAxis: '类型',
        yAxis: '占用率 (%)',
        data: typeStats.map(item => ({
          name: item._id || '未指定类型',
          value: Math.round(item.occupancyRate * 100) / 100
        }))
      }
    ]
    
    // 创建分析洞察
    const insights = []
    
    if (occupancyRate > 80) {
      insights.push({
        type: 'warning',
        title: '高占用率警告',
        description: `当前停车场占用率为 ${Math.round(occupancyRate * 100) / 100}%，超过80%，可能需要考虑增加停车位或优化管理策略。`
      })
    } else if (occupancyRate < 30) {
      insights.push({
        type: 'info',
        title: '低占用率提示',
        description: `当前停车场占用率为 ${Math.round(occupancyRate * 100) / 100}%，低于30%，可能需要考虑营销策略或价格调整。`
      })
    }
    
    // 找出占用率最高和最低的楼层
    if (floorStats.length > 0) {
      const maxFloor = floorStats.reduce((max, floor) => 
        floor.occupancyRate > max.occupancyRate ? floor : max
      )
      const minFloor = floorStats.reduce((min, floor) => 
        floor.occupancyRate < min.occupancyRate ? floor : min
      )
      
      insights.push({
        type: 'info',
        title: '楼层占用率差异',
        description: `楼层 ${maxFloor._id} 占用率最高 (${Math.round(maxFloor.occupancyRate * 100) / 100}%)，楼层 ${minFloor._id} 占用率最低 (${Math.round(minFloor.occupancyRate * 100) / 100}%)。`
      })
    }
    
    // 创建报告摘要
    const summary = `停车场 ${parkingLot.name} 在 ${period} 期间的平均占用率为 ${Math.round(occupancyRate * 100) / 100}%，总停车位 ${totalSpaces} 个，已占用 ${occupiedSpaces} 个。`
    
    // 创建指标数据
    const metrics = {
      totalSpaces,
      occupiedSpaces,
      availableSpaces: totalSpaces - occupiedSpaces,
      occupancyRate: Math.round(occupancyRate * 100) / 100,
      floorStats,
      areaStats,
      typeStats
    }
    
    // 创建分析报告
    const report = new Analytics({
      title: `${parkingLot.name} 占用率分析报告`,
      description: `${period} 期间停车场占用率详细分析`,
      lotId,
      type: 'occupancy',
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics,
      charts,
      insights,
      summary,
      generatedBy: req.user.id
    })
    
    await report.save()
    
    // 返回完整的报告信息
    const populatedReport = await Analytics.findById(report._id)
      .populate('lotId', 'name')
      .populate('generatedBy', 'name')
    
    res.status(201).json({
      success: true,
      message: '占用率分析报告生成成功',
      data: populatedReport
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 生成收入分析报告
router.post('/reports/generate/revenue', async (req, res) => {
  try {
    const { lotId, period, startDate, endDate } = req.body
    
    // 验证输入
    if (!lotId || !period || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 获取停车场信息
    const parkingLot = await ParkingLot.findById(lotId)
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 获取交易数据
    const transactions = await Transaction.find({
      lotId,
      paymentStatus: 'paid',
      paymentTime: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
    
    // 计算总收入
    const totalRevenue = transactions.reduce((sum, transaction) => 
      sum + transaction.totalAmount, 0
    )
    
    // 计算平均交易金额
    const averageTransactionAmount = transactions.length > 0 
      ? totalRevenue / transactions.length 
      : 0
    
    // 按天统计收入
    const dailyRevenue = {}
    transactions.forEach(transaction => {
      const date = transaction.paymentTime.toISOString().split('T')[0]
      if (!dailyRevenue[date]) {
        dailyRevenue[date] = {
          date,
          revenue: 0,
          count: 0
        }
      }
      dailyRevenue[date].revenue += transaction.totalAmount
      dailyRevenue[date].count += 1
    })
    
    // 转换为数组并排序
    const dailyRevenueArray = Object.values(dailyRevenue).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    )
    
    // 按支付方式统计
    const paymentMethodStats = {}
    transactions.forEach(transaction => {
      if (!paymentMethodStats[transaction.paymentMethod]) {
        paymentMethodStats[transaction.paymentMethod] = {
          method: transaction.paymentMethod,
          revenue: 0,
          count: 0
        }
      }
      paymentMethodStats[transaction.paymentMethod].revenue += transaction.totalAmount
      paymentMethodStats[transaction.paymentMethod].count += 1
    })
    
    const paymentMethodArray = Object.values(paymentMethodStats)
    
    // 按交易类型统计
    const transactionTypeStats = {}
    transactions.forEach(transaction => {
      if (!transactionTypeStats[transaction.type]) {
        transactionTypeStats[transaction.type] = {
          type: transaction.type,
          revenue: 0,
          count: 0
        }
      }
      transactionTypeStats[transaction.type].revenue += transaction.totalAmount
      transactionTypeStats[transaction.type].count += 1
    })
    
    const transactionTypeArray = Object.values(transactionTypeStats)
    
    // 创建图表数据
    const charts = [
      {
        id: 'daily-revenue-line',
        type: 'line',
        title: '每日收入趋势',
        xAxis: '日期',
        yAxis: '收入 (元)',
        data: dailyRevenueArray.map(item => ({
          name: item.date,
          value: Math.round(item.revenue * 100) / 100
        }))
      },
      {
        id: 'payment-method-pie',
        type: 'pie',
        title: '支付方式分布',
        data: paymentMethodArray.map(item => ({
          name: item.method,
          value: Math.round(item.revenue * 100) / 100
        }))
      },
      {
        id: 'transaction-type-bar',
        type: 'bar',
        title: '交易类型分布',
        xAxis: '类型',
        yAxis: '收入 (元)',
        data: transactionTypeArray.map(item => ({
          name: item.type,
          value: Math.round(item.revenue * 100) / 100
        }))
      }
    ]
    
    // 创建分析洞察
    const insights = []
    
    // 找出收入最高和最低的日期
    if (dailyRevenueArray.length > 0) {
      const maxDay = dailyRevenueArray.reduce((max, day) => 
        day.revenue > max.revenue ? day : max
      )
      const minDay = dailyRevenueArray.reduce((min, day) => 
        day.revenue < min.revenue ? day : min
      )
      
      insights.push({
        type: 'info',
        title: '收入波动分析',
        description: `收入最高的一天是 ${maxDay.date}，收入为 ${Math.round(maxDay.revenue * 100) / 100} 元；收入最低的一天是 ${minDay.date}，收入为 ${Math.round(minDay.revenue * 100) / 100} 元。`
      })
    }
    
    // 分析支付方式偏好
    if (paymentMethodArray.length > 0) {
      const mostUsedMethod = paymentMethodArray.reduce((max, method) => 
        method.revenue > max.revenue ? method : max
      )
      
      insights.push({
        type: 'info',
        title: '支付方式偏好',
        description: `最常用的支付方式是 ${mostUsedMethod.method}，占总收入的 ${Math.round((mostUsedMethod.revenue / totalRevenue) * 10000) / 100}%。`
      })
    }
    
    // 创建报告摘要
    const summary = `停车场 ${parkingLot.name} 在 ${period} 期间的总收入为 ${Math.round(totalRevenue * 100) / 100} 元，共完成 ${transactions.length} 笔交易，平均每笔交易金额为 ${Math.round(averageTransactionAmount * 100) / 100} 元。`
    
    // 创建指标数据
    const metrics = {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalTransactions: transactions.length,
      averageTransactionAmount: Math.round(averageTransactionAmount * 100) / 100,
      dailyRevenue: dailyRevenueArray,
      paymentMethodStats: paymentMethodArray,
      transactionTypeStats: transactionTypeArray
    }
    
    // 创建分析报告
    const report = new Analytics({
      title: `${parkingLot.name} 收入分析报告`,
      description: `${period} 期间停车场收入详细分析`,
      lotId,
      type: 'revenue',
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics,
      charts,
      insights,
      summary,
      generatedBy: req.user.id
    })
    
    await report.save()
    
    // 返回完整的报告信息
    const populatedReport = await Analytics.findById(report._id)
      .populate('lotId', 'name')
      .populate('generatedBy', 'name')
    
    res.status(201).json({
      success: true,
      message: '收入分析报告生成成功',
      data: populatedReport
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取实时停车场统计数据
router.get('/dashboard/stats', async (req, res) => {
  try {
    const { lotId } = req.query
    
    // 构建查询条件
    const lotCondition = lotId ? { lotId } : {}
    
    // 获取停车场总数
    const totalLots = lotId ? 1 : await ParkingLot.countDocuments()
    
    // 获取停车位总数
    const totalSpaces = await ParkingSpace.countDocuments(lotCondition)
    
    // 获取已占用停车位数量
    const occupiedSpaces = await ParkingSpace.countDocuments({ 
      ...lotCondition,
      status: 'occupied' 
    })
    
    // 获取可用停车位数量
    const availableSpaces = totalSpaces - occupiedSpaces
    
    // 计算总占用率
    const totalOccupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0
    
    // 获取今日收入
    const todayStart = new Date()
    todayStart.setHours(0, 0, 0, 0)
    
    const todayEnd = new Date()
    todayEnd.setHours(23, 59, 59, 999)
    
    const revenueCondition = {
      paymentStatus: 'paid',
      paymentTime: {
        $gte: todayStart,
        $lte: todayEnd
      },
      ...lotCondition
    }
    
    const todayTransactions = await Transaction.find(revenueCondition)
    const todayRevenue = todayTransactions.reduce((sum, transaction) => 
      sum + transaction.totalAmount, 0
    )
    
    // 获取今日交易数
    const todayTransactionCount = todayTransactions.length
    
    // 获取各停车场占用率
    const lotStats = await ParkingLot.aggregate([
      ...(lotId ? [{ $match: { _id: new mongoose.Types.ObjectId(lotId) } }] : []),
      {
        $lookup: {
          from: "parkingspaces",
          localField: "_id",
          foreignField: "lotId",
          as: "spaces"
        }
      },
      {
        $addFields: {
          totalSpaces: { $size: "$spaces" },
          occupiedSpaces: {
            $size: {
              $filter: {
                input: "$spaces",
                cond: { $eq: ["$$this.status", "occupied"] }
              }
            }
          }
        }
      },
      {
          $addFields: {
            occupancyRate: {
              $cond: {
                if: { $eq: ["$totalSpaces", 0] },
                then: 0,
                else: {
                  $multiply: [
                    { $divide: ["$occupiedSpaces", "$totalSpaces"] },
                    100
                  ]
                }
              }
            }
          }
        },
      {
        $project: {
          name: 1,
          address: 1,
          totalSpaces: 1,
          occupiedSpaces: 1,
          availableSpaces: { $subtract: ["$totalSpaces", "$occupiedSpaces"] },
          occupancyRate: { $round: ["$occupancyRate", 2] }
        }
      }
    ])
    
    // 获取最近7天的收入趋势
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    sevenDaysAgo.setHours(0, 0, 0, 0)
    
    const revenueTrend = await Transaction.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paymentTime: { $gte: sevenDaysAgo },
          ...lotCondition
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentTime" } },
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])
    
    // 获取支付方式统计
    const paymentMethodStats = await Transaction.aggregate([
      {
        $match: {
          paymentStatus: 'paid',
          paymentTime: { $gte: todayStart },
          ...lotCondition
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          revenue: { $sum: "$totalAmount" },
          count: { $sum: 1 }
        }
      },
      { $sort: { revenue: -1 } }
    ])
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalLots,
          totalSpaces,
          occupiedSpaces,
          availableSpaces,
          totalOccupancyRate: Math.round(totalOccupancyRate * 100) / 100,
          todayRevenue: Math.round(todayRevenue * 100) / 100,
          todayTransactionCount
        },
        lotStats,
        revenueTrend,
        paymentMethodStats
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

module.exports = router