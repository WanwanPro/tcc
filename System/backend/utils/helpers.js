// Dijkstra算法实现
const dijkstra = (nodes, edges, startNodeId, endNodeId) => {
  // 创建节点映射
  const nodeMap = {}
  nodes.forEach(node => {
    nodeMap[node.nodeId] = node
  })

  // 初始化距离和前驱节点
  const distances = {}
  const previous = {}
  const unvisited = new Set()

  // 初始化所有节点的距离为无穷大
  nodes.forEach(node => {
    distances[node.nodeId] = Infinity
    previous[node.nodeId] = null
    unvisited.add(node.nodeId)
  })

  // 设置起始节点的距离为0
  distances[startNodeId] = 0

  // 当还有未访问的节点时
  while (unvisited.size > 0) {
    // 找到未访问节点中距离最小的节点
    let currentNodeId = null
    let minDistance = Infinity

    for (const nodeId of unvisited) {
      if (distances[nodeId] < minDistance) {
        minDistance = distances[nodeId]
        currentNodeId = nodeId
      }
    }

    // 如果没有找到可达节点，或者已经到达目标节点，则结束
    if (currentNodeId === null || currentNodeId === endNodeId) {
      break
    }

    // 从未访问集合中移除当前节点
    unvisited.delete(currentNodeId)

    // 更新当前节点的邻居节点的距离
    const currentEdges = edges.filter(edge => 
      edge.fromNodeId === currentNodeId
    )

    for (const edge of currentEdges) {
      const neighborNodeId = edge.toNodeId
      const alt = distances[currentNodeId] + edge.distance

      if (alt < distances[neighborNodeId]) {
        distances[neighborNodeId] = alt
        previous[neighborNodeId] = currentNodeId
      }
    }
  }

  // 如果目标节点不可达，返回null
  if (distances[endNodeId] === Infinity) {
    return null
  }

  // 构建路径
  const path = []
  let currentNodeId = endNodeId

  while (currentNodeId !== null) {
    path.unshift(nodeMap[currentNodeId])
    currentNodeId = previous[currentNodeId]
  }

  // 计算总距离和预计时间
  const totalDistance = distances[endNodeId]
  const estimatedTime = Math.ceil(totalDistance / 1.2) // 假设步行速度为1.2米/秒

  return {
    path,
    totalDistance,
    estimatedTime
  }
}

// A*算法实现
const aStar = (nodes, edges, startNodeId, endNodeId) => {
  // 创建节点映射
  const nodeMap = {}
  nodes.forEach(node => {
    nodeMap[node.nodeId] = node
  })

  // 计算两点之间的直线距离（启发式函数）
  const heuristic = (nodeId1, nodeId2) => {
    const node1 = nodeMap[nodeId1]
    const node2 = nodeMap[nodeId2]
    
    if (!node1 || !node2 || !node1.position || !node2.position) {
      return 0
    }
    
    const dx = node1.position.x - node2.position.x
    const dy = node1.position.y - node2.position.y
    
    return Math.sqrt(dx * dx + dy * dy)
  }

  // 初始化距离和前驱节点
  const gScore = {} // 从起点到当前节点的实际距离
  const fScore = {} // 从起点到当前节点的实际距离 + 从当前节点到终点的估计距离
  const previous = {}
  const openSet = new Set([startNodeId])
  const closedSet = new Set()

  // 初始化所有节点的距离为无穷大
  nodes.forEach(node => {
    gScore[node.nodeId] = Infinity
    fScore[node.nodeId] = Infinity
    previous[node.nodeId] = null
  })

  // 设置起始节点的距离为0
  gScore[startNodeId] = 0
  fScore[startNodeId] = heuristic(startNodeId, endNodeId)

  // 当开放集合不为空时
  while (openSet.size > 0) {
    // 找到开放集合中f值最小的节点
    let currentNodeId = null
    let minFScore = Infinity

    for (const nodeId of openSet) {
      if (fScore[nodeId] < minFScore) {
        minFScore = fScore[nodeId]
        currentNodeId = nodeId
      }
    }

    // 如果已经到达目标节点，则结束
    if (currentNodeId === endNodeId) {
      break
    }

    // 从开放集合中移除当前节点，并添加到关闭集合
    openSet.delete(currentNodeId)
    closedSet.add(currentNodeId)

    // 更新当前节点的邻居节点的距离
    const currentEdges = edges.filter(edge => 
      edge.fromNodeId === currentNodeId
    )

    for (const edge of currentEdges) {
      const neighborNodeId = edge.toNodeId

      // 如果邻居节点已经在关闭集合中，跳过
      if (closedSet.has(neighborNodeId)) {
        continue
      }

      // 计算从起点到邻居节点的临时距离
      const tentativeGScore = gScore[currentNodeId] + edge.distance

      // 如果临时距离小于已知距离，或者邻居节点不在开放集合中
      if (tentativeGScore < gScore[neighborNodeId]) {
        // 更新距离和前驱节点
        previous[neighborNodeId] = currentNodeId
        gScore[neighborNodeId] = tentativeGScore
        fScore[neighborNodeId] = tentativeGScore + heuristic(neighborNodeId, endNodeId)

        // 如果邻居节点不在开放集合中，添加到开放集合
        if (!openSet.has(neighborNodeId)) {
          openSet.add(neighborNodeId)
        }
      }
    }
  }

  // 如果目标节点不可达，返回null
  if (gScore[endNodeId] === Infinity) {
    return null
  }

  // 构建路径
  const path = []
  let currentNodeId = endNodeId

  while (currentNodeId !== null) {
    path.unshift(nodeMap[currentNodeId])
    currentNodeId = previous[currentNodeId]
  }

  // 计算总距离和预计时间
  const totalDistance = gScore[endNodeId]
  const estimatedTime = Math.ceil(totalDistance / 1.2) // 假设步行速度为1.2米/秒

  return {
    path,
    totalDistance,
    estimatedTime
  }
}

