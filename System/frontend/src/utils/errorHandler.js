/**
 * 全局错误处理工具
 */

// 错误类型枚举
export const ErrorTypes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR: 'AUTHORIZATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

// 错误消息映射
const ErrorMessages = {
  [ErrorTypes.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorTypes.API_ERROR]: '服务器请求失败，请稍后重试',
  [ErrorTypes.VALIDATION_ERROR]: '输入数据验证失败，请检查输入内容',
  [ErrorTypes.AUTHENTICATION_ERROR]: '身份验证失败，请重新登录',
  [ErrorTypes.AUTHORIZATION_ERROR]: '权限不足，无法执行此操作',
  [ErrorTypes.UNKNOWN_ERROR]: '未知错误，请联系管理员'
}

/**
 * 错误处理类
 */
class ErrorHandler {
  /**
   * 处理认证错误
   */
  static handleAuthenticationError() {
    // 清除本地存储的token
    localStorage.removeItem('token')
    
    // 重定向到登录页面
    if (window.location.pathname !== '/login') {
      window.location.href = '/login'
    }
  }
  
  /**
   * 处理API错误
   * @param {Object} error - 错误对象
   * @param {Function} showMessage - 显示消息的函数
   * @returns {Object} 处理后的错误对象
   */
  static handleApiError(error, showMessage) {
    let errorType = ErrorTypes.UNKNOWN_ERROR
    let message = ErrorMessages[ErrorTypes.UNKNOWN_ERROR]
    
    if (!error) {
      errorType = ErrorTypes.UNKNOWN_ERROR
      message = '发生未知错误'
    } else if (error.response) {
      // 服务器返回了错误状态码
      const status = error.response.status
      
      if (status === 401) {
        errorType = ErrorTypes.AUTHENTICATION_ERROR
        message = '登录已过期，请重新登录'
        // 执行登出逻辑
        this.handleAuthenticationError()
      } else if (status === 403) {
        errorType = ErrorTypes.AUTHORIZATION_ERROR
        message = '权限不足，无法执行此操作'
      } else if (status >= 400 && status < 500) {
        errorType = ErrorTypes.VALIDATION_ERROR
        message = error.response.data?.message || '请求参数错误'
      } else if (status >= 500) {
        errorType = ErrorTypes.API_ERROR
        message = '服务器内部错误，请稍后重试'
      }
    } else if (error.request) {
      // 请求已发出但没有收到响应
      errorType = ErrorTypes.NETWORK_ERROR
      message = '网络连接失败，请检查网络设置'
    } else {
      // 其他错误
      errorType = ErrorTypes.UNKNOWN_ERROR
      message = error.message || '未知错误'
    }
    
    // 显示错误消息
    if (showMessage && typeof showMessage === 'function') {
      showMessage({
        type: 'error',
        message: message
      })
    }
    
    // 记录错误日志
    console.error('API错误:', error)
    
    // 返回处理后的错误对象
    return {
      type: errorType,
      message: message,
      originalError: error
    }
  }
  
  /**
   * 安全地执行异步操作
   * @param {Promise} promise - 要执行的Promise
   * @param {Function} showError - 显示错误的函数
   * @returns {Promise} 包含data或error的对象
   */
  static async safeAsync(promise, showError) {
    try {
      const data = await promise
      return { data, error: null }
    } catch (error) {
      const handledError = this.handleApiError(error, showError)
      return { data: null, error: handledError }
    }
  }
  
  /**
   * 安全地访问对象属性
   * @param {Object} obj - 要访问的对象
   * @param {String} path - 属性路径，如 'a.b.c'
   * @param {*} defaultValue - 默认值
   * @returns {*} 属性值或默认值
   */
  static safeGet(obj, path, defaultValue = null) {
    if (!obj || typeof obj !== 'object') {
      return defaultValue
    }
    
    const keys = path.split('.')
    let result = obj
    
    for (const key of keys) {
      if (result && typeof result === 'object' && key in result) {
        result = result[key]
      } else {
        return defaultValue
      }
    }
    
    return result
  }
  
  /**
   * 安全地执行函数
   * @param {Function} fn - 要执行的函数
   * @param {*} defaultReturn - 函数出错时的返回值
   * @param {...*} args - 函数参数
   * @returns {*} 函数返回值或默认值
   */
  static safeCall(fn, defaultReturn = null, ...args) {
    try {
      if (typeof fn === 'function') {
        return fn(...args)
      }
      return defaultReturn
    } catch (error) {
      console.error('函数执行错误:', error)
      return defaultReturn
    }
  }
}

export default ErrorHandler