const express = require('express');
const router = express.Router();
const { User } = require('../models/User');
const ParkingLot = require('../models/ParkingLot');
const ParkingSpace = require('../models/ParkingSpace');
const Transaction = require('../models/Transaction');
const { auth } = require('../middleware/auth');

// 获取仪表盘统计数据
router.get('/dashboard', auth, async (req, res) => {
  try {
    // 总用户数
    const totalUsers = await User.countDocuments({ status: 'active' });

    // 总停车场数
    const totalParkingLots = await ParkingLot.countDocuments({ status: 'active' });

    // 总车位数
    const totalSpaces = await ParkingSpace.countDocuments();

    // 本月收入
    const currentMonth = new Date();
    currentMonth.setDate(1);
    currentMonth.setHours(0, 0, 0, 0);

    const monthlyRevenue = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          status: 'completed',
          createdAt: { $gte: currentMonth }
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
        totalUsers,
        totalParkingLots,
        totalSpaces,
        monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0
      }
    });
  } catch (error) {
    console.error('获取仪表盘统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取仪表盘统计数据失败',
      error: error.message
    });
  }
});

// 获取用户统计数据
router.get('/users', auth, async (req, res) => {
  try {
    // 总用户数
    const totalUsers = await User.countDocuments();

    // 活跃用户数
    const activeUsers = await User.countDocuments({ status: 'active' });

    // 禁用用户数
    const disabledUsers = await User.countDocuments({ status: 'disabled' });

    // 黑名单用户数
    const blacklistedUsers = await User.countDocuments({ status: 'blacklist' });

    // 按用户类型统计
    const userTypes = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    // 最近30天注册用户数
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        disabledUsers,
        blacklistedUsers,
        userTypes: userTypes.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        recentUsers
      }
    });
  } catch (error) {
    console.error('获取用户统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户统计数据失败',
      error: error.message
    });
  }
});

// 获取停车场统计数据
router.get('/parking-lots', auth, async (req, res) => {
  try {
    // 总停车场数
    const totalParkingLots = await ParkingLot.countDocuments();

    // 活跃停车场数
    const activeParkingLots = await ParkingLot.countDocuments({ status: 'active' });

    // 维护中停车场数
    const maintenanceParkingLots = await ParkingLot.countDocuments({ status: 'maintenance' });

    // 停用停车场数
    const disabledParkingLots = await ParkingLot.countDocuments({ status: 'disabled' });

    // 按城市统计
    const parkingLotsByCity = await ParkingLot.aggregate([
      {
        $group: {
          _id: '$address.city',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalParkingLots,
        activeParkingLots,
        maintenanceParkingLots,
        disabledParkingLots,
        parkingLotsByCity: parkingLotsByCity.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
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

// 获取车位统计数据
router.get('/parking-spaces', auth, async (req, res) => {
  try {
    // 总车位数
    const totalSpaces = await ParkingSpace.countDocuments();

    // 空闲车位数
    const availableSpaces = await ParkingSpace.countDocuments({ status: 'available' });

    // 占用车位数
    const occupiedSpaces = await ParkingSpace.countDocuments({ status: 'occupied' });

    // 预订车位数
    const reservedSpaces = await ParkingSpace.countDocuments({ status: 'reserved' });

    // 维护中车位数
    const maintenanceSpaces = await ParkingSpace.countDocuments({ status: 'maintenance' });

    // 按类型统计
    const spacesByType = await ParkingSpace.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        totalSpaces,
        availableSpaces,
        occupiedSpaces,
        reservedSpaces,
        maintenanceSpaces,
        spacesByType: spacesByType.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {})
      }
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

// 获取收入统计数据
router.get('/revenue', auth, async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;

    let startDate, endDate, groupBy;

    if (period === 'day') {
      startDate = new Date(year, new Date().getMonth(), 1);
      endDate = new Date(year, new Date().getMonth() + 1, 0);
      groupBy = { $dayOfMonth: '$exitTime' };
    } else if (period === 'week') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $week: '$exitTime' };
    } else if (period === 'month') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $month: '$exitTime' };
    } else if (period === 'year') {
      startDate = new Date(year - 5, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $year: '$exitTime' };
    }

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    // 总收入
    const totalRevenue = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
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
        revenueData,
        totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
      }
    });
  } catch (error) {
    console.error('获取收入统计数据失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收入统计数据失败',
      error: error.message
    });
  }
});

