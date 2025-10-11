const Analytics = require('../models/Analytics')
const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const Transaction = require('../models/Transaction')
const { generatePagination, generateId } = require('../utils/helpers')

// 获取所有分析报告
const getAnalyticsReports = async (req, res) => {
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
    
    if (req.query.status) {
      query.status = req.query.status
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      }
    }
    
    // 执行查询
    const analyticsReports = await Analytics.find(query)
      .populate('lotId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await Analytics.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        analyticsReports,
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

// 获取单个分析报告
const getAnalyticsReport = async (req, res) => {
  try {
    const analyticsReport = await Analytics.findById(req.params.id)
      .populate('lotId', 'name address')
    
    if (!analyticsReport) {
      return res.status(404).json({
        success: false,
        message: '分析报告不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: analyticsReport
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建分析报告
const createAnalyticsReport = async (req, res) => {
  try {
    const { 
      reportId, lotId, type, name, description, period, 
      startDate, endDate, metrics, charts, insights, properties 
    } = req.body
    
    // 验证输入
    if (!reportId || !lotId || !type || !name || !period || !startDate || !endDate) {
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
    
    // 检查报告ID是否已存在
    const existingReport = await Analytics.findOne({ reportId, lotId })
    
    if (existingReport) {
      return res.status(400).json({
        success: false,
        message: '该停车场下已存在此报告ID'
      })
    }
    
    // 创建新分析报告
    const analyticsReport = new Analytics({
      reportId,
      lotId,
      type,
      name,
      description: description || '',
      period,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics: metrics || {},
      charts: charts || [],
      insights: insights || [],
      properties: properties || {}
    })
    
    await analyticsReport.save()
    
    // 返回分析报告信息
    const populatedReport = await Analytics.findById(analyticsReport._id)
      .populate('lotId', 'name')
    
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
}

// 更新分析报告
const updateAnalyticsReport = async (req, res) => {
  try {
    const { 
      type, name, description, period, startDate, endDate, 
      metrics, charts, insights, properties 
    } = req.body
    
    // 查找分析报告
    const analyticsReport = await Analytics.findById(req.params.id)
    
    if (!analyticsReport) {
      return res.status(404).json({
        success: false,
        message: '分析报告不存在'
      })
    }
    
    // 更新字段
    if (type) analyticsReport.type = type
    if (name) analyticsReport.name = name
    if (description) analyticsReport.description = description
    if (period) analyticsReport.period = period
    if (startDate) analyticsReport.startDate = new Date(startDate)
    if (endDate) analyticsReport.endDate = new Date(endDate)
    if (metrics) analyticsReport.metrics = metrics
    if (charts) analyticsReport.charts = charts
    if (insights) analyticsReport.insights = insights
    if (properties) analyticsReport.properties = properties
    
    await analyticsReport.save()
    
    // 返回分析报告信息
    const populatedReport = await Analytics.findById(analyticsReport._id)
      .populate('lotId', 'name')
    
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
}

// 删除分析报告
const deleteAnalyticsReport = async (req, res) => {
  try {
    const analyticsReport = await Analytics.findById(req.params.id)
    
    if (!analyticsReport) {
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
}

// 生成占用率分析报告
const generateOccupancyReport = async (req, res) => {
  try {
    const { lotId, startDate, endDate, groupBy = 'hour' } = req.body
    
    // 验证输入
    if (!lotId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID、开始日期和结束日期'
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
    
    // 获取停车场的所有停车位
    const totalSpaces = await ParkingSpace.countDocuments({ lotId })
    
    if (totalSpaces === 0) {
      return res.status(404).json({
        success: false,
        message: '停车场没有停车位'
      })
    }
    
    // 构建分组格式
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
    
    // 获取占用率数据（这里使用模拟数据，实际项目中应该从停车位状态历史记录中获取）
    // 由于没有停车位状态历史记录模型，我们生成模拟数据
    const start = new Date(startDate)
    const end = new Date(endDate)
    const occupancyData = []
    
    // 生成时间序列数据
    const timeDiff = end - start
    let interval
    
    switch (groupBy) {
      case 'hour':
        interval = 60 * 60 * 1000 // 1小时
        break
      case 'day':
        interval = 24 * 60 * 60 * 1000 // 1天
        break
      case 'week':
        interval = 7 * 24 * 60 * 60 * 1000 // 1周
        break
      case 'month':
        interval = 30 * 24 * 60 * 60 * 1000 // 1个月
        break
      default:
        interval = 24 * 60 * 60 * 1000 // 1天
    }
    
    for (let time = start; time <= end; time += interval) {
      const timeStr = time.toISOString().slice(0, 16).replace('T', ' ')
      
      // 模拟占用率数据，实际项目中应该从数据库获取
      const baseOccupancy = 0.7 // 基础占用率
      const variation = 0.2 // 变化范围
      
      // 根据时间段调整占用率
      let hourFactor = 1
      const hour = time.getHours()
      
      if (hour >= 9 && hour <= 11) {
        hourFactor = 1.2 // 上午高峰
      } else if (hour >= 18 && hour <= 20) {
        hourFactor = 1.3 // 晚上高峰
      } else if (hour >= 0 && hour <= 6) {
        hourFactor = 0.5 // 深夜低峰
      }
      
      // 周末调整
      const dayOfWeek = time.getDay()
      const weekendFactor = (dayOfWeek === 0 || dayOfWeek === 6) ? 0.8 : 1
      
      // 计算占用率
      const randomVariation = (Math.random() - 0.5) * variation
      let occupancyRate = baseOccupancy * hourFactor * weekendFactor + randomVariation
      
      // 确保占用率在0到1之间
      occupancyRate = Math.max(0, Math.min(1, occupancyRate))
      
      const occupiedSpaces = Math.floor(totalSpaces * occupancyRate)
      
      occupancyData.push({
        time: timeStr,
        occupiedSpaces,
        availableSpaces: totalSpaces - occupiedSpaces,
        occupancyRate: Math.round(occupancyRate * 100) / 100
      })
    }
    
    // 计算平均占用率
    const avgOccupancyRate = occupancyData.reduce((sum, data) => sum + data.occupancyRate, 0) / occupancyData.length
    
    // 计算峰值和谷值
    const peakOccupancy = Math.max(...occupancyData.map(data => data.occupancyRate))
    const lowOccupancy = Math.min(...occupancyData.map(data => data.occupancyRate))
    
    // 生成图表数据
    const chartData = {
      labels: occupancyData.map(data => data.time),
      datasets: [
        {
          label: '占用率 (%)',
          data: occupancyData.map(data => data.occupancyRate * 100),
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }
      ]
    }
    
    // 生成洞察
    const insights = [
      {
        type: 'summary',
        title: '占用率概览',
        content: `在 ${startDate} 至 ${endDate} 期间，停车场的平均占用率为 ${(avgOccupancyRate * 100).toFixed(2)}%，峰值占用率为 ${(peakOccupancy * 100).toFixed(2)}%，最低占用率为 ${(lowOccupancy * 100).toFixed(2)}%。`
      },
      {
        type: 'recommendation',
        title: '优化建议',
        content: avgOccupancyRate > 0.8 
          ? '停车场占用率较高，建议考虑动态定价或优化停车位分配以提高效率。'
          : avgOccupancyRate < 0.5 
            ? '停车场占用率较低，建议考虑营销活动或调整定价策略以吸引更多车辆。'
            : '停车场占用率处于合理水平，继续保持当前运营策略。'
      }
    ]
    
    // 创建报告
    const reportId = generateId('occupancy_report')
    const reportName = `${parkingLot.name} 占用率分析报告`
    
    const analyticsReport = new Analytics({
      reportId,
      lotId,
      type: 'occupancy',
      name: reportName,
      description: `停车场 ${parkingLot.name} 在 ${startDate} 至 ${endDate} 期间的占用率分析`,
      period: `${startDate} 至 ${endDate}`,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics: {
        totalSpaces,
        avgOccupancyRate: Math.round(avgOccupancyRate * 100) / 100,
        peakOccupancy: Math.round(peakOccupancy * 100) / 100,
        lowOccupancy: Math.round(lowOccupancy * 100) / 100
      },
      charts: [
        {
          type: 'line',
          title: '占用率趋势',
          data: chartData
        }
      ],
      insights
    })
    
    await analyticsReport.save()
    
    // 返回报告信息
    const populatedReport = await Analytics.findById(analyticsReport._id)
      .populate('lotId', 'name')
    
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
}

// 生成收入分析报告
const generateRevenueReport = async (req, res) => {
  try {
    const { lotId, startDate, endDate, groupBy = 'day' } = req.body
    
    // 验证输入
    if (!lotId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID、开始日期和结束日期'
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
    
    // 构建分组格式
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
    
    // 获取收入数据
    const revenueData = await Transaction.aggregate([
      {
        $match: {
          lotId,
          status: 'completed',
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
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
      {
        $match: {
          lotId,
          status: 'completed',
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
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
    
    // 获取支付方式统计
    const paymentStats = await Transaction.aggregate([
      {
        $match: {
          lotId,
          status: 'completed',
          createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
          }
        }
      },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" }
        }
      },
      { $sort: { totalAmount: -1 } }
    ])
    
    // 计算支付方式百分比
    const totalTransactions = paymentStats.reduce((sum, stat) => sum + stat.count, 0)
    
    paymentStats.forEach(stat => {
      stat.percentage = totalTransactions > 0 ? (stat.count / totalTransactions * 100).toFixed(2) : 0
    })
    
    // 生成收入趋势图表数据
    const revenueChartData = {
      labels: revenueData.map(data => data._id),
      datasets: [
        {
          label: '收入 (元)',
          data: revenueData.map(data => data.totalRevenue),
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
          yAxisID: 'y'
        },
        {
          label: '交易数',
          data: revenueData.map(data => data.transactionCount),
          backgroundColor: 'rgba(153, 102, 255, 0.2)',
          borderColor: 'rgba(153, 102, 255, 1)',
          borderWidth: 1,
          yAxisID: 'y1'
        }
      ]
    }
    
    // 生成支付方式图表数据
    const paymentChartData = {
      labels: paymentStats.map(stat => stat._id),
      datasets: [
        {
          label: '支付方式占比 (%)',
          data: paymentStats.map(stat => parseFloat(stat.percentage)),
          backgroundColor: [
            'rgba(255, 99, 132, 0.2)',
            'rgba(54, 162, 235, 0.2)',
            'rgba(255, 206, 86, 0.2)',
            'rgba(75, 192, 192, 0.2)',
            'rgba(153, 102, 255, 0.2)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)'
          ],
          borderWidth: 1
        }
      ]
    }
    
    // 生成洞察
    const insights = [
      {
        type: 'summary',
        title: '收入概览',
        content: `在 ${startDate} 至 ${endDate} 期间，停车场的总收入为 ${totalStats.totalRevenue.toFixed(2)} 元，总交易数为 ${totalStats.transactionCount} 笔，平均每笔交易金额为 ${totalStats.avgAmount.toFixed(2)} 元。`
      },
      {
        type: 'recommendation',
        title: '优化建议',
        content: paymentStats.length > 0 && paymentStats[0]._id === 'cash'
          ? '现金支付占比较高，建议推广电子支付方式以提高效率和用户体验。'
          : '支付方式分布较为均衡，继续保持当前支付策略。'
      }
    ]
    
    // 创建报告
    const reportId = generateId('revenue_report')
    const reportName = `${parkingLot.name} 收入分析报告`
    
    const analyticsReport = new Analytics({
      reportId,
      lotId,
      type: 'revenue',
      name: reportName,
      description: `停车场 ${parkingLot.name} 在 ${startDate} 至 ${endDate} 期间的收入分析`,
      period: `${startDate} 至 ${endDate}`,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      metrics: {
        totalRevenue: totalStats.totalRevenue,
        transactionCount: totalStats.transactionCount,
        avgAmount: totalStats.avgAmount
      },
      charts: [
        {
          type: 'line',
          title: '收入趋势',
          data: revenueChartData
        },
        {
          type: 'pie',
          title: '支付方式分布',
          data: paymentChartData
        }
      ],
      insights
    })
    
    await analyticsReport.save()
    
    // 返回报告信息
    const populatedReport = await Analytics.findById(analyticsReport._id)
      .populate('lotId', 'name')
    
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
}

// 获取实时停车场统计数据
const getRealTimeStats = async (req, res) => {
  try {
    const { lotId } = req.query
    
    // 构建查询条件
    const lotQuery = {}
    
    if (lotId) {
      lotQuery._id = lotId
    }
    
    // 获取停车场列表
    const parkingLots = await ParkingLot.find(lotQuery)
    
    if (parkingLots.length === 0) {
      return res.status(404).json({
        success: false,
        message: '没有找到停车场'
      })
    }
    
    // 获取每个停车场的统计数据
    const statsPromises = parkingLots.map(async (lot) => {
      // 获取停车位总数和已占用数
      const totalSpaces = await ParkingSpace.countDocuments({ lotId: lot._id })
      const occupiedSpaces = await ParkingSpace.countDocuments({ 
        lotId: lot._id, 
        status: 'occupied' 
      })
      
      // 计算占用率
      const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) : 0
      
      // 获取今日收入
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      
      const todayRevenue = await Transaction.aggregate([
        {
          $match: {
            lotId: lot._id,
            status: 'completed',
            createdAt: {
              $gte: today,
              $lt: tomorrow
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            transactionCount: { $sum: 1 }
          }
        }
      ])
      
      const revenueData = todayRevenue.length > 0 ? todayRevenue[0] : {
        totalRevenue: 0,
        transactionCount: 0
      }
      
      // 获取本周收入
      const weekStart = new Date(today)
      weekStart.setDate(weekStart.getDate() - weekStart.getDay())
      
      const weekRevenue = await Transaction.aggregate([
        {
          $match: {
            lotId: lot._id,
            status: 'completed',
            createdAt: {
              $gte: weekStart,
              $lt: tomorrow
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            transactionCount: { $sum: 1 }
          }
        }
      ])
      
      const weekRevenueData = weekRevenue.length > 0 ? weekRevenue[0] : {
        totalRevenue: 0,
        transactionCount: 0
      }
      
      // 获取本月收入
      const monthStart = new Date(today)
      monthStart.setDate(1)
      
      const monthRevenue = await Transaction.aggregate([
        {
          $match: {
            lotId: lot._id,
            status: 'completed',
            createdAt: {
              $gte: monthStart,
              $lt: tomorrow
            }
          }
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$amount" },
            transactionCount: { $sum: 1 }
          }
        }
      ])
      
      const monthRevenueData = monthRevenue.length > 0 ? monthRevenue[0] : {
        totalRevenue: 0,
        transactionCount: 0
      }
      
      return {
        lotId: lot._id,
        lotName: lot.name,
        lotAddress: lot.address,
        totalSpaces,
        occupiedSpaces,
        availableSpaces: totalSpaces - occupiedSpaces,
        occupancyRate: Math.round(occupancyRate * 100) / 100,
        todayRevenue: revenueData.totalRevenue,
        todayTransactions: revenueData.transactionCount,
        weekRevenue: weekRevenueData.totalRevenue,
        weekTransactions: weekRevenueData.transactionCount,
        monthRevenue: monthRevenueData.totalRevenue,
        monthTransactions: monthRevenueData.transactionCount
      }
    })
    
    const stats = await Promise.all(statsPromises)
    
    // 计算总体统计
    const totalStats = stats.reduce((acc, stat) => {
      acc.totalSpaces += stat.totalSpaces
      acc.occupiedSpaces += stat.occupiedSpaces
      acc.availableSpaces += stat.availableSpaces
      acc.todayRevenue += stat.todayRevenue
      acc.todayTransactions += stat.todayTransactions
      acc.weekRevenue += stat.weekRevenue
      acc.weekTransactions += stat.weekTransactions
      acc.monthRevenue += stat.monthRevenue
      acc.monthTransactions += stat.monthTransactions
      
      return acc
    }, {
      totalSpaces: 0,
      occupiedSpaces: 0,
      availableSpaces: 0,
      todayRevenue: 0,
      todayTransactions: 0,
      weekRevenue: 0,
      weekTransactions: 0,
      monthRevenue: 0,
      monthTransactions: 0
    })
    
    // 计算总体占用率
    totalStats.occupancyRate = totalStats.totalSpaces > 0 
      ? Math.round((totalStats.occupiedSpaces / totalStats.totalSpaces) * 100) / 100 
      : 0
    
    res.status(200).json({
      success: true,
      data: {
        stats,
        totalStats
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

module.exports = {
  getAnalyticsReports,
  getAnalyticsReport,
  createAnalyticsReport,
  updateAnalyticsReport,
  deleteAnalyticsReport,
  generateOccupancyReport,
  generateRevenueReport,
  getRealTimeStats
}