// 创建管理员账户的脚本
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// 连接数据库
mongoose.connect('mongodb://192.168.0.78:27017/parking_system', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log('MongoDB连接成功');
}).catch(err => {
  console.error('MongoDB连接失败:', err);
  process.exit(1);
});

// 定义管理员模型
const AdminSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String, required: true },
  email: { type: String },
  role: { type: String, default: 'admin' },
  permissions: [{ type: String }],
  status: { type: String, default: 'active' },
  lastLogin: { type: Date }
});

// 密码加密中间件
AdminSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    return next();
  }
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// 密码比较方法
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', AdminSchema);

// 创建管理员账户
async function createAdmin() {
  try {
    // 检查是否已存在admin账户
    const existingAdmin = await Admin.findOne({ username: 'admin' });
    
    if (existingAdmin) {
      console.log('admin账户已存在，正在更新密码...');
      existingAdmin.password = '123456';
      await existingAdmin.save();
      console.log('admin账户密码已更新');
    } else {
      // 创建新的admin账户
      const newAdmin = new Admin({
        username: 'admin',
        password: '123456',
        name: '系统管理员',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['all'],
        status: 'active'
      });
      
      await newAdmin.save();
      console.log('admin账户创建成功');
    }
    
    console.log('管理员账户信息:');
    console.log('用户名: admin');
    console.log('密码: 123456');
    
    // 关闭数据库连接
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('创建管理员账户失败:', error);
    mongoose.connection.close();
  }
}

// 运行脚本
createAdmin();