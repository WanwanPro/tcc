const mongoose = require('mongoose')

const navigationPathSchema = new mongoose.Schema({
  pathId: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  lotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  startNode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MapNode',
    required: true
  },
  endNode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MapNode',
    required: true
  },
  nodes: [{
    nodeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MapNode',
      required: true
    },
    order: {
      type: Number,
      required: true
    },
    instruction: {
      type: String
    },
    distance: {
      type: Number,
      required: true
    },
    estimatedTime: {
      type: Number,
      required: true
    }
  }],
  totalDistance: {
    type: Number,
    required: true
  },
  totalTime: {
    type: Number,
    required: true
  },
  pathType: {
    type: String,
    enum: ['shortest', 'fastest', 'accessible', 'custom'],
    default: 'shortest'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})

// 索引
navigationPathSchema.index({ pathId: 1 })
navigationPathSchema.index({ lotId: 1 })
navigationPathSchema.index({ startNode: 1 })
navigationPathSchema.index({ endNode: 1 })

module.exports = mongoose.model('NavigationPath', navigationPathSchema)