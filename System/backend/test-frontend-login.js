const axios = require('axios');

// 模拟前端登录请求
async function testFrontendLogin() {
  try {
    console.log('测试前端登录流程...');
    
    // 1. 发送登录请求
    const loginResponse = await axios.post('http://localhost:3000/api/admin/auth/login', {
      username: 'admin',
      password: '123456'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录成功!');
    console.log('登录响应:', JSON.stringify(loginResponse.data, null, 2));
    
    // 2. 获取token
    const token = loginResponse.data.data.token;
    console.log('获取到token:', token.substring(0, 50) + '...');
    
    // 3. 使用token获取用户信息
    const infoResponse = await axios.get('http://localhost:3000/api/admin/auth/info', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取用户信息成功!');
    console.log('用户信息:', JSON.stringify(infoResponse.data, null, 2));
    
    // 4. 测试获取车位数据
    const parkingResponse = await axios.get('http://localhost:3000/api/admin/parking/spaces?limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('获取车位数据成功!');
    console.log('车位数据:', JSON.stringify(parkingResponse.data, null, 2));
    
  } catch (error) {
    console.error('测试失败:', error.response?.data || error.message);
  }
}

testFrontendLogin();