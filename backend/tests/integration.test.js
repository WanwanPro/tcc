const request = require('supertest');
const app = require('../server');

describe('Integration Tests', () => {
  // 测试服务器是否正常运行
  test('GET / should return welcome message', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
    expect(response.body.message).toBe('智能停车场车位引导与导航系统API');
  });

  // 测试用户相关接口
  describe('User API', () => {
    test('POST /api/users/login should handle login', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({ code: 'test_code' });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('token');
    });
  });

  // 测试车位相关接口
  describe('Parking Space API', () => {
    test('GET /api/spaces should return parking spaces', async () => {
      const response = await request(app).get('/api/spaces');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });

    test('POST /api/spaces/update should update space status', async () => {
      const response = await request(app)
        .post('/api/spaces/update')
        .send({ 
          spaceId: 'space_1',
          status: '占用'
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  // 测试路径规划接口
  describe('Path Planning API', () => {
    test('POST /api/path/plan should calculate optimal path', async () => {
      const response = await request(app)
        .post('/api/path/plan')
        .send({
          startPoint: { x: 0, y: 0 },
          endPoint: { x: 10, y: 10 },
          obstacles: []
        });
      
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  // 测试图像识别接口
  describe('Image Recognition API', () => {
    test('GET /api/image/status should return parking status', async () => {
      const response = await request(app).get('/api/image/status');
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('success', true);
    });
  });
});