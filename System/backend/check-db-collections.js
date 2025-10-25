const mongoose = require('mongoose');
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');
  
  try {
    // 检查集合是否存在
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('可用集合:', collections.map(c => c.name));
    
    // 检查各集合的文档数量
    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      console.log(`${collection.name}: ${count} 个文档`);
    }
    
    // 特别检查仪表盘API需要的集合
    const parkingSpacesCount = await db.collection('parkingspaces').countDocuments();
    const parkingLotsCount = await db.collection('parkinglots').countDocuments();
    const transactionsCount = await db.collection('transactions').countDocuments();
    
    console.log('\n仪表盘API需要的集合:');
    console.log(`ParkingSpaces: ${parkingSpacesCount} 个文档`);
    console.log(`ParkingLots: ${parkingLotsCount} 个文档`);
    console.log(`Transactions: ${transactionsCount} 个文档`);
    
    if (transactionsCount === 0) {
      console.log('\n警告: Transactions集合为空，这可能导致仪表盘API出错');
    }
    
  } catch (error) {
    console.error('检查数据库时出错:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}).catch(error => {
  console.error('数据库连接失败:', error);
});