const mongoose = require('mongoose')

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

module.exports = mongoose.model('ParkingSpace', parkingSpaceSchema)