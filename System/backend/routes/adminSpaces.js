const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ParkingSpace = require('../models/ParkingSpace');
const ParkingLot = require('../models/ParkingLot');
const Transaction = require('../models/Transaction');
const ParkingSpaceLog = require('../models/ParkingSpaceLog');
const ParkingSpaceStatusHistory = require('../models/ParkingSpaceStatusHistory');

// 获取车位列表
router.get('/', auth, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      parkingLotId,
      status,
      type,
      floor,
      zone,
      keyword,
      sort = 'createdAt'
    } = req.query;

    // 构建查询条件
    const query = {};
    
    if (parkingLotId) {
      query.parkingLotId = parkingLotId;
    }
    
    if (status) {
      query.status = status;
    }
    
    if (type) {
      query.type = type;
    }
    
    if (floor) {
      query.floor = floor;
    }
    
    if (zone) {
      query.zone = zone;
    }
    
    if (keyword) {
      query.$or = [
        { spaceNumber: { $regex: keyword, $options: 'i' } },
        { zone: { $regex: keyword, $options: 'i' } }
      ];
    }

    // 分页参数
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // 排序参数
    let sortOption = {};
    const [sortField, sortOrder] = sort.startsWith('-') 
      ? [sort.substring(1), -1] 
      : [sort, 1];
    sortOption[sortField] = sortOrder;

    // 执行查询
    const [spaces, total] = await Promise.all([
      ParkingSpace.find(query)
        .populate('lotId', 'name')
        .sort(sortOption)
        .skip(skip)
        .limit(limitNum),
      ParkingSpace.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        items: spaces,
        total,
        page: pageNum,
        limit: limitNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (error) {
    console.error('获取车位列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车位列表失败',
      error: error.message
    });
  }
});

// 获取单个车位详情
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const space = await ParkingSpace.findById(id)
      .populate('parkingLotId', 'name address totalSpaces');
    
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      });
    }

    res.status(200).json({
      success: true,
      data: space
    });
  } catch (error) {
    console.error('获取车位详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车位详情失败',
      error: error.message
    });
  }
});

// 创建车位
router.post('/', auth, async (req, res) => {
  try {
    const {
      spaceNumber,
      parkingLotId,
      floor,
      zone,
      type,
      status = 'available',
      coordinates = { x: 0, y: 0 }
    } = req.body;

    // 验证必填字段
    if (!spaceNumber || !parkingLotId || !floor || !zone || !type) {
      return res.status(400).json({
        success: false,
        message: '请填写所有必填字段'
      });
    }

    // 检查停车场是否存在
    const parkingLot = await ParkingLot.findById(parkingLotId);
    if (!parkingLot) {
      return res.status(400).json({
        success: false,
        message: '停车场不存在'
      });
    }

    // 检查车位编号是否已存在
    const existingSpace = await ParkingSpace.findOne({
      spaceNumber,
      parkingLotId,
      floor
    });
    
    if (existingSpace) {
      return res.status(400).json({
        success: false,
        message: '该车位编号已存在'
      });
    }

    // 创建新车位
    const newSpace = new ParkingSpace({
      spaceNumber,
      parkingLotId,
      floor,
      zone,
      type,
      status,
      coordinates
    });

    const savedSpace = await newSpace.save();
    
    // 更新停车场总车位数
    await ParkingLot.findByIdAndUpdate(parkingLotId, {
      $inc: { totalSpaces: 1 }
    });

    res.status(201).json({
      success: true,
      data: savedSpace,
      message: '车位创建成功'
    });
  } catch (error) {
    console.error('创建车位失败:', error);
    res.status(500).json({
      success: false,
      message: '创建车位失败',
      error: error.message
    });
  }
});

