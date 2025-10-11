const NavigationPath = require('../models/NavigationPath')
const MapNode = require('../models/MapNode')
const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const { 
  generatePagination, 
  generateId,
  dijkstra,
  aStar
} = require('../utils/helpers')

// 获取所有导航路径
const getNavigationPaths = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.startNodeId) {
      query.startNodeId = req.query.startNodeId
    }
    
    if (req.query.endNodeId) {
      query.endNodeId = req.query.endNodeId
    }
    
    if (req.query.search) {
      query.$or = [
        { pathId: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const navigationPaths = await NavigationPath.find(query)
      .populate('lotId', 'name address')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await NavigationPath.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        navigationPaths,
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

// 获取单个导航路径
const getNavigationPath = async (req, res) => {
  try {
    const navigationPath = await NavigationPath.findById(req.params.id)
      .populate('lotId', 'name address')
    
    if (!navigationPath) {
      return res.status(404).json({
        success: false,
        message: '导航路径不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: navigationPath
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建导航路径
const createNavigationPath = async (req, res) => {
  try {
    const { 
      pathId, lotId, startNodeId, endNodeId, name, description, 
      path, distance, estimatedTime, properties 
    } = req.body
    
    // 验证输入
    if (!pathId || !lotId || !startNodeId || !endNodeId || !path) {
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
    
    // 检查路径ID是否已存在
    const existingPath = await NavigationPath.findOne({ pathId, lotId })
    
    if (existingPath) {
      return res.status(400).json({
        success: false,
        message: '该停车场下已存在此路径ID'
      })
    }
    
    // 创建新导航路径
    const navigationPath = new NavigationPath({
      pathId,
      lotId,
      startNodeId,
      endNodeId,
      name: name || '',
      description: description || '',
      path,
      distance: distance || 0,
      estimatedTime: estimatedTime || 0,
      properties: properties || {}
    })
    
    await navigationPath.save()
    
    // 返回导航路径信息
    const populatedPath = await NavigationPath.findById(navigationPath._id)
      .populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: '导航路径创建成功',
      data: populatedPath
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 更新导航路径
const updateNavigationPath = async (req, res) => {
  try {
    const { 
      startNodeId, endNodeId, name, description, path, 
      distance, estimatedTime, properties 
    } = req.body
    
    // 查找导航路径
    const navigationPath = await NavigationPath.findById(req.params.id)
    
    if (!navigationPath) {
      return res.status(404).json({
        success: false,
        message: '导航路径不存在'
      })
    }
    
    // 更新字段
    if (startNodeId) navigationPath.startNodeId = startNodeId
    if (endNodeId) navigationPath.endNodeId = endNodeId
    if (name) navigationPath.name = name
    if (description) navigationPath.description = description
    if (path) navigationPath.path = path
    if (distance !== undefined) navigationPath.distance = distance
    if (estimatedTime !== undefined) navigationPath.estimatedTime = estimatedTime
    if (properties) navigationPath.properties = properties
    
    await navigationPath.save()
    
    // 返回导航路径信息
    const populatedPath = await NavigationPath.findById(navigationPath._id)
      .populate('lotId', 'name')
    
    res.status(200).json({
      success: true,
      message: '导航路径更新成功',
      data: populatedPath
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 删除导航路径
const deleteNavigationPath = async (req, res) => {
  try {
    const navigationPath = await NavigationPath.findById(req.params.id)
    
    if (!navigationPath) {
      return res.status(404).json({
        success: false,
        message: '导航路径不存在'
      })
    }
    
    await NavigationPath.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '导航路径删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取特定停车场的导航路径
const getLotNavigationPaths = async (req, res) => {
  try {
    const { lotId } = req.params
    
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
    
    // 获取停车场的所有导航路径
    const navigationPaths = await NavigationPath.find({ lotId })
      .sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      data: navigationPaths
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 计算导航路径
const calculateNavigationPath = async (req, res) => {
  try {
    const { lotId, startNodeId, endNodeId, algorithm = 'dijkstra' } = req.body
    
    // 验证输入
    if (!lotId || !startNodeId || !endNodeId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID、起始节点ID和目标节点ID'
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
    
    // 获取起始节点和目标节点
    const startNode = await MapNode.findOne({ nodeId: startNodeId, lotId })
    const endNode = await MapNode.findOne({ nodeId: endNodeId, lotId })
    
    if (!startNode) {
      return res.status(404).json({
        success: false,
        message: '起始节点不存在'
      })
    }
    
    if (!endNode) {
      return res.status(404).json({
        success: false,
        message: '目标节点不存在'
      })
    }
    
    // 获取停车场所有节点
    const mapNodes = await MapNode.find({ lotId })
    
    // 构建图数据
    const graph = {}
    
    mapNodes.forEach(node => {
      graph[node.nodeId] = {}
      
      node.connections.forEach(conn => {
        graph[node.nodeId][conn.toNodeId] = conn.distance
      })
    })
    
    // 计算最短路径
    let pathResult
    
    if (algorithm === 'dijkstra') {
      pathResult = dijkstra(graph, startNodeId, endNodeId)
    } else if (algorithm === 'astar') {
      pathResult = aStar(graph, startNodeId, endNodeId)
    } else {
      return res.status(400).json({
        success: false,
        message: '不支持的算法，请使用 dijkstra 或 astar'
      })
    }
    
    if (!pathResult.path || pathResult.path.length === 0) {
      return res.status(404).json({
        success: false,
        message: '无法找到从起始节点到目标节点的路径'
      })
    }
    
    // 获取路径上的节点详细信息
    const pathNodes = await MapNode.find({
      nodeId: { $in: pathResult.path },
      lotId
    }).sort({ nodeId: 1 })
    
    // 构建路径数据
    const pathData = {
      startNodeId,
      endNodeId,
      path: pathResult.path,
      distance: pathResult.distance,
      estimatedTime: Math.ceil(pathResult.distance / 1.2), // 假设步行速度为1.2米/秒
      nodes: pathNodes,
      algorithm
    }
    
    res.status(200).json({
      success: true,
      data: pathData
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取从入口到停车位的导航路径
const getNavigationToParkingSpace = async (req, res) => {
  try {
    const { lotId, entranceId, spaceId, algorithm = 'dijkstra' } = req.query
    
    // 验证输入
    if (!lotId || !entranceId || !spaceId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID、入口ID和停车位ID'
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
    
    // 获取入口节点
    const entranceNode = await MapNode.findOne({ 
      nodeId: entranceId, 
      lotId,
      type: 'entrance'
    })
    
    if (!entranceNode) {
      return res.status(404).json({
        success: false,
        message: '入口节点不存在'
      })
    }
    
    // 获取停车位
    const parkingSpace = await ParkingSpace.findOne({ spaceId, lotId })
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      })
    }
    
    // 获取停车位附近的节点
    const nearbyNodes = await MapNode.find({
      lotId,
      floorId: parkingSpace.floorId,
      type: { $in: ['parking', 'intersection'] }
    })
    
    if (nearbyNodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: '停车位附近没有可用节点'
      })
    }
    
    // 找到距离停车位最近的节点
    let nearestNode = null
    let minDistance = Infinity
    
    nearbyNodes.forEach(node => {
      const distance = Math.sqrt(
        Math.pow(node.position.x - parkingSpace.position.x, 2) +
        Math.pow(node.position.y - parkingSpace.position.y, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestNode = node
      }
    })
    
    // 计算从入口到最近节点的路径
    const pathResult = await calculateNavigationPath({
      body: {
        lotId,
        startNodeId: entranceId,
        endNodeId: nearestNode.nodeId,
        algorithm
      }
    }, {
      status: () => ({ json: (data) => data }),
      json: (data) => data
    })
    
    if (!pathResult.success) {
      return res.status(pathResult.status || 500).json(pathResult)
    }
    
    // 添加停车位信息到路径数据
    const navigationData = {
      ...pathResult.data,
      parkingSpace: {
        spaceId: parkingSpace.spaceId,
        floorId: parkingSpace.floorId,
        position: parkingSpace.position,
        status: parkingSpace.status
      },
      finalDistance: pathResult.data.distance + minDistance
    }
    
    res.status(200).json({
      success: true,
      data: navigationData
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 保存导航路径
const saveNavigationPath = async (req, res) => {
  try {
    const { lotId, startNodeId, endNodeId, name, description, algorithm = 'dijkstra' } = req.body
    
    // 验证输入
    if (!lotId || !startNodeId || !endNodeId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID、起始节点ID和目标节点ID'
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
    
    // 计算导航路径
    const pathResult = await calculateNavigationPath({
      body: {
        lotId,
        startNodeId,
        endNodeId,
        algorithm
      }
    }, {
      status: () => ({ json: (data) => data }),
      json: (data) => data
    })
    
    if (!pathResult.success) {
      return res.status(pathResult.status || 500).json(pathResult)
    }
    
    // 生成路径ID
    const pathId = generateId('path')
    
    // 创建导航路径记录
    const navigationPath = new NavigationPath({
      pathId,
      lotId,
      startNodeId,
      endNodeId,
      name: name || `路径 ${pathId}`,
      description: description || '',
      path: pathResult.data.path,
      distance: pathResult.data.distance,
      estimatedTime: pathResult.data.estimatedTime,
      properties: {
        algorithm,
        createdAt: new Date()
      }
    })
    
    await navigationPath.save()
    
    // 返回导航路径信息
    const populatedPath = await NavigationPath.findById(navigationPath._id)
      .populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: '导航路径计算并保存成功',
      data: populatedPath
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
  getNavigationPaths,
  getNavigationPath,
  createNavigationPath,
  updateNavigationPath,
  deleteNavigationPath,
  getLotNavigationPaths,
  calculateNavigationPath,
  getNavigationToParkingSpace,
  saveNavigationPath
}