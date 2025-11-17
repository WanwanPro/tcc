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
    // 获取A区车位，按编号排序
    const aSpaces = await ParkingSpace.find({ area: 'A' }).sort({ spaceId: 1 });
    const bSpaces = await ParkingSpace.find({ area: 'B' }).sort({ spaceId: 1 });
    
    console.log(`A区车位总数: ${aSpaces.length}`);
    console.log(`B区车位总数: ${bSpaces.length}`);
    
    // 检查A区编号
    console.log('\nA区车位编号检查:');
    console.log(`第一个车位: ${aSpaces[0].spaceId}`);
    console.log(`最后一个车位: ${aSpaces[aSpaces.length - 1].spaceId}`);
    
    // 检查B区编号
    console.log('\nB区车位编号检查:');
    console.log(`第一个车位: ${bSpaces[0].spaceId}`);
    console.log(`最后一个车位: ${bSpaces[bSpaces.length - 1].spaceId}`);
    
    // 检查编号是否连续
    let aConsecutive = true;
    for (let i = 0; i < aSpaces.length; i++) {
      const expectedId = `A${(i + 1).toString().padStart(3, '0')}`;
      if (aSpaces[i].spaceId !== expectedId) {
        console.log(`A区编号不连续: 期望 ${expectedId}, 实际 ${aSpaces[i].spaceId}`);
        aConsecutive = false;
      }
    }
    
    let bConsecutive = true;
    for (let i = 0; i < bSpaces.length; i++) {
      const expectedId = `B${(i + 1).toString().padStart(3, '0')}`;
      if (bSpaces[i].spaceId !== expectedId) {
        console.log(`B区编号不连续: 期望 ${expectedId}, 实际 ${bSpaces[i].spaceId}`);
        bConsecutive = false;
      }
    }
    
    if (aConsecutive) {
      console.log('\nA区车位编号连续正确');
    }
    
    if (bConsecutive) {
      console.log('B区车位编号连续正确');
    }
    
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