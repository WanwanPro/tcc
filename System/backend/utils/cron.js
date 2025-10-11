const cron = require('node-cron')
const ParkingSpace = require('../models/ParkingSpace')
const Transaction = require('../models/Transaction')
const SimulationHistory = require('../models/SimulationHistory')
const logger = require('./logger')

// 自动更新超时停车状态
const updateOverdueParking = cron.schedule('0 */30 * * * *', async () => {
  try {
    logger.info('开始检查超时停车')
    
    // 查找所有已占用但没有退出时间的停车位
    const overdueSpaces = await ParkingSpace.find({
      status: 'occupied',
      'vehicleInfo.estimatedExitTime': { $lt: new Date() }
    }).populate('parkingLotId')
    
    logger.info(`发现 ${overdueSpaces.length} 个超时停车位`)
    
    // 更新这些停车位的状态
    for (const space of overdueSpaces) {
      // 计算停车时长
      const entryTime = space.vehicleInfo.entryTime
      const now = new Date()
      const duration = Math.floor((now - entryTime) / (1000 * 60)) // 分钟
      
      // 查找对应的交易记录
      const transaction = await Transaction.findOne({
        parkingSpaceId: space._id,
        status: 'active'
      })
      
      if (transaction) {
        // 更新交易记录
        transaction.exitTime = now
        transaction.duration = duration
        transaction.status = 'completed'
        await transaction.save()
        
        logger.info(`更新交易记录 ${transaction.transactionId}，停车时长: ${duration} 分钟`)
      }
      
      // 重置停车位状态
      space.status = 'available'
      space.vehicleInfo = undefined
      await space.save()
      
      logger.info(`重置停车位 ${space.spaceId} 状态为可用`)
    }
    
    logger.info('超时停车检查完成')
  } catch (error) {
    logger.error('检查超时停车时出错:', error)
  }
}, {
  scheduled: false // 不立即启动，由应用控制
})

// 每日数据统计
const dailyStatsReport = cron.schedule('0 1 * * *', async () => {
  try {
    logger.info('开始生成每日数据统计报告')
    
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    yesterday.setHours(0, 0, 0, 0)
    
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // 统计昨日交易
    const yesterdayTransactions = await Transaction.find({
      createdAt: {
        $gte: yesterday,
        $lt: today
      }
    })
    
    const totalRevenue = yesterdayTransactions.reduce((sum, transaction) => {
      return sum + (transaction.status === 'completed' ? transaction.amount : 0)
    }, 0)
    
    const completedTransactions = yesterdayTransactions.filter(t => t.status === 'completed').length
    
    // 统计停车位占用率
    const totalSpaces = await ParkingSpace.countDocuments()
    const occupiedSpaces = await ParkingSpace.countDocuments({ status: 'occupied' })
    const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces * 100).toFixed(2) : 0
    
    // 记录统计结果
    logger.info(`每日统计报告生成完成: 总收入: ${totalRevenue}, 完成交易: ${completedTransactions}, 占用率: ${occupancyRate}%`)
    
    // 这里可以将报告保存到数据库或发送邮件
  } catch (error) {
    logger.error('生成每日统计报告时出错:', error)
  }
}, {
  scheduled: false
})

// 清理过期的模拟历史记录
const cleanupSimulationHistory = cron.schedule('0 2 1 * *', async () => {
  try {
    logger.info('开始清理过期的模拟历史记录')
    
    // 删除30天前的模拟历史记录
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    const result = await SimulationHistory.deleteMany({
      createdAt: { $lt: thirtyDaysAgo }
    })
    
    logger.info(`清理了 ${result.deletedCount} 条过期的模拟历史记录`)
  } catch (error) {
    logger.error('清理模拟历史记录时出错:', error)
  }
}, {
  scheduled: false
})

// 实时停车位状态模拟
let realTimeSimulationInterval = null

const startRealTimeSimulation = async (parkingLotId, interval = 60000) => {
  try {
    // 停止现有的模拟
    if (realTimeSimulationInterval) {
      clearInterval(realTimeSimulationInterval)
    }
    
    logger.info(`启动停车场 ${parkingLotId} 的实时模拟，间隔: ${interval}ms`)
    
    // 立即执行一次
    await simulateParkingLotStatus(parkingLotId)
    
    // 设置定时器
    realTimeSimulationInterval = setInterval(async () => {
      await simulateParkingLotStatus(parkingLotId)
    }, interval)
    
    return true
  } catch (error) {
    logger.error('启动实时模拟时出错:', error)
    return false
  }
}

const stopRealTimeSimulation = () => {
  try {
    if (realTimeSimulationInterval) {
      clearInterval(realTimeSimulationInterval)
      realTimeSimulationInterval = null
      logger.info('已停止实时模拟')
      return true
    }
    return false
  } catch (error) {
    logger.error('停止实时模拟时出错:', error)
    return false
  }
}

// 模拟停车场状态
const simulateParkingLotStatus = async (parkingLotId) => {
  try {
    // 获取停车场所有停车位
    const spaces = await ParkingSpace.find({ parkingLotId })
    
    if (spaces.length === 0) {
      return
    }
    
    // 随机选择一些停车位进行状态变更
    const numToChange = Math.floor(Math.random() * Math.min(5, spaces.length * 0.1)) + 1
    const spacesToChange = []
    
    // 随机选择停车位
    while (spacesToChange.length < numToChange && spacesToChange.length < spaces.length) {
      const randomIndex = Math.floor(Math.random() * spaces.length)
      const space = spaces[randomIndex]
      
      if (!spacesToChange.includes(space)) {
        spacesToChange.push(space)
      }
    }
    
    // 更新选中的停车位状态
    for (const space of spacesToChange) {
      const statuses = ['available', 'occupied', 'reserved']
      const currentIndex = statuses.indexOf(space.status)
      
      // 随机选择一个新状态（避免选择相同状态）
      let newIndex
      do {
        newIndex = Math.floor(Math.random() * statuses.length)
      } while (newIndex === currentIndex)
      
      const newStatus = statuses[newIndex]
      
      // 如果新状态是占用，添加车辆信息
      let vehicleInfo = undefined
      if (newStatus === 'occupied') {
        vehicleInfo = {
          licensePlate: `模拟${Math.floor(Math.random() * 10000)}`,
          entryTime: new Date(),
          estimatedExitTime: new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000) // 4小时内
        }
      }
      
      // 更新停车位状态
      await ParkingSpace.findByIdAndUpdate(space._id, {
        status: newStatus,
        vehicleInfo
      })
      
      // 记录模拟历史
      await SimulationHistory.create({
        parkingSpaceId: space._id,
        previousStatus: space.status,
        newStatus,
        simulatedBy: null, // 系统模拟
        simulationType: 'real_time'
      })
    }
    
    logger.info(`模拟了 ${spacesToChange.length} 个停车位的状态变更`)
  } catch (error) {
    logger.error('模拟停车场状态时出错:', error)
  }
}

// 启动所有定时任务
const startAllCronJobs = () => {
  updateOverdueParking.start()
  dailyStatsReport.start()
  cleanupSimulationHistory.start()
  logger.info('所有定时任务已启动')
}

// 停止所有定时任务
const stopAllCronJobs = () => {
  updateOverdueParking.stop()
  dailyStatsReport.stop()
  cleanupSimulationHistory.stop()
  stopRealTimeSimulation()
  logger.info('所有定时任务已停止')
}

module.exports = {
  updateOverdueParking,
  dailyStatsReport,
  cleanupSimulationHistory,
  startRealTimeSimulation,
  stopRealTimeSimulation,
  startAllCronJobs,
  stopAllCronJobs
}