import request from '@/utils/request'

// 用户认证相关API
export function login(data) {
  return request({
    url: '/admin/auth/login',
    method: 'post',
    data
  })
}

export function getInfo() {
  return request({
    url: '/admin/auth/info',
    method: 'get'
  })
}

export function logout() {
  return request({
    url: '/admin/auth/logout',
    method: 'post'
  })
}

export function changePassword(data) {
  return request({
    url: '/admin/auth/change-password',
    method: 'put',
    data
  })
}

export function updateProfile(data) {
  return request({
    url: '/auth/profile',
    method: 'put',
    data
  })
}

// 用户管理相关API
export function getUserList(params) {
  return request({
    url: '/admin/users/users',
    method: 'get',
    params
  })
}

export function getUserDetail(id) {
  return request({
    url: `/admin/users/users/${id}`,
    method: 'get'
  })
}

export function createUser(data) {
  return request({
    url: '/admin/users/users',
    method: 'post',
    data
  })
}

export function updateUser(id, data) {
  return request({
    url: `/admin/users/users/${id}`,
    method: 'put',
    data
  })
}

export function deleteUser(id) {
  return request({
    url: `/admin/users/users/${id}`,
    method: 'delete'
  })
}

export function resetUserPassword(id, data) {
  return request({
    url: `/admin/users/users/${id}/password`,
    method: 'put',
    data
  })
}

export function updateUserStatus(id, data) {
  return request({
    url: `/admin/users/users/${id}/status`,
    method: 'put',
    data
  })
}

// 角色管理相关API
export function getRolesList() {
  return request({
    url: '/admin/users/roles',
    method: 'get'
  })
}

export function createRole(data) {
  return request({
    url: '/admin/users/roles',
    method: 'post',
    data
  })
}

export function updateRole(id, data) {
  return request({
    url: `/admin/users/roles/${id}`,
    method: 'put',
    data
  })
}

export function deleteRole(id) {
  return request({
    url: `/admin/users/roles/${id}`,
    method: 'delete'
  })
}

// 黑名单管理相关API
export function getBlacklist(params) {
  return request({
    url: '/admin/users/blacklist',
    method: 'get',
    params
  })
}

export function addToBlacklist(data) {
  return request({
    url: '/admin/users/blacklist',
    method: 'post',
    data
  })
}

export function removeFromBlacklist(id) {
  return request({
    url: `/admin/users/blacklist/${id}`,
    method: 'delete'
  })
}
