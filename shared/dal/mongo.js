const mongoose = require('mongoose')

let cached = null

const connectUnified = async () => {
  if (cached) return cached
  const uri = process.env.UNIFIED_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/parking_system'
  const conn = await mongoose.connect(uri)
  cached = conn
  return conn
}

module.exports = { connectUnified }
