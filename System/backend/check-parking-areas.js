const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('Connected to MongoDB');
  
  // 检查parkingspaces集合中的文档
  const db = mongoose.connection.db;
  const totalCount = await db.collection('parkingspaces').countDocuments();
  console.log('Total parking spaces:', totalCount);
  
  // 检查不同区域的车位分布
  const areaGroups = await db.collection('parkingspaces').aggregate([
    { $group: { _id: '$area', count: { $sum: 1 } } },
    { $sort: { _id: 1 } }
  ]).toArray();
  
  console.log('\nParking spaces by area:');
  areaGroups.forEach(group => {
    console.log('Area:', group._id, ', Count:', group.count);
  });
  
  // 检查A区1-55号车位
  const aSpaces = await db.collection('parkingspaces').find({
    area: 'A区',
    spaceId: { $lte: '55' }
  }).toArray();
  
  console.log('\nA区1-55号车位数量:', aSpaces.length);
  if (aSpaces.length > 0) {
    console.log('A区1-55号车位示例:');
    aSpaces.slice(0, 5).forEach(space => {
      console.log('spaceId:', space.spaceId, ', area:', space.area);
    });
  }
  
  // 检查C区车位
  const cSpaces = await db.collection('parkingspaces').find({
    area: 'C区'
  }).toArray();
  
  console.log('\nC区车位数量:', cSpaces.length);
  if (cSpaces.length > 0) {
    console.log('C区车位示例:');
    cSpaces.slice(0, 5).forEach(space => {
      console.log('spaceId:', space.spaceId, ', area:', space.area);
    });
  }
  
  // 检查B区车位
  const bSpaces = await db.collection('parkingspaces').find({
    area: 'B区'
  }).toArray();
  
  console.log('\nB区车位数量:', bSpaces.length);
  if (bSpaces.length > 0) {
    console.log('B区车位示例:');
    bSpaces.slice(0, 5).forEach(space => {
      console.log('spaceId:', space.spaceId, ', area:', space.area);
    });
  }
  
  mongoose.connection.close();
}).catch(err => {
  console.error('Error connecting to MongoDB:', err);
});