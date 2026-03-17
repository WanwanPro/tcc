const express = require('express')
const jwt = require('jsonwebtoken')
const Admin = require('../models/Admin')
const {
  registerClient,
  unregisterClient
} = require('../services/parkingSpaceEvents')

const router = express.Router()

async function authenticateSseRequest(req) {
  const authHeader = req.header('Authorization')
  const headerToken = authHeader && authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : ''
  const token = headerToken || req.query.token || ''

  if (!token) {
    throw new Error('未提供令牌')
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret')
  const admin = await Admin.findById(decoded.id).select('-password')

  if (!admin || admin.status !== 'active') {
    throw new Error('用户不存在或已禁用')
  }

  return admin
}

router.get('/parking-spaces', async (req, res) => {
  try {
    await authenticateSseRequest(req)

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache, no-transform')
    res.setHeader('Connection', 'keep-alive')
    res.setHeader('X-Accel-Buffering', 'no')

    if (typeof res.flushHeaders === 'function') {
      res.flushHeaders()
    }

    registerClient(res)

    req.on('close', () => {
      unregisterClient(res)
      res.end()
    })
  } catch (error) {
    res.status(401).json({
      success: false,
      message: error.message || 'SSE 认证失败'
    })
  }
})

module.exports = router
