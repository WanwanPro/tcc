const express = require('express')
const SystemNotice = require('../models/SystemNotice')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit || '5', 10), 10)
    const notices = await SystemNotice.find({ status: 'active' })
      .sort({ publishedAt: -1 })
      .limit(limit)

    res.json({
      success: true,
      data: notices.map((notice) => ({
        id: notice._id,
        title: notice.title,
        content: notice.content,
        priority: notice.priority,
        publishedAt: notice.publishedAt,
        createdByName: notice.createdByName
      }))
    })
  } catch (error) {
    console.error('获取公告列表失败:', error)
    res.status(500).json({
      success: false,
      message: '获取公告列表失败',
      error: error.message
    })
  }
})

module.exports = router
