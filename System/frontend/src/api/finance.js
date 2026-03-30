import request from '@/utils/request'

// 获取财务概览数据
export function getFinanceOverview(params) {
  return request({
    url: '/admin/finance/overview',
    method: 'get',
    params
  })
}

// 获取财务交易记录
export function getFinanceTransactions(params) {
  return request({
    url: '/admin/finance/transactions',
    method: 'get',
    params
  })
}

// 获取收入趋势数据
export function getRevenueTrend(params) {
  return request({
    url: '/admin/finance/revenue-trend',
    method: 'get',
    params
  })
}

// 获取收入分布数据
export function getRevenueDistribution(params) {
  return request({
    url: '/admin/finance/revenue-distribution',
    method: 'get',
    params
  })
}

// 获取支付方式分布数据
export function getPaymentMethodDistribution(params) {
  return request({
    url: '/admin/finance/payment-method-distribution',
    method: 'get',
    params
  })
}

// 获取支出数据
export function getExpenses(params) {
  return request({
    url: '/admin/finance/expenses',
    method: 'get',
    params
  })
}

// 创建支出记录
export function createExpense(data) {
  return request({
    url: '/admin/finance/expenses',
    method: 'post',
    data
  })
}

// 更新支出记录
export function updateExpense(id, data) {
  return request({
    url: `/admin/finance/expenses/${id}`,
    method: 'put',
    data
  })
}

// 删除支出记录
export function deleteExpense(id) {
  return request({
    url: `/admin/finance/expenses/${id}`,
    method: 'delete'
  })
}

// 获取财务报表
export function getFinanceReports(params) {
  return request({
    url: '/admin/finance/reports',
    method: 'get',
    params
  })
}

// 生成财务报表
export function generateFinanceReport(data) {
  return request({
    url: '/admin/finance/reports/generate',
    method: 'post',
    data
  })
}

// 导出财务报表
export function exportFinanceReport(params) {
  return request({
    url: '/admin/finance/reports/export',
    method: 'get',
    params,
    responseType: 'blob'
  })
}

// 获取财务设置
export function getFinanceSettings() {
  return request({
    url: '/admin/finance/settings',
    method: 'get'
  })
}

// 更新财务设置
export function updateFinanceSettings(data) {
  return request({
    url: '/admin/finance/settings',
    method: 'put',
    data
  })
}

// 获取财务统计
export function getFinanceStatistics(params) {
  return request({
    url: '/admin/finance/statistics',
    method: 'get',
    params
  })
}

// 获取月度财务报表
export function getMonthlyFinanceReport(params) {
  return request({
    url: '/admin/finance/monthly-report',
    method: 'get',
    params
  })
}

// 获取年度财务报表
export function getYearlyFinanceReport(params) {
  return request({
    url: '/admin/finance/yearly-report',
    method: 'get',
    params
  })
}

// 获取财务对比数据
export function getFinanceComparison(params) {
  return request({
    url: '/admin/finance/comparison',
    method: 'get',
    params
  })
}

// 获取财务预测数据
export function getFinanceForecast(params) {
  return request({
    url: '/admin/finance/forecast',
    method: 'get',
    params
  })
}

// 获取财务预警信息
export function getFinanceAlerts(params) {
  return request({
    url: '/admin/finance/alerts',
    method: 'get',
    params
  })
}

// 标记财务预警为已读
export function markFinanceAlertAsRead(id) {
  return request({
    url: `/admin/finance/alerts/${id}/read`,
    method: 'put'
  })
}

// 获取停车收入明细
export function getParkingRevenueDetails(params) {
  return request({
    url: '/admin/finance/parking-revenue-details',
    method: 'get',
    params
  })
}

// 获取会员收入明细
export function getMembershipRevenueDetails(params) {
  return request({
    url: '/admin/finance/membership-revenue-details',
    method: 'get',
    params
  })
}

// 获取其他收入明细
export function getOtherRevenueDetails(params) {
  return request({
    url: '/admin/finance/other-revenue-details',
    method: 'get',
    params
  })
}

// 获取退款记录
export function getRefundRecords(params) {
  return request({
    url: '/admin/finance/refunds',
    method: 'get',
    params
  })
}

// 处理退款申请
export function processRefund(id, data) {
  return request({
    url: `/admin/finance/refunds/${id}/process`,
    method: 'put',
    data
  })
}

// 获取发票信息
export function getInvoiceInfo(params) {
  return request({
    url: '/admin/finance/invoices',
    method: 'get',
    params
  })
}

// 生成发票
export function generateInvoice(data) {
  return request({
    url: '/admin/finance/invoices/generate',
    method: 'post',
    data
  })
}

// 获取财务审计日志
export function getFinanceAuditLogs(params) {
  return request({
    url: '/admin/finance/audit-logs',
    method: 'get',
    params
  })
}
