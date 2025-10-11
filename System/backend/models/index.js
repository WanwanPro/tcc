const mongoose = require('mongoose')

// 用户模型
const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'operator', 'viewer'],
    default: 'viewer'
  },
  profile: {
    firstName: String,
    lastName: String,
    phone: String,
    avatar: String
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date
}, {
  timestamps: true
})

// 停车场模型
const ParkingLotSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  totalSpaces: {
    type: Number,
    required: true
  },
  availableSpaces: {
    type: Number,
    default: 0
  },
  floors: {
    type: Number,
    default: 1
  },
  operatingHours: {
    open: String,
    close: String
  },
  pricing: {
    hourly: Number,
    daily: Number,
    monthly: Number
  },
  features: [String],
  coordinates: {
    latitude: Number,
    longitude: Number
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// 停车位模型
const ParkingSpaceSchema = new mongoose.Schema({
  spaceId: {
    type: String,
    required: true,
    unique: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  section: String,
  spaceNumber: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['standard', 'disabled', 'electric', 'reserved'],
    default: 'standard'
  },
  status: {
    type: String,
    enum: ['available', 'occupied', 'reserved', 'out_of_order'],
    default: 'available'
  },
  coordinates: {
    x: Number,
    y: Number
  },
  nodeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MapNode'
  },
  vehicleInfo: {
    licensePlate: String,
    entryTime: Date,
    estimatedExitTime: Date
  }
}, {
  timestamps: true
})

// 地图节点模型
const MapNodeSchema = new mongoose.Schema({
  nodeId: {
    type: String,
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  floor: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ['entrance', 'exit', 'parking_space', 'intersection', 'elevator', 'stairs', 'amenity'],
    required: true
  },
  name: String,
  coordinates: {
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
    nodeId: String,
    distance: Number,
    floor: Number,
    type: {
      type: String,
      enum: ['walkway', 'stairs', 'elevator', 'ramp'],
      default: 'walkway'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// 导航路径模型
const NavigationPathSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  startPoint: {
    nodeId: String,
    floor: Number,
    type: String,
    name: String
  },
  endPoint: {
    nodeId: String,
    floor: Number,
    type: String,
    name: String
  },
  path: [{
    nodeId: String,
    floor: Number,
    coordinates: {
      x: Number,
      y: Number
    },
    instruction: String
  }],
  distance: Number,
  estimatedTime: Number,
  isRecommended: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// 交易记录模型
const TransactionSchema = new mongoose.Schema({
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  parkingSpaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpace',
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  vehicleInfo: {
    licensePlate: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['car', 'motorcycle', 'truck', 'electric'],
      default: 'car'
    }
  },
  entryTime: {
    type: Date,
    required: true
  },
  exitTime: Date,
  duration: Number, // 分钟
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'subscription'],
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'cancelled'],
    default: 'active'
  },
  operatorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

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

// 系统配置模型
const SystemConfigSchema = new mongoose.Schema({
  key: {
    type: String,
    required: true,
    unique: true
  },
  category: {
    type: String,
    required: true
  },
  value: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: String,
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    default: 'string'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  properties: mongoose.Schema.Types.Mixed
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
const User = mongoose.model('User', UserSchema)
const ParkingLot = mongoose.model('ParkingLot', ParkingLotSchema)
const ParkingSpace = mongoose.model('ParkingSpace', ParkingSpaceSchema)
const MapNode = mongoose.model('MapNode', MapNodeSchema)
const NavigationPath = mongoose.model('NavigationPath', NavigationPathSchema)
const Transaction = mongoose.model('Transaction', TransactionSchema)
const BillingRule = mongoose.model('BillingRule', BillingRuleSchema)
const AnalyticsReport = mongoose.model('AnalyticsReport', AnalyticsReportSchema)
const SystemConfig = mongoose.model('SystemConfig', SystemConfigSchema)
const SimulationHistory = mongoose.model('SimulationHistory', SimulationHistorySchema)

module.exports = {
  User,
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