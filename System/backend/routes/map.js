const express = require('express')
const MapNode = require('../models/MapNode')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 获取地图节点列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 50
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
    
    if (req.query.isAccessible !== undefined) {
      query.isAccessible = req.query.isAccessible === 'true'
    }
    
    if (req.query.search) {
      query.$or = [
        { nodeId: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const nodes = await MapNode.find(query)
      .populate('lotId', 'name')
      .sort({ floorId: 1, nodeId: 1 })
      .skip(skip)
      .limit(limit)
    
    const total = await MapNode.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        nodes,
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

// 获取单个地图节点
router.get('/:id', async (req, res) => {
  try {
    const node = await MapNode.findById(req.params.id)
      .populate('lotId', 'name address')
    
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: node
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建地图节点
router.post('/', async (req, res) => {
  try {
    const { nodeId, floorId, lotId, type, position, connections, isAccessible, name, description } = req.body
    
    // 验证输入
    if (!nodeId || !floorId || !lotId || !type || !position) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查节点ID是否已存在
    const existingNode = await MapNode.findOne({ nodeId, floorId })
    if (existingNode) {
      return res.status(400).json({
        success: false,
        message: '该楼层已存在此节点ID'
      })
    }
    
    // 创建新节点
    const node = new MapNode({
      nodeId,
      floorId,
      lotId,
      type,
      position,
      connections: connections || [],
      isAccessible: isAccessible !== undefined ? isAccessible : true,
      name,
      description
    })
    
    await node.save()
    
    res.status(201).json({
      success: true,
      message: '地图节点创建成功',
      data: node
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 批量创建地图节点
router.post('/batch', async (req, res) => {
  try {
    const { lotId, floorId, nodes } = req.body
    
    // 验证输入
    if (!lotId || !floorId || !nodes || !Array.isArray(nodes) || nodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的节点数据'
      })
    }
    
    // 检查节点ID是否已存在
    const existingNodeIds = await MapNode.find({
      lotId,
      floorId,
      nodeId: { $in: nodes.map(n => n.nodeId) }
    }).distinct('nodeId')
    
    if (existingNodeIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: `以下节点ID已存在: ${existingNodeIds.join(', ')}`
      })
    }
    
    // 为每个节点添加停车场和楼层信息
    const nodesWithLotFloor = nodes.map(node => ({
      ...node,
      lotId,
      floorId
    }))
    
    const createdNodes = await MapNode.insertMany(nodesWithLotFloor)
    
    res.status(201).json({
      success: true,
      message: `成功创建 ${createdNodes.length} 个地图节点`,
      data: createdNodes
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 更新地图节点
router.put('/:id', async (req, res) => {
  try {
    const { type, position, connections, isAccessible, name, description } = req.body
    
    // 查找节点
    const node = await MapNode.findById(req.params.id)
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    // 更新字段
    if (type) node.type = type
    if (position) node.position = position
    if (connections) node.connections = connections
    if (isAccessible !== undefined) node.isAccessible = isAccessible
    if (name) node.name = name
    if (description) node.description = description
    
    await node.save()
    
    res.status(200).json({
      success: true,
      message: '地图节点更新成功',
      data: node
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 删除地图节点
router.delete('/:id', async (req, res) => {
  try {
    // 查找节点
    const node = await MapNode.findById(req.params.id)
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
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
})

// 获取停车场所有楼层的节点
router.get('/lot/:lotId/floors', async (req, res) => {
  try {
    const lotId = req.params.lotId
    
    // 获取所有楼层的节点
    const floors = await MapNode.aggregate([
      { $match: { lotId: mongoose.Types.ObjectId(lotId) } },
      { $group: { _id: '$floorId', nodes: { $push: '$$ROOT' } } },
      { $sort: { _id: 1 } }
    ])
    
    res.status(200).json({
      success: true,
      data: floors
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取特定楼层的节点
router.get('/lot/:lotId/floor/:floorId', async (req, res) => {
  try {
    const lotId = req.params.lotId
    const floorId = req.params.floorId
    
    // 获取楼层的所有节点
    const nodes = await MapNode.find({ lotId, floorId })
      .sort({ nodeId: 1 })
    
    res.status(200).json({
      success: true,
      data: nodes
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 获取节点连接关系
router.get('/connections/:lotId/:floorId', async (req, res) => {
  try {
    const lotId = req.params.lotId
    const floorId = req.params.floorId
    
    // 获取楼层的所有节点
    const nodes = await MapNode.find({ lotId, floorId })
    
    // 构建连接关系图
    const connections = []
    nodes.forEach(node => {
      if (node.connections && node.connections.length > 0) {
        node.connections.forEach(conn => {
          connections.push({
            from: node.nodeId,
            to: conn.nodeId,
            distance: conn.distance,
            direction: conn.direction
          })
        })
      }
    })
    
    res.status(200).json({
      success: true,
      data: {
        nodes,
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
})

// 更新节点连接关系
router.put('/connections/:id', async (req, res) => {
  try {
    const { connections } = req.body
    
    // 查找节点
    const node = await MapNode.findById(req.params.id)
    if (!node) {
      return res.status(404).json({
        success: false,
        message: '地图节点不存在'
      })
    }
    
    // 更新连接关系
    node.connections = connections || []
    await node.save()
    
    res.status(200).json({
      success: true,
      message: '节点连接关系更新成功',
      data: node
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
