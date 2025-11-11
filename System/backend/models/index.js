const mongoose = require('mongoose')

// 从User.js导入User和Role模型
const { User, Role } = require('./User')

// 从ParkingLot.js导入ParkingLot模型
const ParkingLot = require('./ParkingLot')

// 从ParkingSpace.js导入ParkingSpace模型
const ParkingSpace = require('./ParkingSpace')

// 从MapNode.js导入MapNode模型
const MapNode = require('./MapNode')

// 从NavigationPath.js导入NavigationPath模型
const NavigationPath = require('./NavigationPath')

// 从Transaction.js导入Transaction模型
const Transaction = require('./Transaction')

// 从SystemConfig.js导入SystemConfig模型
const SystemConfig = require('./SystemConfig')

// 计费规则模型
const BillingRuleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot'
  },
  vehicleType: {
    type: String,
    enum: ['all', 'car', 'motorcycle', 'truck', 'electric'],
    default: 'all'
  },
  timeBasedRates: [{
    duration: {
      type: String,
      enum: ['hourly', 'daily', 'weekly', 'monthly']
    },
    rate: Number,
    maxDuration: Number // 最大持续时间（分钟）
  }],
  specialRates: [{
    name: String,
    conditions: String,
    rate: Number,
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  gracePeriod: {
    type: Number,
    default: 15 // 宽限期（分钟）
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// 分析报告模型
const AnalyticsReportSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['occupancy', 'revenue', 'traffic', 'custom'],
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot'
  },
  period: {
    startDate: {
      type: Date,
      required: true
    },
    endDate: {
      type: Date,
      required: true
    }
  },
  data: {
    summary: mongoose.Schema.Types.Mixed,
    details: [mongoose.Schema.Types.Mixed],
    charts: [mongoose.Schema.Types.Mixed]
  },
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isScheduled: {
    type: Boolean,
    default: false
  },
  schedule: {
    frequency: String,
    nextRun: Date
  }
}, {
  timestamps: true
})

// 模拟历史记录模型
const SimulationHistorySchema = new mongoose.Schema({
  parkingSpaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpace',
    required: true
  },
  previousStatus: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'out_of_order'],
    required: true
  },
  newStatus: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'out_of_order'],
    required: true
  },
  simulatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  simulationType: {
    type: String,
    enum: ['manual', 'batch', 'random', 'real_time'],
    required: true
  }
}, {
  timestamps: true
})

// 创建模型
const BillingRule = mongoose.model('BillingRule', BillingRuleSchema)
const AnalyticsReport = mongoose.model('AnalyticsReport', AnalyticsReportSchema)
const SimulationHistory = mongoose.model('SimulationHistory', SimulationHistorySchema)

// 导出所有模型
module.exports = {
  User,
  Role,
  ParkingLot,
  ParkingSpace,
  MapNode,
  NavigationPath,
  Transaction,
  BillingRule,
  AnalyticsReport,
  SystemConfig,
  SimulationHistory
}

// 导入并重新导出小程序相关模型
const {
  MiniProgramUser,
  Vehicle,
  ParkingRecord,
  FavoriteParkingLot,
  UserFeedback
} = require('./miniprogram')

// 添加小程序模型到导出
module.exports = {
  ...module.exports,
  MiniProgramUser,
  Vehicle,
  ParkingRecord,
  FavoriteParkingLot,
  UserFeedback
}