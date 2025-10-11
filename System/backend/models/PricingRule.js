const mongoose = require('mongoose')

const pricingRuleSchema = new mongoose.Schema({
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
  rules: [{
    vehicleType: {
      type: String,
      enum: ['car', 'motorcycle', 'electric', 'disabled'],
      required: true
    },
    timeRanges: [{
      startHour: {
        type: Number,
        required: true
      },
      endHour: {
        type: Number,
        required: true
      },
      days: [{
        type: String,
        enum: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
      }]
    }],
    pricing: {
      type: {
        type: String,
        enum: ['hourly', 'daily', 'monthly', 'incremental'],
        required: true
      },
      baseRate: {
        type: Number,
        required: true
      },
      baseDuration: {
        type: Number,
        required: true
      },
      incrementRate: {
        type: Number
      },
      incrementDuration: {
        type: Number
      },
      maxDailyRate: {
        type: Number
      }
    }
  }],
  specialRules: [{
    name: String,
    description: String,
    startDate: Date,
    endDate: Date,
    discountPercentage: Number,
    applicableVehicleTypes: [String]
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  effectiveDate: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date
  }
}, {
  timestamps: true
})

// 索引
pricingRuleSchema.index({ lotId: 1 })
pricingRuleSchema.index({ isActive: 1 })

module.exports = mongoose.model('PricingRule', pricingRuleSchema)