// 更新车位
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // 检查车位是否存在
    const space = await ParkingSpace.findById(id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      });
    }

    // 如果更改了停车场，需要验证新停车场是否存在
    if (updateData.parkingLotId && updateData.parkingLotId !== space.parkingLotId.toString()) {
      const parkingLot = await ParkingLot.findById(updateData.parkingLotId);
      if (!parkingLot) {
        return res.status(400).json({
          success: false,
          message: '停车场不存在'
        });
      }
    }

    // 如果更改了车位编号，需要检查是否重复
    if (updateData.spaceNumber && updateData.spaceNumber !== space.spaceNumber) {
      const existingSpace = await ParkingSpace.findOne({
        spaceNumber: updateData.spaceNumber,
        parkingLotId: updateData.parkingLotId || space.parkingLotId,
        floor: updateData.floor || space.floor,
        _id: { $ne: id }
      });
      
      if (existingSpace) {
        return res.status(400).json({
          success: false,
          message: '该车位编号已存在'
        });
      }
    }

    // 记录旧状态（用于同步）
    const oldStatus = space.status;
    const newStatus = updateData.status || space.status;
    
    // 更新车位
    const updatedSpace = await ParkingSpace.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('parkingLotId', 'name');
    
    // 如果状态发生变化，自动同步到TCC后端（微信小程序）
    if (oldStatus !== newStatus && updatedSpace.spaceId) {
      try {
        const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService');
        await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
          updatedSpace.spaceId,
          newStatus
        );
        console.log(`[自动同步] 车位 ${updatedSpace.spaceId} 状态已同步到微信小程序后端: ${oldStatus} -> ${newStatus}`);
      } catch (syncError) {
        console.error(`[自动同步] 同步失败:`, syncError.message);
        // 不影响主流程，只记录错误
      }
    }

    res.status(200).json({
      success: true,
      data: updatedSpace,
      message: '车位更新成功'
    });
  } catch (error) {
    console.error('更新车位失败:', error);
    res.status(500).json({
      success: false,
      message: '更新车位失败',
      error: error.message
    });
  }
});

// 删除车位
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查车位是否存在
    const space = await ParkingSpace.findById(id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      });
    }

    // 检查车位是否被占用
    if (space.status === 'occupied') {
      return res.status(400).json({
        success: false,
        message: '占用车位不能删除'
      });
    }

    // 删除车位
    await ParkingSpace.findByIdAndDelete(id);
    
    // 更新停车场总车位数
    await ParkingLot.findByIdAndUpdate(space.parkingLotId, {
      $inc: { totalSpaces: -1 }
    });

    res.status(200).json({
      success: true,
      message: '车位删除成功'
    });
  } catch (error) {
    console.error('删除车位失败:', error);
    res.status(500).json({
      success: false,
      message: '删除车位失败',
      error: error.message
    });
  }
});

// 释放车位
router.put('/:id/release', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查车位是否存在
    const space = await ParkingSpace.findById(id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      });
    }

    // 检查车位是否被占用
    if (space.status !== 'occupied') {
      return res.status(400).json({
        success: false,
        message: '只有占用车位才能释放'
      });
    }

    // 更新车位状态为空闲
    const updatedSpace = await ParkingSpace.findByIdAndUpdate(
      id,
      { 
        status: 'available',
        occupiedBy: null,
        occupiedAt: null
      },
      { new: true }
    );

    // 结束停车记录
    await Transaction.findOneAndUpdate(
      { 
        spaceId: id,
        exitTime: null 
      },
      { 
        exitTime: new Date(),
        status: 'completed'
      }
    );

    res.status(200).json({
      success: true,
      data: updatedSpace,
      message: '车位释放成功'
    });
  } catch (error) {
    console.error('释放车位失败:', error);
    res.status(500).json({
      success: false,
      message: '释放车位失败',
      error: error.message
    });
  }
});

