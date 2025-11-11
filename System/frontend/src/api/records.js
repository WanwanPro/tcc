import { request } from '@/utils/request'

/**
 * 获取停车记录列表
 * @param {Object} params - 查询参数
 * @param {number} params.page - 页码
 * @param {number} params.limit - 每页数量
 * @param {string} params.status - 状态筛选
 * @param {string} params.parkingLotId - 停车场ID
 * @param {string} params.vehicleNumber - 车牌号
 * @param {string} params.userId - 用户ID
 * @param {string} params.startDate - 开始日期
 * @param {string} params.endDate - 结束日期
 * @returns {Promise} 返回停车记录列表
 */
export function getParkingRecords(params = {}) {
  return request({
    url: '/admin/records/records',
    method: 'get',
    params
  })
}

/**
 * 获取单个停车记录详情
 * @param {string} id - 记录ID
 * @returns {Promise} 返回停车记录详情
 */
export function getParkingRecordById(id) {
  return request({
    url: `/admin/records/records/${id}`,
    method: 'get'
  })
}

/**
 * 创建停车记录
 * @param {Object} data - 停车记录数据
 * @param {string} data.vehicleNumber - 车牌号
 * @param {string} data.lotId - 停车场ID
 * @param {string} data.spaceId - 停车位ID
 * @param {string} data.userId - 用户ID
 * @param {string} data.entryTime - 入场时间
 * @param {string} data.exitTime - 出场时间
 * @param {string} data.paymentMethod - 支付方式
 * @param {number} data.amount - 金额
 * @param {string} data.pricingRule - 定价规则
 * @param {string} data.notes - 备注
 * @returns {Promise} 返回创建的停车记录
 */
export function createParkingRecord(data) {
  return request({
    url: '/admin/records/records',
    method: 'post',
    data
  })
}

/**
 * 更新停车记录
 * @param {string} id - 记录ID
 * @param {Object} data - 更新数据
 * @param {string} data.exitTime - 出场时间
 * @param {string} data.paymentStatus - 支付状态
 * @param {string} data.paymentMethod - 支付方式
 * @param {number} data.amount - 金额
 * @param {string} data.notes - 备注
 * @param {string} data.processedBy - 处理人
 * @returns {Promise} 返回更新后的停车记录
 */
export function updateParkingRecord(id, data) {
  return request({
    url: `/admin/records/records/${id}`,
    method: 'put',
    data
  })
}

/**
 * 删除停车记录
 * @param {string} id - 记录ID
 * @returns {Promise} 返回删除结果
 */
export function deleteParkingRecord(id) {
  return request({
    url: `/admin/records/records/${id}`,
    method: 'delete'
  })
}

/**
 * 获取停车统计数据
 * @param {Object} params - 查询参数
 * @param {string} params.period - 统计周期(today/week/month/year)
 * @param {string} params.parkingLotId - 停车场ID
 * @returns {Promise} 返回停车统计数据
 */
export function getParkingStatistics(params = {}) {
  return request({
    url: '/admin/records/statistics',
    method: 'get',
    params
  })
}

/**
 * 结算停车记录
 * @param {string} id - 记录ID
 * @param {Object} data - 结算数据
 * @param {string} data.paymentMethod - 支付方式
 * @returns {Promise} 返回结算结果
 */
export function checkoutParkingRecord(id, data) {
  return request({
    url: `/admin/records/records/${id}/checkout`,
    method: 'post',
    data
  })
}

/**
 * 导出停车记录
 * @param {Object} params - 查询参数
 * @param {string} params.format - 导出格式(excel/csv)
 * @param {Object} params.filter - 筛选条件
 * @returns {Promise} 返回导出结果
 */
export function exportParkingRecords(params = {}) {
  return request({
    url: '/admin/records/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}