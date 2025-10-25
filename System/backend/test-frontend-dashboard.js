const axios = require('axios');

async function testFrontendDashboard() {
  try {
    console.log('测试前端仪表盘数据获取...');
    
    // 1. 登录获取token
    const loginResponse = await axios.post('http://localhost:3000/api/admin/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const token = loginResponse.data.data.token;
    console.log('登录成功，获取到token');
    
    // 2. 使用前端API调用方式获取仪表盘数据
    const dashboardResponse = await axios.get('http://localhost:3000/api/admin/analytics/dashboard/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!dashboardResponse.data.success) {
      throw new Error('获取仪表盘数据失败');
    }
    
    console.log('仪表盘数据获取成功:');
    console.log('- 停车场总数:', dashboardResponse.data.data.overview.totalLots);
    console.log('- 停车位总数:', dashboardResponse.data.data.overview.totalSpaces);
    console.log('- 已占用车位:', dashboardResponse.data.data.overview.occupiedSpaces);
    console.log('- 可用车位:', dashboardResponse.data.data.overview.availableSpaces);
    console.log('- 总占用率:', dashboardResponse.data.data.overview.totalOccupancyRate + '%');
    console.log('- 今日收入:', dashboardResponse.data.data.overview.todayRevenue);
    console.log('- 今日交易数:', dashboardResponse.data.data.overview.todayTransactionCount);
    
    console.log('\n各停车场统计:');
    dashboardResponse.data.data.lotStats.forEach(lot => {
      console.log(`- ${lot.name}: 总车位${lot.totalSpaces}, 已占${lot.occupiedSpaces}, 占用率${lot.occupancyRate}%`);
    });
    
    console.log('\n测试完成！前端应该能够正确显示仪表盘数据。');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

testFrontendDashboard();