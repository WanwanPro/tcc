// 测试前端登录和token处理
const axios = require('axios');

// 模拟localStorage
const localStorage = {
  data: {},
  setItem: function(key, value) {
    this.data[key] = value;
    console.log(`localStorage.setItem('${key}', '${value.substring(0, 50)}...')`);
  },
  getItem: function(key) {
    const value = this.data[key] || '';
    console.log(`localStorage.getItem('${key}'): ${value.substring(0, 50)}...`);
    return value;
  },
  removeItem: function(key) {
    delete this.data[key];
    console.log(`localStorage.removeItem('${key}')`);
  }
};

// 模拟前端请求拦截器
function createRequest() {
  const service = axios.create({
    baseURL: 'http://localhost:5002/api', // 使用前端代理
    timeout: 15000
  });

  // 请求拦截器 - 添加token
  service.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('添加Authorization头:', `Bearer ${token.substring(0, 50)}...`);
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器 - 处理错误
  service.interceptors.response.use(
    response => {
      const res = response.data;
      if (res.code === 200 || res.success === true) {
        return res;
      } else {
        throw new Error(res.message || '系统错误');
      }
    },
    error => {
      if (error.response && error.response.status === 401) {
        console.error('401错误 - 未授权，清除token');
        localStorage.removeItem('token');
      }
      throw error;
    }
  );

  return service;
}

// 模拟登录API
function login(data) {
  const request = createRequest();
  return request({
    url: '/admin/auth/login',
    method: 'post',
    data
  });
}

// 模拟获取用户信息API
function getInfo() {
  const request = createRequest();
  return request({
    url: '/admin/auth/info',
    method: 'get'
  });
}

// 测试登录流程
async function testLoginFlow() {
  try {
    console.log('=== 开始测试前端登录流程 ===');
    
    // 1. 清除可能存在的旧token
    localStorage.removeItem('token');
    
    // 2. 登录
    console.log('\n1. 执行登录...');
    const loginResponse = await login({
      username: 'admin',
      password: '123456'
    });
    
    console.log('登录成功:', loginResponse.message);
    
    // 3. 提取并存储token
    const token = loginResponse.data?.token || loginResponse.token;
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token已存储到localStorage');
    } else {
      throw new Error('登录响应中缺少token');
    }
    
    // 4. 使用token获取用户信息
    console.log('\n2. 使用token获取用户信息...');
    const infoResponse = await getInfo();
    console.log('获取用户信息成功:', infoResponse.data?.name);
    
    // 5. 验证token是否仍然存在
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      console.log('\n✅ Token存储验证成功');
    } else {
      console.log('\n❌ Token存储验证失败');
    }
    
    console.log('\n=== 前端登录流程测试完成 ===');
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

testLoginFlow();