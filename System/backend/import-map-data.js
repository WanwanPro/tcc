const mongoose = require('mongoose')
const fs = require('fs')
const path = require('path')
const ParkingLot = require('./models/ParkingLot')
const ParkingSpace = require('./models/ParkingSpace')
const MapNode = require('./models/MapNode')

// 连接数据库
require('dotenv').config()
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/parking_admin', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})

// 读取地图数据
const mapDataPath = path.join(__dirname, '../../tcc1date1.json')
const mapData = JSON.parse(fs.readFileSync(mapDataPath, 'utf8'))

async function importMapData() {
  try {
    console.log('开始导入地图数据...')
    
    // 1. 创建或获取停车场
    let parkingLot = await ParkingLot.findOne({ name: '示例停车场' })
    
    if (!parkingLot) {
      parkingLot = new ParkingLot({
        name: '示例停车场',
        address: '示例地址',
        description: '从tcc1date1.json导入的示例停车场',
        totalSpaces: mapData.parkingSpaces.length,
        floors: [{
          floorId: 'F1',
          floorName: '一楼',
          spaces: [],
          mapImage: 'tcc1date1.json',
          nodes: []
        }],
        operatingHours: {
          open: '00:00',
          close: '23:59'
        },
        status: 'active',
        facilities: ['电梯', '无障碍通道'],
        contact: {
          phone: '123456789',
          email: 'example@parking.com'
        }
      })
      
      await parkingLot.save()
      console.log('创建停车场成功')
    } else {
      console.log('停车场已存在，跳过创建')
    }
    
    const floorId = 'F1'
    const lotId = parkingLot._id
    
    // 2. 导入停车位数据
    console.log('开始导入停车位数据...')
    const parkingSpaces = []
    
    for (let i = 0; i < mapData.parkingSpaces.length; i++) {
      const space = mapData.parkingSpaces[i]
      const spaceId = `P${String(i + 1).padStart(3, '0')}` // 生成停车位ID，如P001, P002...
      
      // 检查停车位是否已存在
      const existingSpace = await ParkingSpace.findOne({ spaceId, floorId, lotId })
      
      if (!existingSpace) {
        const newSpace = new ParkingSpace({
          spaceId,
          floorId,
          lotId,
          area: 'A区', // 默认区域
          type: 'standard', // 默认标准车位
          status: Math.random() > 0.7 ? 'occupied' : 'available', // 随机设置一些车位为占用状态
          position: {
            x: space.x,
            y: space.y
          }
        })
        
        parkingSpaces.push(newSpace)
      }
    }
    
    if (parkingSpaces.length > 0) {
      await ParkingSpace.insertMany(parkingSpaces)
      console.log(`成功导入 ${parkingSpaces.length} 个停车位`)
    } else {
      console.log('所有停车位已存在，跳过导入')
    }
    
    // 3. 导入地图节点数据
    console.log('开始导入地图节点数据...')
    const mapNodes = []
    
    // 添加入口节点
    for (let i = 0; i < mapData.entrances.length; i++) {
      const entrance = mapData.entrances[i]
      const nodeId = `ENTRANCE${i + 1}`
      
      // 检查节点是否已存在
      const existingNode = await MapNode.findOne({ nodeId, floorId, lotId })
      
      if (!existingNode) {
        mapNodes.push({
          nodeId,
          floorId,
          lotId,
          type: 'entrance',
          position: {
            x: entrance.x,
            y: entrance.y
          },
          connections: [],
          name: `入口${i + 1}`,
          description: '停车场入口'
        })
      }
    }
    
    // 添加电梯节点
    for (let i = 0; i < mapData.elevators.length; i++) {
      const elevator = mapData.elevators[i]
      const nodeId = `ELEVATOR${i + 1}`
      
      // 检查节点是否已存在
      const existingNode = await MapNode.findOne({ nodeId, floorId, lotId })
      
      if (!existingNode) {
        mapNodes.push({
          nodeId,
          floorId,
          lotId,
          type: 'elevator',
          position: {
            x: elevator.x,
            y: elevator.y
          },
          connections: [],
          name: `电梯${i + 1}`,
          description: '电梯'
        })
      }
    }
    
    // 添加一些交叉路口节点（基于交通标志）
    for (let i = 0; i < mapData.trafficSigns.length; i++) {
      const sign = mapData.trafficSigns[i]
      const nodeId = `INTERSECTION${i + 1}`
      
      // 检查节点是否已存在
      const existingNode = await MapNode.findOne({ nodeId, floorId, lotId })
      
      if (!existingNode) {
        mapNodes.push({
          nodeId,
          floorId,
          lotId,
          type: 'intersection',
          position: {
            x: sign.x,
            y: sign.y
          },
          connections: [],
          name: `路口${i + 1}`,
          description: `交通标志: ${sign.type}`
        })
      }
    }
    
    if (mapNodes.length > 0) {
      await MapNode.insertMany(mapNodes)
      console.log(`成功导入 ${mapNodes.length} 个地图节点`)
    } else {
      console.log('所有地图节点已存在，跳过导入')
    }
    
    // 4. 更新停车场的停车位和节点引用
    const allSpaces = await ParkingSpace.find({ floorId, lotId })
    const allNodes = await MapNode.find({ floorId, lotId })
    
    parkingLot.floors[0].spaces = allSpaces.map(space => space._id)
    parkingLot.floors[0].nodes = allNodes.map(node => node._id)
    parkingLot.totalSpaces = allSpaces.length
    
    await parkingLot.save()
    console.log('更新停车场信息成功')
    
    console.log('地图数据导入完成!')
    console.log(`停车场: ${parkingLot.name}`)
    console.log(`停车位数量: ${allSpaces.length}`)
    console.log(`地图节点数量: ${allNodes.length}`)
    
  } catch (error) {
    console.error('导入地图数据失败:', error)
  } finally {
    mongoose.connection.close()
  }
}

// 执行导入
importMapData()