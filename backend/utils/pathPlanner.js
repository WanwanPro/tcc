/**
 * 路径规划工具类
 * 实现改进的A*算法用于停车场导航
 */

class PathPlanner {
  /**
   * 构造函数
   * @param {Array} obstacles - 障碍物列表
   * @param {Object} gridSize - 网格大小 {width, height}
   */
  constructor(obstacles = [], gridSize = { width: 100, height: 100 }) {
    this.obstacles = obstacles;
    this.gridSize = gridSize;
    this.grid = this.createGrid();
  }

  /**
   * 创建网格
   * @returns {Array} 网格数组
   */
  createGrid() {
    const grid = [];
    for (let x = 0; x < this.gridSize.width; x++) {
      grid[x] = [];
      for (let y = 0; y < this.gridSize.height; y++) {
        grid[x][y] = !this.isObstacle(x, y);
      }
    }
    return grid;
  }

  /**
   * 检查位置是否为障碍物
   * @param {Number} x - x坐标
   * @param {Number} y - y坐标
   * @returns {Boolean} 是否为障碍物
   */
  isObstacle(x, y) {
    return this.obstacles.some(obstacle => 
      x >= obstacle.x && x < obstacle.x + obstacle.width &&
      y >= obstacle.y && y < obstacle.y + obstacle.height
    );
  }

  /**
   * 计算两个点之间的曼哈顿距离
   * @param {Object} point1 - 点1 {x, y}
   * @param {Object} point2 - 点2 {x, y}
   * @returns {Number} 距离
   */
  manhattanDistance(point1, point2) {
    return Math.abs(point1.x - point2.x) + Math.abs(point1.y - point2.y);
  }

  /**
   * 获取相邻节点
   * @param {Object} node - 当前节点
   * @returns {Array} 相邻节点数组
   */
  getNeighbors(node) {
    const neighbors = [];
    const directions = [
      { x: 0, y: -1 }, // 上
      { x: 1, y: 0 },  // 右
      { x: 0, y: 1 },  // 下
      { x: -1, y: 0 }  // 左
    ];

    for (const dir of directions) {
      const newX = node.x + dir.x;
      const newY = node.y + dir.y;

      // 检查边界
      if (newX >= 0 && newX < this.gridSize.width && 
          newY >= 0 && newY < this.gridSize.height && 
          this.grid[newX][newY]) {
        neighbors.push({ x: newX, y: newY });
      }
    }

    return neighbors;
  }

  /**
   * A*路径查找算法
   * @param {Object} start - 起点 {x, y}
   * @param {Object} end - 终点 {x, y}
   * @returns {Array|null} 路径节点数组，如果找不到路径则返回null
   */
  findPath(start, end) {
    // 初始化开放列表和关闭列表
    const openList = [];
    const closedList = new Set();
    
    // 创建起点节点
    const startNode = {
      x: start.x,
      y: start.y,
      g: 0, // 从起点到当前节点的实际代价
      h: this.manhattanDistance(start, end), // 启发式代价
      f: 0, // 总代价 f = g + h
      parent: null
    };
    startNode.f = startNode.g + startNode.h;
    
    // 将起点添加到开放列表
    openList.push(startNode);
    
    // 主循环
    while (openList.length > 0) {
      // 找到f值最小的节点
      let currentIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[currentIndex].f) {
          currentIndex = i;
        }
      }
      
      // 取出当前节点
      const currentNode = openList.splice(currentIndex, 1)[0];
      
      // 检查是否到达终点
      if (currentNode.x === end.x && currentNode.y === end.y) {
        // 回溯路径
        const path = [];
        let current = currentNode;
        while (current) {
          path.unshift({ x: current.x, y: current.y });
          current = current.parent;
        }
        return path;
      }
      
      // 将当前节点添加到关闭列表
      closedList.add(`${currentNode.x},${currentNode.y}`);
      
      // 检查相邻节点
      const neighbors = this.getNeighbors(currentNode);
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.x},${neighbor.y}`;
        
        // 如果在关闭列表中，跳过
        if (closedList.has(neighborKey)) {
          continue;
        }
        
        // 计算从起点到邻居节点的代价
        const tentativeG = currentNode.g + 1;
        
        // 查找是否已在开放列表中
        const openNeighbor = openList.find(node => node.x === neighbor.x && node.y === neighbor.y);
        
        if (!openNeighbor) {
          // 不在开放列表中，创建新节点
          const newNode = {
            x: neighbor.x,
            y: neighbor.y,
            g: tentativeG,
            h: this.manhattanDistance(neighbor, end),
            f: 0,
            parent: currentNode
          };
          newNode.f = newNode.g + newNode.h;
          openList.push(newNode);
        } else if (tentativeG < openNeighbor.g) {
          // 在开放列表中且找到了更优路径
          openNeighbor.g = tentativeG;
          openNeighbor.f = openNeighbor.g + openNeighbor.h;
          openNeighbor.parent = currentNode;
        }
      }
    }
    
    // 没有找到路径
    return null;
  }

  /**
   * 动态调整路径以避开新障碍物
   * @param {Array} currentPath - 当前路径
   * @param {Array} newObstacles - 新障碍物
   * @param {Object} currentPosition - 当前位置
   * @returns {Array|null} 调整后的路径
   */
  adjustPath(currentPath, newObstacles, currentPosition) {
    // 更新障碍物列表
    this.obstacles = [...this.obstacles, ...newObstacles];
    this.grid = this.createGrid();
    
    // 找到当前位置在路径中的位置
    const currentIndex = currentPath.findIndex(point => 
      point.x === currentPosition.x && point.y === currentPosition.y
    );
    
    if (currentIndex === -1) {
      // 当前位置不在路径中，重新计算完整路径
      const start = currentPath[0];
      const end = currentPath[currentPath.length - 1];
      return this.findPath(start, end);
    }
    
    // 从当前位置到终点重新规划路径
    const remainingPath = currentPath.slice(currentIndex);
    const end = remainingPath[remainingPath.length - 1];
    
    const newPath = this.findPath(currentPosition, end);
    
    if (newPath) {
      // 合并已走过的路径和新规划的路径
      const completedPath = currentPath.slice(0, currentIndex);
      return [...completedPath, ...newPath];
    }
    
    return null;
  }
}

module.exports = PathPlanner;