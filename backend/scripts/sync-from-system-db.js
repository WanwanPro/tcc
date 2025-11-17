/**
 * 从 System 后端数据库同步车位数据到 TCC 后端数据库
 * 确保微信小程序的数据与后台管理系统一致
 */

const mongoose = require('mongoose');
require('dotenv').config();

// 连接两个数据库
const SYSTEM_DB_URI = process.env.SYSTEM_MONGODB_URI || 'mongodb://localhost:27017/parking_admin';
const TCC_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_system';

// System 数据库模型（简化版，只读取需要的数据）
let systemConn;
let SystemParkingSpace;

// TCC 数据库模型
const ParkingSpace = require('../models/ParkingSpace');

async function syncData() {
  try {
    console.log('开始同步车位数据（System → TCC）...\n');
    
    // 连接 System 数据库
    console.log('1. 连接 System 数据库...');
    systemConn = await mongoose.createConnection(SYSTEM_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    // 在 System 连接上创建模型（避免与 TCC 模型冲突）
    const SystemParkingSpaceSchema = new mongoose.Schema({}, { strict: false, collection: 'parkingspaces' });
    SystemParkingSpace = systemConn.model('SystemParkingSpace', SystemParkingSpaceSchema, 'parkingspaces');
    
    console.log('   ✅ System 数据库连接成功');
    
    // 连接 TCC 数据库
    console.log('2. 连接 TCC 数据库...');
    await mongoose.connect(TCC_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('   ✅ TCC 数据库连接成功\n');
    
    // 从 System 数据库读取数据
    console.log('3. 从 System 数据库读取车位数据...');
    const systemSpaces = await SystemParkingSpace.find({});
    console.log(`   ✅ 读取到 ${systemSpaces.length} 个车位\n`);
    
    if (systemSpaces.length === 0) {
      console.log('⚠️  System 数据库中没有车位数据');
      await mongoose.disconnect();
      await systemConn.close();
      process.exit(0);
    }
    
    // 清除 TCC 数据库中的现有数据
    console.log('4. 清除 TCC 数据库中的旧数据...');
    const deletedCount = await ParkingSpace.deleteMany({});
    console.log(`   ✅ 删除了 ${deletedCount.deletedCount} 个旧车位\n`);
    
    // 状态映射函数：System (英文) -> TCC (中文)
    const mapStatusToTCC = (status) => {
      const mapping = {
        'available': '空闲',
        'occupied': '占用',
        'reserved': '预定',
        'maintenance': '占用', // 维修中视为占用
        '空闲': '空闲',
        '占用': '占用',
        '预定': '预定'
      };
      return mapping[status] || '空闲';
    };
    
    // 转换并同步数据
    console.log('5. 转换并同步车位数据...');
    const spacesToInsert = [];
    
    systemSpaces.forEach((systemSpace) => {
      const tccSpace = {
        spaceId: systemSpace.spaceId || `TCC-${String(systemSpace._id).substring(18, 24)}`,
        position: {
          x: systemSpace.position?.x || 0,
          y: systemSpace.position?.y || 0
        },
        status: mapStatusToTCC(systemSpace.status),
        updatedAt: systemSpace.updatedAt || systemSpace.lastUpdated || new Date()
      };
      
      spacesToInsert.push(tccSpace);
    });
    
    // 批量插入
    if (spacesToInsert.length > 0) {
      await ParkingSpace.insertMany(spacesToInsert);
      console.log(`   ✅ 成功插入 ${spacesToInsert.length} 个车位\n`);
    }
    
    // 统计信息
    const stats = await ParkingSpace.aggregate([
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
    await systemConn.close();
    
    process.exit(0);
    
  } catch (error) {
    console.error('❌ 同步失败:', error);
    console.error('错误堆栈:', error.stack);
    await mongoose.disconnect();
    if (systemConn) await systemConn.close();
    process.exit(1);
  }
}

// 运行同步
syncData();




