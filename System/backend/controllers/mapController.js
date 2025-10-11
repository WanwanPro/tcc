const MapNode = require('../models/MapNode')
const ParkingLot = require('../models/ParkingLot')
const { generatePagination, generateId } = require('../utils/helpers')

// 获取所有地图节点
const getMapNodes = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.floorId) {
      query.floorId = req.query.floorId
    }
    
    if (req.query.type) {
      query.type = req.query.type
    }
    
    if (req.query.search) {
      query.$or = [
        { nodeId: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const mapNodes = await MapNode.find(query)
      .populate('lotId', 'name address')
      .sort({ floorId: 1, nodeId: 1 })
      .skip(skip)
      .limit(limit)
    
    const total = await MapNode.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        mapNodes,
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

// 获取单个地图节点
const getMapNode = async (req, res) => {
  try {
    const mapNode = await MapNode.findById(req.params.id)
      .populate('lotId', 'name address')
    
    if (!mapNode) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: mapNode
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 创建地图节点
const createMapNode = async (req, res) => {
  try {
    const { 
      nodeId, lotId, floorId, type, name, description, 
      position, connections, properties 
    } = req.body
    
    // 验证输入
    if (!nodeId || !lotId || !floorId || !type || !position) {
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
    
    // 检查节点ID是否已存在
    const existingNode = await MapNode.findOne({ nodeId, lotId, floorId })
    
    if (existingNode) {
      return res.status(400).json({
        success: false,
        message: '该停车场楼层下已存在此节点ID'
      })
    }
    
    // 创建新地图节点
    const mapNode = new MapNode({
      nodeId,
      lotId,
      floorId,
      type,
      name: name || '',
      description: description || '',
      position,
      connections: connections || [],
      properties: properties || {}
    })
    
    await mapNode.save()
    
    // 返回地图节点信息
    const populatedNode = await MapNode.findById(mapNode._id)
      .populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: '地图节点创建成功',
      data: populatedNode
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 批量创建地图节点
const createMapNodes = async (req, res) => {
  try {
    const { lotId, floorId, nodes } = req.body
    
    // 验证输入
    if (!lotId || !floorId || !nodes || !Array.isArray(nodes)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的停车场ID、楼层ID和节点数组'
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
    
    // 检查节点ID是否已存在
    const existingNodeIds = await MapNode.find({ 
      lotId, 
      floorId,
      nodeId: { $in: nodes.map(n => n.nodeId) }
    }).select('nodeId')
    
    const existingIds = existingNodeIds.map(n => n.nodeId)
    
    if (existingIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `以下节点ID已存在: ${existingIds.join(', ')}`
      })
    }
    
    // 创建地图节点
    const mapNodes = nodes.map(node => ({
      ...node,
      lotId,
      floorId,
      name: node.name || '',
      description: node.description || '',
      connections: node.connections || [],
      properties: node.properties || {}
    }))
    
    const createdNodes = await MapNode.insertMany(mapNodes)
    
    // 返回地图节点信息
    const populatedNodes = await MapNode.find({
      _id: { $in: createdNodes.map(n => n._id) }
    }).populate('lotId', 'name')
    
    res.status(201).json({
      success: true,
      message: `成功创建 ${createdNodes.length} 个地图节点`,
      data: populatedNodes
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 更新地图节点
const updateMapNode = async (req, res) => {
  try {
    const { 
      type, name, description, position, connections, properties 
    } = req.body
    
    // 查找地图节点
    const mapNode = await MapNode.findById(req.params.id)
    
    if (!mapNode) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    // 更新字段
    if (type) mapNode.type = type
    if (name) mapNode.name = name
    if (description) mapNode.description = description
    if (position) mapNode.position = position
    if (connections) mapNode.connections = connections
    if (properties) mapNode.properties = properties
    
    await mapNode.save()
    
    // 返回地图节点信息
    const populatedNode = await MapNode.findById(mapNode._id)
      .populate('lotId', 'name')
    
    res.status(200).json({
      success: true,
      message: '地图节点更新成功',
      data: populatedNode
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 删除地图节点
const deleteMapNode = async (req, res) => {
  try {
    // 查找地图节点
    const mapNode = await MapNode.findById(req.params.id)
    
    if (!mapNode) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    // 检查是否有其他节点连接到此节点
    const connectedNodes = await MapNode.find({
      'connections.toNodeId': mapNode.nodeId,
      lotId: mapNode.lotId,
      floorId: mapNode.floorId
    })
    
    if (connectedNodes.length > 0) {
      return res.status(400).json({
        success: false,
        message: '此节点被其他节点连接，请先删除相关连接'
      })
    }
    
    await MapNode.findByIdAndDelete(req.params.id)
    
    res.status(200).json({
      success: true,
      message: '地图节点删除成功'
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取停车场楼层的所有地图节点
const getFloorMapNodes = async (req, res) => {
  try {
    const { lotId, floorId } = req.query
    
    if (!lotId || !floorId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID和楼层ID'
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
    
    // 获取楼层所有地图节点
    const mapNodes = await MapNode.find({ lotId, floorId })
      .sort({ nodeId: 1 })
    
    res.status(200).json({
      success: true,
      data: mapNodes
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取地图节点的连接关系
const getNodeConnections = async (req, res) => {
  try {
    const { id } = req.params
    
    // 查找地图节点
    const mapNode = await MapNode.findById(id)
    
    if (!mapNode) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    // 获取连接的节点
    const connectedNodeIds = mapNode.connections.map(conn => conn.toNodeId)
    
    const connectedNodes = await MapNode.find({
      nodeId: { $in: connectedNodeIds },
      lotId: mapNode.lotId,
      floorId: mapNode.floorId
    }).select('nodeId type name position')
    
    // 构建连接关系数据
    const connections = mapNode.connections.map(conn => {
      const connectedNode = connectedNodes.find(node => node.nodeId === conn.toNodeId)
      return {
        ...conn,
        nodeInfo: connectedNode || null
      }
    })
    
    res.status(200).json({
      success: true,
      data: {
        node: mapNode,
        connections
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

// 更新地图节点的连接关系
const updateNodeConnections = async (req, res) => {
  try {
    const { connections } = req.body
    
    if (!connections || !Array.isArray(connections)) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的连接数组'
      })
    }
    
    // 查找地图节点
    const mapNode = await MapNode.findById(req.params.id)
    
    if (!mapNode) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    // 验证连接的节点是否存在
    const connectedNodeIds = connections.map(conn => conn.toNodeId)
    
    if (connectedNodeIds.length > 0) {
      const existingNodes = await MapNode.find({
        nodeId: { $in: connectedNodeIds },
        lotId: mapNode.lotId,
        floorId: mapNode.floorId
      }).select('nodeId')
      
      const existingIds = existingNodes.map(node => node.nodeId)
      const missingIds = connectedNodeIds.filter(id => !existingIds.includes(id))
      
      if (missingIds.length > 0) {
        return res.status(400).json({
          success: false,
          message: `以下连接的节点不存在: ${missingIds.join(', ')}`
        })
      }
    }
    
    // 更新连接关系
    mapNode.connections = connections
    await mapNode.save()
    
    res.status(200).json({
      success: true,
      message: '节点连接关系更新成功',
      data: mapNode
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
}

// 获取停车场楼层的地图数据（用于前端渲染）
const getFloorMapData = async (req, res) => {
  try {
    const { lotId, floorId } = req.query
    
    if (!lotId || !floorId) {
      return res.status(400).json({
        success: false,
        message: '请提供停车场ID和楼层ID'
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
    
    // 获取楼层所有地图节点
    const mapNodes = await MapNode.find({ lotId, floorId })
      .sort({ nodeId: 1 })
    
    // 获取楼层所有停车位
    const ParkingSpace = require('../models/ParkingSpace')
    const parkingSpaces = await ParkingSpace.find({ lotId, floorId })
      .sort({ spaceId: 1 })
    
    // 构建地图数据
    const mapData = {
      lotInfo: {
        id: parkingLot._id,
        name: parkingLot.name,
        address: parkingLot.address
      },
      floorId,
      nodes: mapNodes,
      spaces: parkingSpaces,
      edges: []
    }
    
    // 构建边数据
    mapNodes.forEach(node => {
      node.connections.forEach(conn => {
        mapData.edges.push({
          from: node.nodeId,
          to: conn.toNodeId,
          distance: conn.distance,
          direction: conn.direction,
          type: conn.type
        })
      })
    })
    
    res.status(200).json({
      success: true,
      data: mapData
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
  getMapNodes,
  getMapNode,
  createMapNode,
  createMapNodes,
  updateMapNode,
  deleteMapNode,
  getFloorMapNodes,
  getNodeConnections,
  updateNodeConnections,
  getFloorMapData
}