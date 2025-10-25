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
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// 密码比较方法
AdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const Admin = mongoose.model('Admin', AdminSchema);

// 重新创建管理员账户
async function recreateAdmin() {
  try {
    // 删除现有的admin账户
    await Admin.deleteMany({ username: 'admin' });
    console.log('已删除现有的admin账户');
    
    // 创建新的admin账户
    const newAdmin = new Admin({
      username: 'admin',
      password: '123456',
      name: '系统管理员',
      email: 'admin@example.com',
      role: 'super_admin',
      permissions: [
        'user_management',
        'parking_management',
        'analytics',
        'system_settings'
      ],
      status: 'active'
    });
    
    await newAdmin.save();
    console.log('新的admin账户创建成功');
    
    // 验证密码
    const isMatch = await newAdmin.comparePassword('123456');
    console.log('密码验证结果:', isMatch ? '成功' : '失败');
    
    // 关闭数据库连接
    mongoose.connection.close();
    console.log('数据库连接已关闭');
  } catch (error) {
    console.error('重新创建管理员账户失败:', error);
    mongoose.connection.close();
  }
}

// 运行脚本
recreateAdmin();