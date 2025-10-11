import axios from 'axios'
import { ElMessage } from 'element-plus'

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
    
    // 如果返回的状态码为200，说明接口请求成功，可以正常拿到数据
    if (res.code === 200 || res.success === true) {
      return res
    } else {
      // 否则的话抛出错误
      ElMessage.error(res.message || '系统错误')
      return Promise.reject(new Error(res.message || '系统错误'))
    }
  },
  error => {
    // 对响应错误做点什么
    console.log('err' + error)
    
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // 未登录或token过期
          const errorMessage = error.response.data?.message || '登录已过期，请重新登录'
          ElMessage.error(errorMessage)
          localStorage.removeItem('token')
          // 只有在当前不是登录页面时才跳转
          if (window.location.pathname !== '/login') {
            window.location.href = '/login'
          }
          break
        case 403:
          // 权限不足
          ElMessage.error('权限不足')
          break
        case 500:
          // 服务器错误
          ElMessage.error('服务器错误')
          break
        default:
          ElMessage.error('网络错误')
      }
    } else {
      ElMessage.error('网络连接失败')
    }
    
    return Promise.reject(error)
  }
)

export default service