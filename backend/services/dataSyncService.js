/**
 * 数据同步服务
 * 用于定期在微信小程序后端和System后台管理系统之间同步数据，确保数据模型统一
 */

const cron = require('node-cron');
const ParkingSpace = require('../models/ParkingSpace');
const ParkingLot = require('../models/ParkingLot');
const apiAdapterService = require('./apiAdapterService');
const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService');

/**
 * 自动同步服务类
 */
class DataSyncService {
  constructor() {
    this.isRunning = false;
    this.syncInterval = null;
    this.lastSyncTime = null;
    this.syncStats = {
      totalSyncs: 0,
      successfulSyncs: 0,
      failedSyncs: 0,
      lastSyncStatus: null,
      lastSyncError: null
    };
  }

  /**
   * 启动自动同步服务
   * @param {String} schedule - cron表达式，默认每5分钟同步一次
   */
  startAutoSync(schedule = '*/5 * * * *') {
    if (this.isRunning) {
      console.log('数据同步服务已在运行中');
      return;
    }

    console.log(`启动数据同步服务，计划: ${schedule}`);
    this.isRunning = true;

    // 立即执行一次同步
    this.performSync();

    // 设置定时同步
    this.syncInterval = cron.schedule(schedule, () => {
      this.performSync();
    });
  }

  /**
   * 停止自动同步服务
   */
  stopAutoSync() {
    if (!this.isRunning) {
      console.log('数据同步服务未在运行');
      return;
    }

    console.log('停止数据同步服务');
    this.isRunning = false;
    
    if (this.syncInterval) {
      this.syncInterval.stop();
      this.syncInterval = null;
    }
  }

  /**
   * 执行数据同步
   */
  async performSync() {
    if (!this.isRunning) {
      console.log('数据同步服务已停止，跳过同步');
      return;
    }

    console.log('开始执行数据同步...');
    const startTime = Date.now();

    try {
      // 1. 从System后台获取所有停车场
      const parkingLots = await ParkingLot.find({ isActive: true });
      
      // 2. 对每个停车场执行双向同步
      for (const lot of parkingLots) {
        await this.syncParkingLotData(lot._id);
      }

      // 3. 更新同步统计信息
      this.syncStats.totalSyncs++;
      this.syncStats.successfulSyncs++;
      this.syncStats.lastSyncStatus = 'success';
      this.syncStats.lastSyncError = null;
      this.lastSyncTime = new Date();

      const duration = Date.now() - startTime;
      console.log(`数据同步完成，耗时: ${duration}ms`);
    } catch (error) {
      console.error('数据同步失败:', error.message);
      
      // 更新同步统计信息
      this.syncStats.totalSyncs++;
      this.syncStats.failedSyncs++;
      this.syncStats.lastSyncStatus = 'failed';
      this.syncStats.lastSyncError = error.message;
      this.lastSyncTime = new Date();
    }
  }

  /**
   * 同步单个停车场的数据
   * @param {String} parkingLotId - 停车场ID
   */
  async syncParkingLotData(parkingLotId) {
    try {
      // 1. 从System后台获取停车位数据（通过API）
      const systemSpaces = await apiAdapterService.getParkingSpacesFromSystem(parkingLotId);
      
      // 2. 从微信小程序后端获取停车位数据（从本地数据库）
      const miniprogramSpaces = await ParkingSpace.find({});
      
      // 3. 比较数据并找出差异
      const differences = this.compareParkingSpaces(systemSpaces, miniprogramSpaces);
      
      // 4. 同步差异数据
      if (differences.systemOnly.length > 0) {
        // 将System后台独有的数据同步到微信小程序后端
        await this.syncSpacesToMiniprogram(differences.systemOnly);
      }
      
      if (differences.miniprogramOnly.length > 0) {
        // 将微信小程序后端独有的数据同步到System后台
        await this.syncSpacesToSystem(differences.miniprogramOnly, parkingLotId);
      }
      
      if (differences.conflicts.length > 0) {
        // 处理冲突数据（以System后台为准）
        await this.resolveConflicts(differences.conflicts);
      }
      
      console.log(`停车场 ${parkingLotId} 数据同步完成`);
    } catch (error) {
      console.error(`停车场 ${parkingLotId} 数据同步失败:`, error.message);
      throw error;
    }
  }

