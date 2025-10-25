const mongoose = require('mongoose');
require('dotenv').config();
const Transaction = require('./models/Transaction');
const ParkingLot = require('./models/ParkingLot');
const ParkingSpace = require('./models/ParkingSpace');

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');
  
  try {
    // 检查是否已有交易数据
    const existingTransactions = await Transaction.countDocuments();
    if (existingTransactions > 0) {
      console.log(`已有 ${existingTransactions} 条交易记录，跳过生成`);
      return;
    }
    
    // 获取停车场和停车位数据
    const parkingLots = await ParkingLot.find();
    const parkingSpaces = await ParkingSpace.find({ status: 'occupied' });
    
    if (parkingLots.length === 0) {
      console.log('没有找到停车场数据');
      return;
    }
    
    if (parkingSpaces.length === 0) {
      console.log('没有找到已占用的停车位，将随机选择一些停车位');
      // 随机选择一些停车位作为已占用状态
      const allSpaces = await ParkingSpace.find();
      const occupiedCount = Math.min(50, allSpaces.length); // 假设有50个车位被占用
      
      for (let i = 0; i < occupiedCount; i++) {
        const randomIndex = Math.floor(Math.random() * allSpaces.length);
        allSpaces[randomIndex].status = 'occupied';
        await allSpaces[randomIndex].save();
      }
      
      // 重新获取已占用的停车位
      parkingSpaces.push(...await ParkingSpace.find({ status: 'occupied' }));
    }
    
    console.log(`找到 ${parkingLots.length} 个停车场和 ${parkingSpaces.length} 个已占用停车位`);
    
    // 生成模拟交易数据
    const transactions = [];
    const paymentMethods = ['cash', 'card', 'mobile', 'prepaid'];
    
    // 生成最近30天的交易数据
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      // 每天生成5-15笔交易
      const dailyTransactions = Math.floor(Math.random() * 10) + 5;
      
      for (let j = 0; j < dailyTransactions; j++) {
        const randomLot = parkingLots[Math.floor(Math.random() * parkingLots.length)];
        const randomSpace = parkingSpaces.length > 0 
          ? parkingSpaces[Math.floor(Math.random() * parkingSpaces.length)]
          : null;
        
        // 生成入场和出场时间
        const entryTime = new Date(date);
        entryTime.setHours(Math.floor(Math.random() * 12)); // 0-11点入场
        entryTime.setMinutes(Math.floor(Math.random() * 60));
        
        const exitTime = new Date(entryTime);
        exitTime.setHours(entryTime.getHours() + Math.floor(Math.random() * 8) + 1); // 停车1-8小时
        exitTime.setMinutes(entryTime.getMinutes() + Math.floor(Math.random() * 60));
        
        // 计算停车时长（分钟）
        const duration = Math.floor((exitTime - entryTime) / (1000 * 60));
        
        // 计算费用（每小时5-15元）
        const hourlyRate = Math.floor(Math.random() * 10) + 5;
        const amount = Math.ceil(duration / 60) * hourlyRate;
        
        // 生成交易ID
        const transactionId = `TXN${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${date.getDate().toString().padStart(2, '0')}${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
        
        // 生成车牌号
        const vehicleNumber = `京A${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`;
        
        // 选择支付方式
        const paymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
        
        // 创建交易记录
        const transaction = new Transaction({
          transactionId,
          type: 'parking',
          userId: `user${Math.floor(Math.random() * 1000)}`,
          vehicleNumber,
          lotId: randomLot._id,
          spaceId: randomSpace ? randomSpace._id : null,
          entryTime,
          exitTime,
          duration,
          amount,
          paymentMethod,
          paymentStatus: 'paid',
          paymentTime: exitTime,
          totalAmount: amount,
          notes: '模拟交易数据'
        });
        
        transactions.push(transaction);
      }
    }
    
    // 批量保存交易数据
    await Transaction.insertMany(transactions);
    console.log(`成功生成 ${transactions.length} 条模拟交易数据`);
    
  } catch (error) {
    console.error('生成模拟数据失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}).catch(error => {
  console.error('数据库连接失败:', error);
});