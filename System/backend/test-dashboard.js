const axios = require('axios');

async function testLogin() {
  try {
    const response = await axios.post('http://localhost:3000/api/admin/auth/login', {
      username: 'admin',
      password: 'admin123'
    });
    
    console.log('Login successful:', response.data);
    const token = response.data.token || response.data.data?.token;
    
    if (token) {
      console.log('Token:', token);
      
      // Test analytics endpoint with token
      const analyticsResponse = await axios.get('http://localhost:3000/api/admin/analytics/dashboard/stats', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Analytics response:', analyticsResponse.data);
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testLogin();