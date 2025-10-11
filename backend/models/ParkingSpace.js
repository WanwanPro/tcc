const mongoose = require('mongoose');

const parkingSpaceSchema = new mongoose.Schema({
  spaceId: {
    type: String,
    required: true,
    unique: true
  },
  position: {
    x: { type: Number, required: true },
    y: { type: Number, required: true }
  },
  status: {
    type: String,
    enum: ['空闲', '占用', '预定'],
    required: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ParkingSpace', parkingSpaceSchema);