// 简单的API测试脚本
const request = require('supertest')
const express = require('express')
const mongoose = require('mongoose')

// 创建测试应用
const app = express()

// 中间件
app.use(express.json())

// 健康检查端点
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running',
    timestamp: new Date().toISOString()
  })
})

// 模拟推荐车位API
app.get('/api/recommendation/parking-spaces', (req, res) => {
  const { latitude, longitude, radius, limit } = req.query
  
  // 模拟返回数据
  const mockSpaces = [
    {
      id: 'space_1',
      spaceNumber: 'A101',
      floor: '1F',
      section: 'A区',
      isAvailable: true,
      distance: 50,
      estimatedWalkingTime: 2,
      features: ['靠近电梯', '宽敞车位']
    },
    {
      id: 'space_2',
      spaceNumber: 'B205',
      floor: '2F',
      section: 'B区',
      isAvailable: true,
      distance: 80,
      estimatedWalkingTime: 3,
      features: ['室内车位', '监控覆盖']
    }
  ]
  
  res.status(200).json({
    success: true,
    message: '获取推荐车位成功',
    data: {
      spaces: mockSpaces,
      count: mockSpaces.length
    }
  })
})

// 模拟路径规划API
app.post('/api/navigation/calculate', (req, res) => {
  const { startNodeId, endNodeId, userId } = req.body
  
  // 模拟返回路径数据
  const mockPath = [
    { x: 10, y: 20, floor: '1F', instruction: '向前直行' },
    { x: 30, y: 20, floor: '1F', instruction: '右转' },
    { x: 30, y: 50, floor: '1F', instruction: '向前直行' },
    { x: 50, y: 50, floor: '1F', instruction: '到达车位' }
  ]
  
  res.status(200).json({
    success: true,
    message: '路径计算成功',
    data: {
      path: mockPath,
      distance: 100,
      estimatedTime: 3,
      pathId: 'path_' + Date.now()
    }
  })
})

// 模拟反向寻车API
app.get('/api/find-car/find/:userId', (req, res) => {
  const { userId } = req.params
  
  // 模拟返回车辆位置数据
  const mockParkingRecord = {
    id: 'record_1',
    parkingLot: {
      id: 'lot_1',
      name: 'TCC停车场',
      address: '北京市朝阳区建国路88号'
    },
    space: {
      id: 'space_1',
      spaceNumber: 'A101',
      floor: '1F',
      section: 'A区'
    },
    entryTime: '2023-11-20T09:30:00Z',
    vehicle: {
      licensePlate: '京A12345',
      brand: '大众',
      model: '帕萨特'
    }
  }
  
  res.status(200).json({
    success: true,
    message: '获取车辆位置成功',
    data: {
      hasActiveParking: true,
      parkingRecord: mockParkingRecord
    }
  })
})

// 模拟用户登录API
app.post('/api/user/guest', (req, res) => {
  // 模拟创建游客用户
  const mockUser = {
    id: 'user_' + Date.now(),
    nickName: '游客用户',
    isGuest: true
  }
  
  const token = 'guest_token_' + Date.now()
  
  res.status(201).json({
    success: true,
    message: '游客模式登录成功',
    data: {
      token,
      userInfo: mockUser
    }
  })
})

// 模拟获取用户信息API
app.get('/api/user/:userId', (req, res) => {
  const { userId } = req.params
  
  // 模拟返回用户信息
  const mockUser = {
    id: userId,
    nickName: '游客用户',
    avatarUrl: '',
    gender: 0,
    isGuest: true,
    totalParkingCount: 0,
    statistics: {
      totalParkingTime: 0,
      totalParkingFee: 0
    }
  }
  
  res.status(200).json({
    success: true,
    message: '获取用户信息成功',
    data: mockUser
  })
})

// 模拟添加车辆API
app.post('/api/user/:userId/vehicles', (req, res) => {
  const { userId } = req.params
  const { licensePlate, vehicleType, brand, model, color, isDefault } = req.body
  
  // 模拟返回添加的车辆信息
  const mockVehicle = {
    id: 'vehicle_' + Date.now(),
    userId,
    licensePlate,
    vehicleType,
    brand,
    model,
    color,
    isDefault: isDefault || false,
    createdAt: new Date().toISOString()
  }
  
  res.status(201).json({
    success: true,
    message: '添加车辆成功',
    data: mockVehicle
  })
})

// 运行测试
async function runTests() {
  console.log('开始API集成测试...\n')
  
  try {
    // 测试健康检查
    console.log('1. 测试健康检查端点')
    const healthResponse = await request(app)
      .get('/api/health')
      .expect(200)
    
    console.log('✓ 健康检查测试通过')
    console.log(`  状态: ${healthResponse.body.status}`)
    console.log(`  消息: ${healthResponse.body.message}\n`)
    
    // 测试推荐车位API
    console.log('2. 测试推荐车位API')
    const spacesResponse = await request(app)
      .get('/api/recommendation/parking-spaces')
      .query({
        latitude: 39.9042,
        longitude: 116.4074,
        radius: 1000,
        limit: 5
      })
      .expect(200)
    
    console.log('✓ 推荐车位API测试通过')
    console.log(`  返回车位数量: ${spacesResponse.body.data.count}\n`)
    
    // 测试路径规划API
    console.log('3. 测试路径规划API')
    const pathResponse = await request(app)
      .post('/api/navigation/calculate')
      .send({
        startNodeId: 'entrance_1',
        endNodeId: 'space_A101',
        userId: 'test_user_id'
      })
      .expect(200)
    
    console.log('✓ 路径规划API测试通过')
    console.log(`  路径点数量: ${pathResponse.body.data.path.length}`)
    console.log(`  总距离: ${pathResponse.body.data.distance}米\n`)
    
    // 测试反向寻车API
    console.log('4. 测试反向寻车API')
    const findCarResponse = await request(app)
      .get('/api/find-car/find/test_user_id')
      .expect(200)
    
    console.log('✓ 反向寻车API测试通过')
    console.log(`  有活跃停车记录: ${findCarResponse.body.data.hasActiveParking}`)
    console.log(`  车位号: ${findCarResponse.body.data.parkingRecord.space.spaceNumber}\n`)
    
    // 测试用户登录API
    console.log('5. 测试游客登录API')
    const loginResponse = await request(app)
      .post('/api/user/guest')
      .expect(201)
    
    console.log('✓ 游客登录API测试通过')
    const userId = loginResponse.body.data.userInfo.id
    console.log(`  用户ID: ${userId}\n`)
    
    // 测试获取用户信息API
    console.log('6. 测试获取用户信息API')
    const userInfoResponse = await request(app)
      .get(`/api/user/${userId}`)
      .expect(200)
    
    console.log('✓ 获取用户信息API测试通过')
    console.log(`  用户昵称: ${userInfoResponse.body.data.nickName}\n`)
    
    // 测试添加车辆API
    console.log('7. 测试添加车辆API')
    const addVehicleResponse = await request(app)
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
    
    console.log('✓ 添加车辆API测试通过')
    console.log(`  车牌号: ${addVehicleResponse.body.data.licensePlate}\n`)
    
    console.log('所有API测试通过！')
    
  } catch (error) {
    console.error('API测试失败:', error.message)
    process.exit(1)
  }
}

// 运行测试
runTests()