const ParkingSpace = require('../models/ParkingSpace');
const apiAdapterService = require('../services/apiAdapterService');
const dataModelMappingService = require('../services/dataModelMappingService');

// 获取所有车位状态
exports.getAllSpaces = async (req, res) => {
  try {
    const { parkingId, useSystemApi } = req.query;
    
    let spaces;
    
    // 如果请求中指定使用System API，则从System后台获取数据
    if (useSystemApi === 'true') {
      try {
        spaces = await apiAdapterService.getParkingSpacesFromSystem(parkingId);
      } catch (systemError) {
        console.error('从System后台获取数据失败，使用本地数据:', systemError.message);
        // 如果System API失败，回退到本地数据
        spaces = await ParkingSpace.find({});
      }
    } else {
      // 默认使用本地数据
      spaces = await ParkingSpace.find({});
    }
    
    res.json({
      success: true,
      message: '获取车位状态成功',
      data: spaces
    });
  } catch (error) {
    console.error('获取车位状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取车位状态失败',
      error: error.message
    });
  }
};

// 更新车位状态
exports.updateSpaceStatus = async (req, res) => {
  try {
    const { spaceId, status, syncToSystem } = req.body;
    
    // 验证状态值
    const validStatus = ['空闲', '占用', '预定'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的车位状态'
      });
    }
    
    // 更新本地车位状态
    const updatedSpace = await ParkingSpace.findOneAndUpdate(
      { spaceId },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
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
    
    res.json({
      success: true,
      message: `车位数据同步完成，成功: ${syncResult.success}/${syncResult.total}`,
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