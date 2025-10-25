const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 导入模型
const ParkingLot = require('./models/ParkingLot');
const ParkingSpace = require('./models/ParkingSpace');

// 平衡分配停车位给所有停车场
async function balanceSpaceDistribution() {
  try {
    console.log('平衡分配停车位给所有停车场...\n');
    
    // 获取所有停车场
    const parkingLots = await ParkingLot.find({});
    console.log('所有停车场:');
    parkingLots.forEach(lot => {
      console.log(`- ID: ${lot._id}, 名称: ${lot.name}`);
    });
    
    // 获取当前停车位分布
    const lotSpaceCounts = {};
    const allSpaces = await ParkingSpace.find({});
    
    allSpaces.forEach(space => {
      if (!lotSpaceCounts[space.lotId]) {
        lotSpaceCounts[space.lotId] = { total: 0, occupied: 0, available: 0, spaces: [] };
      }
      lotSpaceCounts[space.lotId].total++;
      lotSpaceCounts[space.lotId].spaces.push(space);
      if (space.status === 'occupied') {
        lotSpaceCounts[space.lotId].occupied++;
      } else {
        lotSpaceCounts[space.lotId].available++;
      }
    });
    
    console.log('\n当前停车位分布:');
    for (const lotId in lotSpaceCounts) {
      const lot = parkingLots.find(l => l._id.toString() === lotId);
      const lotName = lot ? lot.name : '未知停车场';
      console.log(`- ${lotName} (ID: ${lotId}): 总数${lotSpaceCounts[lotId].total}, 已占${lotSpaceCounts[lotId].occupied}, 可用${lotSpaceCounts[lotId].available}`);
    }
    
    // 检查哪些停车场没有停车位
    const lotsWithoutSpaces = parkingLots.filter(lot => 
      !lotSpaceCounts[lot._id.toString()] || lotSpaceCounts[lot._id.toString()].total === 0
    );
    
    if (lotsWithoutSpaces.length > 0) {
      console.log('\n没有停车位的停车场:');
      lotsWithoutSpaces.forEach(lot => {
        console.log(`- ${lot.name} (ID: ${lot._id})`);
      });
      
      // 找到停车位最多的停车场，从中分配一些停车位给没有停车位的停车场
      let maxSpaceLotId = null;
      let maxSpaceCount = 0;
      
      for (const lotId in lotSpaceCounts) {
        if (lotSpaceCounts[lotId].total > maxSpaceCount) {
          maxSpaceCount = lotSpaceCounts[lotId].total;
          maxSpaceLotId = lotId;
        }
      }
      
      if (maxSpaceLotId) {
        const maxSpaceLot = parkingLots.find(l => l._id.toString() === maxSpaceLotId);
        console.log(`\n从停车位最多的停车场 "${maxSpaceLot.name}" (ID: ${maxSpaceLotId}) 分配停车位`);
        
        // 为每个没有停车位的停车场分配50个停车位
        for (const targetLot of lotsWithoutSpaces) {
          const spacesToMove = Math.min(50, lotSpaceCounts[maxSpaceLotId].total / 2);
          
          if (spacesToMove > 0) {
            // 获取要移动的停车位（优先选择可用停车位）
            const spacesToReassign = lotSpaceCounts[maxSpaceLotId].spaces
              .filter(space => space.status === 'available')
              .slice(0, spacesToMove);
            
            if (spacesToReassign.length > 0) {
              console.log(`分配 ${spacesToReassign.length} 个停车位给 "${targetLot.name}"`);
              
              // 更新这些停车位的lotId
              const spaceIds = spacesToReassign.map(space => space._id);
              await ParkingSpace.updateMany(
                { _id: { $in: spaceIds } },
                { $set: { lotId: targetLot._id } }
              );
              
              console.log(`成功将 ${spacesToReassign.length} 个停车位分配给 "${targetLot.name}"`);
            } else {
              console.log(`"${maxSpaceLot.name}" 中没有足够的可用停车位分配给 "${targetLot.name}"`);
            }
          }
        }
        
        // 再次检查修复后的数据
        console.log('\n修复后的停车位分布:');
        const updatedLotSpaceCounts = {};
        const updatedAllSpaces = await ParkingSpace.find({});
        
        updatedAllSpaces.forEach(space => {
          if (!updatedLotSpaceCounts[space.lotId]) {
            updatedLotSpaceCounts[space.lotId] = { total: 0, occupied: 0, available: 0 };
          }
          updatedLotSpaceCounts[space.lotId].total++;
          if (space.status === 'occupied') {
            updatedLotSpaceCounts[space.lotId].occupied++;
          } else {
            updatedLotSpaceCounts[space.lotId].available++;
          }
        });
        
        for (const lotId in updatedLotSpaceCounts) {
          const lot = parkingLots.find(l => l._id.toString() === lotId);
          const lotName = lot ? lot.name : '未知停车场';
          console.log(`- ${lotName} (ID: ${lotId}): 总数${updatedLotSpaceCounts[lotId].total}, 已占${updatedLotSpaceCounts[lotId].occupied}, 可用${updatedLotSpaceCounts[lotId].available}`);
        }
      }
    } else {
      console.log('\n所有停车场都有关联的停车位，无需调整');
    }
    
  } catch (error) {
    console.error('平衡分配停车位时发生错误:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行平衡分配
balanceSpaceDistribution();