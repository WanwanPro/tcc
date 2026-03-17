const clients = new Set()

function sendEvent(client, event, payload) {
  try {
    client.write(`event: ${event}\n`)
    client.write(`data: ${JSON.stringify(payload)}\n\n`)
  } catch (error) {
    clients.delete(client)
  }
}

function registerClient(res) {
  clients.add(res)
  sendEvent(res, 'connected', {
    type: 'connected',
    timestamp: new Date().toISOString()
  })
}

function unregisterClient(res) {
  clients.delete(res)
}

function broadcastParkingSpaceChanged(payload = {}) {
  const message = {
    type: 'parking-space-changed',
    timestamp: new Date().toISOString(),
    ...payload
  }

  for (const client of clients) {
    sendEvent(client, 'parking-space-changed', message)
  }
}

function broadcastHeartbeat() {
  for (const client of clients) {
    sendEvent(client, 'heartbeat', {
      type: 'heartbeat',
      timestamp: new Date().toISOString()
    })
  }
}

setInterval(broadcastHeartbeat, 30000).unref()

module.exports = {
  registerClient,
  unregisterClient,
  broadcastParkingSpaceChanged
}
