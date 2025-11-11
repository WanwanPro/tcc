// 详细调试登录问题
const http = require('http');

// 发送HTTP请求的函数
function sendRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let responseData = '';
      
      res.on('data', (chunk) => {
        responseData += chunk;
      });
      
      res.on('end', () => {
        try {
          const parsedData = JSON.parse(responseData);
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: parsedData
          });
        } catch (error) {
          resolve({
            statusCode: res.statusCode,
            headers: res.headers,
            data: responseData
          });
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
  console.log('开始详细调试登录问题...');
  console.log('=====================================\n');
  
  try {
    // 1. 测试健康检查端点
    console.log('1. 测试健康检查端点');
    console.log('=====================================');
    
    const healthOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/health',
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const healthResponse = await sendRequest(healthOptions);
    console.log('健康检查状态码:', healthResponse.statusCode);
    console.log('健康检查响应:', healthResponse.data);
    console.log('');
    
    // 2. 测试登录接口
    console.log('2. 测试登录接口');
    console.log('=====================================');
    
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
    
    console.log('发送请求到:', `http://${loginOptions.hostname}:${loginOptions.port}${loginOptions.path}`);
    console.log('请求方法:', loginOptions.method);
    console.log('请求头:', loginOptions.headers);
    console.log('请求数据:', JSON.stringify(loginData));
    
    const loginResponse = await sendRequest(loginOptions, loginData);
    
    console.log('响应状态码:', loginResponse.statusCode);
    console.log('响应头:', loginResponse.headers);
    console.log('响应数据:', JSON.stringify(loginResponse.data, null, 2));
    
    if (loginResponse.statusCode === 200 && loginResponse.data.success) {
      console.log('\n登录成功!');
      const token = loginResponse.data.token;
      
      // 3. 测试用户信息接口
      console.log('\n3. 测试用户信息接口');
      console.log('=====================================');
      
      const infoOptions = {
        hostname: 'localhost',
        port: 5000,
        path: '/api/admin/auth/info',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      };
      
      console.log('发送请求到:', `http://${infoOptions.hostname}:${infoOptions.port}${infoOptions.path}`);
      console.log('请求方法:', infoOptions.method);
      console.log('请求头:', infoOptions.headers);
      
      const infoResponse = await sendRequest(infoOptions);
      
      console.log('响应状态码:', infoResponse.statusCode);
      console.log('响应数据:', JSON.stringify(infoResponse.data, null, 2));
    } else {
      console.log('\n登录失败:', JSON.stringify(loginResponse.data));
    }
  } catch (error) {
    console.error('请求出错:', error.message);
  }
}

// 运行测试
testLogin();