// 预订车位
router.put('/:id/reserve', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, vehicleNumber } = req.body;
    
    // 检查车位是否存在
    const space = await ParkingSpace.findById(id);
    if (!space) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      });
    }

    // 检查车位是否空闲
    if (space.status !== 'available') {
      return res.status(400).json({
        success: false,
        message: '只有空闲车位才能预订'
      });
    }

    // 更新车位状态为预订
    const updatedSpace = await ParkingSpace.findByIdAndUpdate(
      id,
      { 
        status: 'reserved',
        occupiedBy: {
          userId,
          vehicleNumber
        },
        occupiedAt: new Date()
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      data: updatedSpace,
      message: '车位预订成功'
    });
  } catch (error) {
    console.error('预订车位失败:', error);
    res.status(500).json({
      success: false,
      message: '预订车位失败',
      error: error.message
    });
  }
});

// 获取车位统计数据
router.get('/stats/overview', auth, async (req, res) => {
  try {
    const { parkingLotId } = req.query;
    
    // 构建查询条件
    const matchCondition = {};
    if (parkingLotId) {
      matchCondition.parkingLotId = parkingLotId;
    }
    
    // 聚合查询
    const stats = await ParkingSpace.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          available: { $sum: { $cond: [{ $eq: ['$status', 'available'] }, 1, 0] } },
          occupied: { $sum: { $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0] } },
          reserved: { $sum: { $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0] } },
          maintenance: { $sum: { $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0] } },
          standard: { $sum: { $cond: [{ $eq: ['$type', 'standard'] }, 1, 0] } },
          disabled: { $sum: { $cond: [{ $eq: ['$type', 'disabled'] }, 1, 0] } },
          electric: { $sum: { $cond: [{ $eq: ['$type', 'electric'] }, 1, 0] } },
          large: { $sum: { $cond: [{ $eq: ['$type', 'large'] }, 1, 0] } }
        }
      }
    ]);
    
    // 计算占用率
    const result = stats[0] || {
      total: 0,
      available: 0,
      occupied: 0,
      reserved: 0,
      maintenance: 0,
      standard: 0,
      disabled: 0,
      electric: 0,
      large: 0
    };
    
    result.occupancyRate = result.total > 0 ? (result.occupied / result.total * 100).toFixed(2) : 0;
    
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取车位统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取车位统计数据失败',
      error: error.message
    });
  }
});

// 批量更新车位状态
router.put('/batch/status', auth, async (req, res) => {
  try {
    const { spaceIds, status } = req.body;
    
    if (!spaceIds || !Array.isArray(spaceIds) || spaceIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: '请提供车位ID列表'
      });
    }
    
    if (!status) {
      return res.status(400).json({
        success: false,
        message: '请提供状态'
      });
    }
    
    // 批量更新
    const result = await ParkingSpace.updateMany(
      { _id: { $in: spaceIds } },
      { status }
    );
    
    // 自动同步更新后的车位状态到TCC后端（微信小程序）
    if (result.modifiedCount > 0) {
      try {
        const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService');
        const updatedSpaces = await ParkingSpace.find({ _id: { $in: spaceIds } });
        
        let syncSuccessCount = 0;
        for (const space of updatedSpaces) {
          if (space.spaceId) {
            try {
              await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
                space.spaceId,
                status
              );
              syncSuccessCount++;
            } catch (syncError) {
              console.error(`[批量同步] 车位 ${space.spaceId} 同步失败:`, syncError.message);
            }
          }
        }
        console.log(`[批量同步] 成功同步 ${syncSuccessCount}/${result.modifiedCount} 个车位状态到微信小程序后端`);
      } catch (syncError) {
        console.error(`[批量同步] 同步过程出错:`, syncError.message);
        // 不影响主流程，只记录错误
      }
    }
    
    res.status(200).json({
      success: true,
      data: {
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount
      },
      message: `成功更新 ${result.modifiedCount} 个车位状态`
    });
  } catch (error) {
    console.error('批量更新车位状态失败:', error);
    res.status(500).json({
      success: false,
      message: '批量更新车位状态失败',
      error: error.message
    });
  }
});

module.exports = router;