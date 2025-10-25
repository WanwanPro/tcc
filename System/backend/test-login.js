const axios = require('axios');

async function testLogin() {
  try {
    console.log('测试登录API...');
    
    const response = await axios.post('http://localhost:3000/api/admin/auth/login', {
      username: 'admin',
      password: '123456'
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('登录成功!');
    console.log('响应数据:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('登录失败:', error.response?.data || error.message);
  }
}

testLogin();