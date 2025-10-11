const ParkingSpace = require('../models/ParkingSpace')
const ParkingLot = require('../models/ParkingLot')
const { generatePagination, generateId } = require('../utils/helpers')

// 模拟单个停车位状态
const simulateParkingSpaceStatus = async (req, res) => {
  try {
    const { spaceId, lotId, status } = req.body
    
    // 验证输入
    if (!spaceId || !lotId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车位ID和停车场ID'
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
    
    // 查找停车位
    const parkingSpace = await ParkingSpace.findOne({ spaceId, lotId })
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    // 更新停车位状态
    const oldStatus = parkingSpace.status
    parkingSpace.status = status || parkingSpace.status
    
    // 如果是停车状态，更新停车时间
    if (parkingSpace.status === 'occupied') {
      parkingSpace.parkedAt = new Date()
      
      // 模拟车牌号
      if (!parkingSpace.licensePlate) {
        const plateChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
        const plateNumbers = '0123456789'
        let licensePlate = ''
        
        // 生成车牌号，格式: 省简称(1) + 字母(1) + 字母/数字(1) + · + 数字(5)
        licensePlate += '沪' // 假设是上海车牌
        
        for (let i = 0; i < 3; i++) {
          if (i === 0) {
            licensePlate += plateChars.charAt(Math.floor(Math.random() * plateChars.length))
          } else {
            const chars = plateChars + plateNumbers
            licensePlate += chars.charAt(Math.floor(Math.random() * chars.length))
          }
        }
        
        licensePlate += '·'
        
        for (let i = 0; i < 5; i++) {
          licensePlate += plateNumbers.charAt(Math.floor(Math.random() * plateNumbers.length))
        }
        
        parkingSpace.licensePlate = licensePlate
      }
    } else {
      parkingSpace.parkedAt = null
      parkingSpace.licensePlate = null
    }
    
    await parkingSpace.save()
    
    res.status(200).json({
      success: true,
      message: '停车位状态模拟成功',
      data: {
        spaceId: parkingSpace.spaceId,
        oldStatus,
        newStatus: parkingSpace.status,
        parkedAt: parkingSpace.parkedAt,
        licensePlate: parkingSpace.licensePlate
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

// 批量模拟停车位状态
const simulateBatchParkingSpaceStatus = async (req, res) => {
  try {
    const { lotId, floorId, status, count } = req.body
    
    // 验证输入
    if (!lotId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID'
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
    
    // 构建查询条件
    const query = { lotId }
    
    if (floorId) {
      query.floorId = floorId
    }
    
    // 获取符合条件的停车位
    let parkingSpaces = await ParkingSpace.find(query)
    
    // 如果指定了状态，只获取该状态的停车位
    if (status) {
      parkingSpaces = parkingSpaces.filter(space => space.status !== status)
    }
    
    // 如果指定了数量，随机选择指定数量的停车位
    if (count && count > 0 && count < parkingSpaces.length) {
      const shuffled = parkingSpaces.sort(() => 0.5 - Math.random())
      parkingSpaces = shuffled.slice(0, count)
    }
    
    // 更新停车位状态
    const updatedSpaces = []
    const plateChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const plateNumbers = '0123456789'
    
    for (const space of parkingSpaces) {
      const oldStatus = space.status
      
      // 如果没有指定状态，随机生成状态
      const newStatus = status || (Math.random() > 0.7 ? 'occupied' : 'available')
      space.status = newStatus
      
      // 如果是停车状态，更新停车时间和车牌号
      if (space.status === 'occupied') {
        space.parkedAt = new Date()
        
        // 模拟车牌号
        if (!space.licensePlate) {
          let licensePlate = ''
          
          // 生成车牌号，格式: 省简称(1) + 字母(1) + 字母/数字(1) + · + 数字(5)
          licensePlate += '沪' // 假设是上海车牌
          
          for (let i = 0; i < 3; i++) {
            if (i === 0) {
              licensePlate += plateChars.charAt(Math.floor(Math.random() * plateChars.length))
            } else {
              const chars = plateChars + plateNumbers
              licensePlate += chars.charAt(Math.floor(Math.random() * chars.length))
            }
          }
          
          licensePlate += '·'
          
          for (let i = 0; i < 5; i++) {
            licensePlate += plateNumbers.charAt(Math.floor(Math.random() * plateNumbers.length))
          }
          
          space.licensePlate = licensePlate
        }
      } else {
        space.parkedAt = null
        space.licensePlate = null
      }
      
      await space.save()
      
      updatedSpaces.push({
        spaceId: space.spaceId,
        oldStatus,
        newStatus: space.status,
        parkedAt: space.parkedAt,
        licensePlate: space.licensePlate
      })
    }
    
    res.status(200).json({
      success: true,
      message: `成功模拟 ${updatedSpaces.length} 个停车位状态`,
      data: updatedSpaces
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 随机模拟停车场状态
const simulateRandomParkingLotStatus = async (req, res) => {
  try {
    const { lotId, occupiedRatio = 0.7 } = req.body
    
    // 验证输入
    if (!lotId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID'
      })
    }
    
    if (occupiedRatio < 0 || occupiedRatio > 1) {
      return res.status(400).json({
        success: false,
        message: '占用率必须在0到1之间'
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
    
    // 获取所有停车位
    const parkingSpaces = await ParkingSpace.find({ lotId })
    
    if (parkingSpaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: '停车场没有停车位'
      })
    }
    
    // 计算需要占用的停车位数量
    const occupiedCount = Math.floor(parkingSpaces.length * occupiedRatio)
    
    // 随机选择停车位
    const shuffled = parkingSpaces.sort(() => 0.5 - Math.random())
    const occupiedSpaces = shuffled.slice(0, occupiedCount)
    const availableSpaces = shuffled.slice(occupiedCount)
    
    // 更新停车位状态
    const plateChars = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
    const plateNumbers = '0123456789'
    
    // 更新占用的停车位
    for (const space of occupiedSpaces) {
      space.status = 'occupied'
      space.parkedAt = new Date()
      
      // 模拟车牌号
      if (!space.licensePlate) {
        let licensePlate = ''
        
        // 生成车牌号，格式: 省简称(1) + 字母(1) + 字母/数字(1) + · + 数字(5)
        licensePlate += '沪' // 假设是上海车牌
        
        for (let i = 0; i < 3; i++) {
          if (i === 0) {
            licensePlate += plateChars.charAt(Math.floor(Math.random() * plateChars.length))
          } else {
            const chars = plateChars + plateNumbers
            licensePlate += chars.charAt(Math.floor(Math.random() * chars.length))
          }
        }
        
        licensePlate += '·'
        
        for (let i = 0; i < 5; i++) {
          licensePlate += plateNumbers.charAt(Math.floor(Math.random() * plateNumbers.length))
        }
        
        space.licensePlate = licensePlate
      }
      
      await space.save()
    }
    
    // 更新可用的停车位
    for (const space of availableSpaces) {
      space.status = 'available'
      space.parkedAt = null
      space.licensePlate = null
      
      await space.save()
    }
    
    res.status(200).json({
      success: true,
      message: `成功模拟停车场状态，占用率: ${occupiedRatio}`,
      data: {
        totalSpaces: parkingSpaces.length,
        occupiedCount,
        availableCount: parkingSpaces.length - occupiedCount,
        occupiedRatio
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

// 获取模拟历史记录
const getSimulationHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = { type: 'simulation' }
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.createdAt = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      }
    }
    
    // 这里应该有一个模拟记录模型，为了简化，我们返回一个模拟的历史记录
    // 在实际项目中，应该创建一个SimulationRecord模型来存储模拟记录
    
    res.status(200).json({
      success: true,
      message: '获取模拟历史记录成功',
      data: {
        history: [], // 实际项目中应该从数据库获取
        pagination: generatePagination(page, limit, 0)
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

// 重置停车位状态
const resetParkingSpaceStatus = async (req, res) => {
  try {
    const { lotId, floorId } = req.body
    
    // 验证输入
    if (!lotId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID'
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
    
    // 构建查询条件
    const query = { lotId }
    
    if (floorId) {
      query.floorId = floorId
    }
    
    // 重置停车位状态
    const result = await ParkingSpace.updateMany(query, {
      status: 'available',
      parkedAt: null,
      licensePlate: null
    })
    
    res.status(200).json({
      success: true,
      message: `成功重置 ${result.modifiedCount} 个停车位状态`,
      data: {
        modifiedCount: result.modifiedCount
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

// 实时模拟停车位状态变化
const startRealTimeSimulation = async (req, res) => {
  try {
    const { lotId, interval = 5000, changeRatio = 0.1 } = req.body
    
    // 验证输入
    if (!lotId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID'
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
    
    // 这里应该启动一个定时任务来实时模拟停车位状态变化
    // 为了简化，我们只返回一个成功响应
    // 在实际项目中，可以使用node-cron或其他定时任务库来实现
    
    res.status(200).json({
      success: true,
      message: `成功启动实时模拟，间隔: ${interval}ms，变化率: ${changeRatio}`,
      data: {
        lotId,
        interval,
        changeRatio
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

// 停止实时模拟
const stopRealTimeSimulation = async (req, res) => {
  try {
    const { lotId } = req.body
    
    // 验证输入
    if (!lotId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID'
      })
    }
    
    // 这里应该停止对应的定时任务
    // 为了简化，我们只返回一个成功响应
    
    res.status(200).json({
      success: true,
      message: '成功停止实时模拟',
      data: {
        lotId
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
  simulateParkingSpaceStatus,
  simulateBatchParkingSpaceStatus,
  simulateRandomParkingLotStatus,
  getSimulationHistory,
  resetParkingSpaceStatus,
  startRealTimeSimulation,
  stopRealTimeSimulation
}