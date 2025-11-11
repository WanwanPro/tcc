const mongoose = require('mongoose');

const parkingSpaceLogSchema = new mongoose.Schema({
  spaceId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ParkingSpace', 
    required: true 
  },
  lotId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'ParkingLot', 
    required: true 
  },
  operatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  operation: { 
    type: String, 
    enum: ['create', 'update', 'delete', 'status_change', 'batch_update'], 
    required: true 
  },
  previousState: { 
    type: mongoose.Schema.Types.Mixed 
  },
  newState: { 
    type: mongoose.Schema.Types.Mixed 
  },
  timestamp: { 
    type: Date, 
    default: Date.now 
  },
  ipAddress: { 
    type: String 
  },
  userAgent: { 
    type: String 
  },
  description: {
    type: String
  }
}, {
  timestamps: true
});

// 添加索引以提高查询性能
parkingSpaceLogSchema.index({ spaceId: 1, timestamp: -1 });
parkingSpaceLogSchema.index({ lotId: 1, timestamp: -1 });
parkingSpaceLogSchema.index({ operatorId: 1, timestamp: -1 });
parkingSpaceLogSchema.index({ operation: 1, timestamp: -1 });

module.exports = mongoose.model('ParkingSpaceLog', parkingSpaceLogSchema);