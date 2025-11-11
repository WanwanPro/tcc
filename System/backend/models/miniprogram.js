const mongoose = require('mongoose')

// 小程序用户模型
const MiniProgramUserSchema = new mongoose.Schema({
  openId: {
    type: String,
    required: true,
    unique: true
  },
  unionId: String,
  nickName: String,
  avatarUrl: String,
  gender: {
    type: Number,
    enum: [0, 1, 2], // 0=未知, 1=男, 2=女
    default: 0
  },
  phone: String,
  isGuest: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLoginTime: Date,
  loginCount: {
    type: Number,
    default: 0
  },
  totalParkingCount: {
    type: Number,
    default: 0
  },
  statistics: {
    totalParkingTime: {
      type: Number,
      default: 0 // 总停车时长，单位：分钟
    },
    totalParkingFee: {
      type: Number,
      default: 0 // 总停车费用，单位：元
    }
  }
}, {
  timestamps: true
})

// 用户车辆模型
const VehicleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MiniProgramUser',
    required: true
  },
  licensePlate: {
    type: String,
    required: true
  },
  vehicleType: {
    type: String,
    enum: ['sedan', 'suv', 'mpv', 'sports', 'truck', 'motorcycle', 'electric', 'other'],
    default: 'sedan'
  },
  brand: String,
  model: String,
  color: String,
  isDefault: {
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

// 停车记录模型
const ParkingRecordSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MiniProgramUser',
    required: true
  },
  vehicleId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  spaceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingSpace',
    required: true
  },
  entryTime: {
    type: Date,
    required: true
  },
  exitTime: Date,
  plannedExitTime: Date,
  status: {
    type: String,
    enum: ['parking', 'exited', 'overtime'],
    default: 'parking'
  },
  fee: {
    amount: {
      type: Number,
      default: 0
    },
    paid: {
      type: Boolean,
      default: false
    },
    paymentMethod: {
      type: String,
      enum: ['wechat', 'alipay', 'cash', 'card', 'monthly'],
      default: 'wechat'
    },
    paymentTime: Date
  },
  navigationPath: {
    pathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NavigationPath'
    },
    savedAt: Date // 用户保存导航路径的时间
  },
  findCarPath: {
    pathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'NavigationPath'
    },
    savedAt: Date // 用户保存反向寻车路径的时间
  },
  notes: String // 用户备注
}, {
  timestamps: true
})

// 用户收藏停车场模型
const FavoriteParkingLotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MiniProgramUser',
    required: true
  },
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot',
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
})

// 用户反馈模型
const UserFeedbackSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MiniProgramUser',
    required: true
  },
  type: {
    type: String,
    enum: ['bug', 'suggestion', 'complaint', 'praise'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  images: [String], // 反馈图片URL数组
  contactInfo: String, // 联系方式
  status: {
    type: String,
    enum: ['pending', 'processing', 'resolved', 'closed'],
    default: 'pending'
  },
  adminReply: String,
  resolvedAt: Date
}, {
  timestamps: true
})

// 创建模型
const MiniProgramUser = mongoose.model('MiniProgramUser', MiniProgramUserSchema)
const MiniProgramVehicle = mongoose.model('MiniProgramVehicle', VehicleSchema)
const ParkingRecord = mongoose.model('ParkingRecord', ParkingRecordSchema)
const FavoriteParkingLot = mongoose.model('FavoriteParkingLot', FavoriteParkingLotSchema)
const UserFeedback = mongoose.model('UserFeedback', UserFeedbackSchema)

module.exports = {
  MiniProgramUser,
  Vehicle: MiniProgramVehicle,
  ParkingRecord,
  FavoriteParkingLot,
  UserFeedback
}