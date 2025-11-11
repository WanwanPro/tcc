const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const SystemSettings = require('../models/SystemSettings');
const SystemLog = require('../models/SystemLog');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { promisify } = require('util');

const writeFile = promisify(fs.writeFile);
const readFile = promisify(fs.readFile);
const mkdir = promisify(fs.mkdir);

// 配置文件上传
const upload = multer({
  dest: 'temp/',
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  }
});

// 获取系统设置
router.get('/settings', auth, async (req, res) => {
  try {
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      // 如果没有设置，创建默认设置
      settings = new SystemSettings({
        basic: {
          systemName: '智慧停车场管理系统',
          systemVersion: '1.0.0',
          companyName: '智慧科技有限公司',
          contactPhone: '400-888-8888',
          contactEmail: 'support@example.com',
          logoUrl: '',
          theme: 'default',
          language: 'zh-CN'
        },
        parking: {
          freeDuration: 15,
          maxDuration: 24,
          overtimeRate: 1.5,
          autoRelease: true,
          autoReleaseTime: 5,
          enableReservation: true,
          reservationAdvanceTime: 2,
          reservationHoldTime: 15
        },
        payment: {
          paymentMethods: ['cash', 'alipay', 'wechat'],
          alipayAppId: '',
          alipayPrivateKey: '',
          wechatAppId: '',
          wechatMchId: '',
          wechatApiKey: '',
          autoPrintInvoice: false,
          invoiceTitle: '',
          taxNumber: ''
        },
        notification: {
          smsEnabled: false,
          smsProvider: 'aliyun',
          smsSignature: '',
          emailEnabled: false,
          smtpServer: '',
          smtpPort: 587,
          emailAccount: '',
          emailPassword: '',
          notificationScenes: ['entry', 'exit', 'overtime']
        },
        security: {
          passwordComplexity: 'medium',
          passwordExpiry: 90,
          loginLockEnabled: true,
          maxFailedAttempts: 5,
          lockDuration: 30,
          sessionTimeout: 120,
          twoFactorEnabled: false,
          ipWhitelist: ''
        }
      });
      await settings.save();
    }
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error('获取系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统设置失败',
      error: error.message
    });
  }
});

// 更新系统设置
router.put('/settings', auth, async (req, res) => {
  try {
    const { basic, parking, payment, notification, security } = req.body;
    
    let settings = await SystemSettings.findOne();
    
    if (!settings) {
      settings = new SystemSettings();
    }
    
    if (basic) settings.basic = { ...settings.basic, ...basic };
    if (parking) settings.parking = { ...settings.parking, ...parking };
    if (payment) settings.payment = { ...settings.payment, ...payment };
    if (notification) settings.notification = { ...settings.notification, ...notification };
    if (security) settings.security = { ...settings.security, ...security };
    
    await settings.save();
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'update',
      module: '系统设置',
      details: '更新系统设置',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '系统设置更新成功',
      data: settings
    });
  } catch (error) {
    console.error('更新系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新系统设置失败',
      error: error.message
    });
  }
});

// 获取基础设置
router.get('/settings/basic', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    res.json({
      success: true,
      data: settings.basic
    });
  } catch (error) {
    console.error('获取基础设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取基础设置失败',
      error: error.message
    });
  }
});

// 更新基础设置
router.put('/settings/basic', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    settings.basic = { ...settings.basic, ...req.body };
    await settings.save();
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'update',
      module: '基础设置',
      details: '更新基础设置',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '基础设置更新成功',
      data: settings.basic
    });
  } catch (error) {
    console.error('更新基础设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新基础设置失败',
      error: error.message
    });
  }
});

// 获取停车设置
router.get('/settings/parking', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    res.json({
      success: true,
      data: settings.parking
    });
  } catch (error) {
    console.error('获取停车设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取停车设置失败',
      error: error.message
    });
  }
});

// 更新停车设置
router.put('/settings/parking', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    settings.parking = { ...settings.parking, ...req.body };
    await settings.save();
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'update',
      module: '停车设置',
      details: '更新停车设置',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '停车设置更新成功',
      data: settings.parking
    });
  } catch (error) {
    console.error('更新停车设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新停车设置失败',
      error: error.message
    });
  }
});

// 获取支付设置
router.get('/settings/payment', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    res.json({
      success: true,
      data: settings.payment
    });
  } catch (error) {
    console.error('获取支付设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取支付设置失败',
      error: error.message
    });
  }
});

// 更新支付设置
router.put('/settings/payment', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    settings.payment = { ...settings.payment, ...req.body };
    await settings.save();
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'update',
      module: '支付设置',
      details: '更新支付设置',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '支付设置更新成功',
      data: settings.payment
    });
  } catch (error) {
    console.error('更新支付设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新支付设置失败',
      error: error.message
    });
  }
});

// 获取通知设置
router.get('/settings/notification', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    res.json({
      success: true,
      data: settings.notification
    });
  } catch (error) {
    console.error('获取通知设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取通知设置失败',
      error: error.message
    });
  }
});

