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

module.exports = router;
