const axios = require('axios');

// 配置
const BASE_URL = 'http://localhost:3000/api/admin';

// 登录获取token
async function login() {
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      username: 'admin',
      password: 'admin123'
    });
    
    return response.data.data.token;
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
    throw error;
  }
}

// 测试导航路径API
async function testNavigationPathsAPI(token) {
  try {
    console.log('\n=== 测试导航路径API ===');
    
    // 设置请求头
    const headers = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    
    // 1. 获取导航路径列表
    console.log('\n1. 获取导航路径列表...');
    try {
      const response = await axios.get(`${BASE_URL}/navigation?limit=10`, { headers });
      console.log('✅ 获取导航路径成功，总数:', response.data?.data?.pagination?.total || '未知');
      console.log('响应结构:', JSON.stringify(response.data, null, 2));
    } catch (error) {
      console.error('❌ 获取导航路径失败:', error.response?.data || error.message);
      if (error.response?.data?.error) {
        console.error('错误详情:', error.response.data.error);
      }
    }
    
  } catch (error) {
    console.error('测试失败:', error.message);
  }
}

// 主函数
async function main() {
  try {
    console.log('登录获取token...');
    const token = await login();
    console.log('Token获取成功');
    
    await testNavigationPathsAPI(token);
    
    console.log('\n=== 所有测试完成 ===');
  } catch (error) {
    console.error('测试流程失败:', error.message);
  }
}

// 运行测试
main();