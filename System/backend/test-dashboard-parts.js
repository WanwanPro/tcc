const mongoose = require('mongoose');
const axios = require('axios');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB连接成功'))
  .catch(err => console.error('MongoDB连接失败:', err));

// 导入模型
const ParkingLot = require('./models/ParkingLot');
const ParkingSpace = require('./models/ParkingSpace');
const Transaction = require('./models/Transaction');

// 测试仪表盘API的各个部分
async function testDashboardParts() {
  try {
    console.log('开始测试仪表盘API的各个部分...\n');
    
    // 1. 测试获取停车场总数
    console.log('1. 测试获取停车场总数...');
    const totalLots = await ParkingLot.countDocuments();
    console.log('停车场总数:', totalLots);
    
    // 2. 测试获取停车位总数
    console.log('\n2. 测试获取停车位总数...');
    const totalSpaces = await ParkingSpace.countDocuments();
    console.log('停车位总数:', totalSpaces);
    
    // 3. 测试获取已占用停车位数量
    console.log('\n3. 测试获取已占用停车位数量...');
    const occupiedSpaces = await ParkingSpace.countDocuments({ status: 'occupied' });
    console.log('已占用停车位数量:', occupiedSpaces);
    
    // 4. 测试获取今日收入
    console.log('\n4. 测试获取今日收入...');
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    
    const revenueCondition = {
      paymentStatus: 'paid',
      paymentTime: {
        $gte: todayStart,
        $lte: todayEnd
      }
    };
    
    const todayTransactions = await Transaction.find(revenueCondition);
    const todayRevenue = todayTransactions.reduce((sum, transaction) => 
      sum + transaction.totalAmount, 0
    );
    console.log('今日交易数:', todayTransactions.length);
    console.log('今日收入:', todayRevenue);
    
    // 5. 测试各停车场占用率聚合查询
    console.log('\n5. 测试各停车场占用率聚合查询...');
    try {
      const lotStats = await ParkingLot.aggregate([
        {
          $lookup: {
            from: "parkingspaces",
            localField: "_id",
            foreignField: "lotId",
            as: "spaces"
          }
        },
        {
          $addFields: {
            totalSpaces: { $size: "$spaces" },
            occupiedSpaces: {
              $size: {
                $filter: {
                  input: "$spaces",
                  cond: { $eq: ["$$this.status", "occupied"] }
                }
              }
            }
          }
        },
        {
          $addFields: {
            occupancyRate: {
              $multiply: [
                { $divide: ["$occupiedSpaces", "$totalSpaces"] },
                100
              ]
            }
          }
        },
        {
          $project: {
            name: 1,
            address: 1,
            totalSpaces: 1,
            occupiedSpaces: 1,
            availableSpaces: { $subtract: ["$totalSpaces", "$occupiedSpaces"] },
            occupancyRate: { $round: ["$occupancyRate", 2] }
          }
        }
      ]);
      console.log('各停车场占用率:', lotStats);
    } catch (error) {
      console.error('各停车场占用率聚合查询失败:', error.message);
    }
    
    // 6. 测试最近7天的收入趋势
    console.log('\n6. 测试最近7天的收入趋势...');
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);
      
      const revenueTrend = await Transaction.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            paymentTime: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$paymentTime" } },
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]);
      console.log('最近7天收入趋势:', revenueTrend);
    } catch (error) {
      console.error('收入趋势聚合查询失败:', error.message);
    }
    
    // 7. 测试支付方式统计
    console.log('\n7. 测试支付方式统计...');
    try {
      const paymentMethodStats = await Transaction.aggregate([
        {
          $match: {
            paymentStatus: 'paid',
            paymentTime: { $gte: todayStart }
          }
        },
        {
          $group: {
            _id: "$paymentMethod",
            revenue: { $sum: "$totalAmount" },
            count: { $sum: 1 }
          }
        },
        { $sort: { revenue: -1 } }
      ]);
      console.log('支付方式统计:', paymentMethodStats);
    } catch (error) {
      console.error('支付方式统计聚合查询失败:', error.message);
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  } finally {
    mongoose.connection.close();
    console.log('\n数据库连接已关闭');
  }
}

// 执行测试
testDashboardParts();