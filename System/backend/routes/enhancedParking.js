const express = require('express');
const router = express.Router();
const enhancedParkingController = require('../controllers/enhancedParkingController');
const { auth, checkPermission, checkResourceAccess, logOperation } = require('../middleware/auth');

// 获取车位操作日志
router.get('/logs', 
  auth, 
  checkPermission('parking_space:view_logs'), 
  logOperation('view', 'parking_space'),
  enhancedParkingController.getOperationLogs
);

// 获取车位状态变更历史
router.get('/status-history', 
  auth, 
  checkPermission('parking_space:view_history'), 
  logOperation('view', 'parking_space'),
  enhancedParkingController.getStatusHistory
);

// 获取车位状态统计
router.get('/statistics', 
  auth, 
  checkPermission('parking_space:view_stats'), 
  logOperation('view', 'parking_space'),
  enhancedParkingController.getStatistics
);

// 批量更新停车位
router.put('/spaces/batch', 
  auth, 
  checkPermission('parking_space:batch_update'), 
  logOperation('batch_update', 'parking_space'),
  enhancedParkingController.batchUpdateSpaces
);

// 更新车位状态（带日志记录）
router.put('/spaces/:id/status', 
  auth, 
  checkResourceAccess('parking_space', 'update'), 
  logOperation('status_change', 'parking_space'),
  enhancedParkingController.updateSpaceStatusWithLog
);

module.exports = router;