const axios = require('axios');

// 模拟localStorage
const localStorage = {
  data: {},
  getItem: function(key) {
    return this.data[key] || null;
  },
  setItem: function(key, value) {
    this.data[key] = value;
  },
  removeItem: function(key) {
    delete this.data[key];
  }
};

// 创建axios实例
const createApiClient = () => {
  const client = axios.create({
    baseURL: 'http://localhost:3000/api',
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // 请求拦截器 - 添加token
  client.interceptors.request.use(
    config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    error => Promise.reject(error)
  );

  // 响应拦截器 - 处理错误
  client.interceptors.response.use(
    response => response.data,
    error => {
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        console.log('Token已过期，已清除');
      }
      return Promise.reject(error);
    }
  );

  return client;
};

// 测试函数
const testParkingManagement = async () => {
  const api = createApiClient();
  
  try {
    // 1. 登录获取token
    console.log('登录获取token...');
    const loginResponse = await api.post('/admin/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = loginResponse.data.token;
    localStorage.setItem('token', token);
    console.log('Token获取成功');
    
    // 2. 获取车位列表
    console.log('\n1. 获取车位列表...');
    const spacesResponse = await api.get('/admin/parking/spaces', {
      params: { limit: 10, page: 1 }
    });
    console.log('获取车位列表成功');
    console.log('响应数据:', JSON.stringify(spacesResponse, null, 2).substring(0, 500) + '...');
    
    // 3. 获取停车场列表
    console.log('\n2. 获取停车场列表...');
    const lotsResponse = await api.get('/admin/parking/lots', {
      params: { limit: 10 }
    });
    console.log('获取停车场列表成功');
    console.log('响应数据:', JSON.stringify(lotsResponse, null, 2).substring(0, 500) + '...');
    
    console.log('\n✅ 车位管理页面数据获取功能测试通过');
  } catch (error) {
    console.error('❌ 车位管理API测试失败:', error.response?.data || error.message);
  }
};

// 运行测试
testParkingManagement().then(() => {
  console.log('\n=== 所有测试完成 ===');
  process.exit(0);
}).catch(error => {
  console.error('测试流程失败:', error.message);
  process.exit(1);
});