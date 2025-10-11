// 使用后端实际的Admin模型检查管理员账户
const mongoose = require('mongoose');

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

// 检查管理员账户
async function checkAdmin() {
  try {
    // 查找admin账户
    const admin = await Admin.findOne({ username: 'admin' });
    
    if (admin) {
      console.log('找到admin账户:');
      console.log('用户名:', admin.username);
      console.log('姓名:', admin.name);
      console.log('邮箱:', admin.email);
      console.log('角色:', admin.role);
      console.log('状态:', admin.status);
      console.log('密码哈希:', admin.password.substring(0, 20) + '...');
      
      // 测试密码验证
      const isMatch = await admin.comparePassword('123456');
      console.log('密码验证(123456):', isMatch ? '成功' : '失败');
      
      if (!isMatch) {
        // 如果密码验证失败，更新密码
        console.log('正在更新密码...');
        admin.password = '123456';
        await admin.save();
        
        // 重新验证
        const newMatch = await admin.comparePassword('123456');
        console.log('更新后密码验证(123456):', newMatch ? '成功' : '失败');
      }
    } else {
      console.log('未找到admin账户，正在创建...');
      
      // 创建admin账户
      const newAdmin = new Admin({
        username: 'admin',
        password: '123456',
        name: '系统管理员',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['read', 'write', 'delete'],
        status: 'active'
      });
      
      await newAdmin.save();
      console.log('admin账户创建成功');
      
      // 验证新创建的账户
      const createdAdmin = await Admin.findOne({ username: 'admin' });
      const isMatch = await createdAdmin.comparePassword('123456');
      console.log('新账户密码验证(123456):', isMatch ? '成功' : '失败');
    }
    
    // 关闭数据库连接
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('检查管理员账户失败:', error);
    mongoose.connection.close();
  }
}

// 运行脚本
checkAdmin();