import axios from 'axios'
import { ElMessage } from 'element-plus'
import ErrorHandler from './errorHandler'

// 创建axios实例
const service = axios.create({
  baseURL: '/api', // API的base_url
  timeout: 15000 // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  config => {
    // 在发送请求之前做些什么
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
      console.log('[Request] Token已添加到请求头:', token.substring(0, 20) + '...')
    } else {
      console.warn('[Request] 未找到token，请求可能失败')
    }
    return config
  },
  error => {
    // 对请求错误做些什么
    console.log(error)
    return Promise.reject(error)
  }
)

// response拦截器
service.interceptors.response.use(
  response => {
    // 对响应数据做点什么
    const res = response.data
    
    // 调试日志
    if (response.config.url && response.config.url.includes('/parking/spaces')) {
      console.log('[Request Interceptor] 车位列表API响应:', {
        url: response.config.url,
        status: response.status,
        success: res.success,
        hasData: !!res.data,
        dataKeys: res.data ? Object.keys(res.data) : [],
        spacesCount: res.data?.spaces?.length || res.data?.items?.length || 0
      })
    }
    
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    if (res.code === 200 || res.success === true) {
      return res
    } else {
      // 否则的话抛出错误
      const errorMessage = res.message || '系统错误'
      ElMessage.error(errorMessage)
      return Promise.reject(new Error(errorMessage))
    }
  },
  error => {
    // 使用ErrorHandler处理错误
    ErrorHandler.handleApiError(error, ElMessage)
    return Promise.reject(error)
  }
)

export default service