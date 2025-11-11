const express = require('express')
const NavigationPath = require('../models/NavigationPath')
const MapNode = require('../models/MapNode')
const { auth } = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 获取导航路径列表
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 20
    const skip = (page - 1) * limit
    
    // 构建查询条件
    const query = {}
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId
    }
    
    if (req.query.pathType) {
      query.pathType = req.query.pathType
    }
    
    if (req.query.isActive !== undefined) {
      query.isActive = req.query.isActive === 'true'
    }
    
    if (req.query.search) {
      query.$or = [
        { pathId: { $regex: req.query.search, $options: 'i' } },
        { name: { $regex: req.query.search, $options: 'i' } },
        { description: { $regex: req.query.search, $options: 'i' } }
      ]
    }
    
    // 执行查询
    const paths = await NavigationPath.find(query)
      .populate('lotId', 'name')
      .populate('startNode', 'nodeId name type')
      .populate('endNode', 'nodeId name type')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
    
    const total = await NavigationPath.countDocuments(query)
    
    res.status(200).json({
      success: true,
      data: {
        paths,
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

// 获取特定停车场的导航路径 - 必须放在 /:id 路由之前
router.get('/lot/:lotId', async (req, res) => {
  try {
    const lotId = req.params.lotId
    const { pathType, isActive } = req.query
    
    // 构建查询条件
    const query = { lotId }
    
    if (pathType) {
      query.pathType = pathType
    }
    
    if (isActive !== undefined) {
      query.isActive = isActive === 'true'
    }
    
    const paths = await NavigationPath.find(query)
      .populate('startNode', 'nodeId name type')
      .populate('endNode', 'nodeId name type')
      .sort({ createdAt: -1 })
    
    res.status(200).json({
      success: true,
      data: {
        paths,
        count: paths.length
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

// 获取单个导航路径 - 必须放在更具体的路由之后
router.get('/:id', async (req, res) => {
  try {
    const path = await NavigationPath.findById(req.params.id)
      .populate('lotId', 'name address')
      .populate('startNode', 'nodeId name type position')
      .populate('endNode', 'nodeId name type position')
      .populate('nodes.nodeId', 'nodeId name type position')
      .populate('createdBy', 'name')
    
    if (!path) {
      return res.status(404).json({
        success: false,
        message: '导航路径不存在'
      })
    }
    
    res.status(200).json({
      success: true,
      data: path
    })
  } catch (error) {
    console.error(error)
    res.status(500).json({
      success: false,
      message: '服务器错误'
    })
  }
})

// 创建导航路径
router.post('/', async (req, res) => {
  try {
    const { pathId, name, description, lotId, startNode, endNode, nodes, pathType, isActive } = req.body
    
    // 验证输入
    if (!pathId || !name || !lotId || !startNode || !endNode || !nodes) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 检查路径ID是否已存在
    const existingPath = await NavigationPath.findOne({ pathId })
    if (existingPath) {
      return res.status(400).json({
        success: false,
        message: '路径ID已存在'
      })
    }
    
    // 计算总距离和时间
    let totalDistance = 0
    let totalTime = 0
    
    nodes.forEach(node => {
      totalDistance += node.distance || 0
      totalTime += node.estimatedTime || 0
    })
    
    // 创建新路径
    const path = new NavigationPath({
      pathId,
      name,
      description,
      lotId,
      startNode,
      endNode,
      nodes,
      totalDistance,
      totalTime,
      pathType: pathType || 'shortest',
      isActive: isActive !== undefined ? isActive : true,
      createdBy: req.user.id
    })
    
    await path.save()
    
    // 返回完整的路径信息
    const populatedPath = await NavigationPath.findById(path._id)
      .populate('lotId', 'name')
      .populate('startNode', 'nodeId name type')
      .populate('endNode', 'nodeId name type')
      .populate('createdBy', 'name')
    
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
})

// 更新导航路径
router.put('/:id', async (req, res) => {
  try {
    const { name, description, startNode, endNode, nodes, pathType, isActive } = req.body
    
    // 查找路径
    const path = await NavigationPath.findById(req.params.id)
    if (!path) {
      return res.status(404).json({
        success: false,
        message: '导航路径不存在'
      })
    }
    
    // 更新字段
    if (name) path.name = name
    if (description) path.description = description
    if (startNode) path.startNode = startNode
    if (endNode) path.endNode = endNode
    if (nodes) {
      path.nodes = nodes
      
      // 重新计算总距离和时间
      let totalDistance = 0
      let totalTime = 0
      
      nodes.forEach(node => {
        totalDistance += node.distance || 0
        totalTime += node.estimatedTime || 0
      })
      
      path.totalDistance = totalDistance
      path.totalTime = totalTime
    }
    if (pathType) path.pathType = pathType
    if (isActive !== undefined) path.isActive = isActive
    
    await path.save()
    
    // 返回完整的路径信息
    const populatedPath = await NavigationPath.findById(path._id)
      .populate('lotId', 'name')
      .populate('startNode', 'nodeId name type')
      .populate('endNode', 'nodeId name type')
      .populate('createdBy', 'name')
    
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
})

// 删除导航路径
router.delete('/:id', async (req, res) => {
  try {
    // 查找路径
    const path = await NavigationPath.findById(req.params.id)
    if (!path) {
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
})

// 计算导航路径（基于Dijkstra算法）
router.post('/calculate', async (req, res) => {
  try {
    const { lotId, floorId, startNodeId, endNodeId, pathType } = req.body
    
    // 验证输入
    if (!lotId || !floorId || !startNodeId || !endNodeId) {
      return res.status(400).json({
        success: false,
        message: '请提供所有必填字段'
      })
    }
    
    // 获取起始和结束节点
    const startNode = await MapNode.findOne({ lotId, floorId, nodeId: startNodeId })
    const endNode = await MapNode.findOne({ lotId, floorId, nodeId: endNodeId })
    
    if (!startNode || !endNode) {
      return res.status(404).json({
        success: false,
        message: '起始节点或结束节点不存在'
      })
    }
    
    // 获取所有节点
    const nodes = await MapNode.find({ lotId, floorId })
    
    // 构建图
    const graph = {}
    nodes.forEach(node => {
      graph[node.nodeId] = {}
      if (node.connections) {
        node.connections.forEach(conn => {
          // 根据路径类型调整权重
          let weight = conn.distance
          
          if (pathType === 'accessible' && !node.isAccessible) {
            weight = Infinity // 无障碍路径，不可通过的节点权重设为无穷大
          }
          
          graph[node.nodeId][conn.nodeId] = weight
        })
      }
    })
    
    // 使用Dijkstra算法计算最短路径
    const path = dijkstra(graph, startNodeId, endNodeId)
    
    if (!path || path.length === 0) {
      return res.status(404).json({
        success: false,
        message: '无法找到从起始节点到结束节点的路径'
      })
    }
    
    // 构建路径节点信息
    const pathNodes = []
    let totalDistance = 0
    let totalTime = 0
    
    for (let i = 0; i < path.length; i++) {
      const nodeId = path[i]
      const node = nodes.find(n => n.nodeId === nodeId)
      
      if (node) {
        let distance = 0
        let estimatedTime = 0
        let instruction = ''
        
        if (i > 0) {
          const prevNodeId = path[i - 1]
          const prevNode = nodes.find(n => n.nodeId === prevNodeId)
          
          // 计算距离和时间
          const connection = prevNode.connections.find(c => c.nodeId === nodeId)
          if (connection) {
            distance = connection.distance
            estimatedTime = Math.ceil(distance / 1.2 * 60) // 假设步行速度为1.2米/秒，转换为分钟
            
            // 生成导航指令
            if (connection.direction) {
              instruction = `向${getDirectionText(connection.direction)}走`
            } else {
              instruction = '继续前行'
            }
            
            // 添加节点类型信息
            if (node.type === 'entrance') {
              instruction += '，到达入口'
            } else if (node.type === 'exit') {
              instruction += '，到达出口'
            } else if (node.type === 'parking') {
              instruction += '，到达停车位'
            } else if (node.type === 'elevator') {
              instruction += '，到达电梯'
            } else if (node.type === 'stairs') {
              instruction += '，到达楼梯'
            }
          }
          
          totalDistance += distance
          totalTime += estimatedTime
        }
        
        pathNodes.push({
          nodeId: node._id,
          order: i + 1,
          instruction,
          distance,
          estimatedTime
        })
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        path,
        pathNodes,
        totalDistance,
        totalTime,
        pathType: pathType || 'shortest'
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

// Dijkstra算法实现
function dijkstra(graph, start, end) {
  const distances = {}
  const previous = {}
  const queue = []
  
  // 初始化
  for (const node in graph) {
    distances[node] = node === start ? 0 : Infinity
    previous[node] = null
    queue.push(node)
  }
  
  while (queue.length > 0) {
    // 找到距离最小的节点
    let minNode = null
    let minDistance = Infinity
    
    for (const node of queue) {
      if (distances[node] < minDistance) {
        minNode = node
        minDistance = distances[node]
      }
    }
    
    if (minNode === null || minNode === end) {
      break
    }
    
    // 从队列中移除当前节点
    queue.splice(queue.indexOf(minNode), 1)
    
    // 更新邻居节点的距离
    for (const neighbor in graph[minNode]) {
      const alt = distances[minNode] + graph[minNode][neighbor]
      
      if (alt < distances[neighbor]) {
        distances[neighbor] = alt
        previous[neighbor] = minNode
      }
    }
  }
  
  // 构建路径
  const path = []
  let currentNode = end
  
  while (currentNode !== null) {
    path.unshift(currentNode)
    currentNode = previous[currentNode]
  }
  
  return path[0] === start ? path : []
}

// 获取方向文本
function getDirectionText(direction) {
  const directionMap = {
    'north': '北',
    'south': '南',
    'east': '东',
    'west': '西',
    'northeast': '东北',
    'northwest': '西北',
    'southeast': '东南',
    'southwest': '西南'
  }
  
  return directionMap[direction] || '前方'
}

module.exports = router
