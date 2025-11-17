// 测试登录功能的脚本
const axios = require('axios');

// 配置axios
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
  timeout: 10000
});

async function testLogin() {
  try {
    console.log('开始测试登录功能...');
    
    // 测试登录
    const loginResponse = await api.post('/admin/auth/login', {
      username: 'admin',
      password: '123456'
    });
    
    console.log('登录成功:', loginResponse.data);
    
    // 提取token
    const token = loginResponse.data.data.token;
    console.log('获取到token:', token);
    
    // 测试获取用户信息 - 使用 /info 端点
    const userInfoResponse = await api.get('/admin/auth/info', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取用户信息成功(/info):', userInfoResponse.data);
    
    // 测试获取用户信息 - 使用 /me 端点
    const meResponse = await api.get('/admin/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取用户信息成功(/me):', meResponse.data);
    
    console.log('所有测试通过！');
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

// 运行测试
testLogin();