// 计算两点之间的直线距离
const calculateDistance = (point1, point2) => {
  if (!point1 || !point2) {
    return 0
  }

  const dx = point1.x - point2.x
  const dy = point1.y - point2.y

  return Math.sqrt(dx * dx + dy * dy)
}

// 生成随机颜色
const generateRandomColor = () => {
  const letters = '0123456789ABCDEF'
  let color = '#'
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)]
  }
  return color
}

// 格式化日期时间
const formatDateTime = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 格式化日期
const formatDate = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  
  return `${year}-${month}-${day}`
}

// 格式化时间
const formatTime = (date) => {
  if (!date) return ''
  
  const d = new Date(date)
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return `${hours}:${minutes}:${seconds}`
}

// 计算停车时长（分钟）
const calculateParkingDuration = (entryTime, exitTime) => {
  if (!entryTime || !exitTime) return 0
  
  const entry = new Date(entryTime)
  const exit = new Date(exitTime)
  
  return Math.floor((exit - entry) / (1000 * 60))
}

// 计算停车费用
const calculateParkingFee = (duration, pricingRule) => {
  if (!pricingRule || !pricingRule.rules || duration <= 0) return 0
  
  let fee = 0
  
  // 根据计费规则计算费用
  for (const rule of pricingRule.rules) {
    if (duration <= rule.duration) {
      fee = rule.fee
      break
    }
  }
  
  // 如果超过所有规则的时间段，使用最后一个规则的费率计算
  if (fee === 0 && pricingRule.rules.length > 0) {
    const lastRule = pricingRule.rules[pricingRule.rules.length - 1]
    const additionalDuration = duration - lastRule.duration
    const additionalUnits = Math.ceil(additionalDuration / lastRule.unit)
    fee = lastRule.fee + (additionalUnits * lastRule.additionalFee)
  }
  
  return fee
}

// 生成分页信息
const generatePagination = (page, limit, total) => {
  const pages = Math.ceil(total / limit)
  
  return {
    page,
    limit,
    total,
    pages,
    hasNext: page < pages,
    hasPrev: page > 1
  }
}

// 生成唯一ID
const generateId = (prefix = '') => {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `${prefix}${timestamp}${random}`
}

module.exports = {
  dijkstra,
  aStar,
  calculateDistance,
  generateRandomColor,
  formatDateTime,
  formatDate,
  formatTime,
  calculateParkingDuration,
  calculateParkingFee,
  generatePagination,
  generateId
}