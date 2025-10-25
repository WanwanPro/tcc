const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { User, ParkingLot, ParkingSpace, SystemConfig } = require('../models')
const Admin = require('../models/Admin')

// 初始化数据库数据
const initializeDatabase = async () => {
  try {
    console.log('开始初始化数据库...')

    // 清空现有数据（可选）
    // await User.deleteMany({})
    // await ParkingLot.deleteMany({})
    // await ParkingSpace.deleteMany({})
    // await SystemConfig.deleteMany({})

    // 创建默认管理员用户
    const adminExists = await User.findOne({ role: 'admin' })
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 12)
      
      const admin = new User({
        username: 'admin',
        email: 'admin@parking.com',
        password: hashedPassword,
        role: 'admin',
        profile: {
          firstName: '系统',
          lastName: '管理员'
        },
        isActive: true
      })
      
      await admin.save()
      console.log('已创建默认管理员账户: admin / admin123')
    }

    // 创建Admin模型的管理员用户
    const adminModelExists = await Admin.findOne({ username: 'admin' })
    if (!adminModelExists) {
      const admin = new Admin({
        username: 'admin',
        password: 'admin123',
        name: '系统管理员',
        email: 'admin@parking.com',
        role: 'super_admin',
        permissions: ['read', 'write', 'delete', 'admin'],
        status: 'active'
      })
      
      await admin.save()
      console.log('已创建Admin模型管理员账户: admin / admin123')
    }

    // 创建默认系统配置
    const configs = [
      {
        key: 'system.name',
        category: 'system',
        value: '智能停车场管理系统',
        description: '系统名称',
        dataType: 'string',
        isActive: true
      },
      {
        key: 'system.version',
        category: 'system',
        value: '1.0.0',
        description: '系统版本',
        dataType: 'string',
        isActive: true
      },
      {
        key: 'parking.default_occupancy_rate',
        category: 'parking',
        value: 0.7,
        description: '默认占用率（用于模拟）',
        dataType: 'number',
        isActive: true
      },
      {
        key: 'parking.simulation_interval',
        category: 'parking',
        value: 60000,
        description: '模拟间隔（毫秒）',
        dataType: 'number',
        isActive: true
      },
      {
        key: 'billing.default_hourly_rate',
        category: 'billing',
        value: 5,
        description: '默认小时费率',
        dataType: 'number',
        isActive: true
      },
      {
        key: 'billing.grace_period',
        category: 'billing',
        value: 15,
        description: '宽限期（分钟）',
        dataType: 'number',
        isActive: true
      }
    ]

    for (const config of configs) {
      const exists = await SystemConfig.findOne({ key: config.key })
      if (!exists) {
        await SystemConfig.create(config)
        console.log(`已创建系统配置: ${config.key}`)
      }
    }

    // 创建示例停车场
    const parkingLotExists = await ParkingLot.findOne()
    if (!parkingLotExists) {
      const parkingLot = new ParkingLot({
        name: '中心停车场',
        address: '北京市朝阳区建国路88号',
        totalSpaces: 200,
        availableSpaces: 140,
        floors: 3,
        operatingHours: {
          open: '06:00',
          close: '23:00'
        },
        pricing: {
          hourly: 5,
          daily: 40,
          monthly: 800
        },
        features: ['24小时监控', '电动汽车充电桩', '无障碍停车位'],
        coordinates: {
          latitude: 39.9042,
          longitude: 116.4074
        },
        isActive: true
      })
      
      await parkingLot.save()
      console.log('已创建示例停车场: 中心停车场')

      // 为示例停车场创建停车位
      const spaces = []
      for (let floor = 1; floor <= 3; floor++) {
        for (let section = 0; section < 4; section++) {
          const sectionLetter = String.fromCharCode(65 + section) // A, B, C, D
          
          for (let num = 1; num <= 20; num++) {
            const spaceNumber = `${sectionLetter}${num.toString().padStart(2, '0')}`
            const spaceId = `P${floor}-${spaceNumber}`
            
            // 随机设置一些停车位为占用状态
            const isOccupied = Math.random() < 0.3
            
            let vehicleInfo = undefined
            if (isOccupied) {
              vehicleInfo = {
                licensePlate: `京A${Math.floor(Math.random() * 100000).toString().padStart(5, '0')}`,
                entryTime: new Date(Date.now() - Math.random() * 4 * 60 * 60 * 1000),
                estimatedExitTime: new Date(Date.now() + Math.random() * 4 * 60 * 60 * 1000)
              }
            }
            
            spaces.push({
              spaceId,
              parkingLotId: parkingLot._id,
              floor,
              section: sectionLetter,
              spaceNumber,
              type: num <= 2 ? 'disabled' : num <= 4 ? 'electric' : 'standard',
              status: isOccupied ? 'occupied' : 'available',
              coordinates: {
                x: 100 + (section * 200) + (num % 10) * 20,
                y: 100 + (floor * 100) + Math.floor(num / 10) * 20
              },
              vehicleInfo
            })
          }
        }
      }
      
      await ParkingSpace.insertMany(spaces)
      console.log(`已创建 ${spaces.length} 个停车位`)
      
      // 更新停车场可用停车位数量
      const occupiedCount = spaces.filter(s => s.status === 'occupied').length
      parkingLot.availableSpaces = parkingLot.totalSpaces - occupiedCount
      await parkingLot.save()
    }

    console.log('数据库初始化完成!')
    return true
  } catch (error) {
    console.error('数据库初始化失败:', error)
    return false
  }
}

module.exports = initializeDatabase