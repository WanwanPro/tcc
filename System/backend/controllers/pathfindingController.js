const { NavigationPath, MapNode, ParkingSpace, ParkingLot } = require('../models')

/**
 * A*寻路算法实现
 * 用于计算停车场内从起点到终点的最优路径
 */
class AStarPathfinder {
  constructor(graph) {
    this.graph = graph // 图数据，包含节点和边
  }

  /**
   * 计算两个节点之间的启发式距离（曼哈顿距离）
   */
  heuristic(nodeA, nodeB) {
    const dx = Math.abs(nodeA.coordinates.x - nodeB.coordinates.x)
    const dy = Math.abs(nodeA.coordinates.y - nodeB.coordinates.y)
    const floorDiff = Math.abs(nodeA.floor - nodeB.floor) * 10 // 楼层差异权重更高
    return dx + dy + floorDiff
  }

  /**
   * 获取节点的邻居节点
   */
  getNeighbors(nodeId) {
    const node = this.graph.nodes.find(n => n.nodeId === nodeId)
    if (!node || !node.connections) return []
    
    return node.connections.map(conn => {
      const neighborNode = this.graph.nodes.find(n => n.nodeId === conn.nodeId)
      if (!neighborNode) return null
      
      return {
        nodeId: conn.nodeId,
        node: neighborNode,
        distance: conn.distance || 10, // 默认距离权重
        type: conn.type || 'walkway'
      }
    }).filter(Boolean)
  }

  /**
   * A*算法主函数
   */
  findPath(startNodeId, endNodeId) {
    const startNode = this.graph.nodes.find(n => n.nodeId === startNodeId)
    const endNode = this.graph.nodes.find(n => n.nodeId === endNodeId)
    
    if (!startNode || !endNode) {
      throw new Error('起点或终点节点不存在')
    }

    // 开放列表和关闭列表
    const openSet = []
    const closedSet = new Set()
    
    // 起点节点
    const startNodeData = {
      nodeId: startNodeId,
      node: startNode,
      gScore: 0, // 从起点到当前节点的实际距离
      fScore: this.heuristic(startNode, endNode), // f = g + h
      parent: null
    }
    
    openSet.push(startNodeData)
    
    while (openSet.length > 0) {
      // 找到f值最小的节点
      let currentIndex = 0
      for (let i = 1; i < openSet.length; i++) {
        if (openSet[i].fScore < openSet[currentIndex].fScore) {
          currentIndex = i
        }
      }
      
      const current = openSet[currentIndex]
      
      // 如果到达终点
      if (current.nodeId === endNodeId) {
        // 重建路径
        const path = []
        let temp = current
        
        while (temp) {
          path.unshift({
            nodeId: temp.nodeId,
            coordinates: temp.node.coordinates,
            floor: temp.node.floor,
            type: temp.node.type,
            name: temp.node.name
          })
          temp = temp.parent
        }
        
        return {
          success: true,
          path,
          distance: current.gScore,
          nodeCount: path.length
        }
      }
      
      // 将当前节点从开放列表移到关闭列表
      openSet.splice(currentIndex, 1)
      closedSet.add(current.nodeId)
      
      // 检查所有邻居
      const neighbors = this.getNeighbors(current.nodeId)
      
      for (const neighbor of neighbors) {
        // 如果邻居已在关闭列表中，跳过
        if (closedSet.has(neighbor.nodeId)) {
          continue
        }
        
        // 计算从起点到邻居的g值
        const tentativeGScore = current.gScore + neighbor.distance
        
        // 查找邻居是否已在开放列表中
        let neighborNode = openSet.find(n => n.nodeId === neighbor.nodeId)
        
        if (!neighborNode) {
          // 如果不在开放列表中，添加到开放列表
          neighborNode = {
            nodeId: neighbor.nodeId,
            node: neighbor.node,
            gScore: tentativeGScore,
            fScore: tentativeGScore + this.heuristic(neighbor.node, endNode),
            parent: current
          }
          openSet.push(neighborNode)
        } else if (tentativeGScore < neighborNode.gScore) {
          // 如果找到了更短的路径，更新邻居节点
          neighborNode.gScore = tentativeGScore
          neighborNode.fScore = tentativeGScore + this.heuristic(neighbor.node, endNode)
          neighborNode.parent = current
        }
      }
    }
    
    // 如果开放列表为空，没有找到路径
    return {
      success: false,
      message: '无法找到从起点到终点的路径'
    }
  }
}

/**
 * 计算导航路径
 * 接收起点和终点坐标，返回导航路径
 */
