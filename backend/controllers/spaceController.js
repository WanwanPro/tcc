const mongoose = require('mongoose');
const ParkingSpace = require('../models/ParkingSpace');
const apiAdapterService = require('../services/apiAdapterService');
const dataModelMappingService = require('../services/dataModelMappingService');
const { upsert } = require('../../shared/dal/atomic');
const { connectUnified } = require('../../shared/dal/mongo');

// 获取所有车位状态
exports.getAllSpaces = async (req, res) => {
  try {
    const { parkingId, useLocalApi } = req.query;
    
    let spaces;
    
    // 默认从System后台获取数据（统一数据源）
    // 只有当 useLocalApi='true' 时才使用本地数据
    if (useLocalApi === 'true') {
      let connected = true
      try {
        await connectUnified()
      } catch (e) {
        connected = false
        console.error('[getAllSpaces] 本地数据库连接失败，返回空数据:', e && e.message ? e.message : e)
      }
      if (connected && mongoose.connection && mongoose.connection.readyState === 1) {
        spaces = await ParkingSpace.find({});
        console.log('[getAllSpaces] 使用本地数据，共', spaces.length, '个车位');
      } else {
        spaces = []
      }
    } else {
      // 默认从System后台获取数据（与后台管理系统使用同一数据源）
      try {
        spaces = await apiAdapterService.getParkingSpacesFromSystem(parkingId);
        console.log('[getAllSpaces] 从System后台获取数据，共', spaces.length, '个车位');
      } catch (systemError) {
        console.error('[getAllSpaces] 从System后台获取数据失败，使用本地数据:', systemError.message);
        try {
          let connected = true
          try {
            await connectUnified()
          } catch (e) {
            connected = false
            console.error('[getAllSpaces] 本地数据库连接失败，返回空数据:', e && e.message ? e.message : e)
          }
          if (connected && mongoose.connection && mongoose.connection.readyState === 1) {
            spaces = await ParkingSpace.find({});
          } else {
            spaces = []
          }
        } catch (localError) {
          console.error('[getAllSpaces] 获取本地数据失败:', localError.message);
          spaces = []
        }
      }
    }
    
    if (!Array.isArray(spaces)) {
      spaces = [];
    }

    res.json({
      success: true,
      message: spaces.length > 0 ? '获取车位状态成功' : '未获取到数据',
      data: spaces
    });
  } catch (error) {
    console.error('获取车位状态错误:', error);
    res.json({
      success: true,
      message: '获取车位状态失败，已返回空数据',
      data: []
    });
  }
};

// 更新车位状态
exports.updateSpaceStatus = async (req, res) => {
  try {
    const { spaceId, status, syncToSystem } = req.body;
    
    // 验证输入参数
    if (!spaceId || !status) {
      return res.status(400).json({
        success: false,
        message: '请提供车位ID和状态'
      });
    }
    
    // 验证状态值
    const validStatus = ['空闲', '占用', '预定'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的车位状态'
      });
    }
    
    const existing = await ParkingSpace.findOne({ spaceId })
    const id = existing ? existing._id : new mongoose.Types.ObjectId()
    const doc = { _id: id, spaceId, status, updatedAt: new Date() }
    await upsert('parkingspaces', doc, ['view_admin_parkingspaces', 'view_miniprogram_parkingspaces'])
    const updatedSpace = await ParkingSpace.findOne({ spaceId })
    
    if (!updatedSpace) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      });
    }
    
    // 如果请求中指定同步到System后台，则同步数据
    if (syncToSystem === 'true') {
      try {
        // 使用数据模型映射服务将状态转换为System格式
        const systemStatus = dataModelMappingService.mapStatusToSystem(status);
        await apiAdapterService.updateParkingSpaceStatusInSystem(spaceId, systemStatus);
        console.log(`车位 ${spaceId} 状态已同步到System后台`);
      } catch (systemError) {
        console.error('同步车位状态到System后台失败:', systemError.message);
        // 不影响主流程，只记录错误
      }
    }
    
    res.json({
      success: true,
      message: '车位状态更新成功',
      data: updatedSpace
    });
  } catch (error) {
    console.error('更新车位状态错误:', error);
    res.status(500).json({
      success: false,
      message: '车位状态更新失败',
      error: error.message
    });
  }
};

// 同步所有车位数据到System后台
exports.syncAllSpacesToSystem = async (req, res) => {
  try {
    // 获取本地所有车位数据
    const localSpaces = await ParkingSpace.find({});
    
    // 使用数据模型映射服务将本地数据转换为System格式
    const systemSpaces = dataModelMappingService.batchMapParkingSpacesToSystem(localSpaces);
    
    // 同步到System后台
    const syncResult = await apiAdapterService.syncParkingSpacesToSystem(systemSpaces);
    
    // 处理同步结果，确保数据结构正确
    const successCount = syncResult.data?.created || syncResult.data?.updated || 0;
    const totalCount = syncResult.data?.total || syncResult.success || syncResult.total || 0;
    
    res.json({
      success: true,
      message: `车位数据同步完成，成功: ${successCount}/${totalCount}`,
      data: syncResult
    });
  } catch (error) {
    console.error('同步车位数据错误:', error);
    res.status(500).json({
      success: false,
      message: '车位数据同步失败',
      error: error.message
    });
  }
};
