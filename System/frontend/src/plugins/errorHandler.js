import { ElMessage } from 'element-plus'
import ErrorHandler from '@/utils/errorHandler'

/**
 * 全局错误处理插件
 */
const GlobalErrorHandler = {
  install(app) {
    // 全局错误处理
    app.config.errorHandler = (err, vm, info) => {
      console.error('全局错误:', err)
      console.error('错误组件:', vm)
      console.error('错误信息:', info)
      
      // 显示友好的错误消息
      ElMessage.error({
        message: '应用发生错误，请刷新页面重试',
        duration: 5000
      })
      
      // 可以在这里添加错误上报逻辑
      // reportError(err, vm, info)
    }
    
    // 全局警告处理
    app.config.warnHandler = (msg, vm, trace) => {
      console.warn('全局警告:', msg)
      console.warn('警告组件:', vm)
      console.warn('警告追踪:', trace)
    }
    
    // 提供全局错误处理方法
    app.config.globalProperties.$handleError = (error, customMessage) => {
      return ErrorHandler.handleApiError(error, ElMessage)
    }
    
    // 提供全局安全访问方法
    app.config.globalProperties.$safeGet = (obj, path, defaultValue) => {
      return ErrorHandler.safeGet(obj, path, defaultValue)
    }
    
    // 提供全局安全执行方法
    app.config.globalProperties.$safeCall = (fn, defaultReturn, ...args) => {
      return ErrorHandler.safeCall(fn, defaultReturn, ...args)
    }
    
    // 提供全局安全异步方法
    app.config.globalProperties.$safeAsync = async (promise) => {
      return ErrorHandler.safeAsync(promise, ElMessage)
    }
    
    // 添加全局方法，使模板中可以直接使用
    app.config.globalProperties.safeGet = (obj, path, defaultValue) => {
      return ErrorHandler.safeGet(obj, path, defaultValue)
    }
    
    app.config.globalProperties.safeGetArray = (arr, index, defaultValue) => {
      if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
        return defaultValue
      }
      return arr[index]
    }
  }
}

export default GlobalErrorHandler