const calculateNavigationPath = async (req, res) => {
  try {
    const { 
      parkingLotId,
      startPoint, // {x, y, floor} 或 {nodeId}
      endPoint,   // {x, y, floor} 或 {nodeId}
      options = {} // 导航选项，如避开楼梯、偏好电梯等
    } = req.body

    // 验证停车场是否存在
    const parkingLot = await ParkingLot.findById(parkingLotId)
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }

    // 获取停车场地图节点数据
    const mapNodes = await MapNode.find({
      parkingLotId,
      isActive: true
    })

    if (mapNodes.length === 0) {
      return res.status(404).json({
        success: false,
        message: '停车场地图数据不存在'
      })
    }

    // 构建图数据
    const graph = {
      nodes: mapNodes.map(node => ({
        nodeId: node.nodeId,
        type: node.type,
        name: node.name,
        coordinates: node.coordinates,
        floor: node.floor,
        connections: node.connections
      }))
    }

    // 创建路径规划器
    const pathfinder = new AStarPathfinder(graph)

    // 确定起点和终点节点ID
    let startNodeId, endNodeId

    // 处理起点
    if (startPoint.nodeId) {
      startNodeId = startPoint.nodeId
    } else {
      // 根据坐标找到最近的节点
      const nearestStartNode = findNearestNode(mapNodes, startPoint.x, startPoint.y, startPoint.floor)
      if (!nearestStartNode) {
        return res.status(400).json({
          success: false,
          message: '无法确定起点位置'
        })
      }
      startNodeId = nearestStartNode.nodeId
    }

    // 处理终点
    if (endPoint.nodeId) {
      endNodeId = endPoint.nodeId
    } else {
      // 根据坐标找到最近的节点
      const nearestEndNode = findNearestNode(mapNodes, endPoint.x, endPoint.y, endPoint.floor)
      if (!nearestEndNode) {
        return res.status(400).json({
          success: false,
          message: '无法确定终点位置'
        })
      }
      endNodeId = nearestEndNode.nodeId
    }

    // 应用导航选项
    if (options.avoidStairs) {
      // 修改图数据，移除楼梯连接
      graph.nodes.forEach(node => {
        node.connections = node.connections.filter(conn => conn.type !== 'stairs')
      })
    }

    // 计算路径
    const result = pathfinder.findPath(startNodeId, endNodeId)

    if (!result.success) {
      return res.status(200).json({
        success: false,
        message: result.message,
        data: null
      })
    }

    // 保存导航路径到数据库（可选）
    if (options.savePath) {
      const newPath = new NavigationPath({
        name: options.pathName || `路径_${Date.now()}`,
        parkingLotId,
        startPoint: {
          nodeId: result.path[0].nodeId,
          floor: result.path[0].floor,
          type: result.path[0].type,
          name: result.path[0].name
        },
        endPoint: {
          nodeId: result.path[result.path.length - 1].nodeId,
          floor: result.path[result.path.length - 1].floor,
          type: result.path[result.path.length - 1].type,
          name: result.path[result.path.length - 1].name
        },
        pathNodes: result.path,
        distance: result.distance,
        estimatedTime: Math.round(result.distance / 50), // 假设步行速度为50单位/分钟
        isActive: true
      })

      await newPath.save()
      result.pathId = newPath._id
    }

    res.status(200).json({
      success: true,
      message: '路径计算成功',
      data: {
        path: result.path,
        distance: result.distance,
        estimatedTime: Math.round(result.distance / 50), // 假设步行速度为50单位/分钟
        nodeCount: result.nodeCount,
        pathId: result.pathId
      }
    })
  } catch (error) {
    console.error('计算导航路径失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 根据坐标找到最近的节点
 */
function findNearestNode(nodes, x, y, floor) {
  let nearestNode = null
  let minDistance = Infinity

  nodes.forEach(node => {
    if (node.floor !== floor) return
    
    const dx = node.coordinates.x - x
    const dy = node.coordinates.y - y
    const distance = Math.sqrt(dx * dx + dy * dy)
    
    if (distance < minDistance) {
      minDistance = distance
      nearestNode = node
    }
  })

  return nearestNode
}

/**
 * 获取已保存的导航路径
 */
const getSavedNavigationPaths = async (req, res) => {
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

    // 获取已保存的导航路径
    const paths = await NavigationPath.find({
      parkingLotId,
      isActive: true
    }).sort({ createdAt: -1 })

    res.status(200).json({
      success: true,
      message: '获取导航路径成功',
      data: {
        paths,
        count: paths.length
      }
    })
  } catch (error) {
    console.error('获取导航路径失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 删除已保存的导航路径
 */
const deleteNavigationPath = async (req, res) => {
  try {
    const { pathId } = req.params

    // 验证路径是否存在
    const path = await NavigationPath.findById(pathId)
    if (!path) {
      return res.status(404).json({
        success: false,
        message: '导航路径不存在'
      })
    }

    // 删除路径（软删除，设置为不活跃）
    path.isActive = false
    await path.save()

    res.status(200).json({
      success: true,
      message: '导航路径删除成功'
    })
  } catch (error) {
    console.error('删除导航路径失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

module.exports = {
  calculateNavigationPath,
  getSavedNavigationPaths,
  deleteNavigationPath
}