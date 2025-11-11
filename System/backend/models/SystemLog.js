const mongoose = require('mongoose');

const systemLogSchema = new mongoose.Schema({
  operator: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'login', 'logout', 'export', 'import', 'backup', 'restore', 'reset', 'clear']
  },
  module: {
    type: String,
    required: true
  },
  details: {
    type: String,
    required: true
  },
  ip: {
    type: String,
    required: true
  },
  userAgent: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success'
  },
  errorMessage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// 创建索引
systemLogSchema.index({ createdAt: -1 });
systemLogSchema.index({ operator: 1, createdAt: -1 });
systemLogSchema.index({ module: 1, createdAt: -1 });
systemLogSchema.index({ action: 1, createdAt: -1 });

module.exports = mongoose.model('SystemLog', systemLogSchema);