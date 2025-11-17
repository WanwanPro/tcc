const mongoose = require('mongoose')

const upsert = async (collectionName, doc, views) => {
  const session = await mongoose.startSession()
  try {
    await session.withTransaction(async () => {
      const base = mongoose.connection.collection(collectionName)
      await base.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true, session })
      for (const v of views) {
        const view = mongoose.connection.collection(v)
        await view.updateOne({ _id: doc._id }, { $set: doc }, { upsert: true, session })
      }
    })
  } finally {
    await session.endSession()
  }
}

module.exports = { upsert }

