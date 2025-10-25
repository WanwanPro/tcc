/**
 * System后台管理系统API适配器
 * 用于System后台管理系统与微信小程序后端API之间的交互
 */

const axios = require('axios');
const dataMappingService = require('../../../backend/services/dataMappingService');
const dataModelMappingService = require('./dataModelMappingService');

// 微信小程序后端API基础URL
const MINIPROGRAM_API_BASE_URL = 'http://localhost:5000/api';

/**
 * 从微信小程序后端获取停车位数据
 * @param {String} parkingId - 停车场ID
 * @returns {Array} System后台格式的停车位数据
 */
async function getParkingSpacesFromMiniprogram(parkingId) {
  try {
    const response = await axios.get(
      `${MINIPROGRAM_API_BASE_URL}/spaces`,
      {
        params: { parkingId }
      }
    );
    
    // 使用新的数据模型映射服务将微信小程序格式的数据转换为System后台格式
    const miniprogramSpaces = response.data.data || response.data;
    return dataModelMappingService.batchMapParkingSpacesToSystem(miniprogramSpaces, parkingId);
  } catch (error) {
    console.error('从微信小程序后端获取停车位数据失败:', error.message);
    throw new Error('获取停车位数据失败');
  }
}

/**
 * 向微信小程序后端更新停车位状态
 * @param {String} spaceId - 车位ID
 * @param {String} status - 新状态
 * @returns {Object} 更新结果
 */
async function updateParkingSpaceStatusInMiniprogram(spaceId, status) {
  try {
    // 使用数据模型映射服务将System后台状态转换为微信小程序状态
    const miniprogramStatus = dataModelMappingService.mapStatusToMiniprogram(status);
    
    const response = await axios.post(
      `${MINIPROGRAM_API_BASE_URL}/spaces/update`,
      { 
        spaceId, 
        status: miniprogramStatus,
        syncToSystem: false // 避免循环同步
      }
    );
    
    return response.data;
  } catch (error) {
    console.error('向微信小程序后端更新停车位状态失败:', error.message);
    throw new Error('更新停车位状态失败');
  }
}

/**
 * 向微信小程序后端请求路径规划
 * @param {Object} startNode - 起始节点
 * @param {Object} endNode - 结束节点
 * @returns {Object} System后台格式的路径数据
 */
async function calculatePathInMiniprogram(startNode, endNode) {
  try {
    // 将节点转换为坐标（这里简化处理，实际应该根据节点查找坐标）
    const startPoint = { x: 0, y: 0 }; // 默认起点
    const endPoint = { x: 10, y: 10 }; // 默认终点
    
    const response = await axios.post(
      `${MINIPROGRAM_API_BASE_URL}/path/plan`,
      {
        startPoint,
        endPoint,
        useSystemApi: false // 避免循环调用
      }
    );
    
    // 使用新的数据模型映射服务将微信小程序格式的路径数据转换为System后台格式
    return dataModelMappingService.mapPathToSystem(response.data, 'default_lot', startNode, endNode);
  } catch (error) {
    console.error('向微信小程序后端请求路径规划失败:', error.message);
    throw new Error('路径规划失败');
  }
}

/**
 * 同步停车位数据到微信小程序后端
 * @param {Array} parkingSpaces - 停车位数据数组
 * @returns {Object} 同步结果
 */
async function syncParkingSpacesToMiniprogram(parkingSpaces) {
  try {
    const results = [];
    
    for (const space of parkingSpaces) {
      try {
        // 使用新的数据模型映射服务将System后台格式的数据转换为微信小程序格式
        const miniprogramSpace = dataModelMappingService.mapParkingSpaceToMiniprogram(space);
        
        // 尝试更新微信小程序后端的车位状态
        const response = await axios.post(
          `${MINIPROGRAM_API_BASE_URL}/spaces/update`,
          { 
            spaceId: miniprogramSpace.spaceId, 
            status: miniprogramSpace.status,
            syncToSystem: false // 避免循环同步
          }
        );
        
        results.push({ spaceId: space.spaceId, action: 'updated', success: true });
      } catch (error) {
        console.error(`同步停车位 ${space.spaceId} 到微信小程序后端失败:`, error.message);
        results.push({ spaceId: space.spaceId, action: 'failed', success: false, error: error.message });
      }
    }
    
    return { results, total: parkingSpaces.length, success: results.filter(r => r.success).length };
  } catch (error) {
    console.error('同步停车位数据到微信小程序后端失败:', error.message);
    throw new Error('数据同步失败');
  }
}

module.exports = {
  getParkingSpacesFromMiniprogram,
  updateParkingSpaceStatusInMiniprogram,
  calculatePathInMiniprogram,
  syncParkingSpacesToMiniprogram
};