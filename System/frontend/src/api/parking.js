import request from '@/utils/request'

// 停车场管理API
export function getParkingLots(params) {
  return request({
    url: '/admin/parking-lots',
    method: 'get',
    params
  })
}

export function getParkingLot(id) {
  return request({
    url: `/admin/parking-lots/${id}`,
    method: 'get'
  })
}

export function createParkingLot(data) {
  return request({
    url: '/admin/parking-lots',
    method: 'post',
    data
  })
}

export function updateParkingLot(id, data) {
  return request({
    url: `/admin/parking-lots/${id}`,
    method: 'put',
    data
  })
}

export function deleteParkingLot(id) {
  return request({
    url: `/admin/parking-lots/${id}`,
    method: 'delete'
  })
}

export function getParkingLotStats(params) {
  return request({
    url: '/admin/parking-lots/stats/overview',
    method: 'get',
    params
  })
}

// 车位管理API
export function getParkingSpaces(params) {
  return request({
    url: '/admin/parking-spaces',
    method: 'get',
    params
  })
}

export function getParkingSpace(id) {
  return request({
    url: `/admin/parking-spaces/${id}`,
    method: 'get'
  })
}

export function createParkingSpace(data) {
  return request({
    url: '/admin/parking-spaces',
    method: 'post',
    data
  })
}

export function updateParkingSpace(id, data) {
  return request({
    url: `/admin/parking-spaces/${id}`,
    method: 'put',
    data
  })
}

export function deleteParkingSpace(id) {
  return request({
    url: `/admin/parking-spaces/${id}`,
    method: 'delete'
  })
}

export function releaseParkingSpace(id) {
  return request({
    url: `/admin/parking-spaces/${id}/release`,
    method: 'put'
  })
}

export function reserveParkingSpace(id, data) {
  return request({
    url: `/admin/parking-spaces/${id}/reserve`,
    method: 'put',
    data
  })
}

export function getParkingSpaceStats(params) {
  return request({
    url: '/admin/parking-spaces/stats/overview',
    method: 'get',
    params
  })
}

export function batchUpdateSpaceStatus(spaceIds, status) {
  return request({
    url: '/admin/parking-spaces/batch/status',
    method: 'put',
    data: {
      spaceIds,
      status
    }
  })
}

// 兼容旧页面中的命名
export function getAllParkingStats() {
  return request({
    url: '/admin/parking/stats',
    method: 'get'
  })
}

export function getParkingSpaceDetail(id) {
  return getParkingSpace(id)
}

// 重置所有车位状态
export function resetAllSpaces() {
  return request({
    url: '/admin/parking/spaces/reset',
    method: 'post'
  })
}

// 获取停车记录列表
export function getParkingRecords(params) {
  return request({
    url: '/admin/parking/records',
    method: 'get',
    params
  })
}

// 获取停车记录详情
export function getParkingRecordDetail(id) {
  return request({
    url: `/admin/parking/records/${id}`,
    method: 'get'
  })
}

// 结束停车记录
export function endParkingRecord(id, data) {
  return request({
    url: `/admin/parking/records/${id}/end`,
    method: 'post',
    data
  })
}

// 获取停车记录统计
export function getParkingRecordsStats(params) {
  return request({
    url: '/admin/parking/records/stats',
    method: 'get',
    params
  })
}

// 获取收费标准列表
export function getParkingFeeRules(params) {
  return request({
    url: '/admin/parking/fees',
    method: 'get',
    params
  })
}

// 创建收费标准
export function createParkingFeeRule(data) {
  return request({
    url: '/admin/parking/fees',
    method: 'post',
    data
  })
}

// 更新收费标准
export function updateParkingFeeRule(id, data) {
  return request({
    url: `/admin/parking/fees/${id}`,
    method: 'put',
    data
  })
}

// 删除收费标准
export function deleteParkingFeeRule(id) {
  return request({
    url: `/admin/parking/fees/${id}`,
    method: 'delete'
  })
}

// 获取停车统计数据
export function getParkingStatistics(params) {
  return request({
    url: '/admin/parking/statistics',
    method: 'get',
    params
  })
}

// 导出停车数据
export function exportParkingData(params) {
  return request({
    url: '/admin/parking/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}
