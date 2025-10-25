const express = require('express')
const fs = require('fs')
const path = require('path')
const ParkingLot = require('../models/ParkingLot')
const ParkingSpace = require('../models/ParkingSpace')
const auth = require('../middleware/auth')

const router = express.Router()

// 所有路由都需要认证
router.use(auth)

// 导入tcc1date1.json中的车位数据
router.post('/import-tcc1-data', async (req, res) => {
  try {
    // 读取tcc1date1.json文件
    const filePath = path.join(__dirname, '../tcc1date1.json')
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        message: 'tcc1date1.json文件不存在'
      })
    }
    
    const fileContent = fs.readFileSync(filePath, 'utf8')
    const data = JSON.parse(fileContent)
    
    if (!data.parkingSpaces || !Array.isArray(data.parkingSpaces)) {
      return res.status(400).json({
        success: false,
        message: 'tcc1date1.json文件格式不正确，缺少parkingSpaces数组'
      })
    }
    
    // 获取或创建默认停车场
    let parkingLot = await ParkingLot.findOne({ name: 'TCC1停车场' })
    
    if (!parkingLot) {
      parkingLot = new ParkingLot({
        name: 'TCC1停车场',
        address: 'TCC1停车场地址',
        totalSpaces: data.parkingSpaces.length,
        description: '从tcc1date1.json导入的停车场数据'
      })
      await parkingLot.save()
    }
    
    // 清除现有停车位数据
    await ParkingSpace.deleteMany({ lotId: parkingLot._id })
    
    // 创建新的停车位数据
    const parkingSpaces = data.parkingSpaces.map((space, index) => {
      // 根据位置确定区域
      let area = 'A区'
      if (space.x > 1000) area = 'B区'
      if (space.y > 400) area = 'C区'
      
      // 根据索引确定楼层
      let floorId = 'F1'
      if (index > 100) floorId = 'F2'
      
      // 随机设置一些车位为占用状态
      const status = Math.random() > 0.7 ? 'occupied' : 'available'
      
      return {
        spaceId: space.id.toString(),
        floorId,
        lotId: parkingLot._id,
        area,
        type: 'standard',
        status,
        position: {
          x: space.x,
          y: space.y
        },
        dimensions: {
          width: space.width,
          height: space.height
        }
      }
    })
    
    // 批量插入停车位数据
    const createdSpaces = await ParkingSpace.insertMany(parkingSpaces)
    
    // 更新停车场的总车位数
    parkingLot.totalSpaces = createdSpaces.length
    await parkingLot.save()
    
    res.status(200).json({
      success: true,
      message: `成功导入 ${createdSpaces.length} 个停车位`,
      data: {
        parkingLot,
        importedSpaces: createdSpaces.length
      }
    })
  } catch (error) {
    console.error('导入tcc1数据失败:', error)
    res.status(500).json({
      success: false,
      message: '导入tcc1数据失败',
      error: error.message
    })
  }
})

module.exports = router