// 详细的登录测试脚本，包含调试信息
const http = require('http');

// 发送HTTP请求的函数
function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    console.log('发送请求到:', `http://${options.hostname}:${options.port}${options.path}`);
    console.log('请求方法:', options.method);
    console.log('请求头:', options.headers);
    if (data) {
      console.log('请求数据:', JSON.stringify(data));
    }
    
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
          console.log('响应状态码:', response.statusCode);
          console.log('响应数据:', JSON.stringify(response.data, null, 2));
          resolve(response);
        } catch (error) {
          console.log('响应解析失败:', body);
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      console.error('请求错误:', error);
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
    console.log('=====================================');
    
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
    
    console.log('\n1. 测试登录接口');
    console.log('=====================================');
    const loginResponse = await makeRequest(loginOptions, loginData);
    
    if (loginResponse.statusCode === 200 && loginResponse.data.success) {
      console.log('\n登录成功!');
      
      // 提取token
      const token = loginResponse.data.data.token;
      console.log('\n获取到token:', token ? '成功' : '失败');
      
      if (token) {
        console.log('\n2. 测试获取用户信息接口 (/info)');
        console.log('=====================================');
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
          console.log('\n获取用户信息(/info)状态:', infoResponse.statusCode === 200 ? '成功' : '失败');
        } catch (infoError) {
          console.log('\n获取用户信息(/info)失败:', infoError.message);
        }
        
        console.log('\n3. 测试获取用户信息接口 (/me)');
        console.log('=====================================');
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
          console.log('\n获取用户信息(/me)状态:', meResponse.statusCode === 200 ? '成功' : '失败');
        } catch (meError) {
          console.log('\n获取用户信息(/me)失败:', meError.message);
        }
      }
      
      console.log('\n=====================================');
      console.log('测试完成!');
    } else {
      console.log('\n登录失败:', loginResponse.data);
    }
    
  } catch (error) {
    console.error('\n测试过程中出错:', error.message);
    console.log('请确保后端服务器正在运行在 http://localhost:5000');
  }
}

// 运行测试
testLogin();