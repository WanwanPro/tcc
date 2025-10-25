const axios = require('axios');

async function testDashboardAPI() {
  try {
    // Step 1: Login to get token
    console.log('Step 1: Logging in...');
    const loginResponse = await axios.post('http://localhost:3000/api/admin/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful:', loginResponse.data);
    const token = loginResponse.data.data.token;
    
    if (!token) {
      throw new Error('No token received from login');
    }
    
    console.log('Token received:', token.substring(0, 50) + '...');
    
    // Step 2: Test dashboard API
    console.log('\nStep 2: Testing dashboard API...');
    try {
      const dashboardResponse = await axios.get('http://localhost:3000/api/admin/analytics/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Dashboard API successful:', dashboardResponse.data);
    } catch (dashboardError) {
      console.error('Dashboard API failed:', dashboardError.response?.data || dashboardError.message);
      
      // If we have a response, log more details
      if (dashboardError.response) {
        console.error('Status:', dashboardError.response.status);
        console.error('Headers:', dashboardError.response.headers);
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error.response?.data || error.message);
  }
}

testDashboardAPI();