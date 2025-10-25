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

// 检查数据库中的真实数据
async function checkRealData() {
  try {
    console.log('检查数据库中的真实数据...\n');
    
    // 1. 检查停车场数据
    console.log('1. 停车场数据:');
    const parkingLots = await ParkingLot.find({});
    parkingLots.forEach(lot => {
      console.log(`- ID: ${lot._id}, 名称: ${lot.name}, 地址: ${lot.address || '未设置'}`);
    });
    
    // 2. 检查停车位数据
    console.log('\n2. 停车位数据统计:');
    const parkingSpaces = await ParkingSpace.find({});
    const lotSpaceCounts = {};
    
    parkingSpaces.forEach(space => {
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
    
    console.log('停车位总数:', parkingSpaces.length);
    console.log('各停车场停车位分布:');
    for (const lotId in lotSpaceCounts) {
      const lot = parkingLots.find(l => l._id.toString() === lotId);
      const lotName = lot ? lot.name : '未知停车场';
      console.log(`- ${lotName} (ID: ${lotId}): 总数${lotSpaceCounts[lotId].total}, 已占${lotSpaceCounts[lotId].occupied}, 可用${lotSpaceCounts[lotId].available}`);
    }
    
    // 3. 检查交易数据
    console.log('\n3. 交易数据:');
    const transactions = await Transaction.find({});
    console.log('交易总数:', transactions.length);
    
    if (transactions.length > 0) {
      // 按支付状态分组
      const statusCounts = {};
      // 按支付方式分组
      const methodCounts = {};
      // 今日交易
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);
      
      let todayRevenue = 0;
      let todayCount = 0;
      
      transactions.forEach(transaction => {
        // 支付状态统计
        statusCounts[transaction.paymentStatus] = (statusCounts[transaction.paymentStatus] || 0) + 1;
        
        // 支付方式统计
        if (transaction.paymentMethod) {
          methodCounts[transaction.paymentMethod] = (methodCounts[transaction.paymentMethod] || 0) + 1;
        }
        
        // 今日收入统计
        if (transaction.paymentStatus === 'paid' && 
            transaction.paymentTime >= todayStart && 
            transaction.paymentTime <= todayEnd) {
          todayRevenue += transaction.totalAmount || 0;
          todayCount++;
        }
      });
      
      console.log('支付状态分布:');
      for (const status in statusCounts) {
        console.log(`- ${status}: ${statusCounts[status]}笔`);
      }
      
      console.log('支付方式分布:');
      for (const method in methodCounts) {
        console.log(`- ${method}: ${methodCounts[method]}笔`);
      }
      
      console.log(`今日收入: ${todayRevenue}, 交易数: ${todayCount}`);
      
      // 显示最近几笔交易
      console.log('\n最近5笔交易:');
      const recentTransactions = await Transaction.find({})
        .sort({ createdAt: -1 })
        .limit(5);
      
      recentTransactions.forEach((transaction, index) => {
        console.log(`${index + 1}. 交易ID: ${transaction.transactionId}, 金额: ${transaction.totalAmount}, 状态: ${transaction.paymentStatus}, 时间: ${transaction.paymentTime || transaction.createdAt}`);
      });
    } else {
      console.log('数据库中没有交易数据');
    }
    
  } catch (error) {
    console.error('检查数据时发生错误:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行检查
checkRealData();