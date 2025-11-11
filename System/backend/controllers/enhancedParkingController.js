const ParkingSpace = require('../models/ParkingSpace');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpaceLog = require('../models/ParkingSpaceLog');
const ParkingSpaceStatusHistory = require('../models/ParkingSpaceStatusHistory');
const mongoose = require('mongoose');

// 辅助函数：生成分页信息
const generatePagination = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    currentPage: page,
    totalPages,
    totalItems: total,
    itemsPerPage: limit,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1
  };
};

// 辅助函数：记录操作日志
const logOperation = async (spaceId, lotId, operatorId, operation, previousState, newState, req, description) => {
  try {
    const log = new ParkingSpaceLog({
      spaceId,
      lotId,
      operatorId,
      operation,
      previousState,
      newState,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      description
    });
    await log.save();
  } catch (error) {
    console.error('记录操作日志失败:', error);
  }
};

// 辅助函数：记录状态变更历史
const recordStatusChange = async (spaceId, lotId, previousStatus, newStatus, operatorId, source, changeReason) => {
  try {
    const statusHistory = new ParkingSpaceStatusHistory({
      spaceId,
      lotId,
      previousStatus,
      newStatus,
      changeTime: new Date(),
      changeReason,
      source: source || 'manual',
      operatorId
    });
    await statusHistory.save();
  } catch (error) {
    console.error('记录状态变更历史失败:', error);
  }
};

