import { defineStore } from 'pinia'
import { login, logout, getInfo } from '@/api/user'

export const useUserStore = defineStore('user', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    name: '',
    avatar: '',
    roles: [],
    permissions: []
  }),

  getters: {
    isLoggedIn: (state) => !!state.token,
    hasRole: (state) => (role) => state.roles.includes(role),
    hasPermission: (state) => (permission) => state.permissions.includes(permission)
  },

  actions: {
    // 登录
    async login(loginForm) {
      try {
        const response = await login(loginForm)
        // 处理不同的响应格式
        const token = response.data?.token || response.token
        if (!token) {
          throw new Error('登录响应中缺少token')
        }
        
        this.token = token
        localStorage.setItem('token', token)
        return response
      } catch (error) {
        // 清除可能已存储的无效token
        this.token = ''
        localStorage.removeItem('token')
        throw error
      }
    },

    // 获取用户信息
    async getInfo() {
      try {
        const response = await getInfo()
        // 处理不同的响应格式
        const userData = response.data || response
        const { name, avatar, roles, permissions } = userData
        
        this.name = name || ''
        this.avatar = avatar || ''
        this.roles = roles || []
        this.permissions = permissions || []
        
        return userData
      } catch (error) {
        // 如果获取用户信息失败，可能是token无效，清除登录状态
        this.resetState()
        throw error
      }
    },

    // 登出
    async logout() {
      try {
        await logout()
        this.token = ''
        this.name = ''
        this.avatar = ''
        this.roles = []
        this.permissions = []
        localStorage.removeItem('token')
      } catch (error) {
        throw error
      }
    },

    // 重置状态
    resetState() {
      this.token = ''
      this.name = ''
      this.avatar = ''
      this.roles = []
      this.permissions = []
      localStorage.removeItem('token')
    }
  }
})