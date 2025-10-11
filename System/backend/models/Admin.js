const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const adminSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'operator'],
    default: 'operator'
  },
  permissions: [{
    type: String
  }],
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
})

// 密码加密中间件
adminSchema.pre('save', async function(next) {
  // 只有密码被修改时才进行加密
  if (!this.isModified('password')) {
    return next()
  }
  
  try {
    // 生成盐值并加密密码
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// 密码验证方法
adminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password)
}

// 获取管理员信息（不包含密码）
adminSchema.methods.toJSON = function() {
  const admin = this.toObject()
  delete admin.password
  return admin
}

module.exports = mongoose.model('Admin', adminSchema)