// 获取用户增长趋势
router.get('/user-growth', auth, async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;

    let startDate, endDate, groupBy;

    if (period === 'day') {
      startDate = new Date(year, new Date().getMonth(), 1);
      endDate = new Date(year, new Date().getMonth() + 1, 0);
      groupBy = { $dayOfMonth: '$createdAt' };
    } else if (period === 'week') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $week: '$createdAt' };
    } else if (period === 'month') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $month: '$createdAt' };
    } else if (period === 'year') {
      startDate = new Date(year - 5, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $year: '$createdAt' };
    }

    const userGrowthData = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: userGrowthData
    });
  } catch (error) {
    console.error('获取用户增长趋势失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户增长趋势失败',
      error: error.message
    });
  }
});

// 获取停车记录统计
router.get('/parking-records', auth, async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;

    let startDate, endDate, groupBy;

    if (period === 'day') {
      startDate = new Date(year, new Date().getMonth(), 1);
      endDate = new Date(year, new Date().getMonth() + 1, 0);
      groupBy = { $dayOfMonth: '$entryTime' };
    } else if (period === 'week') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $week: '$entryTime' };
    } else if (period === 'month') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $month: '$entryTime' };
    } else if (period === 'year') {
      startDate = new Date(year - 5, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $year: '$entryTime' };
    }

    const parkingRecordData = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          count: { $sum: 1 },
          avgDuration: { $avg: '$duration' },
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: parkingRecordData
    });
  } catch (error) {
    console.error('获取停车记录统计失败:', error);
    res.status(500).json({
      success: false,
      message: '获取停车记录统计失败',
      error: error.message
    });
  }
});

