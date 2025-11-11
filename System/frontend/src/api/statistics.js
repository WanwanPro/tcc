import request from '@/utils/request'

// 获取仪表盘统计数据
export function getDashboardStatistics(params) {
  return request({
    url: '/api/admin/statistics/dashboard',
    method: 'get',
    params
  })
}

// 获取用户统计数据
export function getUserStatistics(params) {
  return request({
    url: '/api/admin/statistics/users',
    method: 'get',
    params
  })
}

// 获取停车场统计数据
export function getParkingLotStatistics(params) {
  return request({
    url: '/api/admin/statistics/parking-lots',
    method: 'get',
    params
  })
}

// 获取车位统计数据
export function getParkingSpaceStatistics(params) {
  return request({
    url: '/api/admin/statistics/parking-spaces',
    method: 'get',
    params
  })
}

// 获取收入统计数据
export function getRevenueStatistics(params) {
  return request({
    url: '/api/admin/statistics/revenue',
    method: 'get',
    params
  })
}

// 获取用户增长趋势
export function getUserGrowthTrend(params) {
  return request({
    url: '/api/admin/statistics/user-growth',
    method: 'get',
    params
  })
}

// 获取停车记录统计
export function getParkingRecordStatistics(params) {
  return request({
    url: '/api/admin/statistics/parking-records',
    method: 'get',
    params
  })
}

// 获取热门停车场排行
export function getHotParkingLots(params) {
  return request({
    url: '/api/admin/statistics/hot-parking-lots',
    method: 'get',
    params
  })
}

// 获取停车场列表（用于统计）
export function getParkingLotsList(params) {
  return request({
    url: '/api/admin/parking-lots',
    method: 'get',
    params
  })
}

// 获取实时车位使用情况
export function getRealTimeSpaceUsage(params) {
  return request({
    url: '/api/admin/statistics/real-time-usage',
    method: 'get',
    params
  })
}

// 获取用户类型分布
export function getUserTypeDistribution(params) {
  return request({
    url: '/api/admin/statistics/user-type-distribution',
    method: 'get',
    params
  })
}

// 获取收入趋势
export function getRevenueTrend(params) {
  return request({
    url: '/api/admin/statistics/revenue-trend',
    method: 'get',
    params
  })
}

// 导出统计报表
export function exportStatisticsReport(params) {
  return request({
    url: '/api/admin/statistics/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}