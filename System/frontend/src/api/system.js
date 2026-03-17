import request from '@/utils/request'

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

// 获取基础设置
export function getBasicSettings() {
  return request({
    url: '/admin/system/settings/basic',
    method: 'get'
  })
}

// 更新基础设置
export function updateBasicSettings(data) {
  return request({
    url: '/admin/system/settings/basic',
    method: 'put',
    data
  })
}

// 获取停车设置
export function getParkingSettings() {
  return request({
    url: '/admin/system/settings/parking',
    method: 'get'
  })
}

// 更新停车设置
export function updateParkingSettings(data) {
  return request({
    url: '/admin/system/settings/parking',
    method: 'put',
    data
  })
}

// 获取支付设置
export function getPaymentSettings() {
  return request({
    url: '/admin/system/settings/payment',
    method: 'get'
  })
}

// 更新支付设置
export function updatePaymentSettings(data) {
  return request({
    url: '/admin/system/settings/payment',
    method: 'put',
    data
  })
}

// 获取通知设置
export function getNotificationSettings() {
  return request({
    url: '/admin/system/settings/notification',
    method: 'get'
  })
}

// 更新通知设置
export function updateNotificationSettings(data) {
  return request({
    url: '/admin/system/settings/notification',
    method: 'put',
    data
  })
}

// 获取安全设置
export function getSecuritySettings() {
  return request({
    url: '/admin/system/settings/security',
    method: 'get'
  })
}

// 更新安全设置
export function updateSecuritySettings(data) {
  return request({
    url: '/admin/system/settings/security',
    method: 'put',
    data
  })
}

// 测试邮件配置
export function testEmailConfig(data) {
  return request({
    url: '/admin/system/settings/test-email',
    method: 'post',
    data
  })
}

// 测试短信配置
export function testSmsConfig(data) {
  return request({
    url: '/admin/system/settings/test-sms',
    method: 'post',
    data
  })
}

// 重置系统设置
export function resetSystemSettings() {
  return request({
    url: '/admin/system/settings/reset',
    method: 'post'
  })
}

// 导出系统设置
export function exportSystemSettings() {
  return request({
    url: '/admin/system/settings/export',
    method: 'get',
    responseType: 'blob'
  })
}

// 导入系统设置
export function importSystemSettings(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/admin/system/settings/import',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

// 获取系统信息
export function getSystemInfo() {
  return request({
    url: '/admin/system/info',
    method: 'get'
  })
}

// 获取系统日志
export function getSystemLogs(params) {
  return request({
    url: '/admin/system/logs',
    method: 'get',
    params
  })
}

// 清空系统日志
export function clearSystemLogs() {
  return request({
    url: '/admin/system/logs',
    method: 'delete'
  })
}

// 备份系统数据
export function backupSystem() {
  return request({
    url: '/admin/system/backup',
    method: 'post',
    responseType: 'blob'
  })
}

// 恢复系统数据
export function restoreSystem(file) {
  const formData = new FormData()
  formData.append('file', file)
  
  return request({
    url: '/admin/system/restore',
    method: 'post',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
