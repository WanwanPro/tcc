const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 导入模型
const ParkingLot = require('./models/ParkingLot');
const ParkingSpace = require('./models/ParkingSpace');
const Transaction = require('./models/Transaction');

// 只保留TCC1停车场，删除其他停车场
async function keepOnlyTCC1Lot() {
  try {
    console.log('开始只保留TCC1停车场...\n');
    
    // 1. 获取所有停车场
    const parkingLots = await ParkingLot.find({});
    console.log('当前所有停车场:');
    parkingLots.forEach(lot => {
      console.log(`- ID: ${lot._id}, 名称: ${lot.name}`);
    });
    
    // 2. 找到TCC1停车场
    const tcc1Lot = parkingLots.find(lot => lot.name === 'TCC1停车场');
    if (!tcc1Lot) {
      console.error('未找到TCC1停车场');
      return;
    }
    
    console.log(`\n保留的停车场: ${tcc1Lot.name} (ID: ${tcc1Lot._id})`);
    
    // 3. 找出需要删除的停车场（除了TCC1之外的所有停车场）
    const lotsToDelete = parkingLots.filter(lot => lot.name !== 'TCC1停车场');
    console.log(`\n将要删除的停车场数量: ${lotsToDelete.length}`);
    
    if (lotsToDelete.length > 0) {
      console.log('将要删除的停车场:');
      lotsToDelete.forEach(lot => {
        console.log(`- ID: ${lot._id}, 名称: ${lot.name}`);
      });
      
      // 4. 将其他停车场的停车位转移到TCC1停车场
      console.log('\n正在转移其他停车场的停车位到TCC1停车场...');
      
      // 获取需要转移的停车位
      const lotIdsToDelete = lotsToDelete.map(lot => lot._id);
      const spacesToTransfer = await ParkingSpace.find({ lotId: { $in: lotIdsToDelete } });
      
      console.log(`找到 ${spacesToTransfer.length} 个停车位需要转移`);
      
      if (spacesToTransfer.length > 0) {
        // 批量更新这些停车位的lotId为TCC1停车场的ID
        await ParkingSpace.updateMany(
          { lotId: { $in: lotIdsToDelete } },
          { $set: { lotId: tcc1Lot._id } }
        );
        
        console.log(`成功将 ${spacesToTransfer.length} 个停车位转移到TCC1停车场`);
      }
      
      // 5. 删除其他停车场
      console.log('\n正在删除其他停车场...');
      const deleteResult = await ParkingLot.deleteMany({ _id: { $in: lotIdsToDelete } });
      console.log(`成功删除 ${deleteResult.deletedCount} 个停车场`);
    }
    
    // 6. 验证结果
    console.log('\n验证修改结果...');
    
    // 检查停车场
    const updatedLots = await ParkingLot.find({});
    console.log(`\n修改后的停车场数量: ${updatedLots.length}`);
    updatedLots.forEach(lot => {
      console.log(`- ID: ${lot._id}, 名称: ${lot.name}`);
    });
    
    // 检查停车位分布
    const allSpaces = await ParkingSpace.find({});
    console.log(`\n总停车位数量: ${allSpaces.length}`);
    
    const tcc1Spaces = await ParkingSpace.find({ lotId: tcc1Lot._id });
    console.log(`TCC1停车场停车位数量: ${tcc1Spaces.length}`);
    
    const occupiedTCC1Spaces = await ParkingSpace.find({ 
      lotId: tcc1Lot._id, 
      status: 'occupied' 
    });
    console.log(`TCC1停车场已占用车位数量: ${occupiedTCC1Spaces.length}`);
    
    const availableTCC1Spaces = tcc1Spaces.length - occupiedTCC1Spaces.length;
    console.log(`TCC1停车场可用车位数量: ${availableTCC1Spaces.length}`);
    
    const occupancyRate = tcc1Spaces.length > 0 
      ? ((occupiedTCC1Spaces.length / tcc1Spaces.length) * 100).toFixed(2)
      : '0.00';
    console.log(`TCC1停车场占用率: ${occupancyRate}%`);
    
    console.log('\n操作完成！现在只保留了TCC1停车场。');
    
  } catch (error) {
    console.error('操作过程中发生错误:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行操作
keepOnlyTCC1Lot();