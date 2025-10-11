const mongoose = require('mongoose')

const analyticsSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  reportType: {
    type: String,
    enum: ['daily', 'weekly', 'monthly', 'yearly', 'custom'],
    required: true
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String
  },
  dateRange: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  lotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot'
  },
  metrics: {
    totalRevenue: {
      type: Number,
      default: 0
    },
    totalTransactions: {
      type: Number,
      default: 0
    },
    averageOccupancyRate: {
      type: Number,
      default: 0
    },
    peakHours: [{
      hour: Number,
      occupancyRate: Number
    }],
    averageParkingDuration: {
      type: Number,
      default: 0
    },
    vehicleTypeDistribution: [{
      type: String,
      count: Number,
      percentage: Number
    }],
    paymentMethodDistribution: [{
      method: String,
      count: Number,
      amount: Number,
      percentage: Number
    }],
    spaceUtilizationByArea: [{
      area: String,
      totalSpaces: Number,
      averageOccupancyRate: Number
    }],
    revenueByTimeOfDay: [{
      hour: Number,
      revenue: Number
    }],
    revenueByDayOfWeek: [{
      day: String,
      revenue: Number
    }],
    revenueByMonth: [{
      month: String,
      revenue: Number
    }]
  },
  charts: [{
    chartType: {
      type: String,
      enum: ['line', 'bar', 'pie', 'area', 'scatter']
    },
    title: String,
    data: mongoose.Schema.Types.Mixed
  }],
  insights: [{
    type: String,
    description: String,
    value: mongoose.Schema.Types.Mixed
  }],
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  schedule: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly']
    },
    nextRun: Date,
    recipients: [String]
  }
}, {
  timestamps: true
})

// 索引
analyticsSchema.index({ reportId: 1 })
analyticsSchema.index({ reportType: 1 })
analyticsSchema.index({ dateRange: 1 })
analyticsSchema.index({ lotId: 1 })

module.exports = mongoose.model('Analytics', analyticsSchema)