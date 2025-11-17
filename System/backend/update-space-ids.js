const mongoose = require('mongoose');
const ParkingSpace = require('./models/ParkingSpace');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

mongoose.connection.on('connected', async () => {
  console.log('MongoDB连接成功');
  
  try {
    // 获取所有车位，按区域分组
    const aSpaces = await ParkingSpace.find({ area: 'A' }).sort({ spaceId: 1 });
    const bSpaces = await ParkingSpace.find({ area: 'B' }).sort({ spaceId: 1 });
    
    console.log(`找到 ${aSpaces.length} 个A区车位和 ${bSpaces.length} 个B区车位`);
    
    // 更新A区车位编号，从A001开始
    console.log('开始更新A区车位编号...');
    for (let i = 0; i < aSpaces.length; i++) {
      const newSpaceId = `A${(i + 1).toString().padStart(3, '0')}`;
      await ParkingSpace.updateOne(
        { _id: aSpaces[i]._id },
        { $set: { spaceId: newSpaceId } }
      );
      console.log(`更新车位 ${aSpaces[i].spaceId} -> ${newSpaceId}`);
    }
    
    // 更新B区车位编号，从B001开始
    console.log('开始更新B区车位编号...');
    for (let i = 0; i < bSpaces.length; i++) {
      const newSpaceId = `B${(i + 1).toString().padStart(3, '0')}`;
      await ParkingSpace.updateOne(
        { _id: bSpaces[i]._id },
        { $set: { spaceId: newSpaceId } }
      );
      console.log(`更新车位 ${bSpaces[i].spaceId} -> ${newSpaceId}`);
    }
    
    console.log('车位编号更新完成！');
    
    // 验证更新结果
    const updatedSpaces = await ParkingSpace.find({})
      .sort({ area: 1, spaceId: 1 })
      .limit(20);
    
    console.log('\n更新后的前20个车位:');
    updatedSpaces.forEach(space => {
      console.log(`ID: ${space.spaceId}, 区域: ${space.area}, 状态: ${space.status}`);
    });
    
    // 关闭连接
    mongoose.connection.close();
  } catch (error) {
    console.error('更新错误:', error);
    mongoose.connection.close();
  }
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB连接错误:', err);
});