const mongoose = require('mongoose');
const ParkingSpace = require('../models/ParkingSpace');
const ParkingLot = require('../models/ParkingLot');

async function checkSpaces() {
  try {
    await mongoose.connect('mongodb://localhost:27017/parking_admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('✅ 数据库连接成功\n');
    
    const totalSpaces = await ParkingSpace.countDocuments();
    console.log('📊 数据库总车位数:', totalSpaces);
    
    if (totalSpaces === 0) {
      console.log('⚠️  数据库中没有车位数据！');
      await mongoose.disconnect();
      return;
    }
    
    const sample = await ParkingSpace.findOne();
    console.log('\n📋 示例车位:');
    console.log('  spaceId:', sample.spaceId);
    console.log('  lotId:', sample.lotId ? sample.lotId.toString() : 'null');
    console.log('  area:', sample.area);
    console.log('  status:', sample.status);
    
    if (sample.lotId) {
      const lot = await ParkingLot.findById(sample.lotId);
      console.log('\n🏢 对应的停车场:', lot ? lot.name : '❌ 不存在（引用错误）');
      
      if (!lot) {
        console.log('\n⚠️  发现无效的lotId引用！');
        const invalidSpaces = await ParkingSpace.countDocuments({
          lotId: { $exists: true }
        });
        
        // 检查有多少车位的lotId无效
        const allSpaces = await ParkingSpace.find({});
        let invalidCount = 0;
        for (const space of allSpaces) {
          const lotExists = await ParkingLot.findById(space.lotId);
          if (!lotExists) {
            invalidCount++;
          }
        }
        console.log('无效引用的车位数:', invalidCount);
      }
    }
    
    // 测试populate
    console.log('\n🔍 测试Populate:');
    const testSpace = await ParkingSpace.findOne().populate('lotId', 'name address');
    if (testSpace && testSpace.lotId) {
      console.log('  ✅ Populate成功');
      console.log('  停车场名称:', testSpace.lotId.name || '无');
    } else {
      console.log('  ❌ Populate失败 - lotId为空或引用无效');
    }
    
    await mongoose.disconnect();
    console.log('\n✅ 检查完成');
  } catch (error) {
    console.error('❌ 错误:', error);
    await mongoose.disconnect();
  }
}

checkSpaces();




