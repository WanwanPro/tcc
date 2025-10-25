/**
 * API适配器服务
 * 用于微信小程序后端与System后台管理系统API之间的交互
 */

const axios = require('axios');
const dataMappingService = require('./dataMappingService');
const dataModelMappingService = require('./dataModelMappingService');

// System后台管理系统API基础URL
const SYSTEM_API_BASE_URL = 'http://localhost:3000/api';

/**
 * 获取System后台管理系统的认证令牌
 * @returns {String} 认证令牌
 */
async function getSystemAuthToken() {
  try {
    const response = await axios.post(`${SYSTEM_API_BASE_URL}/auth/login`, {
      username: 'admin', // 使用默认管理员账户
      password: 'admin123'
    });
    
    return response.data.token;
  } catch (error) {
    console.error('获取System后台管理系统认证令牌失败:', error.message);
    throw new Error('认证失败');
  }
}

/**
 * 从System后台管理系统获取停车位数据
 * @param {String} lotId - 停车场ID
 * @returns {Array} 微信小程序格式的停车位数据
 */
async function getParkingSpacesFromSystem(lotId = 'default_lot') {
  try {
    const token = await getSystemAuthToken();
    
    const response = await axios.get(
      `${SYSTEM_API_BASE_URL}/parking/lots/${lotId}/spaces`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // 使用新的数据模型映射服务将System后台格式的数据转换为微信小程序格式
    return dataModelMappingService.batchMapParkingSpacesToMiniprogram(response.data);
  } catch (error) {
    console.error('从System后台管理系统获取停车位数据失败:', error.message);
    throw new Error('获取停车位数据失败');
  }
}

/**
 * 向System后台管理系统更新停车位状态
 * @param {String} spaceId - 车位ID
 * @param {String} status - 新状态
 * @returns {Object} 更新结果
 */
async function updateParkingSpaceStatusInSystem(spaceId, status) {
  try {
    const token = await getSystemAuthToken();
    
    // 使用数据模型映射服务将微信小程序状态转换为System后台状态
    const systemSpace = {
      status: status // 将在System后台的控制器中进行状态映射
    };
    
    const response = await axios.put(
      `${SYSTEM_API_BASE_URL}/parking/spaces/${spaceId}/status-with-sync`,
      systemSpace,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('向System后台管理系统更新停车位状态失败:', error.message);
    throw new Error('更新停车位状态失败');
  }
}

/**
 * 向System后台管理系统请求路径规划
 * @param {Object} startPoint - 起点 {x, y}
 * @param {Object} endPoint - 终点 {x, y}
 * @returns {Object} 微信小程序格式的路径数据
 */
async function calculatePathInSystem(startPoint, endPoint) {
  try {
    const token = await getSystemAuthToken();
    
    // 将坐标转换为节点ID（这里简化处理，实际应该根据坐标查找最近的节点）
    const startNodeId = `node_${startPoint.x}_${startPoint.y}`;
    const endNodeId = `node_${endPoint.x}_${endPoint.y}`;
    
    const response = await axios.post(
      `${SYSTEM_API_BASE_URL}/navigation/calculate-path`,
      {
        startNodeId: startNodeId,
        endNodeId: endNodeId,
        lotId: 'default_lot',
        pathType: 'shortest'
      },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // 使用新的数据模型映射服务将System后台格式的路径数据转换为微信小程序格式
    return dataModelMappingService.mapPathToMiniprogram(response.data);
  } catch (error) {
    console.error('向System后台管理系统请求路径规划失败:', error.message);
    throw new Error('路径规划失败');
  }
}

/**
 * 同步停车位数据到System后台管理系统
 * @param {Array} parkingSpaces - 停车位数据数组
 * @returns {Object} 同步结果
 */
async function syncParkingSpacesToSystem(parkingSpaces) {
  try {
    const token = await getSystemAuthToken();
    const results = [];
    
    // 使用新的同步接口
    const response = await axios.post(
      `${SYSTEM_API_BASE_URL}/parking/lots/default_lot/sync-from-miniprogram`,
      { parkingSpaces },
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('同步停车位数据到System后台管理系统失败:', error.message);
    throw new Error('数据同步失败');
  }
}

/**
 * 从System后台管理系统获取停车场统计数据
 * @param {String} lotId - 停车场ID
 * @returns {Object} 停车场统计数据
 */
async function getParkingLotStatsFromSystem(lotId = 'default_lot') {
  try {
    const token = await getSystemAuthToken();
    
    const response = await axios.get(
      `${SYSTEM_API_BASE_URL}/parking/lots/${lotId}/stats`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('从System后台管理系统获取停车场统计数据失败:', error.message);
    throw new Error('获取统计数据失败');
  }
}

module.exports = {
  getSystemAuthToken,
  getParkingSpacesFromSystem,
  updateParkingSpaceStatusInSystem,
  calculatePathInSystem,
  syncParkingSpacesToSystem,
  getParkingLotStatsFromSystem
};