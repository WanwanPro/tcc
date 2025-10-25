/**
 * 数据映射服务
 * 用于在微信小程序和System后台管理系统之间转换数据格式
 */

// 停车位状态映射
const parkingStatusMap = {
  // 微信小程序 -> System后台
  '空闲': 'available',
  '占用': 'occupied',
  '预定': 'reserved',
  
  // System后台 -> 微信小程序
  'available': '空闲',
  'occupied': '占用',
  'reserved': '预定',
  'maintenance': '占用' // 维护状态在微信小程序中显示为占用
};

// 车位类型映射
const parkingTypeMap = {
  'standard': '标准',
  'disabled': '残疾人',
  'electric': '电动车',
  'vip': 'VIP'
};

/**
 * 将微信小程序的停车位数据转换为System后台格式
 * @param {Object} miniprogramSpace - 微信小程序停车位数据
 * @returns {Object} System后台格式的停车位数据
 */
function convertMiniprogramSpaceToSystem(miniprogramSpace) {
  return {
    spaceId: miniprogramSpace.spaceId,
    floorId: miniprogramSpace.floorId || '1F', // 默认1楼
    lotId: miniprogramSpace.lotId || 'default_lot', // 默认停车场
    area: miniprogramSpace.area || 'A区', // 默认区域
    type: 'standard', // 默认标准车位
    status: parkingStatusMap[miniprogramSpace.status] || 'available',
    position: miniprogramSpace.position,
    currentNode: null, // 微信小程序没有节点概念
    occupiedBy: miniprogramSpace.occupiedBy || null
  };
}

/**
 * 将System后台的停车位数据转换为微信小程序格式
 * @param {Object} systemSpace - System后台停车位数据
 * @returns {Object} 微信小程序格式的停车位数据
 */
function convertSystemSpaceToMiniprogram(systemSpace) {
  return {
    spaceId: systemSpace.spaceId,
    position: systemSpace.position,
    status: parkingStatusMap[systemSpace.status] || '空闲',
    updatedAt: systemSpace.updatedAt || systemSpace.lastUpdated
  };
}

/**
 * 将微信小程序的路径数据转换为System后台格式
 * @param {Object} miniprogramPath - 微信小程序路径数据
 * @returns {Object} System后台格式的路径数据
 */
function convertMiniprogramPathToSystem(miniprogramPath) {
  // 将坐标点转换为节点序列
  const nodes = miniprogramPath.route.map((point, index) => ({
    nodeId: `node_${index}`,
    order: index,
    instruction: index === 0 ? '起点' : (index === miniprogramPath.route.length - 1 ? '终点' : '前进'),
    distance: index > 0 ? calculateDistance(miniprogramPath.route[index-1], point) : 0,
    estimatedTime: index > 0 ? calculateEstimatedTime(miniprogramPath.route[index-1], point) : 0
  }));
  
  return {
    pathId: miniprogramPath.pathId,
    name: `路径_${miniprogramPath.pathId}`,
    lotId: 'default_lot', // 默认停车场
    startNode: { nodeId: 'start_node' },
    endNode: { nodeId: 'end_node' },
    nodes: nodes,
    totalDistance: miniprogramPath.distance,
    totalTime: miniprogramPath.estimatedTime,
    pathType: 'shortest'
  };
}

/**
 * 将System后台的路径数据转换为微信小程序格式
 * @param {Object} systemPath - System后台路径数据
 * @returns {Object} 微信小程序格式的路径数据
 */
function convertSystemPathToMiniprogram(systemPath) {
  // 将节点序列转换为坐标点
  const route = systemPath.nodes.map(node => ({
    x: node.position ? node.position.x : 0,
    y: node.position ? node.position.y : 0
  }));
  
  return {
    pathId: systemPath.pathId,
    startPoint: { x: 0, y: 0 }, // System后台没有直接提供起点坐标
    endPoint: { x: 0, y: 0 }, // System后台没有直接提供终点坐标
    route: route,
    obstacles: [], // System后台没有障碍物概念
    distance: systemPath.totalDistance,
    estimatedTime: systemPath.totalTime
  };
}

/**
 * 计算两点之间的距离
 * @param {Object} point1 - 第一个点 {x, y}
 * @param {Object} point2 - 第二个点 {x, y}
 * @returns {Number} 距离
 */
function calculateDistance(point1, point2) {
  return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
}

/**
 * 计算两点之间的预计时间（秒）
 * @param {Object} point1 - 第一个点 {x, y}
 * @param {Object} point2 - 第二个点 {x, y}
 * @returns {Number} 预计时间（秒）
 */
function calculateEstimatedTime(point1, point2) {
  // 假设步行速度为1米/秒
  return calculateDistance(point1, point2);
}

/**
 * 批量转换停车位数据
 * @param {Array} spaces - 停车位数据数组
 * @param {String} direction - 转换方向 'miniprogram-to-system' 或 'system-to-miniprogram'
 * @returns {Array} 转换后的停车位数据数组
 */
function batchConvertParkingSpaces(spaces, direction) {
  if (direction === 'miniprogram-to-system') {
    return spaces.map(convertMiniprogramSpaceToSystem);
  } else if (direction === 'system-to-miniprogram') {
    return spaces.map(convertSystemSpaceToMiniprogram);
  }
  return spaces;
}

/**
 * 批量转换路径数据
 * @param {Array} paths - 路径数据数组
 * @param {String} direction - 转换方向 'miniprogram-to-system' 或 'system-to-miniprogram'
 * @returns {Array} 转换后的路径数据数组
 */
function batchConvertPaths(paths, direction) {
  if (direction === 'miniprogram-to-system') {
    return paths.map(convertMiniprogramPathToSystem);
  } else if (direction === 'system-to-miniprogram') {
    return paths.map(convertSystemPathToMiniprogram);
  }
  return paths;
}

module.exports = {
  parkingStatusMap,
  parkingTypeMap,
  convertMiniprogramSpaceToSystem,
  convertSystemSpaceToMiniprogram,
  convertMiniprogramPathToSystem,
  convertSystemPathToMiniprogram,
  batchConvertParkingSpaces,
  batchConvertPaths
};