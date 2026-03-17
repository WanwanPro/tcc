const mongoose = require('mongoose')

const systemNoticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  priority: {
    type: String,
    enum: ['low', 'normal', 'high'],
    default: 'normal'
  },
  status: {
    type: String,
    enum: ['active', 'inactive'],
    default: 'active'
  },
  publishedAt: {
    type: Date,
    default: Date.now
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  createdByName: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
})

systemNoticeSchema.index({ status: 1, publishedAt: -1 })

module.exports = mongoose.model('SystemNotice', systemNoticeSchema)
