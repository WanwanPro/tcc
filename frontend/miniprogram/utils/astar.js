/**
 * A* 路径规划算法实现
 */

class PriorityQueue {
  constructor() {
    this.items = []
  }

  enqueue(item, priority) {
    this.items.push({ item, priority })
    this.items.sort((a, b) => a.priority - b.priority)
  }

  dequeue() {
    return this.items.shift()?.item
  }

  isEmpty() {
    return this.items.length === 0
  }
}

/**
 * 计算两点间的欧几里得距离（启发式函数）
 */
function heuristic(node1, node2) {
  const dx = node1.coordinates[0] - node2.coordinates[0]
  const dy = node1.coordinates[1] - node2.coordinates[1]
  return Math.sqrt(dx * dx + dy * dy)
}

/**
 * A* 算法主函数
 * @param {Object} graph - 导航图 {nodes, edges}
 * @param {string} startId - 起点节点ID
 * @param {string} endId - 终点节点ID
 * @returns {Array} - 路径坐标数组 [[lng, lat], ...]
 */
function astar(graph, startId, endId) {
  // 构建节点映射
  const nodeMap = {}
  graph.nodes.forEach(node => {
    nodeMap[node.id] = node
  })

  // 构建邻接表
  const adjacency = {}
  graph.nodes.forEach(node => {
    adjacency[node.id] = []
  })
  
  graph.edges.forEach(edge => {
    adjacency[edge.from].push({
      to: edge.to,
      cost: heuristic(nodeMap[edge.from], nodeMap[edge.to])
    })
    // 如果不是单向，添加反向边
    if (!edge.oneway) {
      adjacency[edge.to].push({
        to: edge.from,
        cost: heuristic(nodeMap[edge.to], nodeMap[edge.from])
      })
    }
  })

  const startNode = nodeMap[startId]
  const endNode = nodeMap[endId]

  if (!startNode || !endNode) {
    console.error('起点或终点不存在')
    return []
  }

  // 初始化
  const openSet = new PriorityQueue()
  const cameFrom = {}
  const gScore = {}
  const fScore = {}

  graph.nodes.forEach(node => {
    gScore[node.id] = Infinity
    fScore[node.id] = Infinity
  })

  gScore[startId] = 0
  fScore[startId] = heuristic(startNode, endNode)
  openSet.enqueue(startId, fScore[startId])

  const closedSet = new Set()

  // A* 主循环
  while (!openSet.isEmpty()) {
    const current = openSet.dequeue()

    if (current === endId) {
      // 重构路径
      const path = []
      let node = endId
      while (node) {
        path.unshift(nodeMap[node].coordinates)
        node = cameFrom[node]
      }
      return path
    }

    closedSet.add(current)

    // 遍历邻居
    adjacency[current].forEach(neighbor => {
      if (closedSet.has(neighbor.to)) return

      const tentativeGScore = gScore[current] + neighbor.cost

      if (tentativeGScore < gScore[neighbor.to]) {
        cameFrom[neighbor.to] = current
        gScore[neighbor.to] = tentativeGScore
        fScore[neighbor.to] = tentativeGScore + heuristic(nodeMap[neighbor.to], endNode)
        openSet.enqueue(neighbor.to, fScore[neighbor.to])
      }
    })
  }

  // 没有找到路径
  console.warn('未找到路径')
  return []
}

/**
 * 找到离给定坐标最近的节点
 * @param {Object} graph - 导航图
 * @param {Array} coordinates - [lng, lat]
 * @returns {string} - 最近的节点ID
 */
function findNearestNode(graph, coordinates) {
  let minDist = Infinity
  let nearest = null

  graph.nodes.forEach(node => {
    const dx = node.coordinates[0] - coordinates[0]
    const dy = node.coordinates[1] - coordinates[1]
    const dist = Math.sqrt(dx * dx + dy * dy)
    
    if (dist < minDist) {
      minDist = dist
      nearest = node.id
    }
  })

  return nearest
}

module.exports = {
  astar,
  findNearestNode,
  heuristic
}





