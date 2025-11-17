const mongoose = require('mongoose');
const Admin = require('./models/Admin');

// 连接数据库
mongoose.connect('mongodb://localhost:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(async () => {
  console.log('已连接到数据库');
  
  try {
    // 查找admin用户
    const admin = await Admin.findOne({ username: 'admin' });
    
    if (admin) {
      console.log('找到Admin用户:', admin);
      
      // 验证密码
      const isMatch = await admin.comparePassword('admin123');
      console.log('密码验证结果:', isMatch);
      
      // 如果密码不匹配，更新密码
      if (!isMatch) {
        admin.password = 'admin123';
        await admin.save();
        console.log('密码已更新');
      }
    } else {
      console.log('未找到Admin用户');
    }
  } catch (error) {
    console.error('操作失败:', error);
  } finally {
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  }
}).catch(error => {
  console.error('数据库连接失败:', error);
});