import request from '@/utils/request'

// 用户登录
export function login(data) {
  return request({
    url: '/admin/auth/login',
    method: 'post',
    data
  })
}

// 获取用户信息
export function getInfo() {
  return request({
    url: '/admin/auth/info',
    method: 'get'
  })
}

// 用户登出
export function logout() {
  return request({
    url: '/admin/auth/logout',
    method: 'post'
  })
}

// 获取用户列表
export function getUserList(params) {
  return request({
    url: '/admin/users',
    method: 'get',
    params
  })
}

// 获取用户详情
export function getUserDetail(id) {
  return request({
    url: `/admin/users/${id}`,
    method: 'get'
  })
}

// 更新用户状态
export function updateUserStatus(id, status) {
  return request({
    url: `/admin/users/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取黑名单
export function getBlacklist(params) {
  return request({
    url: '/admin/users/blacklist',
    method: 'get',
    params
  })
}

// 添加黑名单
export function addToBlacklist(data) {
  return request({
    url: '/admin/users/blacklist',
    method: 'post',
    data
  })
}

// 移除黑名单
export function removeFromBlacklist(id) {
  return request({
    url: `/admin/users/blacklist/${id}`,
    method: 'delete'
  })
}