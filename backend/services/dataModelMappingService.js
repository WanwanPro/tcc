const ParkingSpace = require('../models/ParkingSpace');
const Path = require('../models/Path');

/**
 * 数据模型映射服务
 * 用于将微信小程序后端的数据模型转换为System后台管理系统的数据模型
 */
class DataModelMappingService {
  /**
   * 将微信小程序的ParkingSpace转换为System后台的ParkingSpace格式
   * @param {Object} miniprogramSpace - 微信小程序的停车位数据
   * @param {String} lotId - 停车场ID
   * @param {String} floorId - 楼层ID
   * @returns {Object} System后台格式的停车位数据
   */
  mapParkingSpaceToSystem(miniprogramSpace, lotId, floorId = 'F1') {
    // 状态映射
    const statusMapping = {
      '空闲': 'available',
      '占用': 'occupied',
      '预定': 'reserved'
    };

    return {
      spaceId: miniprogramSpace.spaceId,
      floorId: floorId,
      lotId: lotId,
      area: 'A区', // 默认区域，实际应用中应根据位置计算
      type: 'standard', // 默认标准车位
      status: statusMapping[miniprogramSpace.status] || 'available',
      position: {
        x: miniprogramSpace.position.x,
        y: miniprogramSpace.position.y
      },
      lastUpdated: miniprogramSpace.updatedAt || new Date()
    };
  }

  /**
   * 将System后台的ParkingSpace转换为微信小程序的ParkingSpace格式
   * @param {Object} systemSpace - System后台的停车位数据
   * @returns {Object} 微信小程序格式的停车位数据
   */
  mapParkingSpaceToMiniprogram(systemSpace) {
    // 状态映射
    const statusMapping = {
      'available': '空闲',
      'occupied': '占用',
      'reserved': '预定',
      'maintenance': '占用' // 维护状态在微信小程序中显示为占用
    };

    return {
      spaceId: systemSpace.spaceId,
      position: {
        x: systemSpace.position.x,
        y: systemSpace.position.y
      },
      status: statusMapping[systemSpace.status] || '空闲',
      updatedAt: systemSpace.lastUpdated || systemSpace.updatedAt
    };
  }

  /**
   * 将微信小程序的Path转换为System后台的NavigationPath格式
   * @param {Object} miniprogramPath - 微信小程序的路径数据
   * @param {String} lotId - 停车场ID
   * @param {String} startNodeId - 起始节点ID
   * @param {String} endNodeId - 结束节点ID
   * @returns {Object} System后台格式的导航路径数据
   */
  mapPathToSystem(miniprogramPath, lotId, startNodeId, endNodeId) {
    // 将路径点转换为节点数组
    const nodes = miniprogramPath.route.map((point, index) => ({
      nodeId: `node_${index}`, // 生成临时节点ID
      order: index + 1,
      instruction: index === 0 ? '起点' : (index === miniprogramPath.route.length - 1 ? '终点' : '前进'),
      distance: index > 0 ? this.calculateDistance(
        miniprogramPath.route[index - 1],
        point
      ) : 0,
      estimatedTime: index > 0 ? this.calculateTime(
        miniprogramPath.route[index - 1],
        point
      ) : 0
    }));

    return {
      pathId: miniprogramPath.pathId,
      name: `路径 ${miniprogramPath.pathId}`,
      description: '从微信小程序同步的路径',
      lotId: lotId,
      startNode: startNodeId,
      endNode: endNodeId,
      nodes: nodes,
      totalDistance: miniprogramPath.distance,
      totalTime: miniprogramPath.estimatedTime,
      pathType: 'shortest'
    };
  }

