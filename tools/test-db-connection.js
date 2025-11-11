const mongoose = require('mongoose');

// 测试微信小程序后端数据库连接
async function testMiniprogramDB() {
  try {
    console.log('正在测试微信小程序后端数据库连接...');
    const conn = await mongoose.connect('mongodb://192.168.0.78:27017/parking_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ 微信小程序后端数据库连接成功: ${conn.connection.host}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error(`❌ 微信小程序后端数据库连接失败: ${error.message}`);
  }
}

// 测试后台管理系统后端数据库连接
async function testAdminDB() {
  try {
    console.log('正在测试后台管理系统后端数据库连接...');
    const conn = await mongoose.connect('mongodb://192.168.0.78:27017/parking_admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ 后台管理系统后端数据库连接成功: ${conn.connection.host}`);
    await mongoose.connection.close();
  } catch (error) {
    console.error(`❌ 后台管理系统后端数据库连接失败: ${error.message}`);
  }
}

// 运行测试
async function runTests() {
  console.log('开始数据库连接测试...\n');
  
  await testMiniprogramDB();
  console.log('');
  await testAdminDB();
  
  console.log('\n数据库连接测试完成。');
}

runTests();