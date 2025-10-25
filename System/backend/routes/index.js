const express = require('express')
const router = express.Router()
const auth = require('../middleware/auth')

// 导入控制器
const authController = require('../controllers/authController')
const userController = require('../controllers/userController')
const parkingController = require('../controllers/parkingController')
const mapController = require('../controllers/mapController')
const navigationController = require('../controllers/navigationController')
const simulationController = require('../controllers/simulationController')
const financeController = require('../controllers/financeController')
const analyticsController = require('../controllers/analyticsController')
const systemController = require('../controllers/systemController')

// 认证相关路由
router.post('/auth/login', authController.login)
router.get('/auth/me', auth, authController.getMe)
router.post('/auth/logout', auth, authController.logout)
router.post('/auth/change-password', auth, authController.changePassword)

// 用户管理路由
router.get('/users', auth, userController.getUsers)
router.get('/users/:id', auth, userController.getUser)
router.post('/users', auth, userController.createUser)
router.put('/users/:id', auth, userController.updateUser)
router.delete('/users/:id', auth, userController.deleteUser)
router.post('/users/batch', auth, userController.batchCreateUsers)
router.post('/users/:id/reset-password', auth, userController.resetPassword)
router.put('/users/profile', auth, userController.updateProfile)

// 停车场管理路由
router.get('/parking/lots', auth, parkingController.getParkingLots)
router.get('/parking/lots/:id', auth, parkingController.getParkingLot)
router.post('/parking/lots', auth, parkingController.createParkingLot)
router.put('/parking/lots/:id', auth, parkingController.updateParkingLot)
router.delete('/parking/lots/:id', auth, parkingController.deleteParkingLot)
router.get('/parking/lots/:id/spaces', auth, parkingController.getParkingSpaces)
router.get('/parking/spaces', auth, parkingController.getParkingSpaces)
router.get('/parking/spaces/:id', auth, parkingController.getParkingSpace)
router.post('/parking/spaces', auth, parkingController.createParkingSpace)
router.put('/parking/spaces/:id', auth, parkingController.updateParkingSpace)
router.delete('/parking/spaces/:id', auth, parkingController.deleteParkingSpace)
router.post('/parking/spaces/batch', auth, parkingController.batchCreateParkingSpaces)
router.get('/parking/lots/:id/stats', auth, parkingController.getParkingLotStats)

// 与微信小程序后端同步的路由
router.post('/parking/lots/:id/sync-from-miniprogram', auth, parkingController.syncParkingSpacesFromMiniprogram)
router.post('/parking/lots/:id/sync-to-miniprogram', auth, parkingController.syncParkingSpacesToMiniprogram)
router.put('/parking/spaces/:id/status-with-sync', auth, parkingController.updateParkingSpaceStatusWithSync)

// 地图管理路由
router.get('/map/nodes', auth, mapController.getMapNodes)
router.get('/map/nodes/:id', auth, mapController.getMapNode)
router.post('/map/nodes', auth, mapController.createMapNode)
router.put('/map/nodes/:id', auth, mapController.updateMapNode)
router.delete('/map/nodes/:id', auth, mapController.deleteMapNode)
router.post('/map/nodes/batch', auth, mapController.batchCreateMapNodes)
router.get('/map/lots/:id/floors/:floor/nodes', auth, mapController.getParkingLotFloorNodes)
router.get('/map/nodes/:id/connections', auth, mapController.getNodeConnections)
router.post('/map/nodes/:id/connections', auth, mapController.updateNodeConnections)
router.get('/map/lots/:id/floors', auth, mapController.getParkingLotFloors)
router.get('/map/lots/:id/floors/:floor/data', auth, mapController.getFloorMapData)

// 导航路径管理路由
router.get('/navigation/paths', auth, navigationController.getNavigationPaths)
router.get('/navigation/paths/:id', auth, navigationController.getNavigationPath)
router.post('/navigation/paths', auth, navigationController.createNavigationPath)
router.put('/navigation/paths/:id', auth, navigationController.updateNavigationPath)
router.delete('/navigation/paths/:id', auth, navigationController.deleteNavigationPath)
router.get('/navigation/lots/:id/paths', auth, navigationController.getLotNavigationPaths)
router.post('/navigation/calculate-path', auth, navigationController.calculateNavigationPath)
router.post('/navigation/entrance-to-space', auth, navigationController.getNavigationToParkingSpace)
router.post('/navigation/save-path', auth, navigationController.saveNavigationPath)

// 数据模拟路由
router.post('/simulation/space/:id/status', auth, simulationController.simulateParkingSpaceStatus)
router.post('/simulation/batch-status', auth, simulationController.batchSimulateStatus)
router.post('/simulation/random-status', auth, simulationController.simulateRandomStatus)
router.get('/simulation/history', auth, simulationController.getSimulationHistory)
router.post('/simulation/reset', auth, simulationController.resetSimulation)
router.post('/simulation/real-time/start', auth, simulationController.startRealTimeSimulation)
router.post('/simulation/real-time/stop', auth, simulationController.stopRealTimeSimulation)

// 财务管理路由
router.get('/finance/transactions', auth, financeController.getTransactions)
router.get('/finance/transactions/:id', auth, financeController.getTransaction)
router.post('/finance/transactions', auth, financeController.createTransaction)
router.put('/finance/transactions/:id', auth, financeController.updateTransaction)
router.delete('/finance/transactions/:id', auth, financeController.deleteTransaction)
router.get('/finance/revenue/stats', auth, financeController.getRevenueStats)
router.post('/finance/calculate-fee', auth, financeController.calculateParkingFee)
router.get('/finance/billing-rules', auth, financeController.getBillingRules)
router.get('/finance/billing-rules/:id', auth, financeController.getBillingRule)
router.post('/finance/billing-rules', auth, financeController.createBillingRule)
router.put('/finance/billing-rules/:id', auth, financeController.updateBillingRule)
router.delete('/finance/billing-rules/:id', auth, financeController.deleteBillingRule)

// 数据分析路由
router.get('/analytics/reports', auth, analyticsController.getAnalyticsReports)
router.get('/analytics/reports/:id', auth, analyticsController.getAnalyticsReport)
router.post('/analytics/reports', auth, analyticsController.createAnalyticsReport)
router.put('/analytics/reports/:id', auth, analyticsController.updateAnalyticsReport)
router.delete('/analytics/reports/:id', auth, analyticsController.deleteAnalyticsReport)
router.post('/analytics/occupancy-report', auth, analyticsController.generateOccupancyReport)
router.post('/analytics/revenue-report', auth, analyticsController.generateRevenueReport)
router.get('/analytics/real-time-stats', auth, analyticsController.getRealTimeStats)

// 系统管理路由
router.get('/system/configs', auth, systemController.getSystemConfigs)
router.get('/system/configs/:id', auth, systemController.getSystemConfig)
router.post('/system/configs', auth, systemController.createSystemConfig)
router.put('/system/configs/:id', auth, systemController.updateSystemConfig)
router.delete('/system/configs/:id', auth, systemController.deleteSystemConfig)
router.put('/system/configs/batch', auth, systemController.batchUpdateSystemConfigs)
router.get('/system/info', auth, systemController.getSystemInfo)
router.get('/system/logs', auth, systemController.getSystemLogs)
router.post('/system/backup', auth, systemController.backupDatabase)
router.post('/system/restore', auth, systemController.restoreDatabase)
router.post('/system/clear-cache', auth, systemController.clearCache)

module.exports = router