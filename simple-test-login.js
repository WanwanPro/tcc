// 简单的登录测试脚本，不依赖外部模块
const http = require('http');

// 发送HTTP请求的函数
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const response = {
            statusCode: res.statusCode,
            headers: res.headers,
            data: JSON.parse(body)
          };
          resolve(response);
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// 测试登录功能
async function testLogin() {
  try {
    console.log('开始测试登录功能...');
    
    // 测试登录
    const loginOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const loginData = {
      username: 'admin',
      password: '123456'
    };
    
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (loginResponse.statusCode === 200 && loginResponse.data.success) {
      console.log('登录成功:', loginResponse.data);
      
      // 提取token
      const token = loginResponse.data.data.token;
      console.log('获取到token:', token ? '成功' : '失败');
      
      if (token) {
        // 测试获取用户信息 - 使用 /info 端点
        const infoOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/admin/auth/info',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        try {
          const infoResponse = await makeRequest(infoOptions);
          console.log('获取用户信息(/info)状态:', infoResponse.statusCode === 200 ? '成功' : '失败');
        } catch (infoError) {
          console.log('获取用户信息(/info)失败:', infoError.message);
        }
        
        // 测试获取用户信息 - 使用 /me 端点
        const meOptions = {
          hostname: 'localhost',
          port: 5000,
          path: '/api/admin/auth/me',
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        };
        
        try {
          const meResponse = await makeRequest(meOptions);
          console.log('获取用户信息(/me)状态:', meResponse.statusCode === 200 ? '成功' : '失败');
        } catch (meError) {
          console.log('获取用户信息(/me)失败:', meError.message);
        }
      }
      
      console.log('测试完成！');
    } else {
      console.log('登录失败:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('测试过程中出错:', error.message);
    console.log('请确保后端服务器正在运行在 http://localhost:5000');
  }
}

// 运行测试
testLogin();