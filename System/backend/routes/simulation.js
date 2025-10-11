const express = require('express')
const ParkingSpace = require('../models/ParkingSpace')
const ParkingLot = require('../models/ParkingLot')
const auth = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 模拟停车位状态变化
router.post('/spaces/status', async (req, res) => {
  try {
    const { lotId, floorId, count, changeType } = req.body
    
    // 验证输入
    if (!lotId || !count || !changeType) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 构建查询条件
    const query = { lotId }
    if (floorId) {
      query.floorId = floorId
    }
    
    // 获取停车位
    let spaces = await ParkingSpace.find(query)
    
    if (spaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到符合条件的停车位'
      })
    }
    
    // 随机选择停车位
    const selectedSpaces = []
    const shuffled = spaces.sort(() => 0.5 - Math.random())
    const selected = shuffled.slice(0, Math.min(count, spaces.length))
    
    // 更新停车位状态
    const updatedSpaces = []
    
    for (const space of selected) {
      let newStatus = space.status
      
      switch (changeType) {
        case 'random':
          const statuses = ['available', 'occupied', 'reserved']
          newStatus = statuses[Math.floor(Math.random() * statuses.length)]
          break
        case 'available':
          newStatus = 'available'
          break
        case 'occupied':
          newStatus = 'occupied'
          // 添加占用信息
          space.occupiedBy = {
            userId: `user_${Math.floor(Math.random() * 10000)}`,
            vehicleNumber: `京A${Math.floor(Math.random() * 100000)}`,
            entryTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000), // 过去24小时内随机时间
            estimatedExitTime: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000) // 未来8小时内随机时间
          }
          break
        case 'reserved':
          newStatus = 'reserved'
          break
        case 'maintenance':
          newStatus = 'maintenance'
          break
      }
      
      space.status = newStatus
      space.lastUpdated = new Date()
      
      await space.save()
      
      updatedSpaces.push({
        id: space._id,
        spaceId: space.spaceId,
        floorId: space.floorId,
        status: space.status,
        occupiedBy: space.occupiedBy
      })
    }
    
    res.status(200).json({
      success: true,
      message: `成功模拟 ${updatedSpaces.length} 个停车位状态变化`,
      data: updatedSpaces
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 批量模拟停车位状态
router.post('/spaces/batch', async (req, res) => {
  try {
    const { lotId, simulationRules } = req.body
    
    // 验证输入
    if (!lotId || !simulationRules || !Array.isArray(simulationRules)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的模拟规则'
      })
    }
    
    // 获取停车场所有停车位
    const spaces = await ParkingSpace.find({ lotId })
    
    if (spaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: '停车场没有停车位'
      })
    }
    
    // 应用模拟规则
    const updatedSpaces = []
    
    for (const space of spaces) {
      // 查找匹配的规则
      let matchedRule = null
      
      for (const rule of simulationRules) {
        let isMatch = true
        
        if (rule.floorId && space.floorId !== rule.floorId) {
          isMatch = false
        }
        
        if (rule.area && space.area !== rule.area) {
          isMatch = false
        }
        
        if (rule.type && space.type !== rule.type) {
          isMatch = false
        }
        
        if (isMatch) {
          matchedRule = rule
          break
        }
      }
      
      // 应用规则
      if (matchedRule) {
        let newStatus = space.status
        
        // 根据规则的概率决定是否改变状态
        if (Math.random() < matchedRule.probability) {
          // 根据权重随机选择新状态
          const totalWeight = matchedRule.statusOptions.reduce((sum, option) => sum + option.weight, 0)
          let random = Math.random() * totalWeight
          
          for (const option of matchedRule.statusOptions) {
            random -= option.weight
            if (random <= 0) {
              newStatus = option.status
              break
            }
          }
          
          // 更新状态
          space.status = newStatus
          space.lastUpdated = new Date()
          
          // 如果是占用状态，添加占用信息
          if (newStatus === 'occupied') {
            space.occupiedBy = {
              userId: `user_${Math.floor(Math.random() * 10000)}`,
              vehicleNumber: `京A${Math.floor(Math.random() * 100000)}`,
              entryTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
              estimatedExitTime: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000)
            }
          } else {
            space.occupiedBy = undefined
          }
          
          await space.save()
          
          updatedSpaces.push({
            id: space._id,
            spaceId: space.spaceId,
            floorId: space.floorId,
            status: space.status,
            occupiedBy: space.occupiedBy
          })
        }
      }
    }
    
    res.status(200).json({
      success: true,
      message: `成功模拟 ${updatedSpaces.length} 个停车位状态变化`,
      data: updatedSpaces
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 模拟实时停车位变化
router.post('/spaces/realtime', async (req, res) => {
  try {
    const { lotId, interval, duration } = req.body
    
    // 验证输入
    if (!lotId || !interval || !duration) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 获取停车场信息
    const lot = await ParkingLot.findById(lotId)
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }
    
    // 获取停车位
    const spaces = await ParkingSpace.find({ lotId })
    
    if (spaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: '停车场没有停车位'
      })
    }
    
    // 计算模拟次数
    const simulationCount = Math.floor(duration * 60 * 1000 / interval)
    
    // 启动实时模拟
    const simulationResults = []
    let simulationId = Date.now()
    
    // 使用setTimeout模拟实时变化
    const runSimulation = async (count) => {
      if (count <= 0) return
      
      // 随机选择一些停车位进行状态变化
      const changeCount = Math.floor(Math.random() * 5) + 1 // 每次变化1-5个停车位
      const selectedSpaces = []
      const shuffled = spaces.sort(() => 0.5 - Math.random())
      const selected = shuffled.slice(0, Math.min(changeCount, spaces.length))
      
      // 更新停车位状态
      const updatedSpaces = []
      
      for (const space of selected) {
        // 随机决定状态变化类型
        const changeType = Math.random()
        let newStatus = space.status
        
        if (space.status === 'available' && changeType < 0.3) {
          // 30%概率从可用变为占用
          newStatus = 'occupied'
          space.occupiedBy = {
            userId: `user_${Math.floor(Math.random() * 10000)}`,
            vehicleNumber: `京A${Math.floor(Math.random() * 100000)}`,
            entryTime: new Date(),
            estimatedExitTime: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000)
          }
        } else if (space.status === 'occupied' && changeType < 0.6) {
          // 60%概率从占用变为可用
          newStatus = 'available'
          space.occupiedBy = undefined
        } else if (space.status === 'reserved' && changeType < 0.4) {
          // 40%概率从预留变为占用
          newStatus = 'occupied'
          if (!space.occupiedBy) {
            space.occupiedBy = {
              userId: `user_${Math.floor(Math.random() * 10000)}`,
              vehicleNumber: `京A${Math.floor(Math.random() * 100000)}`,
              entryTime: new Date(),
              estimatedExitTime: new Date(Date.now() + Math.random() * 8 * 60 * 60 * 1000)
            }
          }
        } else if (space.status === 'available' && changeType < 0.1) {
          // 10%概率从可用变为预留
          newStatus = 'reserved'
        }
        
        space.status = newStatus
        space.lastUpdated = new Date()
        
        await space.save()
        
        updatedSpaces.push({
          id: space._id,
          spaceId: space.spaceId,
          floorId: space.floorId,
          status: space.status,
          occupiedBy: space.occupiedBy
        })
      }
      
      // 记录模拟结果
      simulationResults.push({
        timestamp: new Date(),
        changes: updatedSpaces
      })
      
      // 继续下一次模拟
      setTimeout(() => runSimulation(count - 1), interval)
    }
    
    // 启动模拟
    runSimulation(simulationCount)
    
    res.status(200).json({
      success: true,
      message: `已启动实时模拟，将持续 ${duration} 分钟，每 ${interval} 毫秒更新一次`,
      data: {
        simulationId,
        lotId,
        lotName: lot.name,
        totalSpaces: spaces.length,
        interval,
        duration,
        simulationCount
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

// 获取模拟历史记录
router.get('/history/:lotId', async (req, res) => {
  try {
    const lotId = req.params.lotId
    const { startDate, endDate } = req.query
    
    // 构建查询条件
    const query = { lotId }
    
    if (startDate || endDate) {
      query.lastUpdated = {}
      if (startDate) {
        query.lastUpdated.$gte = new Date(startDate)
      }
      if (endDate) {
        query.lastUpdated.$lte = new Date(endDate)
      }
    }
    
    // 获取停车位状态变化历史
    const spaces = await ParkingSpace.find(query)
      .select('spaceId floorId status lastUpdated occupiedBy')
      .sort({ lastUpdated: -1 })
    
    // 按时间分组
    const history = {}
    
    spaces.forEach(space => {
      const dateKey = space.lastUpdated.toISOString().split('T')[0]
      
      if (!history[dateKey]) {
        history[dateKey] = {
          date: dateKey,
          changes: []
        }
      }
      
      history[dateKey].changes.push({
        spaceId: space.spaceId,
        floorId: space.floorId,
        status: space.status,
        time: space.lastUpdated,
        occupiedBy: space.occupiedBy
      })
    })
    
    // 转换为数组并按日期排序
    const historyArray = Object.values(history).sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })
    
    res.status(200).json({
      success: true,
      data: historyArray
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 重置所有停车位状态
router.post('/spaces/reset/:lotId', async (req, res) => {
  try {
    const lotId = req.params.lotId
    const { status } = req.body
    
    // 获取停车位
    const spaces = await ParkingSpace.find({ lotId })
    
    if (spaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: '停车场没有停车位'
      })
    }
    
    // 重置所有停车位状态
    for (const space of spaces) {
      space.status = status || 'available'
      space.lastUpdated = new Date()
      space.occupiedBy = undefined
      
      await space.save()
    }
    
    res.status(200).json({
      success: true,
      message: `成功重置 ${spaces.length} 个停车位状态为 ${status || 'available'}`
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