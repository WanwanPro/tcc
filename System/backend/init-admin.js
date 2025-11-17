const mongoose = require('mongoose');
const Admin = require('./models/Admin');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');
  
  try {
    // 检查是否已存在admin用户
    const adminExists = await Admin.findOne({ username: 'admin' });
    
    if (!adminExists) {
      // 创建Admin模型的管理员用户
      const admin = new Admin({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        email: 'admin@parking.com',
        role: 'super_admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        status: 'active'
      });
      
      await admin.save();
      console.log('已创建Admin模型管理员账户: admin / admin123');
    } else {
      console.log('Admin用户已存在');
    }
    
    console.log('初始化完成');
  } catch (error) {
    console.error('初始化失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}).catch(error => {
  console.error('数据库连接失败:', error);
});