const mongoose = require('mongoose')

const systemConfigSchema = new mongoose.Schema({
  configKey: {
    type: String,
    required: true,
    unique: true
  },
  configValue: {
    type: mongoose.Schema.Types.Mixed,
    required: true
  },
  description: {
    type: String
  },
  category: {
    type: String,
    enum: ['general', 'parking', 'payment', 'notification', 'security', 'map'],
    required: true
  },
  dataType: {
    type: String,
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true
  },
  isEditable: {
    type: Boolean,
    default: true
  },
  validationRules: {
    min: Number,
    max: Number,
    pattern: String,
    options: [String]
  },
  lastUpdatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  }
}, {
  timestamps: true
})

// 索引
systemConfigSchema.index({ configKey: 1 })
systemConfigSchema.index({ category: 1 })

module.exports = mongoose.model('SystemConfig', systemConfigSchema)