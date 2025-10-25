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
    // 统计总车位
    const totalCount = await ParkingSpace.countDocuments();
    console.log(`数据库中的车位总数: ${totalCount}`);
    
    // 统计各区域车位数量
    const areaCounts = await ParkingSpace.aggregate([
      {
        $group: {
          _id: '$area',
          count: { $sum: 1 }
        }
      }
    ]);
    
    console.log('\n各区域车位数量:');
    areaCounts.forEach(area => {
      console.log(`${area._id}区: ${area.count}个车位`);
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