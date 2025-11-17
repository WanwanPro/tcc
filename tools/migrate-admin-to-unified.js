const mongoose = require('mongoose')

const adminUri = process.env.ADMIN_MONGODB_URI || 'mongodb://localhost:27017/parking_admin'
const unifiedUri = process.env.UNIFIED_MONGODB_URI || process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_system'

const run = async () => {
  const adminConn = await mongoose.createConnection(adminUri, { useNewUrlParser: true, useUnifiedTopology: true })
  const unifiedConn = await mongoose.createConnection(unifiedUri, { useNewUrlParser: true, useUnifiedTopology: true })
  const adminDb = adminConn.db
  const unifiedDb = unifiedConn.db

  const now = new Date()

  const collections = await adminDb.listCollections().toArray()
  for (const c of collections) {
    const name = c.name
    const src = adminDb.collection(name)
    const dst = unifiedDb.collection(name)
    const cursor = src.find({})
    while (await cursor.hasNext()) {
      const doc = await cursor.next()
      const mapped = { ...doc, schemaVersion: 1, migratedAt: now, source: 'parking_admin' }
      await dst.updateOne({ _id: mapped._id }, { $set: mapped }, { upsert: true })
    }
  }

  await adminConn.close()
  await unifiedConn.close()
}

run().then(() => {
  process.exit(0)
}).catch(err => {
  console.error(err)
  process.exit(1)
})

