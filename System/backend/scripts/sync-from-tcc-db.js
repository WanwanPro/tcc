/**
 * 从 TCC 后端数据库同步车位数据到 System 后端数据库
 * 统一数据源
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 连接两个数据库
const TCC_DB_URI = process.env.TCC_MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_system';
const SYSTEM_DB_URI = process.env.MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_admin';

// System 数据库模型（先加载，避免名称冲突）
const ParkingSpace = require('../models/ParkingSpace');
const ParkingLot = require('../models/ParkingLot');

// TCC 数据库连接（使用独立连接避免模型冲突）
let tccConn;
let TCCParkingSpace;

async function syncData() {
  try {
    console.log('开始同步车位数据...\n');
    
    // 连接 TCC 数据库
    console.log('1. 连接 TCC 数据库...');
    tccConn = await mongoose.createConnection(TCC_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // 在 TCC 连接上创建模型（避免与 System 模型冲突）
    const TCCParkingSpaceSchema = new mongoose.Schema({}, { strict: false, collection: 'parkingspaces' });
    TCCParkingSpace = tccConn.model('TCCParkingSpace', TCCParkingSpaceSchema, 'parkingspaces');
    
    console.log('   ✅ TCC 数据库连接成功');
    
    // 连接 System 数据库
    console.log('2. 连接 System 数据库...');
    await mongoose.connect(SYSTEM_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('   ✅ System 数据库连接成功\n');
    
    // 从 TCC 数据库读取数据
    console.log('3. 从 TCC 数据库读取车位数据...');
    const tccSpaces = await TCCParkingSpace.find({});
    console.log(`   ✅ 读取到 ${tccSpaces.length} 个车位\n`);
    
    if (tccSpaces.length === 0) {
      console.log('⚠️  TCC 数据库中没有车位数据，请先运行初始化脚本');
      await mongoose.disconnect();
      await tccConn.close();
      process.exit(0);
    }
    
    // 查找或创建 TCC1 停车场
    console.log('4. 查找或创建 TCC1 停车场...');
    let parkingLot = await ParkingLot.findOne({ name: 'TCC1停车场' });
    
    if (!parkingLot) {
      parkingLot = new ParkingLot({
        name: 'TCC1停车场',
        address: 'TCC1大楼',
        description: '从 TCC 后端同步的停车场',
        totalSpaces: tccSpaces.length,
        floors: ['TCC1-F1'],
        operatingHours: {
          open: '00:00',
          close: '23:59'
        },
        status: 'active'
      });
      await parkingLot.save();
      console.log('   ✅ 创建了 TCC1 停车场');
    } else {
      console.log('   ✅ 找到 TCC1 停车场');
    }
    
    // 清除现有的 TCC1 车位（如果存在）
    console.log('\n5. 清除 System 数据库中的旧数据...');
    const deletedCount = await ParkingSpace.deleteMany({ lotId: parkingLot._id });
    console.log(`   ✅ 删除了 ${deletedCount.deletedCount} 个旧车位\n`);
    
    // 转换并同步数据
    console.log('6. 转换并同步车位数据...');
    const spacesToInsert = [];
    
    // 状态映射函数
    const mapStatusToSystem = (status) => {
      const mapping = {
        '空闲': 'available',
        '占用': 'occupied',
        '预定': 'reserved',
        'available': 'available',
        'occupied': 'occupied',
        'reserved': 'reserved'
      };
      return mapping[status] || 'available';
    };
    
    // 区域划分函数
    const determineArea = (x, y) => {
      if (!y) return 'A区';
      if (y < 400) return 'A区';
      if (y < 700) return 'B区';
      return 'C区';
    };
    
    tccSpaces.forEach((tccSpace, index) => {
      const x = tccSpace.position?.x || 0;
      const y = tccSpace.position?.y || 0;
      
      const systemSpace = {
        spaceId: tccSpace.spaceId || `TCC1-${String(index + 1).padStart(3, '0')}`,
        lotId: parkingLot._id,
        floorId: 'TCC1-F1',
        area: determineArea(x, y),
        type: 'standard',
        status: mapStatusToSystem(tccSpace.status),
        position: {
          x: x,
          y: y
        }
      };
      
      spacesToInsert.push(systemSpace);
    });
    
    // 批量插入
    if (spacesToInsert.length > 0) {
      await ParkingSpace.insertMany(spacesToInsert);
      console.log(`   ✅ 成功插入 ${spacesToInsert.length} 个车位\n`);
    }
    
    // 更新停车场的总车位数
    parkingLot.totalSpaces = spacesToInsert.length;
    // 检查是否有 availableSpaces 字段，如果没有则动态更新
    const availableCount = spacesToInsert.filter(s => s.status === 'available').length;
    if (parkingLot.schema.path('availableSpaces')) {
      parkingLot.availableSpaces = availableCount;
    }
    await parkingLot.save();
    console.log('   ✅ 更新了停车场统计信息\n');
    
    // 统计信息
    const stats = await ParkingSpace.aggregate([
      { $match: { lotId: parkingLot._id } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('📊 同步结果统计:');
    console.log(`   总车位: ${spacesToInsert.length}`);
    stats.forEach(stat => {
      console.log(`   ${stat._id}: ${stat.count}`);
    });
    
    console.log('\n✅ 数据同步完成！');
    
    // 关闭连接
    await mongoose.disconnect();
    await tccConn.close();
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 同步失败:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

// 运行同步
syncData();

