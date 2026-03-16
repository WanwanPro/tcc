const mongoose = require('mongoose');
const ParkingSpace = require('../models/ParkingSpace');
const apiAdapterService = require('../services/apiAdapterService');
const dataModelMappingService = require('../services/dataModelMappingService');
const { upsert } = require('../../shared/dal/atomic');
const { connectUnified } = require('../../shared/dal/mongo');

const STATUS_TO_SYSTEM = {
  '空闲': 'available',
  '占用': 'occupied',
  '预定': 'reserved',
  '维护中': 'maintenance',
  'available': 'available',
  'occupied': 'occupied',
  'reserved': 'reserved',
  'maintenance': 'maintenance'
};

const STATUS_TO_TEXT = {
  available: '空闲',
  occupied: '占用',
  reserved: '预定',
  maintenance: '维护中'
};

function normalizeStatusKey(status) {
  return STATUS_TO_SYSTEM[status] || 'available';
}

function normalizeSpaceDto(space) {
  if (!space) return null;

  const raw = typeof space.toObject === 'function' ? space.toObject() : space;
  const statusKey = normalizeStatusKey(raw.status);

  return {
    id: raw.id || raw._id?.toString?.() || '',
    spaceId: raw.spaceId || raw.spaceNumber || '',
    lotId: raw.lotId?._id?.toString?.() || raw.lotId || raw.parkingLotId || '',
    lotName: raw.lotName || raw.lotId?.name || raw.parkingLot?.name || '',
    floorId: raw.floorId || raw.floor || '',
    area: raw.area || raw.zone || '',
    type: raw.type || 'standard',
    position: raw.position || raw.coordinates || { x: 0, y: 0 },
    occupiedBy: raw.occupiedBy || null,
    status: STATUS_TO_TEXT[statusKey],
    statusKey,
    statusText: STATUS_TO_TEXT[statusKey],
    updatedAt: raw.updatedAt || raw.lastUpdated || new Date()
  };
}

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

    const normalizedSpaces = spaces
      .map(normalizeSpaceDto)
      .filter(Boolean);

    res.json({
      success: true,
      message: normalizedSpaces.length > 0 ? '获取车位状态成功' : '未获取到数据',
      data: normalizedSpaces
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
    const statusKey = normalizeStatusKey(status);
    const statusText = STATUS_TO_TEXT[statusKey];
    if (!statusText) {
      return res.status(400).json({
        success: false,
        message: '无效的车位状态'
      });
    }

    let updatedSpace = null;

    // 默认优先同步到 System，保持与管理后台同源。
    if (syncToSystem !== 'false') {
      try {
        await apiAdapterService.updateParkingSpaceStatusInSystem(spaceId, statusKey);
        console.log(`车位 ${spaceId} 状态已同步到System后台`);
      } catch (systemError) {
        console.error('同步车位状态到System后台失败:', systemError.message);
      }
    }

    let connected = true;
    try {
      await connectUnified();
    } catch (e) {
      connected = false;
      console.error('[updateSpaceStatus] 本地数据库连接失败:', e && e.message ? e.message : e);
    }

    if (connected && mongoose.connection && mongoose.connection.readyState === 1) {
      const existing = await ParkingSpace.findOne({ spaceId });

      if (existing) {
        const doc = {
          _id: existing._id,
          spaceId,
          position: existing.position,
          status: statusText,
          updatedAt: new Date()
        };
        await upsert('parkingspaces', doc, ['view_admin_parkingspaces', 'view_miniprogram_parkingspaces']);
        updatedSpace = await ParkingSpace.findOne({ spaceId });
      }
    }
    
    res.json({
      success: true,
      message: '车位状态更新成功',
      data: normalizeSpaceDto(updatedSpace) || {
        id: '',
        spaceId,
        lotId: '',
        lotName: '',
        floorId: '',
        area: '',
        type: 'standard',
        position: { x: 0, y: 0 },
        occupiedBy: null,
        status: statusText,
        statusKey,
        statusText,
        updatedAt: new Date()
      }
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