// 更新通知设置
router.put('/settings/notification', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    settings.notification = { ...settings.notification, ...req.body };
    await settings.save();
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'update',
      module: '通知设置',
      details: '更新通知设置',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '通知设置更新成功',
      data: settings.notification
    });
  } catch (error) {
    console.error('更新通知设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新通知设置失败',
      error: error.message
    });
  }
});

// 获取安全设置
router.get('/settings/security', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    res.json({
      success: true,
      data: settings.security
    });
  } catch (error) {
    console.error('获取安全设置失败:', error);
    res.status(500).json({
      success: false,
      message: '获取安全设置失败',
      error: error.message
    });
  }
});

// 更新安全设置
router.put('/settings/security', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    settings.security = { ...settings.security, ...req.body };
    await settings.save();
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'update',
      module: '安全设置',
      details: '更新安全设置',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '安全设置更新成功',
      data: settings.security
    });
  } catch (error) {
    console.error('更新安全设置失败:', error);
    res.status(500).json({
      success: false,
      message: '更新安全设置失败',
      error: error.message
    });
  }
});

// 测试邮件配置
router.post('/settings/test-email', auth, async (req, res) => {
  try {
    const { emailAccount, smtpServer, smtpPort, emailPassword } = req.body;
    
    // 这里应该实现实际的邮件发送测试
    // 暂时模拟测试结果
    setTimeout(() => {
      res.json({
        success: true,
        message: '邮件配置测试成功'
      });
    }, 1000);
  } catch (error) {
    console.error('测试邮件配置失败:', error);
    res.status(500).json({
      success: false,
      message: '测试邮件配置失败',
      error: error.message
    });
  }
});

// 测试短信配置
router.post('/settings/test-sms', auth, async (req, res) => {
  try {
    const { smsProvider, smsSignature } = req.body;
    
    // 这里应该实现实际的短信发送测试
    // 暂时模拟测试结果
    setTimeout(() => {
      res.json({
        success: true,
        message: '短信配置测试成功'
      });
    }, 1000);
  } catch (error) {
    console.error('测试短信配置失败:', error);
    res.status(500).json({
      success: false,
      message: '测试短信配置失败',
      error: error.message
    });
  }
});

// 重置系统设置
router.post('/settings/reset', auth, async (req, res) => {
  try {
    // 删除现有设置
    await SystemSettings.deleteMany({});
    
    // 创建默认设置
    const defaultSettings = new SystemSettings({
      basic: {
        systemName: '智慧停车场管理系统',
        systemVersion: '1.0.0',
        companyName: '智慧科技有限公司',
        contactPhone: '400-888-8888',
        contactEmail: 'support@example.com',
        logoUrl: '',
        theme: 'default',
        language: 'zh-CN'
      },
      parking: {
        freeDuration: 15,
        maxDuration: 24,
        overtimeRate: 1.5,
        autoRelease: true,
        autoReleaseTime: 5,
        enableReservation: true,
        reservationAdvanceTime: 2,
        reservationHoldTime: 15
      },
      payment: {
        paymentMethods: ['cash', 'alipay', 'wechat'],
        alipayAppId: '',
        alipayPrivateKey: '',
        wechatAppId: '',
        wechatMchId: '',
        wechatApiKey: '',
        autoPrintInvoice: false,
        invoiceTitle: '',
        taxNumber: ''
      },
      notification: {
        smsEnabled: false,
        smsProvider: 'aliyun',
        smsSignature: '',
        emailEnabled: false,
        smtpServer: '',
        smtpPort: 587,
        emailAccount: '',
        emailPassword: '',
        notificationScenes: ['entry', 'exit', 'overtime']
      },
      security: {
        passwordComplexity: 'medium',
        passwordExpiry: 90,
        loginLockEnabled: true,
        maxFailedAttempts: 5,
        lockDuration: 30,
        sessionTimeout: 120,
        twoFactorEnabled: false,
        ipWhitelist: ''
      }
    });
    
    await defaultSettings.save();
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'reset',
      module: '系统设置',
      details: '重置系统设置',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '系统设置重置成功',
      data: defaultSettings
    });
  } catch (error) {
    console.error('重置系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '重置系统设置失败',
      error: error.message
    });
  }
});

// 导出系统设置
router.get('/settings/export', auth, async (req, res) => {
  try {
    const settings = await SystemSettings.findOne();
    
    if (!settings) {
      return res.status(404).json({
        success: false,
        message: '未找到系统设置'
      });
    }
    
    // 创建导出目录（如果不存在）
    const exportDir = path.join(__dirname, '../exports');
    try {
      await mkdir(exportDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // 创建导出文件
    const fileName = `system-settings-${Date.now()}.json`;
    const filePath = path.join(exportDir, fileName);
    
    await writeFile(filePath, JSON.stringify(settings, null, 2));
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'export',
      module: '系统设置',
      details: `导出系统设置: ${fileName}`,
      ip: req.ip
    });
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // 发送文件
    const fileContent = await readFile(filePath);
    res.send(fileContent);
    
    // 删除临时文件
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('删除临时文件失败:', err);
      });
    }, 5000);
  } catch (error) {
    console.error('导出系统设置失败:', error);
    res.status(500).json({
      success: false,
      message: '导出系统设置失败',
      error: error.message
    });
  }
});

