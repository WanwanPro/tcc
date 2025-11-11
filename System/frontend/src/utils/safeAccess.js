/**
 * 安全数据访问辅助函数
 */

/**
 * 安全地访问对象属性，防止undefined错误
 * @param {Object} obj - 要访问的对象
 * @param {String} path - 属性路径，如 'a.b.c'
 * @param {*} defaultValue - 默认值
 * @returns {*} 属性值或默认值
 */
export function safeGet(obj, path, defaultValue = null) {
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
 * 安全地访问数组元素，防止undefined错误
 * @param {Array} arr - 要访问的数组
 * @param {Number} index - 索引
 * @param {*} defaultValue - 默认值
 * @returns {*} 数组元素或默认值
 */
export function safeGetArray(arr, index, defaultValue = null) {
  if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
    return defaultValue
  }
  
  return arr[index]
}

/**
 * 安全地执行函数，防止函数执行错误
 * @param {Function} fn - 要执行的函数
 * @param {*} defaultReturn - 函数出错时的返回值
 * @param {...*} args - 函数参数
 * @returns {*} 函数返回值或默认值
 */
export function safeCall(fn, defaultReturn = null, ...args) {
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

/**
 * 安全地格式化日期，防止日期格式化错误
 * @param {Date|String|Number} date - 日期对象或时间戳
 * @param {String} format - 格式化字符串
 * @param {String} defaultValue - 默认值
 * @returns {String} 格式化后的日期字符串或默认值
 */
export function safeFormatDate(date, format = 'YYYY-MM-DD HH:mm:ss', defaultValue = '-') {
  try {
    if (!date) return defaultValue
    
    const dateObj = new Date(date)
    if (isNaN(dateObj.getTime())) return defaultValue
    
    const year = dateObj.getFullYear()
    const month = String(dateObj.getMonth() + 1).padStart(2, '0')
    const day = String(dateObj.getDate()).padStart(2, '0')
    const hours = String(dateObj.getHours()).padStart(2, '0')
    const minutes = String(dateObj.getMinutes()).padStart(2, '0')
    const seconds = String(dateObj.getSeconds()).padStart(2, '0')
    
    return format
      .replace('YYYY', year)
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hours)
      .replace('mm', minutes)
      .replace('ss', seconds)
  } catch (error) {
    console.error('日期格式化错误:', error)
    return defaultValue
  }
}

/**
 * 安全地格式化数字，防止数字格式化错误
 * @param {Number|String} num - 数字
 * @param {Number} decimals - 小数位数
 * @param {String} defaultValue - 默认值
 * @returns {String} 格式化后的数字字符串或默认值
 */
export function safeFormatNumber(num, decimals = 2, defaultValue = '0') {
  try {
    if (num === null || num === undefined || num === '') return defaultValue
    
    const number = Number(num)
    if (isNaN(number)) return defaultValue
    
    return number.toFixed(decimals)
  } catch (error) {
    console.error('数字格式化错误:', error)
    return defaultValue
  }
}

/**
 * 安全地转换数字，防止转换错误
 * @param {*} value - 要转换的值
 * @param {Number} defaultValue - 默认值
 * @returns {Number} 转换后的数字或默认值
 */
export function safeParseNumber(value, defaultValue = 0) {
  try {
    if (value === null || value === undefined || value === '') return defaultValue
    
    const number = Number(value)
    return isNaN(number) ? defaultValue : number
  } catch (error) {
    console.error('数字转换错误:', error)
    return defaultValue
  }
}

/**
 * 安全地转换布尔值，防止转换错误
 * @param {*} value - 要转换的值
 * @param {Boolean} defaultValue - 默认值
 * @returns {Boolean} 转换后的布尔值或默认值
 */
export function safeParseBoolean(value, defaultValue = false) {
  try {
    if (value === null || value === undefined) return defaultValue
    
    if (typeof value === 'boolean') return value
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase()
      return lowerValue === 'true' || lowerValue === '1' || lowerValue === 'yes'
    }
    if (typeof value === 'number') return value !== 0
    
    return Boolean(value)
  } catch (error) {
    console.error('布尔值转换错误:', error)
    return defaultValue
  }
}

/**
 * 安全地获取枚举值，防止枚举访问错误
 * @param {Object} enumObj - 枚举对象
 * @param {String} key - 枚举键
 * @param {*} defaultValue - 默认值
 * @returns {*} 枚举值或默认值
 */
export function safeGetEnum(enumObj, key, defaultValue = null) {
  try {
    if (!enumObj || typeof enumObj !== 'object') return defaultValue
    if (key === null || key === undefined || key === '') return defaultValue
    
    return enumObj[key] ?? defaultValue
  } catch (error) {
    console.error('枚举访问错误:', error)
    return defaultValue
  }
}