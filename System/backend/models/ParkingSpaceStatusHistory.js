const mongoose = require('mongoose');

const parkingSpaceStatusHistorySchema = new mongoose.Schema({
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
  previousStatus: { 
    type: String, 
    required: true 
  },
  newStatus: { 
    type: String, 
    required: true 
  },
  changeTime: { 
    type: Date, 
    default: Date.now 
  },
  changeReason: { 
    type: String 
  },
  source: { 
    type: String, 
    enum: ['manual', 'sensor', 'system', 'sync'], 
    default: 'manual' 
  },
  operatorId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  sessionId: {
    type: String
  }
}, {
  timestamps: true
});

// 添加索引以提高查询性能
parkingSpaceStatusHistorySchema.index({ spaceId: 1, changeTime: -1 });
parkingSpaceStatusHistorySchema.index({ lotId: 1, changeTime: -1 });
parkingSpaceStatusHistorySchema.index({ newStatus: 1, changeTime: -1 });
parkingSpaceStatusHistorySchema.index({ source: 1, changeTime: -1 });

module.exports = mongoose.model('ParkingSpaceStatusHistory', parkingSpaceStatusHistorySchema);