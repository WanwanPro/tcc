const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 导入模型
const ParkingLot = require('./models/ParkingLot');
const ParkingSpace = require('./models/ParkingSpace');

// 修复未关联停车场的停车位数据
async function fixUnlinkedSpaces() {
  try {
    console.log('修复未关联停车场的停车位数据...\n');
    
    // 获取所有停车场
    const parkingLots = await ParkingLot.find({});
    console.log('可用停车场:');
    parkingLots.forEach(lot => {
      console.log(`- ID: ${lot._id}, 名称: ${lot.name}`);
    });
    
    // 获取未关联的停车位
    const unlinkedSpaces = await ParkingSpace.find({ lotId: { $exists: false } });
    console.log(`\n找到 ${unlinkedSpaces.length} 个未关联的停车位`);
    
    if (unlinkedSpaces.length > 0 && parkingLots.length > 0) {
      // 将未关联的停车位分配给第一个停车场
      const targetLotId = parkingLots[0]._id;
      const targetLotName = parkingLots[0].name;
      
      console.log(`\n将 ${unlinkedSpaces.length} 个未关联停车位分配给: ${targetLotName} (ID: ${targetLotId})`);
      
      // 更新这些停车位的lotId
      const result = await ParkingSpace.updateMany(
        { lotId: { $exists: false } },
        { $set: { lotId: targetLotId } }
      );
      
      console.log(`成功更新 ${result.modifiedCount} 个停车位记录`);
      
      // 再次检查修复后的数据
      console.log('\n修复后的停车位分布:');
      const lotSpaceCounts = {};
      const allSpaces = await ParkingSpace.find({});
      
      allSpaces.forEach(space => {
        if (!lotSpaceCounts[space.lotId]) {
          lotSpaceCounts[space.lotId] = { total: 0, occupied: 0, available: 0 };
        }
        lotSpaceCounts[space.lotId].total++;
        if (space.status === 'occupied') {
          lotSpaceCounts[space.lotId].occupied++;
        } else {
          lotSpaceCounts[space.lotId].available++;
        }
      });
      
      for (const lotId in lotSpaceCounts) {
        const lot = parkingLots.find(l => l._id.toString() === lotId);
        const lotName = lot ? lot.name : '未知停车场';
        console.log(`- ${lotName} (ID: ${lotId}): 总数${lotSpaceCounts[lotId].total}, 已占${lotSpaceCounts[lotId].occupied}, 可用${lotSpaceCounts[lotId].available}`);
      }
    } else {
      console.log('没有需要修复的停车位数据');
    }
    
  } catch (error) {
    console.error('修复数据时发生错误:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行修复
fixUnlinkedSpaces();