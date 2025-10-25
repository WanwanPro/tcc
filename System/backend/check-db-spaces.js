const mongoose = require('mongoose');
const ParkingSpace = require('./models/ParkingSpace');

// 连接数据库
mongoose.connect('mongodb://192.168.0.78:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

async function checkParkingSpaces() {
  try {
    // 统计数据库中的车位总数
    const totalCount = await ParkingSpace.countDocuments();
    console.log(`数据库中的车位总数: ${totalCount}`);
    
    // 按区域统计车位数量
    const areaStats = await ParkingSpace.aggregate([
      {
        $group: {
          _id: '$area',
          count: { $sum: 1 }
        }
      },
      {
        $sort: { _id: 1 }
      }
    ]);
    
    console.log('各区域车位数量:');
    areaStats.forEach(stat => {
      console.log(`${stat._id}区: ${stat.count}个车位`);
    });
    
    // 检查前10个车位的详细信息
    const firstTenSpaces = await ParkingSpace.find().limit(10);
    console.log('\n前10个车位的详细信息:');
    firstTenSpaces.forEach(space => {
      console.log(`ID: ${space.spaceId}, 区域: ${space.area}, 状态: ${space.status}`);
    });
    
  } catch (error) {
    console.error('查询数据库时出错:', error);
  } finally {
    mongoose.connection.close();
  }
}

checkParkingSpaces();