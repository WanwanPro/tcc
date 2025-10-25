const mongoose = require('mongoose');

// 测试System后台数据库连接和基本操作
async function testSystemDB() {
  try {
    console.log('正在测试System后台数据库连接...');
    const conn = await mongoose.connect('mongodb://192.168.0.78:27017/parking_admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ System后台数据库连接成功: ${conn.connection.host}`);
    
    // 测试基本数据库操作
    console.log('\n测试基本数据库操作...');
    
    // 获取数据库信息
    const db = mongoose.connection.db;
    const admin = db.admin();
    const result = await admin.ping();
    console.log(`✅ 数据库ping测试成功: ${result.ok === 1 ? '成功' : '失败'}`);
    
    // 获取所有集合
    const collections = await db.listCollections().toArray();
    console.log(`✅ 获取集合列表成功，共 ${collections.length} 个集合`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // 关闭连接
    await mongoose.connection.close();
    console.log('✅ System后台数据库连接已关闭');
    return true;
  } catch (error) {
    console.error(`❌ System后台数据库连接或操作失败: ${error.message}`);
    return false;
  }
}

// 测试微信小程序后端数据库连接和基本操作
async function testMiniprogramDB() {
  try {
    console.log('\n正在测试微信小程序后端数据库连接...');
    const conn = await mongoose.connect('mongodb://192.168.0.78:27017/parking_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ 微信小程序后端数据库连接成功: ${conn.connection.host}`);
    
    // 测试基本数据库操作
    console.log('\n测试基本数据库操作...');
    
    // 获取数据库信息
    const db = mongoose.connection.db;
    const admin = db.admin();
    const result = await admin.ping();
    console.log(`✅ 数据库ping测试成功: ${result.ok === 1 ? '成功' : '失败'}`);
    
    // 获取所有集合
    const collections = await db.listCollections().toArray();
    console.log(`✅ 获取集合列表成功，共 ${collections.length} 个集合`);
    collections.forEach(col => console.log(`  - ${col.name}`));
    
    // 关闭连接
    await mongoose.connection.close();
    console.log('✅ 微信小程序后端数据库连接已关闭');
    return true;
  } catch (error) {
    console.error(`❌ 微信小程序后端数据库连接或操作失败: ${error.message}`);
    return false;
  }
}

// 测试数据模型操作
async function testModelOperations() {
  try {
    console.log('\n测试数据模型操作...');
    
    // 连接System后台数据库
    await mongoose.connect('mongodb://192.168.0.78:27017/parking_admin', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // 获取数据库信息
    const db = mongoose.connection.db;
    
    // 获取所有集合
    const collections = await db.listCollections().toArray();
    console.log(`✅ System后台数据库集合: ${collections.map(c => c.name).join(', ')}`);
    
    // 关闭连接
    await mongoose.connection.close();
    
    // 连接微信小程序后端数据库
    await mongoose.connect('mongodb://192.168.0.78:27017/parking_system', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    // 获取数据库信息
    const db2 = mongoose.connection.db;
    
    // 获取所有集合
    const collections2 = await db2.listCollections().toArray();
    console.log(`✅ 微信小程序后端数据库集合: ${collections2.map(c => c.name).join(', ')}`);
    
    // 关闭连接
    await mongoose.connection.close();
    
    return true;
  } catch (error) {
    console.error(`❌ 数据模型操作测试失败: ${error.message}`);
    return false;
  }
}

// 运行所有测试
async function runAllTests() {
  console.log('开始数据库连接和操作测试...\n');
  
  const systemResult = await testSystemDB();
  const miniprogramResult = await testMiniprogramDB();
  const modelResult = await testModelOperations();
  
  console.log('\n===== 测试结果汇总 =====');
  console.log(`System后台数据库测试: ${systemResult ? '✅ 通过' : '❌ 失败'}`);
  console.log(`微信小程序后端数据库测试: ${miniprogramResult ? '✅ 通过' : '❌ 失败'}`);
  console.log(`数据模型操作测试: ${modelResult ? '✅ 通过' : '❌ 失败'}`);
  
  const allPassed = systemResult && miniprogramResult && modelResult;
  console.log(`\n总体测试结果: ${allPassed ? '✅ 所有测试通过' : '❌ 存在测试失败'}`);
  
  if (allPassed) {
    console.log('\n🎉 所有数据库连接和操作测试均已通过！');
  } else {
    console.log('\n⚠️ 存在测试失败，请检查数据库连接和配置。');
  }
}

// 运行测试
runAllTests();