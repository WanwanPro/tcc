const mongoose = require('mongoose')

const mapNodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true
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
  type: {
    type: String,
    enum: ['entrance', 'exit', 'parking', 'intersection', 'elevator', 'stairs', 'facility'],
    required: true
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
  connections: [{
    nodeId: {
      type: String,
      required: true
    },
    distance: {
      type: Number,
      required: true
    },
    direction: {
      type: String,
      enum: ['north', 'south', 'east', 'west', 'northeast', 'northwest', 'southeast', 'southwest']
    }
  }],
  isAccessible: {
    type: Boolean,
    default: true
  },
  name: {
    type: String
  },
  description: {
    type: String
  }
}, {
  timestamps: true
})

// 索引
mapNodeSchema.index({ nodeId: 1, floorId: 1 })
mapNodeSchema.index({ lotId: 1 })
mapNodeSchema.index({ type: 1 })

module.exports = mongoose.model('MapNode', mapNodeSchema)