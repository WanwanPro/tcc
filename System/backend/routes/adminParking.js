const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpace = require('../models/ParkingSpace');
const Transaction = require('../models/Transaction');
const PricingRule = require('../models/PricingRule');

// 获取停车场列表
router.get('/lots', auth, async (req, res) => {
  try {
    const { page = 1, size = 10, name, status } = req.query;
    const skip = (page - 1) * size;
    
    // 构建查询条件
    const query = {};
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (status) {
      query.status = status;
    }
    
    // 查询停车场列表
    const lots = await ParkingLot.find(query)
      .skip(skip)
      .limit(parseInt(size))
      .sort({ createdAt: -1 });
    
    // 查询总数
    const total = await ParkingLot.countDocuments(query);
    
    // 为每个停车场添加可用车位数
    const lotsWithAvailable = await Promise.all(lots.map(async (lot) => {
      const availableCount = await ParkingSpace.countDocuments({
        parkingLotId: lot._id,
        isOccupied: false
      });
      
      return {
        ...lot.toObject(),
        availableSpaces: availableCount
      };
    }));
    
    res.json({
      success: true,
      data: {
        list: lotsWithAvailable,
        total,
        page: parseInt(page),
        size: parseInt(size)
      }
    });
  } catch (error) {
    console.error('获取停车场列表失败:', error);
    res.status(500).json({
      success: false,
      message: '获取停车场列表失败',
      error: error.message
    });
  }
});

// 获取停车场详情
router.get('/lots/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const lot = await ParkingLot.findById(id);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      });
    }
    
    // 获取可用车位数
    const availableCount = await ParkingSpace.countDocuments({
      parkingLotId: lot._id,
      isOccupied: false
    });
    
    // 获取总车位数
    const totalSpaces = await ParkingSpace.countDocuments({
      parkingLotId: lot._id
    });
    
    res.json({
      success: true,
      data: {
        ...lot.toObject(),
        availableSpaces: availableCount,
        totalSpaces
      }
    });
  } catch (error) {
    console.error('获取停车场详情失败:', error);
    res.status(500).json({
      success: false,
      message: '获取停车场详情失败',
      error: error.message
    });
  }
});

// 创建停车场
router.post('/lots', auth, async (req, res) => {
  try {
    const { name, address, totalSpaces, hourlyRate, dailyRate, status, description } = req.body;
    
    // 验证必填字段
    if (!name || !address || !totalSpaces || !hourlyRate || !dailyRate) {
      return res.status(400).json({
        success: false,
        message: '请填写完整的停车场信息'
      });
    }
    
    // 检查停车场名称是否已存在
    const existingLot = await ParkingLot.findOne({ name });
    if (existingLot) {
      return res.status(400).json({
        success: false,
        message: '停车场名称已存在'
      });
    }
    
    // 创建停车场
    const newLot = new ParkingLot({
      name,
      address,
      totalSpaces,
      hourlyRate,
      dailyRate,
      status: status || 'active',
      description
    });
    
    await newLot.save();
    
    // 创建对应的车位
    const spaces = [];
    for (let i = 1; i <= totalSpaces; i++) {
      spaces.push({
        parkingLotId: newLot._id,
        spaceNumber: `${name}-${i.toString().padStart(3, '0')}`,
        floor: 1, // 默认1楼
        zone: 'A', // 默认A区
        type: 'standard', // 默认标准车位
        isOccupied: false
      });
    }
    
    await ParkingSpace.insertMany(spaces);
    
    res.status(201).json({
      success: true,
      message: '停车场创建成功',
      data: newLot
    });
  } catch (error) {
    console.error('创建停车场失败:', error);
    res.status(500).json({
      success: false,
      message: '创建停车场失败',
      error: error.message
    });
  }
});

// 更新停车场
router.put('/lots/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, totalSpaces, hourlyRate, dailyRate, status, description } = req.body;
    
    // 验证停车场是否存在
    const lot = await ParkingLot.findById(id);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      });
    }
    
    // 如果修改了名称，检查新名称是否已存在
    if (name && name !== lot.name) {
      const existingLot = await ParkingLot.findOne({ name });
      if (existingLot) {
        return res.status(400).json({
          success: false,
          message: '停车场名称已存在'
        });
      }
    }
    
    // 更新停车场信息
    const updatedLot = await ParkingLot.findByIdAndUpdate(
      id,
      {
        name: name || lot.name,
        address: address || lot.address,
        totalSpaces: totalSpaces || lot.totalSpaces,
        hourlyRate: hourlyRate || lot.hourlyRate,
        dailyRate: dailyRate || lot.dailyRate,
        status: status !== undefined ? status : lot.status,
        description: description !== undefined ? description : lot.description
      },
      { new: true }
    );
    
    // 如果车位数发生变化，需要调整车位
    if (totalSpaces && totalSpaces !== lot.totalSpaces) {
      const currentSpaceCount = await ParkingSpace.countDocuments({ parkingLotId: id });
      
      if (totalSpaces > currentSpaceCount) {
        // 需要添加车位
        const spacesToAdd = totalSpaces - currentSpaceCount;
        const newSpaces = [];
        
        for (let i = 1; i <= spacesToAdd; i++) {
          newSpaces.push({
            parkingLotId: id,
            spaceNumber: `${updatedLot.name}-${(currentSpaceCount + i).toString().padStart(3, '0')}`,
            floor: 1,
            zone: 'A',
            type: 'standard',
            isOccupied: false
          });
        }
        
        await ParkingSpace.insertMany(newSpaces);
      } else if (totalSpaces < currentSpaceCount) {
        // 需要删除车位（只能删除空闲车位）
        const occupiedSpaces = await ParkingSpace.countDocuments({
          parkingLotId: id,
          isOccupied: true
        });
        
        if (occupiedSpaces > totalSpaces) {
          return res.status(400).json({
            success: false,
            message: '无法减少车位数，当前已占用车位数超过目标车位数'
          });
        }
        
        // 删除多余的车位
        const spacesToDelete = currentSpaceCount - totalSpaces;
        const spacesToRemove = await ParkingSpace.find({
          parkingLotId: id,
          isOccupied: false
        }).limit(spacesToDelete);
        
        const spaceIdsToRemove = spacesToRemove.map(space => space._id);
        await ParkingSpace.deleteMany({
          _id: { $in: spaceIdsToRemove }
        });
      }
    }
    
    res.json({
      success: true,
      message: '停车场更新成功',
      data: updatedLot
    });
  } catch (error) {
    console.error('更新停车场失败:', error);
    res.status(500).json({
      success: false,
      message: '更新停车场失败',
      error: error.message
    });
  }
});

