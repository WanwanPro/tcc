// 测试API集成
const request = require('supertest')
const app = require('./server')

describe('API Integration Tests', () => {
  // 测试健康检查
  test('Health check endpoint', async () => {
    const response = await request(app)
      .get('/api/health')
      .expect(200)
    
    expect(response.body.status).toBe('success')
    expect(response.body.message).toBe('API is running')
  })

  // 测试推荐车位API
  test('Get recommended parking spaces', async () => {
    const response = await request(app)
      .get('/api/recommendation/parking-spaces')
      .query({
        latitude: 39.9042,
        longitude: 116.4074,
        radius: 1000,
        limit: 5
      })
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data.spaces)).toBe(true)
  })

  // 测试路径规划API
  test('Calculate navigation path', async () => {
    const response = await request(app)
      .post('/api/navigation/calculate')
      .send({
        startNodeId: 'entrance_1',
        endNodeId: 'space_A101',
        userId: 'test_user_id'
      })
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(Array.isArray(response.body.data.path)).toBe(true)
  })

  // 测试反向寻车API
  test('Find vehicle location', async () => {
    const response = await request(app)
      .get('/api/find-car/find/test_user_id')
      .expect(200)
    
    expect(response.body.success).toBe(true)
    if (response.body.data.hasActiveParking) {
      expect(response.body.data.parkingRecord).toBeDefined()
    }
  })

  // 测试用户个人中心API
  test('Get user info', async () => {
    // 首先创建一个测试用户
    const loginResponse = await request(app)
      .post('/api/user/guest')
      .expect(201)
    
    const userId = loginResponse.data.data.userInfo.id
    
    // 获取用户信息
    const response = await request(app)
      .get(`/api/user/${userId}`)
      .expect(200)
    
    expect(response.body.success).toBe(true)
    expect(response.body.data.id).toBe(userId)
  })

  // 测试添加车辆
  test('Add user vehicle', async () => {
    // 首先创建一个测试用户
    const loginResponse = await request(app)
      .post('/api/user/guest')
      .expect(201)
    
    const userId = loginResponse.data.data.userInfo.id
    
    // 添加车辆
    const response = await request(app)
      .post(`/api/user/${userId}/vehicles`)
      .send({
        licensePlate: '京A12345',
        vehicleType: '轿车',
        brand: '大众',
        model: '帕萨特',
        color: '黑色',
        isDefault: true
      })
      .expect(201)
    
    expect(response.body.success).toBe(true)
    expect(response.body.data.licensePlate).toBe('京A12345')
  })
})

console.log('API集成测试完成！')