const mongoose = require('mongoose')

const parkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  totalSpaces: {
    type: Number,
    required: true
  },
  floors: [{
    floorId: {
      type: String,
      required: true
    },
    floorName: {
      type: String,
      required: true
    },
    spaces: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ParkingSpace'
    }],
    mapImage: {
      type: String
    },
    nodes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'MapNode'
    }]
  }],
  operatingHours: {
    open: {
      type: String,
      default: '00:00'
    },
    close: {
      type: String,
      default: '23:59'
    }
  },
  pricingRules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingRule'
  }],
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance'],
    default: 'active'
  },
  facilities: [{
    type: String
  }],
  contact: {
    phone: String,
    email: String
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('ParkingLot', parkingLotSchema)