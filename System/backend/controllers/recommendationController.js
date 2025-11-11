const { ParkingLot, ParkingSpace, MapNode, MiniProgramUser, Vehicle, ParkingRecord } = require('../models')
const { calculateDistance } = require('../utils/helpers')

/**
 * 获取停车场推荐车位
 * 根据用户位置和偏好推荐最近或最适合的空闲车位
 */
const getRecommendedParkingSpaces = async (req, res) => {
  try {
    const { 
      parkingLotId, 
      userLocation, // {x, y, floor}
      preferences = {}, // 偏好设置
      vehicleType = 'standard' // 车辆类型
    } = req.body

    // 验证停车场是否存在
    const parkingLot = await ParkingLot.findById(parkingLotId)
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }

    // 查询所有空闲车位
    const availableSpaces = await ParkingSpace.find({
      parkingLotId,
      status: 'available',
      type: vehicleType === 'electric' ? 'electric' : { $in: ['standard', 'disabled'] }
    }).populate('nodeId')

    if (!availableSpaces || availableSpaces.length === 0) {
      return res.status(200).json({
        success: true,
        message: '当前没有可用车位',
        data: {
          recommendedSpaces: [],
          availableCount: 0
        }
      })
    }

    // 如果没有提供用户位置，使用停车场入口作为默认位置
    let startPoint = userLocation
    if (!startPoint) {
      const entranceNode = await MapNode.findOne({
        parkingLotId,
        type: 'entrance',
        isActive: true
      })
      
      if (entranceNode) {
        startPoint = {
          x: entranceNode.coordinates.x,
          y: entranceNode.coordinates.y,
          floor: entranceNode.floor
        }
      } else {
        // 如果没有入口节点，使用第一个可用车位的位置作为参考
        startPoint = {
          x: availableSpaces[0].coordinates.x,
          y: availableSpaces[0].coordinates.y,
          floor: availableSpaces[0].floor
        }
      }
    }

    // 计算每个车位的推荐分数
    const spacesWithScore = availableSpaces.map(space => {
      // 计算距离分数（距离越近分数越高）
      const distance = calculateDistance(
        startPoint.x, startPoint.y,
        space.coordinates.x, space.coordinates.y
      )
      
      // 楼层差异分数
      const floorDiff = Math.abs(startPoint.floor - space.floor)
      const floorScore = floorDiff === 0 ? 100 : (100 - floorDiff * 20)
      
      // 距离分数（转换为0-100分，距离越近分数越高）
      const maxDistance = 500 // 假设最大距离为500单位
      const distanceScore = Math.max(0, 100 - (distance / maxDistance) * 100)
      
      // 偏好分数
      let preferenceScore = 50 // 默认分数
      
      if (preferences.preferNearExit && space.section && space.section.includes('exit')) {
        preferenceScore += 20
      }
      
      if (preferences.preferGroundFloor && space.floor === 1) {
        preferenceScore += 15
      }
      
      if (preferences.avoidStairs && space.nodeId && space.nodeId.name && space.nodeId.name.includes('elevator')) {
        preferenceScore += 10
      }
      
      // 车位类型偏好
      if (preferences.preferDisabled && space.type === 'disabled') {
        preferenceScore += 25
      }
      
      if (preferences.preferElectric && space.type === 'electric') {
        preferenceScore += 25
      }
      
      // 综合分数（权重：距离40%，楼层20%，偏好40%）
      const totalScore = (distanceScore * 0.4) + (floorScore * 0.2) + (preferenceScore * 0.4)
      
      return {
        ...space.toObject(),
        distance,
        floorDiff,
        scores: {
          distance: Math.round(distanceScore),
          floor: Math.round(floorScore),
          preference: Math.round(preferenceScore),
          total: Math.round(totalScore)
        }
      }
    })

    // 按总分排序
    spacesWithScore.sort((a, b) => b.scores.total - a.scores.total)
    
    // 返回推荐车位（默认返回前5个）
    const recommendedCount = preferences.recommendCount || 5
    const recommendedSpaces = spacesWithScore.slice(0, recommendedCount)
    
    res.status(200).json({
      success: true,
      message: '获取推荐车位成功',
      data: {
        recommendedSpaces,
        availableCount: availableSpaces.length,
        startPoint
      }
    })
  } catch (error) {
    console.error('获取推荐车位失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 获取停车场可用车位统计
 */
const getParkingSpaceStats = async (req, res) => {
  try {
    const { parkingLotId } = req.params
    
    // 验证停车场是否存在
    const parkingLot = await ParkingLot.findById(parkingLotId)
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }

    // 按楼层统计车位状态
    const floorStats = await ParkingSpace.aggregate([
      { $match: { parkingLotId: parkingLot._id } },
      {
        $group: {
          _id: '$floor',
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] }
          },
          occupied: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          },
          reserved: {
            $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] }
          },
          outOfOrder: {
            $sum: { $cond: [{ $eq: ['$status', 'out_of_order'] }, 1, 0] }
          },
          electric: {
            $sum: { $cond: [{ $eq: ['$type', 'electric'] }, 1, 0] }
          },
          disabled: {
            $sum: { $cond: [{ $eq: ['$type', 'disabled'] }, 1, 0] }
          }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // 计算总体统计
    const totalStats = floorStats.reduce(
      (acc, floor) => {
        acc.total += floor.total
        acc.available += floor.available
        acc.occupied += floor.occupied
        acc.reserved += floor.reserved
        acc.outOfOrder += floor.outOfOrder
        acc.electric += floor.electric
        acc.disabled += floor.disabled
        return acc
      },
      { total: 0, available: 0, occupied: 0, reserved: 0, outOfOrder: 0, electric: 0, disabled: 0 }
    )

    // 计算占用率
    const occupancyRate = totalStats.total > 0 
      ? Math.round((totalStats.occupied / totalStats.total) * 100) 
      : 0

    res.status(200).json({
      success: true,
      message: '获取车位统计成功',
      data: {
        parkingLotId,
        totalStats,
        floorStats,
        occupancyRate
      }
    })
  } catch (error) {
    console.error('获取车位统计失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 获取停车场地图数据
 */
const getParkingLotMap = async (req, res) => {
  try {
    const { parkingLotId } = req.params
    const { floor } = req.query
    
    // 验证停车场是否存在
    const parkingLot = await ParkingLot.findById(parkingLotId)
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }

    // 构建查询条件
    const query = { parkingLotId }
    if (floor) {
      query.floor = parseInt(floor)
    }

    // 获取地图节点
    const mapNodes = await MapNode.find(query).sort({ floor: 1, type: 1 })

    // 获取车位信息
    const parkingSpaces = await ParkingSpace.find(query).populate('nodeId')

    // 按楼层组织数据
    const floorMap = {}
    
    // 处理节点数据
    mapNodes.forEach(node => {
      if (!floorMap[node.floor]) {
        floorMap[node.floor] = {
          floor: node.floor,
          nodes: [],
          spaces: []
        }
      }
      
      floorMap[node.floor].nodes.push({
        id: node._id,
        nodeId: node.nodeId,
        type: node.type,
        name: node.name,
        coordinates: node.coordinates,
        connections: node.connections,
        isActive: node.isActive
      })
    })

    // 处理车位数据
    parkingSpaces.forEach(space => {
      if (!floorMap[space.floor]) {
        floorMap[space.floor] = {
          floor: space.floor,
          nodes: [],
          spaces: []
        }
      }
      
      floorMap[space.floor].spaces.push({
        id: space._id,
        spaceId: space.spaceId,
        floor: space.floor,
        section: space.section,
        spaceNumber: space.spaceNumber,
        type: space.type,
        status: space.status,
        coordinates: space.coordinates,
        nodeId: space.nodeId,
        vehicleInfo: space.vehicleInfo
      })
    })

    // 转换为数组格式
    const mapData = Object.values(floorMap)

    res.status(200).json({
      success: true,
      message: '获取停车场地图数据成功',
      data: {
        parkingLot: {
          id: parkingLot._id,
          name: parkingLot.name,
          address: parkingLot.address,
          floors: parkingLot.floors
        },
        mapData
      }
    })
  } catch (error) {
    console.error('获取停车场地图数据失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

module.exports = {
  getRecommendedParkingSpaces,
  getParkingSpaceStats,
  getParkingLotMap
}