const express = require('express')
const { auth } = require('../middleware/auth')
const SystemNotice = require('../models/SystemNotice')

const router = express.Router()

router.use(auth)

router.post('/', async (req, res) => {
  try {
    const { title, content, priority = 'normal' } = req.body

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: '请填写通知标题和内容'
      })
    }

    const notice = await SystemNotice.create({
      title: title.trim(),
      content: content.trim(),
      priority,
      status: 'active',
      publishedAt: new Date(),
      createdBy: req.user._id,
      createdByName: req.user.name || req.user.username || ''
    })

    res.status(201).json({
      success: true,
      message: '系统通知发送成功',
      data: notice
    })
  } catch (error) {
    console.error('发送系统通知失败:', error)
    res.status(500).json({
      success: false,
      message: '发送系统通知失败',
      error: error.message
    })
  }
})

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '20', 10), 50)
    const notices = await SystemNotice.find()
      .sort({ publishedAt: -1 })
      .limit(limit)

    res.json({
      success: true,
      data: notices
    })
  } catch (error) {
    console.error('获取系统通知失败:', error)
    res.status(500).json({
      success: false,
      message: '获取系统通知失败',
      error: error.message
    })
  }
})

module.exports = router
