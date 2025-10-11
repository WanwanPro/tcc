const mongoose = require('mongoose');

const pathSchema = new mongoose.Schema({
  pathId: {
    type: String,
    required: true,
    unique: true
  },
  startPoint: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  endPoint: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  route: [{
    x: Number,
    y: Number
  }],
  obstacles: [{
    x: Number,
    y: Number,
    width: Number,
    height: Number
  }],
  distance: {
    type: Number,
    required: true
  },
  estimatedTime: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('Path', pathSchema);