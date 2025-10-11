const mongoose = require('mongoose')

const transactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  type: {
    type: String,
    enum: ['parking', 'reservation', 'penalty', 'refund'],
    required: true
  },
  userId: {
    type: String,
    required: true
  },
  vehicleNumber: {
    type: String,
    required: true
  },
  lotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  spaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpace'
  },
  entryTime: {
    type: Date,
    required: true
  },
  exitTime: {
    type: Date
  },
  duration: {
    type: Number // 分钟
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'prepaid'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded', 'failed'],
    default: 'pending'
  },
  paymentTime: {
    type: Date
  },
  pricingRule: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'PricingRule'
  },
  breakdown: [{
    description: String,
    amount: Number,
    duration: Number
  }],
  discount: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true
  },
  notes: {
    type: String
  },
  processedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})

// 索引
transactionSchema.index({ transactionId: 1 })
transactionSchema.index({ userId: 1 })
transactionSchema.index({ vehicleNumber: 1 })
transactionSchema.index({ lotId: 1 })
transactionSchema.index({ entryTime: 1 })
transactionSchema.index({ paymentStatus: 1 })

module.exports = mongoose.model('Transaction', transactionSchema)