// 批量更新停车位
const batchUpdateParkingSpaces = async (req, res) => {
  try {
    const { spaceIds, updates, changeReason } = req.body;
    const operatorId = req.user.id;
    
    // 验证输入
    if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供有效的停车位ID数组'
      });
    }
    
    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供要更新的字段'
      });
    }
    
    // 查找所有要更新的停车位
    const parkingSpaces = await ParkingSpace.find({
      _id: { $in: spaceIds }
    }).populate('lotId', 'name');
    
    if (parkingSpaces.length === 0) {
      return res.status(404).json({
        success: false,
        message: '未找到指定的停车位'
      });
    }
    
    // 批量更新停车位
    const updateOperations = spaceIds.map(spaceId => ({
      updateOne: {
        filter: { _id: spaceId },
        update: { $set: updates }
      }
    }));
    
    const result = await ParkingSpace.bulkWrite(updateOperations);
    
    // 记录操作日志和状态变更历史
    for (const space of parkingSpaces) {
      const previousState = { ...space.toObject() };
      const newState = { ...previousState, ...updates };
      
      // 记录操作日志
      await logOperation(
        space._id,
        space.lotId._id,
        operatorId,
        'batch_update',
        previousState,
        newState,
        req,
        `批量更新停车位: ${JSON.stringify(updates)}`
      );
      
      // 如果更新了状态，记录状态变更历史
      if (updates.status && updates.status !== space.status) {
        await recordStatusChange(
          space._id,
          space.lotId._id,
          space.status,
          updates.status,
          operatorId,
          'manual',
          changeReason || '批量状态更新'
        );
      }
    }
    
    // 获取更新后的停车位数据
    const updatedSpaces = await ParkingSpace.find({
      _id: { $in: spaceIds }
    }).populate('lotId', 'name address');
    
    // 如果更新了状态，自动同步到TCC后端（微信小程序）
    if (updates.status && result.modifiedCount > 0) {
      try {
        const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService');
        let syncSuccessCount = 0;
        
        for (const space of updatedSpaces) {
          if (space.spaceId && space.status !== space.previousStatus) {
            try {
              await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
                space.spaceId,
                updates.status
              );
              syncSuccessCount++;
            } catch (syncError) {
              console.error(`[批量同步] 车位 ${space.spaceId} 同步失败:`, syncError.message);
            }
          }
        }
        
        if (syncSuccessCount > 0) {
          console.log(`[批量同步] 成功同步 ${syncSuccessCount}/${result.modifiedCount} 个车位状态到微信小程序后端`);
        }
      } catch (syncError) {
        console.error(`[批量同步] 同步过程出错:`, syncError.message);
        // 不影响主流程，只记录错误
      }
    }
    
    res.status(200).json({
      success: true,
      message: `成功更新 ${result.modifiedCount} 个停车位`,
      data: {
        updatedCount: result.modifiedCount,
        spaces: updatedSpaces
      }
    });
  } catch (error) {
    console.error('批量更新停车位失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取车位操作日志
const getParkingSpaceLogs = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // 构建查询条件
    const query = {};
    
    if (req.query.spaceId) {
      query.spaceId = req.query.spaceId;
    }
    
    if (req.query.lotId) {
      query.lotId = req.query.lotId;
    }
    
    if (req.query.operation) {
      query.operation = req.query.operation;
    }
    
    if (req.query.operatorId) {
      query.operatorId = req.query.operatorId;
    }
    
    if (req.query.startDate || req.query.endDate) {
      query.timestamp = {};
      if (req.query.startDate) {
        query.timestamp.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.timestamp.$lte = new Date(req.query.endDate);
      }
    }
    
    // 执行查询
    const logs = await ParkingSpaceLog.find(query)
      .populate('spaceId', 'spaceId')
      .populate('lotId', 'name')
      .populate('operatorId', 'username')
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ParkingSpaceLog.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        logs,
        pagination: generatePagination(page, limit, total)
      }
    });
  } catch (error) {
    console.error('获取车位操作日志失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取车位状态变更历史
const getParkingSpaceStatusHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // 验证停车位是否存在
    const parkingSpace = await ParkingSpace.findById(id);
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      });
    }
    
    // 构建查询条件
    const query = { spaceId: id };
    
    if (req.query.source) {
      query.source = req.query.source;
    }
    
    if (req.query.startDate || req.query.endDate) {
      query.changeTime = {};
      if (req.query.startDate) {
        query.changeTime.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.changeTime.$lte = new Date(req.query.endDate);
      }
    }
    
    // 执行查询
    const statusHistory = await ParkingSpaceStatusHistory.find(query)
      .populate('operatorId', 'username')
      .sort({ changeTime: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await ParkingSpaceStatusHistory.countDocuments(query);
    
    res.status(200).json({
      success: true,
      data: {
        spaceId: id,
        spaceInfo: parkingSpace,
        statusHistory,
        pagination: generatePagination(page, limit, total)
      }
    });
  } catch (error) {
    console.error('获取车位状态变更历史失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 获取车位状态统计
const getParkingSpaceStats = async (req, res) => {
  try {
    const { lotId } = req.query;
    const { groupBy = 'status' } = req.query;
    
    // 验证停车场是否存在
    if (lotId) {
      const parkingLot = await ParkingLot.findById(lotId);
      if (!parkingLot) {
        return res.status(404).json({
          success: false,
          message: '停车场不存在'
        });
      }
    }
    
    // 构建查询条件
    const matchCondition = {};
    if (lotId) {
      matchCondition.lotId = mongoose.Types.ObjectId(lotId);
    }
    
    // 构建分组条件
    let groupCondition = {};
    switch (groupBy) {
      case 'status':
        groupCondition = { _id: '$status' };
        break;
      case 'type':
        groupCondition = { _id: '$type' };
        break;
      case 'area':
        groupCondition = { _id: '$area' };
        break;
      case 'floor':
        groupCondition = { _id: '$floorId' };
        break;
      default:
        groupCondition = { _id: '$status' };
    }
    
    // 执行聚合查询
    const stats = await ParkingSpace.aggregate([
      { $match: matchCondition },
      {
        $group: {
          ...groupCondition,
          count: { $sum: 1 },
          occupiedCount: {
            $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] }
          }
        }
      },
      {
        $addFields: {
          occupancyRate: {
            $multiply: [
              { $divide: ['$occupiedCount', '$count'] },
              100
            ]
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 获取总览数据
    const totalSpaces = await ParkingSpace.countDocuments(matchCondition);
    const occupiedSpaces = await ParkingSpace.countDocuments({
      ...matchCondition,
      status: 'occupied'
    });
    const availableSpaces = totalSpaces - occupiedSpaces;
    const occupancyRate = totalSpaces > 0 ? (occupiedSpaces / totalSpaces) * 100 : 0;
    
    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalSpaces,
          occupiedSpaces,
          availableSpaces,
          occupancyRate: Math.round(occupancyRate * 100) / 100
        },
        groupBy,
        stats
      }
    });
  } catch (error) {
    console.error('获取车位状态统计失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 更新停车位状态（增强版，包含日志记录）
const updateParkingSpaceStatusWithLog = async (req, res) => {
  try {
    const { status, changeReason } = req.body;
    const operatorId = req.user.id;
    
    // 查找停车位
    const parkingSpace = await ParkingSpace.findById(req.params.id)
      .populate('lotId', 'name');
    
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '停车位不存在'
      });
    }
    
    // 检查状态是否发生变化
    if (status === parkingSpace.status) {
      return res.status(400).json({
        success: false,
        message: '状态未发生变化'
      });
    }
    
    // 保存之前的状态
    const previousStatus = parkingSpace.status;
    
    // 更新停车位状态
    parkingSpace.status = status;
    await parkingSpace.save();
    
    // 记录操作日志
    await logOperation(
      parkingSpace._id,
      parkingSpace.lotId._id,
      operatorId,
      'status_change',
      { status: previousStatus },
      { status },
      req,
      changeReason || `状态从 ${previousStatus} 更改为 ${status}`
    );
    
    // 记录状态变更历史
    await recordStatusChange(
      parkingSpace._id,
      parkingSpace.lotId._id,
      previousStatus,
      status,
      operatorId,
      'manual',
      changeReason
    );
    
    // 返回更新后的停车位信息
    const updatedSpace = await ParkingSpace.findById(parkingSpace._id)
      .populate('lotId', 'name address');
    
    // 自动同步到TCC后端（微信小程序）
    if (updatedSpace.spaceId) {
      try {
        const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService');
        await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
          updatedSpace.spaceId,
          status
        );
        console.log(`[自动同步] 车位 ${updatedSpace.spaceId} 状态已同步到微信小程序后端: ${previousStatus} -> ${status}`);
      } catch (syncError) {
        console.error(`[自动同步] 同步失败:`, syncError.message);
        // 不影响主流程，只记录错误
      }
    }
    
    res.status(200).json({
      success: true,
      message: '停车位状态更新成功',
      data: updatedSpace
    });
  } catch (error) {
    console.error('更新停车位状态失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = {
  batchUpdateParkingSpaces,
  getParkingSpaceLogs,
  getParkingSpaceStatusHistory,
  getParkingSpaceStats,
  updateParkingSpaceStatusWithLog,
  // 别名，与路由中使用的名称匹配
  batchUpdateSpaces: batchUpdateParkingSpaces,
  getOperationLogs: getParkingSpaceLogs,
  getStatusHistory: getParkingSpaceStatusHistory,
  getStatistics: getParkingSpaceStats,
  updateSpaceStatusWithLog: updateParkingSpaceStatusWithLog
};