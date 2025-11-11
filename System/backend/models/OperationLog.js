const mongoose = require('mongoose');

const operationLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  username: {
    type: String,
    required: true
  },
  operation: {
    type: String,
    required: true,
    enum: ['create', 'update', 'delete', 'view', 'batch_update', 'status_change']
  },
  resourceType: {
    type: String,
    required: true,
    enum: ['parking_lot', 'parking_space', 'user', 'system']
  },
  resourceIds: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  details: {
    method: String,
    url: String,
    ip: String,
    userAgent: String,
    requestBody: mongoose.Schema.Types.Mixed,
    params: mongoose.Schema.Types.Mixed,
    query: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引以提高查询性能
operationLogSchema.index({ userId: 1, timestamp: -1 });
operationLogSchema.index({ resourceType: 1, operation: 1, timestamp: -1 });
operationLogSchema.index({ timestamp: -1 });

module.exports = mongoose.model('OperationLog', operationLogSchema);