  /**
   * 比较两个系统的停车位数据
   * @param {Array} systemSpaces - System后台的停车位数据
   * @param {Array} miniprogramSpaces - 微信小程序后端的停车位数据
   * @returns {Object} 差异对象
   */
  compareParkingSpaces(systemSpaces, miniprogramSpaces) {
    // 创建映射表，便于快速查找
    const systemSpacesMap = new Map();
    systemSpaces.forEach(space => {
      systemSpacesMap.set(space.spaceId, space);
    });
    
    const miniprogramSpacesMap = new Map();
    miniprogramSpaces.forEach(space => {
      miniprogramSpacesMap.set(space.spaceId, space);
    });
    
    // 找出差异
    const systemOnly = [];
    const miniprogramOnly = [];
    const conflicts = [];
    
    // 检查System后台独有的数据
    for (const [spaceId, space] of systemSpacesMap) {
      if (!miniprogramSpacesMap.has(spaceId)) {
        systemOnly.push(space);
      }
    }
    
    // 检查微信小程序后端独有的数据和冲突数据
    for (const [spaceId, space] of miniprogramSpacesMap) {
      const systemSpace = systemSpacesMap.get(spaceId);
      
      if (!systemSpace) {
        miniprogramOnly.push(space);
      } else {
        // 检查状态是否一致
        // System后台使用英文状态，微信小程序使用中文状态，需要转换后比较
        const statusMapping = {
          'available': '空闲',
          'occupied': '占用',
          'reserved': '预定',
          'maintenance': '占用'
        };
        const systemStatusInChinese = statusMapping[systemSpace.status] || '空闲';
        
        if (systemStatusInChinese !== space.status) {
          conflicts.push({
            spaceId,
            systemStatus: systemSpace.status,
            miniprogramStatus: space.status,
            systemSpace,
            miniprogramSpace: space
          });
        }
      }
    }
    
    return {
      systemOnly,
      miniprogramOnly,
      conflicts
    };
  }

  /**
   * 将停车位数据同步到微信小程序后端
   * @param {Array} spaces - 停车位数据数组
   */
  async syncSpacesToMiniprogram(spaces) {
    console.log(`同步 ${spaces.length} 个停车位到微信小程序后端`);
    
    for (const space of spaces) {
      try {
        // 更新本地数据库中的停车位
        await ParkingSpace.findOneAndUpdate(
          { spaceId: space.spaceId },
          { 
            status: space.status,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`同步停车位 ${space.spaceId} 到微信小程序后端失败:`, error.message);
      }
    }
  }

  /**
   * 将停车位数据同步到System后台
   * @param {Array} spaces - 停车位数据数组
   * @param {String} parkingLotId - 停车场ID
   */
  async syncSpacesToSystem(spaces, parkingLotId) {
    console.log(`同步 ${spaces.length} 个停车位到System后台`);
    
    for (const space of spaces) {
      try {
        // 检查停车位是否已存在
        const existingSpace = await ParkingSpace.findOne({
          spaceId: space.spaceId,
          lotId: parkingLotId
        });
        
        if (existingSpace) {
          // 更新现有停车位
          existingSpace.status = space.status;
          existingSpace.position = space.position;
          await existingSpace.save();
        } else {
          // 创建新停车位
          const newSpace = new ParkingSpace({
            spaceId: space.spaceId,
            lotId: parkingLotId,
            floorId: space.floorId || 1,
            area: space.area || '',
            type: space.type || 'standard',
            status: space.status,
            position: space.position || { x: 0, y: 0 },
            dimensions: space.dimensions || { width: 2.5, height: 5 },
            features: space.features || []
          });
          await newSpace.save();
        }
      } catch (error) {
        console.error(`同步停车位 ${space.spaceId} 到System后台失败:`, error.message);
      }
    }
  }

  /**
   * 解决冲突数据（以System后台为准）
   * @param {Array} conflicts - 冲突数据数组
   */
  async resolveConflicts(conflicts) {
    console.log(`解决 ${conflicts.length} 个数据冲突`);
    
    for (const conflict of conflicts) {
      try {
        // 将System后台的状态同步到微信小程序后端（更新本地数据库）
        // 需要将System的英文状态转换为中文状态
        const statusMapping = {
          'available': '空闲',
          'occupied': '占用',
          'reserved': '预定',
          'maintenance': '占用'
        };
        const miniprogramStatus = statusMapping[conflict.systemStatus] || '空闲';
        
        await ParkingSpace.findOneAndUpdate(
          { spaceId: conflict.spaceId },
          { 
            status: miniprogramStatus,
            updatedAt: new Date()
          },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`解决停车位 ${conflict.spaceId} 冲突失败:`, error.message);
      }
    }
  }

  /**
   * 获取同步统计信息
   * @returns {Object} 同步统计信息
   */
  getSyncStats() {
    return {
      ...this.syncStats,
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime
    };
  }

  /**
   * 手动触发同步
   */
  async triggerManualSync() {
    console.log('手动触发数据同步');
    await this.performSync();
  }
}

// 创建单例实例
const dataSyncService = new DataSyncService();

module.exports = dataSyncService;