// 删除停车场
router.delete('/lots/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证停车场是否存在
    const lot = await ParkingLot.findById(id);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      });
    }
    
    // 检查是否有占用的车位
    const occupiedSpaces = await ParkingSpace.countDocuments({
      parkingLotId: id,
      isOccupied: true
    });
    
    if (occupiedSpaces > 0) {
      return res.status(400).json({
        success: false,
        message: '无法删除停车场，当前有占用的车位'
      });
    }
    
    // 删除相关的车位
    await ParkingSpace.deleteMany({ parkingLotId: id });
    
    // 删除停车场
    await ParkingLot.findByIdAndDelete(id);
    
    res.json({
      success: true,
      message: '停车场删除成功'
    });
  } catch (error) {
    console.error('删除停车场失败:', error);
    res.status(500).json({
      success: false,
      message: '删除停车场失败',
      error: error.message
    });
  }
});

// 获取停车场统计数据
router.get('/lots/:id/stats', auth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // 验证停车场是否存在
    const lot = await ParkingLot.findById(id);
    if (!lot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      });
    }
    
    // 获取总车位数
    const totalSpaces = await ParkingSpace.countDocuments({ parkingLotId: id });
    
    // 获取占用车位数
    const occupiedSpaces = await ParkingSpace.countDocuments({
      parkingLotId: id,
      isOccupied: true
    });
    
    // 获取可用车位数
    const availableSpaces = totalSpaces - occupiedSpaces;
    
    // 计算占用率
    const occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;
    
    // 获取今日停车记录数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRecords = await Transaction.countDocuments({
      parkingLotId: id,
      createdAt: { $gte: today, $lt: tomorrow },
      type: 'parking'
    });
    
    // 获取今日收入
    const todayRevenue = await Transaction.aggregate([
      {
        $match: {
          parkingLotId: lot._id,
          createdAt: { $gte: today, $lt: tomorrow },
          type: 'parking',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        totalSpaces,
        occupiedSpaces,
        availableSpaces,
        occupancyRate,
        todayRecords,
        todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0
      }
    });
  } catch (error) {
    console.error('获取停车场统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取停车场统计数据失败',
      error: error.message
    });
  }
});

// 获取所有停车场统计数据
router.get('/stats', auth, async (req, res) => {
  try {
    // 获取所有停车场
    const lots = await ParkingLot.find({});
    
    // 为每个停车场获取统计数据
    const lotStats = await Promise.all(lots.map(async (lot) => {
      // 获取总车位数
      const totalSpaces = await ParkingSpace.countDocuments({ parkingLotId: lot._id });
      
      // 获取占用车位数
      const occupiedSpaces = await ParkingSpace.countDocuments({
        parkingLotId: lot._id,
        isOccupied: true
      });
      
      // 计算占用率
      const occupancyRate = totalSpaces > 0 ? Math.round((occupiedSpaces / totalSpaces) * 100) : 0;
      
      return {
        _id: lot._id,
        name: lot.name,
        totalSpaces,
        occupiedSpaces,
        availableSpaces: totalSpaces - occupiedSpaces,
        occupancyRate,
        status: lot.status
      };
    }));
    
    // 计算总体统计数据
    const totalLots = lotStats.length;
    const totalSpaces = lotStats.reduce((sum, lot) => sum + lot.totalSpaces, 0);
    const totalOccupiedSpaces = lotStats.reduce((sum, lot) => sum + lot.occupiedSpaces, 0);
    const totalAvailableSpaces = totalSpaces - totalOccupiedSpaces;
    const overallOccupancyRate = totalSpaces > 0 ? Math.round((totalOccupiedSpaces / totalSpaces) * 100) : 0;
    
    // 获取今日停车记录数
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayRecords = await Transaction.countDocuments({
      createdAt: { $gte: today, $lt: tomorrow },
      type: 'parking'
    });
    
    // 获取今日收入
    const todayRevenue = await Transaction.aggregate([
      {
        $match: {
          createdAt: { $gte: today, $lt: tomorrow },
          type: 'parking',
          status: 'completed'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    res.json({
      success: true,
      data: {
        overview: {
          totalLots,
          totalSpaces,
          occupiedSpaces: totalOccupiedSpaces,
          availableSpaces: totalAvailableSpaces,
          overallOccupancyRate,
          todayRecords,
          todayRevenue: todayRevenue.length > 0 ? todayRevenue[0].total : 0
        },
        lotStats
      }
    });
  } catch (error) {
    console.error('获取所有停车场统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取所有停车场统计数据失败',
      error: error.message
    });
  }
});

module.exports = router;