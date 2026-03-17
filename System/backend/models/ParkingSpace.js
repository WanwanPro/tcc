const mongoose = require('mongoose')
const { broadcastParkingSpaceChanged } = require('../services/parkingSpaceEvents')

const parkingSpaceSchema = new mongoose.Schema({
  spaceId: {
    type: String,
    required: true,
    unique: true
  },
  floorId: {
    type: String,
    required: true
  },
  lotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  area: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'disabled', 'electric', 'vip'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'maintenance'],
    default: 'available'
  },
  position: {
    x: {
      type: Number,
      required: true
    },
    y: {
      type: Number,
      required: true
    }
  },
  currentNode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MapNode'
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  },
  occupiedBy: {
    userId: String,
    vehicleNumber: String,
    entryTime: Date,
    estimatedExitTime: Date
  }
}, {
  timestamps: true
})

// 索引
parkingSpaceSchema.index({ spaceId: 1 })
parkingSpaceSchema.index({ floorId: 1 })
parkingSpaceSchema.index({ lotId: 1 })
parkingSpaceSchema.index({ status: 1 })

// 保存和更新后自动同步到TCC后端（微信小程序）
parkingSpaceSchema.post('save', async function(doc) {
  syncToMiniprogram(doc);
});

parkingSpaceSchema.post('findOneAndUpdate', async function(doc) {
  if (doc) {
    syncToMiniprogram(doc);
  }
});

// 同步函数
async function syncToMiniprogram(doc) {
  // 只在状态字段存在且spaceId存在时同步
  if (doc && doc.spaceId) {
    broadcastParkingSpaceChanged({
      spaceId: doc.spaceId,
      status: doc.status
    })

    try {
      const miniprogramApiAdapter = require('../services/miniprogramApiAdapterService');
      await miniprogramApiAdapter.updateParkingSpaceStatusInMiniprogram(
        doc.spaceId,
        doc.status
      );
      console.log(`[自动同步-Mongoose] 车位 ${doc.spaceId} 状态已同步到微信小程序后端: ${doc.status}`);
    } catch (syncError) {
      // 静默失败，避免影响主流程
      console.error(`[自动同步-Mongoose] 同步失败:`, syncError.message);
    }
  }
}

module.exports = mongoose.model('ParkingSpace', parkingSpaceSchema)