  /**
   * 将System后台的NavigationPath转换为微信小程序的Path格式
   * @param {Object} systemPath - System后台的导航路径数据
   * @returns {Object} 微信小程序格式的路径数据
   */
  mapPathToMiniprogram(systemPath) {
    // 将节点数组转换为路径点数组
    const route = systemPath.nodes.map(node => ({
      x: node.position ? node.position.x : 0, // 如果节点有位置信息，使用它
      y: node.position ? node.position.y : 0
    }));

    return {
      pathId: systemPath.pathId,
      startPoint: {
        x: route.length > 0 ? route[0].x : 0,
        y: route.length > 0 ? route[0].y : 0
      },
      endPoint: {
        x: route.length > 0 ? route[route.length - 1].x : 0,
        y: route.length > 0 ? route[route.length - 1].y : 0
      },
      route: route,
      obstacles: [], // 微信小程序路径模型中的障碍物在System模型中没有直接对应
      distance: systemPath.totalDistance,
      estimatedTime: systemPath.totalTime
    };
  }

  /**
   * 计算两点之间的距离
   * @param {Object} point1 - 第一个点 {x, y}
   * @param {Object} point2 - 第二个点 {x, y}
   * @returns {Number} 两点之间的距离
   */
  calculateDistance(point1, point2) {
    const dx = point2.x - point1.x;
    const dy = point2.y - point1.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算两点之间的预计时间（假设步行速度为1.2米/秒）
   * @param {Object} point1 - 第一个点 {x, y}
   * @param {Object} point2 - 第二个点 {x, y}
   * @returns {Number} 预计时间（秒）
   */
  calculateTime(point1, point2) {
    const distance = this.calculateDistance(point1, point2);
    const walkingSpeed = 1.2; // 米/秒
    return Math.ceil(distance / walkingSpeed);
  }

  /**
   * 批量转换微信小程序的停车位数据为System后台格式
   * @param {Array} miniprogramSpaces - 微信小程序的停车位数据数组
   * @param {String} lotId - 停车场ID
   * @param {String} floorId - 楼层ID
   * @returns {Array} System后台格式的停车位数据数组
   */
  batchMapParkingSpacesToSystem(miniprogramSpaces, lotId, floorId = 'F1') {
    return miniprogramSpaces.map(space => this.mapParkingSpaceToSystem(space, lotId, floorId));
  }

  /**
   * 批量转换System后台的停车位数据为微信小程序格式
   * @param {Array} systemSpaces - System后台的停车位数据数组
   * @returns {Array} 微信小程序格式的停车位数据数组
   */
  batchMapParkingSpacesToMiniprogram(systemSpaces) {
    return systemSpaces.map(space => this.mapParkingSpaceToMiniprogram(space));
  }

  /**
   * 将微信小程序状态转换为System后台状态
   * @param {String} miniprogramStatus - 微信小程序状态（中文）
   * @returns {String} System后台状态（英文）
   */
  mapStatusToSystem(miniprogramStatus) {
    const statusMapping = {
      '空闲': 'available',
      '占用': 'occupied',
      '预定': 'reserved'
    };
    return statusMapping[miniprogramStatus] || 'available';
  }

  /**
   * 将System后台状态转换为微信小程序状态
   * @param {String} systemStatus - System后台状态（英文）
   * @returns {String} 微信小程序状态（中文）
   */
  mapStatusToMiniprogram(systemStatus) {
    const statusMapping = {
      'available': '空闲',
      'occupied': '占用',
      'reserved': '预定',
      'maintenance': '占用' // 维护状态在微信小程序中显示为占用
    };
    return statusMapping[systemStatus] || '空闲';
  }

  /**
   * 计算区域（根据位置计算）
   * @param {Object} position - 位置 {x, y}
   * @returns {String} 区域名称
   */
  calculateArea(position) {
    // 简单的区域划分逻辑，可根据实际需求修改
    if (position.x < 100 && position.y < 100) return 'A区';
    if (position.x < 200 && position.y < 200) return 'B区';
    if (position.x < 300 && position.y < 300) return 'C区';
    return 'D区';
  }
}

module.exports = new DataModelMappingService();