// 获取热门停车场排行
router.get('/hot-parking-lots', auth, async (req, res) => {
  try {
    const { limit = 10, period = 'month' } = req.query;

    let startDate;

    if (period === 'day') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 1);
    } else if (period === 'week') {
      startDate = new Date();
      startDate.setDate(startDate.getDate() - 7);
    } else if (period === 'month') {
      startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);
    } else if (period === 'year') {
      startDate = new Date();
      startDate.setFullYear(startDate.getFullYear() - 1);
    }

    const hotParkingLots = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$parkingLotId',
          count: { $sum: 1 },
          revenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { count: -1 }
      },
      {
        $limit: parseInt(limit)
      }
    ]);

    // 获取停车场详细信息
    const parkingLotIds = hotParkingLots.map(item => item._id);
    const parkingLots = await ParkingLot.find({ _id: { $in: parkingLotIds } });

    // 获取每个停车场的车位信息
    const parkingLotSpaces = await ParkingSpace.aggregate([
      {
        $match: {
          parkingLotId: { $in: parkingLotIds }
        }
      },
      {
        $group: {
          _id: '$parkingLotId',
          totalSpaces: { $sum: 1 },
          occupiedSpaces: {
            $sum: {
              $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // 合并数据
    const result = hotParkingLots.map((item, index) => {
      const parkingLot = parkingLots.find(lot => lot._id.toString() === item._id.toString());
      const spaces = parkingLotSpaces.find(space => space._id.toString() === item._id.toString());

      return {
        rank: index + 1,
        id: item._id,
        name: parkingLot ? parkingLot.name : '未知停车场',
        totalSpaces: spaces ? spaces.totalSpaces : 0,
        occupiedSpaces: spaces ? spaces.occupiedSpaces : 0,
        usageRate: spaces ? Math.round((spaces.occupiedSpaces / spaces.totalSpaces) * 100) : 0,
        monthlyRevenue: item.revenue || 0
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取热门停车场排行失败:', error);
    res.status(500).json({
      success: false,
      message: '获取热门停车场排行失败',
      error: error.message
    });
  }
});

// 获取实时车位使用情况
router.get('/real-time-usage', auth, async (req, res) => {
  try {
    const { parkingLotId } = req.query;

    let matchCondition = {};
    if (parkingLotId) {
      matchCondition.parkingLotId = parkingLotId;
    }

    const realTimeUsage = await ParkingSpace.aggregate([
      {
        $match: matchCondition
      },
      {
        $group: {
          _id: {
            parkingLotId: '$parkingLotId',
            floorId: '$floorId'
          },
          totalSpaces: { $sum: 1 },
          availableSpaces: {
            $sum: {
              $cond: [{ $eq: ['$status', 'available'] }, 1, 0]
            }
          },
          occupiedSpaces: {
            $sum: {
              $cond: [{ $eq: ['$status', 'occupied'] }, 1, 0]
            }
          },
          reservedSpaces: {
            $sum: {
              $cond: [{ $eq: ['$status', 'reserved'] }, 1, 0]
            }
          },
          maintenanceSpaces: {
            $sum: {
              $cond: [{ $eq: ['$status', 'maintenance'] }, 1, 0]
            }
          }
        }
      }
    ]);

    // 获取停车场名称
    const parkingLotIds = [...new Set(realTimeUsage.map(item => item._id.parkingLotId))];
    const parkingLots = await ParkingLot.find({ _id: { $in: parkingLotIds } });

    // 格式化结果
    const result = realTimeUsage.map(item => {
      const parkingLot = parkingLots.find(lot => lot._id.toString() === item._id.parkingLotId.toString());
      
      return {
        parkingLotId: item._id.parkingLotId,
        parkingLotName: parkingLot ? parkingLot.name : '未知停车场',
        floorId: item._id.floorId,
        totalSpaces: item.totalSpaces,
        availableSpaces: item.availableSpaces,
        occupiedSpaces: item.occupiedSpaces,
        reservedSpaces: item.reservedSpaces,
        maintenanceSpaces: item.maintenanceSpaces,
        usageRate: Math.round((item.occupiedSpaces / item.totalSpaces) * 100)
      };
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('获取实时车位使用情况失败:', error);
    res.status(500).json({
      success: false,
      message: '获取实时车位使用情况失败',
      error: error.message
    });
  }
});

// 获取用户类型分布
router.get('/user-type-distribution', auth, async (req, res) => {
  try {
    const userTypeDistribution = await User.aggregate([
      {
        $group: {
          _id: '$userType',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      success: true,
      data: userTypeDistribution
    });
  } catch (error) {
    console.error('获取用户类型分布失败:', error);
    res.status(500).json({
      success: false,
      message: '获取用户类型分布失败',
      error: error.message
    });
  }
});

// 获取收入趋势
router.get('/revenue-trend', auth, async (req, res) => {
  try {
    const { period = 'month', year = new Date().getFullYear() } = req.query;

    let startDate, endDate, groupBy;

    if (period === 'day') {
      startDate = new Date(year, new Date().getMonth(), 1);
      endDate = new Date(year, new Date().getMonth() + 1, 0);
      groupBy = { $dayOfMonth: '$exitTime' };
    } else if (period === 'week') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $week: '$exitTime' };
    } else if (period === 'month') {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $month: '$exitTime' };
    } else if (period === 'year') {
      startDate = new Date(year - 5, 0, 1);
      endDate = new Date(year, 11, 31);
      groupBy = { $year: '$exitTime' };
    }

    const revenueTrend = await Transaction.aggregate([
      {
        $match: {
          type: 'parking',
          status: 'completed',
          createdAt: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: groupBy,
          parkingRevenue: {
            $sum: {
              $cond: [{ $eq: ['$type', 'parking'] }, '$amount', 0]
            }
          },
          otherRevenue: {
            $sum: {
              $cond: [{ $ne: ['$type', 'parking'] }, '$amount', 0]
            }
          },
          totalRevenue: { $sum: '$amount' }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);

    res.json({
      success: true,
      data: revenueTrend
    });
  } catch (error) {
    console.error('获取收入趋势失败:', error);
    res.status(500).json({
      success: false,
      message: '获取收入趋势失败',
      error: error.message
    });
  }
});

// 导出统计报表
router.get('/export', auth, async (req, res) => {
  try {
    const { type = 'dashboard', format = 'excel', period = 'month' } = req.query;

    // 根据类型获取数据
    let data;
    let filename;

    switch (type) {
      case 'dashboard':
        data = await getDashboardStatistics();
        filename = `dashboard_statistics_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'users':
        data = await getUserStatistics();
        filename = `user_statistics_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'parking-lots':
        data = await getParkingLotStatistics();
        filename = `parking_lot_statistics_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'parking-spaces':
        data = await getParkingSpaceStatistics();
        filename = `parking_space_statistics_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      case 'revenue':
        data = await getRevenueStatistics({ period });
        filename = `revenue_statistics_${new Date().toISOString().split('T')[0]}.${format}`;
        break;
      default:
        return res.status(400).json({
          success: false,
          message: '不支持的报表类型'
        });
    }

    // 这里应该实现实际的导出逻辑，例如生成Excel或PDF文件
    // 为了简化，这里只是返回一个模拟的文件

    res.json({
      success: true,
      message: '报表导出成功',
      data: {
        filename,
        downloadUrl: `/api/downloads/${filename}`
      }
    });
  } catch (error) {
    console.error('导出统计报表失败:', error);
    res.status(500).json({
      success: false,
      message: '导出统计报表失败',
      error: error.message
    });
  }
});

// 辅助函数：获取仪表盘统计数据
async function getDashboardStatistics() {
  const totalUsers = await User.countDocuments({ status: 'active' });
  const totalParkingLots = await ParkingLot.countDocuments({ status: 'active' });
  const totalSpaces = await ParkingSpace.countDocuments();

  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);

  const monthlyRevenue = await Transaction.aggregate([
    {
      $match: {
        type: 'parking',
        status: 'completed',
        createdAt: { $gte: currentMonth }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return {
    totalUsers,
    totalParkingLots,
    totalSpaces,
    monthlyRevenue: monthlyRevenue.length > 0 ? monthlyRevenue[0].total : 0
  };
}

// 辅助函数：获取用户统计数据
async function getUserStatistics() {
  const totalUsers = await User.countDocuments();
  const activeUsers = await User.countDocuments({ status: 'active' });
  const disabledUsers = await User.countDocuments({ status: 'disabled' });
  const blacklistedUsers = await User.countDocuments({ status: 'blacklist' });

  const userTypes = await User.aggregate([
    {
      $group: {
        _id: '$userType',
        count: { $sum: 1 }
      }
    }
  ]);

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const recentUsers = await User.countDocuments({
    createdAt: { $gte: thirtyDaysAgo }
  });

  return {
    totalUsers,
    activeUsers,
    disabledUsers,
    blacklistedUsers,
    userTypes: userTypes.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {}),
    recentUsers
  };
}

// 辅助函数：获取停车场统计数据
async function getParkingLotStatistics() {
  const totalParkingLots = await ParkingLot.countDocuments();
  const activeParkingLots = await ParkingLot.countDocuments({ status: 'active' });
  const maintenanceParkingLots = await ParkingLot.countDocuments({ status: 'maintenance' });
  const disabledParkingLots = await ParkingLot.countDocuments({ status: 'disabled' });

  const parkingLotsByCity = await ParkingLot.aggregate([
    {
      $group: {
        _id: '$address.city',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    totalParkingLots,
    activeParkingLots,
    maintenanceParkingLots,
    disabledParkingLots,
    parkingLotsByCity: parkingLotsByCity.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
}

// 辅助函数：获取车位统计数据
async function getParkingSpaceStatistics() {
  const totalSpaces = await ParkingSpace.countDocuments();
  const availableSpaces = await ParkingSpace.countDocuments({ status: 'available' });
  const occupiedSpaces = await ParkingSpace.countDocuments({ status: 'occupied' });
  const reservedSpaces = await ParkingSpace.countDocuments({ status: 'reserved' });
  const maintenanceSpaces = await ParkingSpace.countDocuments({ status: 'maintenance' });

  const spacesByType = await ParkingSpace.aggregate([
    {
      $group: {
        _id: '$type',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    totalSpaces,
    availableSpaces,
    occupiedSpaces,
    reservedSpaces,
    maintenanceSpaces,
    spacesByType: spacesByType.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {})
  };
}

// 辅助函数：获取收入统计数据
async function getRevenueStatistics({ period = 'month', year = new Date().getFullYear() }) {
  let startDate, endDate, groupBy;

  if (period === 'day') {
    startDate = new Date(year, new Date().getMonth(), 1);
    endDate = new Date(year, new Date().getMonth() + 1, 0);
    groupBy = { $dayOfMonth: '$exitTime' };
  } else if (period === 'week') {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
    groupBy = { $week: '$exitTime' };
  } else if (period === 'month') {
    startDate = new Date(year, 0, 1);
    endDate = new Date(year, 11, 31);
    groupBy = { $month: '$exitTime' };
  } else if (period === 'year') {
    startDate = new Date(year - 5, 0, 1);
    endDate = new Date(year, 11, 31);
    groupBy = { $year: '$exitTime' };
  }

  const revenueData = await Transaction.aggregate([
    {
      $match: {
        type: 'parking',
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: groupBy,
        revenue: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { _id: 1 }
    }
  ]);

  const totalRevenue = await Transaction.aggregate([
    {
      $match: {
        type: 'parking',
        status: 'completed',
        createdAt: { $gte: startDate, $lte: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$amount' }
      }
    }
  ]);

  return {
    revenueData,
    totalRevenue: totalRevenue.length > 0 ? totalRevenue[0].total : 0
  };
}

module.exports = router;
