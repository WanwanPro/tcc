const request = require('supertest');
const app = require('../server');

describe('API Tests', () => {
  // 测试根路径
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('智能停车场车位引导与导航系统API');
  });

  // 测试获取车位状态接口
  test('GET /api/spaces should return parking spaces', async () => {
    const response = await request(app).get('/api/spaces');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
  });

  // 测试用户登录接口
  test('POST /api/users/login should handle login', async () => {
    const response = await request(app)
      .post('/api/users/login')
      .send({ code: 'test_code' });
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success');
  });
});