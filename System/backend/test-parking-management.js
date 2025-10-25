// 测试车位管理页面数据获取功能
const axios = require('axios');

// 模拟localStorage
const localStorage = {
  data: {},
  setItem: function(key, value) {
    this.data[key] = value;
  },
  getItem: function(key) {
    return this.data[key] || '';
  }
};

// 创建带认证的请求实例
function createAuthenticatedRequest() {
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
      }
      return config;
    },
    error => {
      return Promise.reject(error);
    }
  );

  return service;
}

// 先登录获取token
async function loginAndGetToken() {
  try {
    console.log('登录获取token...');
    const response = await axios.post('http://localhost:5002/api/admin/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    const token = response.data.data.token;
    localStorage.setItem('token', token);
    console.log('Token获取成功');
    return token;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试车位管理API
async function testParkingManagementAPIs() {
  const request = createAuthenticatedRequest();
  
  try {
    console.log('\n=== 测试车位管理API ===');
    
    // 1. 获取车位列表
    console.log('\n1. 获取车位列表...');
    const spacesResponse = await request({
      url: '/admin/parking/spaces',
      method: 'get',
      params: { limit: 10, page: 1 }
    });
    console.log('获取车位列表成功，总数:', spacesResponse.data?.data?.pagination?.total || '未知');
    console.log('响应结构:', JSON.stringify(spacesResponse.data, null, 2).substring(0, 300) + '...');
    
    // 2. 获取车位详情
    if (spacesResponse.data && spacesResponse.data.data && spacesResponse.data.data.spaces && spacesResponse.data.data.spaces.length > 0) {
      const spaceId = spacesResponse.data.data.spaces[0]._id;
      console.log('\n2. 获取车位详情...');
      const detailResponse = await request({
        url: `/admin/parking/spaces/${spaceId}`,
        method: 'get'
      });
      console.log('获取车位详情成功，车位号:', detailResponse.data?.data?.spaceNumber);
    }
    
    // 3. 获取停车场列表
    console.log('\n3. 获取停车场列表...');
    const lotsResponse = await request({
      url: '/admin/parking/lots',
      method: 'get',
      params: { limit: 10 }
    });
    console.log('获取停车场列表成功，总数:', lotsResponse.data?.data?.pagination?.total || '未知');
    
    // 4. 获取停车场统计数据
    console.log('\n4. 获取停车场统计数据...');
    if (lotsResponse.data && lotsResponse.data.data && lotsResponse.data.data.lots && lotsResponse.data.data.lots.length > 0) {
      const lotId = lotsResponse.data.data.lots[0]._id;
      const statsResponse = await request({
        url: `/admin/parking/stats/${lotId}`,
        method: 'get'
      });
      console.log('获取停车场统计数据成功，总车位:', statsResponse.data?.data?.totalSpaces);
    } else {
      console.log('没有可用的停车场数据，跳过统计测试');
    }
    
    // 5. 获取地图节点
    console.log('\n5. 获取地图节点...');
    const mapNodesResponse = await request({
      url: '/admin/map',
      method: 'get',
      params: { limit: 10 }
    });
    console.log('获取地图节点成功，总数:', mapNodesResponse.data?.data?.pagination?.total || '未知');
    
    // 6. 获取导航路径
    console.log('\n6. 获取导航路径...');
    const navPathsResponse = await request({
      url: '/admin/navigation',
      method: 'get',
      params: { limit: 10 }
    });
    console.log('获取导航路径成功，总数:', navPathsResponse.data?.data?.pagination?.total || '未知');
    
    console.log('\n✅ 车位管理页面数据获取功能测试通过');
    
  } catch (error) {
    console.error('❌ 车位管理API测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
async function runTests() {
  try {
    await loginAndGetToken();
    await testParkingManagementAPIs();
    console.log('\n=== 所有测试完成 ===');
  } catch (error) {
    console.error('测试流程失败:', error.message);
  }
}

runTests();