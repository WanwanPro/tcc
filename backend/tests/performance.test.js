const request = require('supertest');
const app = require('../server');

describe('Performance Tests', () => {
  // 测试API响应时间
  test('GET / should respond within 100ms', async () => {
    const start = Date.now();
    const response = await request(app).get('/');
    const responseTime = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(responseTime).toBeLessThan(100);
  });

  // 测试并发请求处理能力
  test('should handle concurrent requests', async () => {
    const requests = [];
    for (let i = 0; i < 10; i++) {
      requests.push(request(app).get('/api/spaces'));
    }
    
    const start = Date.now();
    const responses = await Promise.all(requests);
    const totalTime = Date.now() - start;
    
    // 验证所有请求都成功
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
    
    // 验证总时间在合理范围内（10个并发请求应在500ms内完成）
    expect(totalTime).toBeLessThan(500);
  });

  // 测试路径规划算法性能
  test('path planning should complete within 500ms', async () => {
    const start = Date.now();
    const response = await request(app)
      .post('/api/path/plan')
      .send({
        startPoint: { x: 0, y: 0 },
        endPoint: { x: 50, y: 50 },
        obstacles: Array(20).fill().map((_, i) => ({
          x: i * 3,
          y: i * 2,
          width: 1,
          height: 1
        }))
      });
    const planningTime = Date.now() - start;
    
    expect(response.status).toBe(200);
    expect(planningTime).toBeLessThan(500);
  });
});