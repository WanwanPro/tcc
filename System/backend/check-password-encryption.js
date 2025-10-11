// 详细检查密码加密过程
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 连接数据库
mongoose.connect('mongodb://192.168.0.78:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB连接成功');
}).catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

// 使用后端实际的Admin模型
const Admin = require('./models/Admin');

// 检查密码加密过程
async function checkPasswordEncryption() {
  try {
    // 删除现有的admin账户
    await Admin.deleteOne({ username: 'admin' });
    console.log('已删除现有的admin账户');
    
    // 创建新的admin账户
    console.log('正在创建新的admin账户...');
    const newAdmin = new Admin({
      username: 'admin',
      password: '123456',
      name: '系统管理员',
      email: 'admin@example.com',
      role: 'admin',
      permissions: ['read', 'write', 'delete'],
      status: 'active'
    });
    
    // 保存前检查密码
    console.log('保存前密码:', newAdmin.password);
    
    // 保存账户
    await newAdmin.save();
    console.log('admin账户创建成功');
    
    // 从数据库重新获取账户
    const savedAdmin = await Admin.findOne({ username: 'admin' });
    console.log('从数据库获取的密码哈希:', savedAdmin.password.substring(0, 20) + '...');
    
    // 手动验证密码
    console.log('开始手动验证密码...');
    const isMatch = await bcrypt.compare('123456', savedAdmin.password);
    console.log('手动密码验证(123456):', isMatch ? '成功' : '失败');
    
    // 使用模型方法验证密码
    console.log('开始使用模型方法验证密码...');
    const modelMatch = await savedAdmin.comparePassword('123456');
    console.log('模型方法密码验证(123456):', modelMatch ? '成功' : '失败');
    
    // 关闭数据库连接
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('检查密码加密过程失败:', error);
    mongoose.connection.close();
  }
}

// 运行脚本
checkPasswordEncryption();