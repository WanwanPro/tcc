/**
 * 检查车位状态统计脚本
 */

const mongoose = require('mongoose');
require('dotenv').config();

const SYSTEM_DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_admin';

async function checkStatus() {
  try {
    await mongoose.connect(SYSTEM_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const ParkingSpace = require('../../System/backend/models/ParkingSpace');
    
    const total = await ParkingSpace.countDocuments({});
    console.log('总车位数:', total);
    
    const stats = await ParkingSpace.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    console.log('\n状态统计:');
    stats.forEach(stat => {
      console.log(`  ${stat._id}: ${stat.count}`);
    });
    
    const available = await ParkingSpace.countDocuments({ status: 'available' });
    const occupied = await ParkingSpace.countDocuments({ status: 'occupied' });
    const reserved = await ParkingSpace.countDocuments({ status: 'reserved' });
    const maintenance = await ParkingSpace.countDocuments({ status: 'maintenance' });
    
    console.log('\n详细统计:');
    console.log(`  available (空闲): ${available}`);
    console.log(`  occupied (占用): ${occupied}`);
    console.log(`  reserved (预定): ${reserved}`);
    console.log(`  maintenance (维护): ${maintenance}`);
    console.log(`  总计: ${available + occupied + reserved + maintenance}`);
    console.log(`  数据库总数: ${total}`);
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('错误:', error);
    process.exit(1);
  }
}

checkStatus();

