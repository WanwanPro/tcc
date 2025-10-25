const mongoose = require('mongoose');
const NavigationPath = require('./models/NavigationPath');

// 加载环境变量
require('dotenv').config();

// 连接数据库
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('MongoDB连接成功');
  
  // 测试NavigationPath模型
  testNavigationPathModel();
}).catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

async function testNavigationPathModel() {
  try {
    console.log('\n=== 测试NavigationPath模型 ===');
    
    // 1. 尝试获取所有导航路径
    console.log('\n1. 获取所有导航路径...');
    const allPaths = await NavigationPath.find({});
    console.log(`找到 ${allPaths.length} 条导航路径`);
    
    // 2. 尝试统计导航路径数量
    console.log('\n2. 统计导航路径数量...');
    const count = await NavigationPath.countDocuments({});
    console.log(`导航路径总数: ${count}`);
    
    // 3. 尝试创建一个测试导航路径
    console.log('\n3. 创建测试导航路径...');
    const testPath = new NavigationPath({
      pathId: 'test-path-001',
      name: '测试路径',
      description: '这是一个测试路径',
      lotId: new mongoose.Types.ObjectId('68f6185fdb5f70f8910ea9c7'), // 使用一个已知的停车场ID
      startNode: new mongoose.Types.ObjectId(), // 创建一个新的ObjectId
      endNode: new mongoose.Types.ObjectId(), // 创建一个新的ObjectId
      nodes: [],
      totalDistance: 100,
      totalTime: 60,
      pathType: 'shortest',
      isActive: true
    });
    
    const savedPath = await testPath.save();
    console.log('测试导航路径创建成功，ID:', savedPath._id);
    
    // 4. 尝试查询刚创建的导航路径
    console.log('\n4. 查询刚创建的导航路径...');
    const foundPath = await NavigationPath.findById(savedPath._id);
    console.log('查询成功，路径名称:', foundPath.name);
    
    // 5. 删除测试数据
    console.log('\n5. 删除测试数据...');
    await NavigationPath.findByIdAndDelete(savedPath._id);
    console.log('测试数据删除成功');
    
    console.log('\n✅ NavigationPath模型测试完成');
    process.exit(0);
  } catch (error) {
    console.error('❌ NavigationPath模型测试失败:', error);
    process.exit(1);
  }
}