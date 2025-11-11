const mongoose = require('mongoose');

const systemSettingsSchema = new mongoose.Schema({
  basic: {
    systemName: {
      type: String,
      default: '智慧停车场管理系统'
    },
    systemVersion: {
      type: String,
      default: '1.0.0'
    },
    companyName: {
      type: String,
      default: '智慧科技有限公司'
    },
    contactPhone: {
      type: String,
      default: '400-888-8888'
    },
    contactEmail: {
      type: String,
      default: 'support@example.com'
    },
    logoUrl: {
      type: String,
      default: ''
    },
    theme: {
      type: String,
      enum: ['default', 'dark', 'blue'],
      default: 'default'
    },
    language: {
      type: String,
      enum: ['zh-CN', 'en-US'],
      default: 'zh-CN'
    }
  },
  parking: {
    freeDuration: {
      type: Number,
      default: 15,
      min: 0,
      max: 60
    },
    maxDuration: {
      type: Number,
      default: 24,
      min: 1,
      max: 24
    },
    overtimeRate: {
      type: Number,
      default: 1.5,
      min: 1,
      max: 10
    },
    autoRelease: {
      type: Boolean,
      default: true
    },
    autoReleaseTime: {
      type: Number,
      default: 5,
      min: 1,
      max: 60
    },
    enableReservation: {
      type: Boolean,
      default: true
    },
    reservationAdvanceTime: {
      type: Number,
      default: 2,
      min: 1,
      max: 24
    },
    reservationHoldTime: {
      type: Number,
      default: 15,
      min: 5,
      max: 60
    }
  },
  payment: {
    paymentMethods: [{
      type: String,
      enum: ['cash', 'alipay', 'wechat', 'card', 'monthly']
    }],
    alipayAppId: {
      type: String,
      default: ''
    },
    alipayPrivateKey: {
      type: String,
      default: ''
    },
    wechatAppId: {
      type: String,
      default: ''
    },
    wechatMchId: {
      type: String,
      default: ''
    },
    wechatApiKey: {
      type: String,
      default: ''
    },
    autoPrintInvoice: {
      type: Boolean,
      default: false
    },
    invoiceTitle: {
      type: String,
      default: ''
    },
    taxNumber: {
      type: String,
      default: ''
    }
  },
  notification: {
    smsEnabled: {
      type: Boolean,
      default: false
    },
    smsProvider: {
      type: String,
      enum: ['aliyun', 'tencent', 'huawei'],
      default: 'aliyun'
    },
    smsSignature: {
      type: String,
      default: ''
    },
    emailEnabled: {
      type: Boolean,
      default: false
    },
    smtpServer: {
      type: String,
      default: ''
    },
    smtpPort: {
      type: Number,
      default: 587
    },
    emailAccount: {
      type: String,
      default: ''
    },
    emailPassword: {
      type: String,
      default: ''
    },
    notificationScenes: [{
      type: String,
      enum: ['entry', 'exit', 'overtime', 'reservation', 'payment']
    }]
  },
  security: {
    passwordComplexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    passwordExpiry: {
      type: Number,
      default: 90,
      min: 0,
      max: 365
    },
    loginLockEnabled: {
      type: Boolean,
      default: true
    },
    maxFailedAttempts: {
      type: Number,
      default: 5,
      min: 3,
      max: 10
    },
    lockDuration: {
      type: Number,
      default: 30,
      min: 5,
      max: 60
    },
    sessionTimeout: {
      type: Number,
      default: 120,
      min: 10,
      max: 480
    },
    twoFactorEnabled: {
      type: Boolean,
      default: false
    },
    ipWhitelist: {
      type: String,
      default: ''
    }
  }
}, {
  timestamps: true
});

// 创建索引
systemSettingsSchema.index({ createdAt: -1 });

module.exports = mongoose.model('SystemSettings', systemSettingsSchema);