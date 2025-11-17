/**
 * 初始化 TCC 后端数据库的停车位数据
 * 从 tcc1date1.json 导入停车位到 TCC 后端 MongoDB
 */

const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const ParkingSpace = require('../models/ParkingSpace');

// 读取环境变量
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_system';

async function initTCSpaces() {
  try {
    console.log('开始初始化 TCC 停车位数据...');
    
    // 连接数据库
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ 数据库连接成功');

    // 读取 tcc1date1.json 数据
    const dataPath = path.join(__dirname, '../../tcc1date1.json');
    const rawData = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    
    console.log(`📦 读取到 ${rawData.parkingSpaces.length} 个停车位数据`);

    // 清除现有数据（可选，注释掉则保留已有数据）
    const deleteResult = await ParkingSpace.deleteMany({});
    console.log(`🗑️  已清除 ${deleteResult.deletedCount} 个现有停车位`);

    // 准备插入的数据
    const spacesToInsert = rawData.parkingSpaces.map((space, index) => {
      // 生成车位ID
      const spaceId = `TCC1-${String(index + 1).padStart(3, '0')}`;
      
      // 随机设置一些车位为占用状态（约30%占用率）
      const isOccupied = Math.random() < 0.3;
      const status = isOccupied ? '占用' : '空闲';
      
      return {
        spaceId: spaceId,
        position: {
          x: space.x,
          y: space.y
        },
        status: status,
        updatedAt: new Date()
      };
    });

    // 批量插入
    const result = await ParkingSpace.insertMany(spacesToInsert, { ordered: false });
    console.log(`✅ 成功插入 ${result.length} 个停车位`);

    // 统计信息
    const totalSpaces = await ParkingSpace.countDocuments({});
    const freeSpaces = await ParkingSpace.countDocuments({ status: '空闲' });
    const occupiedSpaces = await ParkingSpace.countDocuments({ status: '占用' });
    const reservedSpaces = await ParkingSpace.countDocuments({ status: '预定' });

    console.log('\n📊 数据库统计:');
    console.log(`   总车位: ${totalSpaces}`);
    console.log(`   空闲: ${freeSpaces}`);
    console.log(`   占用: ${occupiedSpaces}`);
    console.log(`   预定: ${reservedSpaces}`);

    console.log('\n✅ TCC 停车位数据初始化完成！');
    
    await mongoose.disconnect();
    process.exit(0);

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    
    if (error.code === 11000) {
      console.error('   错误: 存在重复的车位ID');
    }
    
    await mongoose.disconnect();
    process.exit(1);
  }
}

// 运行初始化
initTCSpaces();