// 导入系统设置
router.post('/settings/import', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要导入的文件'
      });
    }
    
    const filePath = req.file.path;
    const fileContent = await readFile(filePath, 'utf8');
    const importedSettings = JSON.parse(fileContent);
    
    // 删除现有设置
    await SystemSettings.deleteMany({});
    
    // 创建新设置
    const newSettings = new SystemSettings(importedSettings);
    await newSettings.save();
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'import',
      module: '系统设置',
      details: `导入系统设置: ${req.file.originalname}`,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '系统设置导入成功',
      data: newSettings
    });
  } catch (error) {
    console.error('导入系统设置失败:', error);
    
    // 删除临时文件（如果存在）
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: '导入系统设置失败',
      error: error.message
    });
  }
});

// 获取系统信息
router.get('/info', auth, async (req, res) => {
  try {
    const os = require('os');
    const packageJson = require('../package.json');
    
    const systemInfo = {
      system: {
        name: '智慧停车场管理系统',
        version: packageJson.version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        uptime: process.uptime(),
        nodeVersion: process.version
      },
      server: {
        hostname: os.hostname(),
        platform: os.platform(),
        arch: os.arch(),
        totalMemory: os.totalmem(),
        freeMemory: os.freemem(),
        cpuCount: os.cpus().length
      },
      database: {
        type: 'MongoDB',
        status: 'connected' // 这里应该检查实际的数据库连接状态
      }
    };
    
    res.json({
      success: true,
      data: systemInfo
    });
  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统信息失败',
      error: error.message
    });
  }
});

// 获取系统日志
router.get('/logs', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, module, action, startDate, endDate } = req.query;
    const query = {};
    
    if (module) query.module = module;
    if (action) query.action = action;
    
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    
    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 }
    };
    
    const logs = await SystemLog.paginate(query, options);
    
    res.json({
      success: true,
      data: logs.docs,
      pagination: {
        current: logs.page,
        pageSize: logs.limit,
        total: logs.totalDocs,
        totalPages: logs.totalPages
      }
    });
  } catch (error) {
    console.error('获取系统日志失败:', error);
    res.status(500).json({
      success: false,
      message: '获取系统日志失败',
      error: error.message
    });
  }
});

// 清空系统日志
router.delete('/logs', auth, async (req, res) => {
  try {
    await SystemLog.deleteMany({});
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'clear',
      module: '系统日志',
      details: '清空系统日志',
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '系统日志清空成功'
    });
  } catch (error) {
    console.error('清空系统日志失败:', error);
    res.status(500).json({
      success: false,
      message: '清空系统日志失败',
      error: error.message
    });
  }
});

// 备份系统数据
router.post('/backup', auth, async (req, res) => {
  try {
    // 创建备份目录（如果不存在）
    const backupDir = path.join(__dirname, '../backups');
    try {
      await mkdir(backupDir, { recursive: true });
    } catch (err) {
      if (err.code !== 'EEXIST') throw err;
    }
    
    // 创建备份文件
    const fileName = `system-backup-${Date.now()}.json`;
    const filePath = path.join(backupDir, fileName);
    
    // 这里应该实现实际的数据备份逻辑
    // 暂时创建一个示例备份文件
    const backupData = {
      timestamp: new Date(),
      version: '1.0.0',
      data: {
        // 这里应该包含所有需要备份的数据
      }
    };
    
    await writeFile(filePath, JSON.stringify(backupData, null, 2));
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'backup',
      module: '系统备份',
      details: `创建系统备份: ${fileName}`,
      ip: req.ip
    });
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    
    // 发送文件
    const fileContent = await readFile(filePath);
    res.send(fileContent);
    
    // 删除临时文件
    setTimeout(() => {
      fs.unlink(filePath, (err) => {
        if (err) console.error('删除临时文件失败:', err);
      });
    }, 5000);
  } catch (error) {
    console.error('备份系统数据失败:', error);
    res.status(500).json({
      success: false,
      message: '备份系统数据失败',
      error: error.message
    });
  }
});

// 恢复系统数据
router.post('/restore', auth, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请选择要恢复的文件'
      });
    }
    
    const filePath = req.file.path;
    const fileContent = await readFile(filePath, 'utf8');
    const backupData = JSON.parse(fileContent);
    
    // 这里应该实现实际的数据恢复逻辑
    // 暂时模拟恢复过程
    console.log('恢复系统数据:', backupData);
    
    // 删除临时文件
    fs.unlinkSync(filePath);
    
    // 记录操作日志
    await SystemLog.create({
      operator: req.user.username,
      action: 'restore',
      module: '系统恢复',
      details: `恢复系统数据: ${req.file.originalname}`,
      ip: req.ip
    });
    
    res.json({
      success: true,
      message: '系统数据恢复成功'
    });
  } catch (error) {
    console.error('恢复系统数据失败:', error);
    
    // 删除临时文件（如果存在）
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      message: '恢复系统数据失败',
      error: error.message
    });
  }
});

module.exports = router;