/**
 * API适配器服务
 * 用于微信小程序后端与System后台管理系统API之间的交互
 */

const axios = require('axios');
const dataMappingService = require('./dataMappingService');
const dataModelMappingService = require('./dataModelMappingService');

// System后台管理系统API基础URL
const SYSTEM_API_BASE_URL = process.env.SYSTEM_API_URL || 'http://localhost:5001/api';

// Token缓存（避免频繁登录）
let cachedToken = null;
let tokenExpiryTime = null;

/**
 * 获取System后台管理系统的认证令牌（带缓存机制）
 * @returns {String} 认证令牌
 */
async function getSystemAuthToken() {
  try {
    const preset = process.env.SYSTEM_API_TOKEN;
    const now = Date.now();
    if (preset) {
      cachedToken = preset;
      tokenExpiryTime = now + 24 * 60 * 60 * 1000;
      return preset;
    }
    if (cachedToken && tokenExpiryTime && now < tokenExpiryTime - 5 * 60 * 1000) {
      return cachedToken;
    }
    const loginUrl = `${SYSTEM_API_BASE_URL}/admin/auth/login`;
    const response = await axios.post(loginUrl, {
      username: process.env.SYSTEM_API_USERNAME || 'admin',
      password: process.env.SYSTEM_API_PASSWORD || '123456'
    });
    let token = null;
    if (response.data && response.data.data && response.data.data.token) {
      token = response.data.data.token;
    } else if (response.data && response.data.token) {
      token = response.data.token;
    } else {
      throw new Error('登录响应中未找到token');
    }
    cachedToken = token;
    tokenExpiryTime = now + 24 * 60 * 60 * 1000;
    return token;
  } catch (error) {
    console.error('获取System后台管理系统认证令牌失败:', error.message);
    if (error.response) {
      console.error('API响应状态:', error.response.status);
      console.error('API响应数据:', error.response.data);
    }
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
    
    // 直接使用System后台管理系统的停车位接口（与前端使用同一接口）
    // 使用limit=1000获取所有车位数据
    const response = await axios.get(
      `${SYSTEM_API_BASE_URL}/admin/parking-spaces`,
      {
        params: {
          limit: 1000,
          page: 1
        },
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }
    );
    
    // System后台返回的格式: { success: true, data: { items: [...], total: ... } }
    let spaces = [];
    if (response.data && response.data.success) {
      if (response.data.data && response.data.data.items) {
        spaces = response.data.data.items;
      } else if (response.data.data && response.data.data.spaces) {
        spaces = response.data.data.spaces;
      } else if (Array.isArray(response.data.data)) {
        spaces = response.data.data;
      }
    }
    
    // 使用数据模型映射服务将System后台格式的数据转换为微信小程序格式
    const mappedSpaces = spaces.map(space => {
      try {
        return dataModelMappingService.mapParkingSpaceToMiniprogram(space);
      } catch (mapError) {
        console.error(`[getParkingSpacesFromSystem] 映射车位失败:`, space.spaceId, mapError.message);
        // 如果映射失败，返回一个默认的空闲车位
        return {
          spaceId: space.spaceId || space._id?.toString() || 'UNKNOWN',
          position: space.position || { x: 0, y: 0 },
          status: '空闲',
          updatedAt: space.updatedAt || space.lastUpdated || new Date()
        };
      }
    });
    
    // 统计映射后的状态分布
    const statusCount = mappedSpaces.reduce((acc, space) => {
      acc[space.status] = (acc[space.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log(`[getParkingSpacesFromSystem] 从System后台获取到 ${spaces.length} 个车位，映射后 ${mappedSpaces.length} 个`);
    console.log(`[getParkingSpacesFromSystem] 映射后状态统计:`, statusCount);
    
    return mappedSpaces;
  } catch (error) {
    console.error('从System后台管理系统获取停车位数据失败:', error.message);
    if (error.response) {
      console.error('API响应错误:', error.response.status, error.response.data);
    }
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