const { ParkingRecord, Vehicle, MiniProgramUser, ParkingSpace, ParkingLot } = require('../models')
const { calculateNavigationPath } = require('./pathfindingController')

/**
 * 标记停车位置
 * 用户停车后标记车位位置，用于后续反向寻车
 */
const markParkingLocation = async (req, res) => {
  try {
    const { userId, vehicleId, parkingLotId, spaceId, notes } = req.body

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 验证车辆是否存在且属于该用户
    const vehicle = await Vehicle.findOne({ _id: vehicleId, userId })
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: '车辆不存在或不属于该用户'
      })
    }

    // 验证停车场是否存在
    const parkingLot = await ParkingLot.findById(parkingLotId)
    if (!parkingLot) {
      return res.status(404).json({
        success: false,
        message: '停车场不存在'
      })
    }

    // 验证车位是否存在且可用
    const parkingSpace = await ParkingSpace.findById(spaceId)
    if (!parkingSpace) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      })
    }

    // 检查用户是否已有未结束的停车记录
    const existingRecord = await ParkingRecord.findOne({
      userId,
      status: 'parking'
    })

    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: '您已有未结束的停车记录，请先结束当前停车'
      })
    }

    // 创建停车记录
    const parkingRecord = new ParkingRecord({
      userId,
      vehicleId,
      parkingLotId,
      spaceId,
      entryTime: new Date(),
      status: 'parking',
      notes
    })

    // 更新车位状态为占用
    parkingSpace.status = 'occupied'
    parkingSpace.vehicleInfo = {
      licensePlate: vehicle.licensePlate,
      entryTime: new Date()
    }
    await parkingSpace.save()

    // 保存停车记录
    await parkingRecord.save()

    // 更新用户停车统计
    user.totalParkingCount += 1
    await user.save()

    res.status(201).json({
      success: true,
      message: '停车位置标记成功',
      data: {
        parkingRecord: {
          id: parkingRecord._id,
          parkingLot: parkingLot.name,
          spaceId: parkingSpace.spaceId,
          spaceNumber: parkingSpace.spaceNumber,
          floor: parkingSpace.floor,
          section: parkingSpace.section,
          entryTime: parkingRecord.entryTime,
          vehicle: {
            licensePlate: vehicle.licensePlate,
            brand: vehicle.brand,
            model: vehicle.model,
            color: vehicle.color
          },
          notes: parkingRecord.notes
        }
      }
    })
  } catch (error) {
    console.error('标记停车位置失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 结束停车
 * 用户取车时结束停车记录
 */
const endParking = async (req, res) => {
  try {
    const { recordId, paymentMethod = 'wechat' } = req.body

    // 验证停车记录是否存在
    const parkingRecord = await ParkingRecord.findById(recordId)
      .populate('userId')
      .populate('vehicleId')
      .populate('parkingLotId')
      .populate('spaceId')

    if (!parkingRecord) {
      return res.status(404).json({
        success: false,
        message: '停车记录不存在'
      })
    }

    if (parkingRecord.status !== 'parking') {
      return res.status(400).json({
        success: false,
        message: '该停车记录已结束'
      })
    }

    // 更新停车记录
    parkingRecord.exitTime = new Date()
    parkingRecord.status = 'exited'
    
    // 计算停车费用（简化计算，实际应根据停车场计费规则）
    const parkingDuration = Math.floor((parkingRecord.exitTime - parkingRecord.entryTime) / (1000 * 60)) // 分钟
    const hourlyRate = 5 // 假设每小时5元
    const feeAmount = Math.ceil(parkingDuration / 60) * hourlyRate
    
    parkingRecord.fee = {
      amount: feeAmount,
      paid: true,
      paymentMethod,
      paymentTime: new Date()
    }

    // 更新车位状态为可用
    const parkingSpace = await ParkingSpace.findById(parkingRecord.spaceId._id)
    if (parkingSpace) {
      parkingSpace.status = 'available'
      parkingSpace.vehicleInfo = {}
      await parkingSpace.save()
    }

    // 更新用户统计信息
    const user = parkingRecord.userId
    user.statistics.totalParkingTime += parkingDuration
    user.statistics.totalParkingFee += feeAmount
    await user.save()

    // 保存停车记录
    await parkingRecord.save()

    res.status(200).json({
      success: true,
      message: '停车结束成功',
      data: {
        parkingRecord: {
          id: parkingRecord._id,
          entryTime: parkingRecord.entryTime,
          exitTime: parkingRecord.exitTime,
          parkingDuration: `${Math.floor(parkingDuration / 60)}小时${parkingDuration % 60}分钟`,
          fee: parkingRecord.fee
        }
      }
    })
  } catch (error) {
    console.error('结束停车失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 查找车辆位置
 * 根据用户信息查找当前停放的车辆位置
 */
const findVehicleLocation = async (req, res) => {
  try {
    const { userId } = req.params

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 查找用户当前有效的停车记录
    const parkingRecord = await ParkingRecord.findOne({
      userId,
      status: 'parking'
    })
      .populate('vehicleId')
      .populate('parkingLotId')
      .populate('spaceId')

    if (!parkingRecord) {
      return res.status(200).json({
        success: true,
        message: '当前没有停车记录',
        data: null
      })
    }

    // 计算停车时长
    const now = new Date()
    const parkingDuration = Math.floor((now - parkingRecord.entryTime) / (1000 * 60)) // 分钟

    res.status(200).json({
      success: true,
      message: '查找车辆位置成功',
      data: {
        parkingRecord: {
          id: parkingRecord._id,
          entryTime: parkingRecord.entryTime,
          parkingDuration: `${Math.floor(parkingDuration / 60)}小时${parkingDuration % 60}分钟`,
          parkingLot: {
            id: parkingRecord.parkingLotId._id,
            name: parkingRecord.parkingLotId.name,
            address: parkingRecord.parkingLotId.address
          },
          parkingSpace: {
            id: parkingRecord.spaceId._id,
            spaceId: parkingRecord.spaceId.spaceId,
            spaceNumber: parkingRecord.spaceId.spaceNumber,
            floor: parkingRecord.spaceId.floor,
            section: parkingRecord.spaceId.section,
            coordinates: parkingRecord.spaceId.coordinates
          },
          vehicle: {
            id: parkingRecord.vehicleId._id,
            licensePlate: parkingRecord.vehicleId.licensePlate,
            brand: parkingRecord.vehicleId.brand,
            model: parkingRecord.vehicleId.model,
            color: parkingRecord.vehicleId.color
          },
          notes: parkingRecord.notes
        }
      }
    })
  } catch (error) {
    console.error('查找车辆位置失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 生成反向寻车路径
 * 从当前位置到车辆位置的导航路径
 */
const generateFindCarPath = async (req, res) => {
  try {
    const { 
      userId,
      currentLocation, // {x, y, floor} 或 {nodeId}
      options = {}
    } = req.body

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 查找用户当前有效的停车记录
    const parkingRecord = await ParkingRecord.findOne({
      userId,
      status: 'parking'
    })
      .populate('vehicleId')
      .populate('parkingLotId')
      .populate('spaceId')

    if (!parkingRecord) {
      return res.status(400).json({
        success: false,
        message: '当前没有停车记录，无法生成寻车路径'
      })
    }

    // 构建终点（车辆位置）
    const endPoint = {
      x: parkingRecord.spaceId.coordinates.x,
      y: parkingRecord.spaceId.coordinates.y,
      floor: parkingRecord.spaceId.floor
    }

    // 调用路径规划API生成路径
    const pathReq = {
      body: {
        parkingLotId: parkingRecord.parkingLotId._id,
        startPoint: currentLocation,
        endPoint,
        options: {
          ...options,
          savePath: true,
          pathName: `寻车路径_${new Date().toLocaleString()}`
        }
      }
    }

    // 模拟调用路径规划API
    const pathResult = await calculateNavigationPath(pathReq, {
      status: () => {},
      json: (data) => data
    })

    if (!pathResult.success) {
      return res.status(400).json({
        success: false,
        message: '生成寻车路径失败',
        error: pathResult.message
      })
    }

    // 保存寻车路径到停车记录
    parkingRecord.findCarPath = {
      pathId: pathResult.data.pathId,
      savedAt: new Date()
    }
    await parkingRecord.save()

    res.status(200).json({
      success: true,
      message: '生成寻车路径成功',
      data: {
        path: pathResult.data.path,
        distance: pathResult.data.distance,
        estimatedTime: pathResult.data.estimatedTime,
        pathId: pathResult.data.pathId,
        vehicleInfo: {
          licensePlate: parkingRecord.vehicleId.licensePlate,
          brand: parkingRecord.vehicleId.brand,
          model: parkingRecord.vehicleId.model,
          color: parkingRecord.vehicleId.color
        },
        parkingSpace: {
          spaceId: parkingRecord.spaceId.spaceId,
          spaceNumber: parkingRecord.spaceId.spaceNumber,
          floor: parkingRecord.spaceId.floor,
          section: parkingRecord.spaceId.section
        }
      }
    })
  } catch (error) {
    console.error('生成寻车路径失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

/**
 * 获取用户停车历史记录
 */
const getParkingHistory = async (req, res) => {
  try {
    const { userId } = req.params
    const { page = 1, limit = 10, status } = req.query

    // 验证用户是否存在
    const user = await MiniProgramUser.findById(userId)
    if (!user) {
      return res.status(404).json({
        success: false,
        message: '用户不存在'
      })
    }

    // 构建查询条件
    const query = { userId }
    if (status) {
      query.status = status
    }

    // 计算分页
    const skip = (parseInt(page) - 1) * parseInt(limit)

    // 查询停车记录
    const parkingRecords = await ParkingRecord.find(query)
      .populate('vehicleId')
      .populate('parkingLotId')
      .populate('spaceId')
      .sort({ entryTime: -1 })
      .skip(skip)
      .limit(parseInt(limit))

    // 获取总数
    const total = await ParkingRecord.countDocuments(query)

    // 格式化数据
    const formattedRecords = parkingRecords.map(record => {
      const parkingDuration = record.exitTime 
        ? Math.floor((record.exitTime - record.entryTime) / (1000 * 60))
        : Math.floor((new Date() - record.entryTime) / (1000 * 60))

      return {
        id: record._id,
        entryTime: record.entryTime,
        exitTime: record.exitTime,
        status: record.status,
        parkingDuration: record.exitTime 
          ? `${Math.floor(parkingDuration / 60)}小时${parkingDuration % 60}分钟`
          : `已停${Math.floor(parkingDuration / 60)}小时${parkingDuration % 60}分钟`,
        parkingLot: {
          id: record.parkingLotId._id,
          name: record.parkingLotId.name,
          address: record.parkingLotId.address
        },
        parkingSpace: {
          spaceId: record.spaceId.spaceId,
          spaceNumber: record.spaceId.spaceNumber,
          floor: record.spaceId.floor,
          section: record.spaceId.section
        },
        vehicle: {
          licensePlate: record.vehicleId.licensePlate,
          brand: record.vehicleId.brand,
          model: record.vehicleId.model,
          color: record.vehicleId.color
        },
        fee: record.fee,
        notes: record.notes
      }
    })

    res.status(200).json({
      success: true,
      message: '获取停车历史记录成功',
      data: {
        records: formattedRecords,
        pagination: {
          current: parseInt(page),
          pageSize: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    })
  } catch (error) {
    console.error('获取停车历史记录失败:', error)
    res.status(500).json({
      success: false,
      message: '服务器错误',
      error: error.message
    })
  }
}

module.exports = {
  markParkingLocation,
  endParking,
  findVehicleLocation,
  generateFindCarPath,
  getParkingHistory
}