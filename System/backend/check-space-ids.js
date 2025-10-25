const mongoose = require('mongoose');
const ParkingSpace = require('./models/ParkingSpace');

// 连接数据库
mongoose.connect('mongodb://192.168.0.78:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', async () => {
  console.log('MongoDB连接成功');
  
  try {
    // 获取所有车位，按区域和编号排序
    const spaces = await ParkingSpace.find({})
      .sort({ area: 1, spaceId: 1 })
      .limit(20); // 只显示前20个
    
    console.log('前20个车位的详细信息:');
    spaces.forEach(space => {
      console.log(`ID: ${space.spaceId}, 区域: ${space.area}, 状态: ${space.status}`);
    });
    
    // 关闭连接
    mongoose.connection.close();
  } catch (error) {
    console.error('查询错误:', error);
    mongoose.connection.close();
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
});