import request from '@/utils/request'

// 获取仪表盘数据
export function getDashboardData() {
  return request({
    url: '/admin/dashboard',
    method: 'get'
  })
}

// 获取车位列表
export function getParkingSpaces(params) {
  return request({
    url: '/admin/parking/spaces',
    method: 'get',
    params
  })
}

// 获取车位详情
export function getParkingSpaceDetail(id) {
  return request({
    url: `/admin/parking/spaces/${id}`,
    method: 'get'
  })
}

// 更新车位信息
export function updateParkingSpace(id, data) {
  return request({
    url: `/admin/parking/spaces/${id}`,
    method: 'put',
    data
  })
}

// 批量更新车位状态
export function batchUpdateSpaceStatus(data) {
  return request({
    url: '/admin/parking/spaces/batch-status',
    method: 'put',
    data
  })
}

// 获取车位使用统计
export function getParkingStatistics(params) {
  return request({
    url: '/admin/parking/statistics',
    method: 'get',
    params
  })
}

// 获取停车场列表
export function getParkingLots(params) {
  return request({
    url: '/admin/parking/lots',
    method: 'get',
    params
  })
}

// 获取停车场详情
export function getParkingLotDetail(id) {
  return request({
    url: `/admin/parking/lots/${id}`,
    method: 'get'
  })
}

// 创建停车场
export function createParkingLot(data) {
  return request({
    url: '/admin/parking/lots',
    method: 'post',
    data
  })
}

// 更新停车场信息
export function updateParkingLot(id, data) {
  return request({
    url: `/admin/parking/lots/${id}`,
    method: 'put',
    data
  })
}

// 获取地图节点
export function getMapNodes(params) {
  return request({
    url: '/admin/map/nodes',
    method: 'get',
    params
  })
}

// 创建地图节点
export function createMapNode(data) {
  return request({
    url: '/admin/map/nodes',
    method: 'post',
    data
  })
}

// 更新地图节点
export function updateMapNode(id, data) {
  return request({
    url: `/admin/map/nodes/${id}`,
    method: 'put',
    data
  })
}

// 删除地图节点
export function deleteMapNode(id) {
  return request({
    url: `/admin/map/nodes/${id}`,
    method: 'delete'
  })
}

// 获取导航路径
export function getNavigationPaths(params) {
  return request({
    url: '/admin/navigation/paths',
    method: 'get',
    params
  })
}

// 计算最优路径
export function calculateOptimalPath(data) {
  return request({
    url: '/admin/navigation/calculate',
    method: 'post',
    data
  })
}

// 启动车位状态模拟
export function startSpaceSimulation(data) {
  return request({
    url: '/admin/simulation/spaces/start',
    method: 'post',
    data
  })
}

// 停止车位状态模拟
export function stopSpaceSimulation() {
  return request({
    url: '/admin/simulation/spaces/stop',
    method: 'post'
  })
}

// 获取模拟数据
export function getSimulationData(params) {
  return request({
    url: '/admin/simulation/data',
    method: 'get',
    params
  })
}

// 清理模拟数据
export function clearSimulationData() {
  return request({
    url: '/admin/simulation/data',
    method: 'delete'
  })
}

// 获取收费标准
export function getPricingRules(params) {
  return request({
    url: '/admin/finance/pricing',
    method: 'get',
    params
  })
}

// 创建收费标准
export function createPricingRule(data) {
  return request({
    url: '/admin/finance/pricing',
    method: 'post',
    data
  })
}

// 更新收费标准
export function updatePricingRule(id, data) {
  return request({
    url: `/admin/finance/pricing/${id}`,
    method: 'put',
    data
  })
}

// 获取收入统计
export function getRevenueStatistics(params) {
  return request({
    url: '/admin/finance/revenue',
    method: 'get',
    params
  })
}

// 获取支付记录
export function getPaymentRecords(params) {
  return request({
    url: '/admin/finance/payments',
    method: 'get',
    params
  })
}

// 获取管理员列表
export function getAdminList(params) {
  return request({
    url: '/admin/system/admins',
    method: 'get',
    params
  })
}

// 创建管理员
export function createAdmin(data) {
  return request({
    url: '/admin/system/admins',
    method: 'post',
    data
  })
}

// 更新管理员
export function updateAdmin(id, data) {
  return request({
    url: `/admin/system/admins/${id}`,
    method: 'put',
    data
  })
}

// 获取角色列表
export function getRoleList() {
  return request({
    url: '/admin/system/roles',
    method: 'get'
  })
}

// 获取系统设置
export function getSystemSettings() {
  return request({
    url: '/admin/system/settings',
    method: 'get'
  })
}

// 更新系统设置
export function updateSystemSettings(data) {
  return request({
    url: '/admin/system/settings',
    method: 'put',
    data
  })
}

// 获取操作日志
export function getOperationLogs(params) {
  return request({
    url: '/admin/system/logs',
    method: 'get',
    params
  })
}

// 获取用户行为分析数据
export function getUserBehaviorAnalysis(params) {
  return request({
    url: '/admin/analytics/user-behavior',
    method: 'get',
    params
  })
}

// 获取车位使用分析数据
export function getParkingUsageAnalysis(params) {
  return request({
    url: '/admin/analytics/parking-usage',
    method: 'get',
    params
  })
}

// 获取流量预测数据
export function getTrafficForecast(params) {
  return request({
    url: '/admin/analytics/traffic-forecast',
    method: 'get',
    params
  })
}