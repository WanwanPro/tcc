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

// 验证数据库中的真实数据
async function verifyRealData() {
  try {
    console.log('验证数据库中的真实数据...\n');
    
    // 1. 验证停车场数据
    const parkingLots = await ParkingLot.find({});
    console.log(`1. 停车场总数: ${parkingLots.length}`);
    parkingLots.forEach(lot => {
      console.log(`   - ${lot.name} (ID: ${lot._id})`);
    });
    
    // 2. 验证停车位数据
    const parkingSpaces = await ParkingSpace.find({});
    console.log(`\n2. 停车位总数: ${parkingSpaces.length}`);
    
    // 按停车场统计停车位
    const spaceStats = {};
    parkingSpaces.forEach(space => {
      if (!spaceStats[space.lotId]) {
        spaceStats[space.lotId] = { total: 0, occupied: 0, available: 0 };
      }
      spaceStats[space.lotId].total++;
      if (space.status === 'occupied') {
        spaceStats[space.lotId].occupied++;
      } else {
        spaceStats[space.lotId].available++;
      }
    });
    
    console.log('\n各停车场停车位统计:');
    for (const lotId in spaceStats) {
      const lot = parkingLots.find(l => l._id.toString() === lotId);
      const lotName = lot ? lot.name : '未知停车场';
      const occupancyRate = spaceStats[lotId].total > 0 
        ? ((spaceStats[lotId].occupied / spaceStats[lotId].total) * 100).toFixed(2)
        : '0.00';
      console.log(`   - ${lotName}: 总数${spaceStats[lotId].total}, 已占${spaceStats[lotId].occupied}, 可用${spaceStats[lotId].available}, 占用率${occupancyRate}%`);
    }
    
    // 3. 验证交易数据
    const transactions = await Transaction.find({});
    console.log(`\n3. 交易总数: ${transactions.length}`);
    
    // 计算今日收入（使用与仪表盘API相同的条件）
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const todayTransactions = await Transaction.find({
      paymentStatus: 'paid',
      paymentTime: {
        $gte: today,
        $lt: tomorrow
      }
    });
    
    const todayRevenue = todayTransactions.reduce((sum, transaction) => {
      return sum + (transaction.totalAmount || 0);
    }, 0);
    
    console.log(`   - 今日交易数: ${todayTransactions.length}`);
    console.log(`   - 今日收入: ${todayRevenue}`);
    
    // 按支付方式统计
    const paymentStats = {};
    transactions.forEach(transaction => {
      if (!paymentStats[transaction.paymentMethod]) {
        paymentStats[transaction.paymentMethod] = { count: 0, amount: 0 };
      }
      paymentStats[transaction.paymentMethod].count++;
      paymentStats[transaction.paymentMethod].amount += transaction.totalAmount || 0;
    });
    
    console.log('\n支付方式统计:');
    for (const method in paymentStats) {
      console.log(`   - ${method}: ${paymentStats[method].count}笔, 总额${paymentStats[method].amount}`);
    }
    
    // 4. 验证仪表盘API应该返回的数据
    const totalSpaces = parkingSpaces.length;
    const totalOccupied = parkingSpaces.filter(space => space.status === 'occupied').length;
    const totalAvailable = totalSpaces - totalOccupied;
    const overallOccupancyRate = totalSpaces > 0 ? ((totalOccupied / totalSpaces) * 100).toFixed(2) : '0.00';
    
    console.log('\n4. 仪表盘API应该返回的数据:');
    console.log(`   - 停车场总数: ${parkingLots.length}`);
    console.log(`   - 停车位总数: ${totalSpaces}`);
    console.log(`   - 已占用车位: ${totalOccupied}`);
    console.log(`   - 可用车位: ${totalAvailable}`);
    console.log(`   - 总占用率: ${overallOccupancyRate}%`);
    console.log(`   - 今日收入: ${todayRevenue}`);
    console.log(`   - 今日交易数: ${todayTransactions.length}`);
    
    console.log('\n验证完成！以上数据都是数据库中的真实数据。');
    
  } catch (error) {
    console.error('验证数据时发生错误:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行验证
verifyRealData();