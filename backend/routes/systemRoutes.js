const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

const DEFAULT_PUBLIC_SETTINGS = {
  systemName: '智能停车场系统',
  systemVersion: '1.0.0',
  companyName: '智能停车场团队',
  contactPhone: '',
  contactEmail: '',
  logoUrl: ''
};

let adminDbConnectionPromise = null;

const getAdminDbConnection = async () => {
  if (!adminDbConnectionPromise) {
    const adminUri =
      process.env.SYSTEM_MONGODB_URI ||
      process.env.ADMIN_MONGODB_URI ||
      'mongodb://127.0.0.1:27017/parking_admin';

    adminDbConnectionPromise = mongoose.createConnection(adminUri).asPromise();
  }

  return adminDbConnectionPromise;
};

router.get('/public-settings', async (req, res) => {
  try {
    const adminDb = await getAdminDbConnection();
    const settings = await adminDb.collection('systemsettings').findOne({});
    const basic = settings?.basic || {};

    res.json({
      success: true,
      data: {
        ...DEFAULT_PUBLIC_SETTINGS,
        ...basic
      }
    });
  } catch (error) {
    console.error('获取公开系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公开系统设置失败',
      error: error.message
    });
  }
});

router.get('/notices', async (req, res) => {
  try {
    const adminDb = await getAdminDbConnection();
    const limit = Math.min(parseInt(req.query.limit || '5', 10), 10);
    const notices = await adminDb
      .collection('systemnotices')
      .find({ status: 'active' })
      .sort({ publishedAt: -1, createdAt: -1 })
      .limit(limit)
      .toArray();

    res.json({
      success: true,
      data: notices.map((notice) => ({
        id: notice._id,
        title: notice.title || '',
        content: notice.content || '',
        priority: notice.priority || 'normal',
        publishedAt: notice.publishedAt || notice.createdAt || null,
        createdByName: notice.createdByName || ''
      }))
    });
  } catch (error) {
    console.error('获取公开公告失败:', error);
    res.status(500).json({
      success: false,
      message: '获取公开公告失败',
      error: error.message
    });
  }
});

module.exports = router;
