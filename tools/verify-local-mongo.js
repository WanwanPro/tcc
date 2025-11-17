const mongoose = require('mongoose')

async function countCollections(uri, collections) {
  const conn = await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  const db = mongoose.connection.db
  const results = {}
  for (const name of collections) {
    const exists = await db.listCollections({ name }).hasNext()
    if (!exists) {
      results[name] = null
      continue
    }
    const count = await db.collection(name).countDocuments()
    results[name] = count
  }
  await mongoose.connection.close()
  return results
}

async function run() {
  console.log('验证本地 MongoDB 数据集')
  const adminUri = 'mongodb://localhost:27017/parking_admin'
  const systemUri = 'mongodb://localhost:27017/parking_system'
  const adminCollections = [
    'users',
    'admins',
    'parkingspaces',
    'mapnodes',
    'transactions',
    'parkingrecords'
  ]
  const systemCollections = [
    'admins',
    'users',
    'parkingspaces',
    'paths'
  ]
  const adminCounts = await countCollections(adminUri, adminCollections)
  const systemCounts = await countCollections(systemUri, systemCollections)
  console.log('parking_admin:', adminCounts)
  console.log('parking_system:', systemCounts)
}

run().catch(err => {
  console.error('验证失败', err.message)
  process.exit(1)
})