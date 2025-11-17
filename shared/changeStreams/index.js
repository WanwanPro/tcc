const mongoose = require('mongoose')

const subscribe = (collections, handler) => {
  const conn = mongoose.connection
  collections.forEach(name => {
    try {
      const coll = conn.collection(name)
      const stream = coll.watch([], { fullDocument: 'updateLookup' })
      stream.on('change', change => {
        handler(name, change)
      })
    } catch (e) {
      console.log(`[ChangeStreamDisabled] ${name}: ${e && e.message ? e.message : e}`)
    }
  })
}

module.exports = { subscribe }
