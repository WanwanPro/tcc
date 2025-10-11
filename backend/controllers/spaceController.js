const ParkingSpace = require('../models/ParkingSpace');

// 获取所有车位状态
exports.getAllSpaces = async (req, res) => {
  try {
    const { parkingId } = req.query;
    
    // 在实际应用中，可能需要根据parkingId过滤
    const spaces = await ParkingSpace.find({});
    
    res.json({
      success: true,
      message: '获取车位状态成功',
      data: spaces
    });
  } catch (error) {
    console.error('获取车位状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取车位状态失败',
      error: error.message
    });
  }
};

// 更新车位状态
exports.updateSpaceStatus = async (req, res) => {
  try {
    const { spaceId, status } = req.body;
    
    // 验证状态值
    const validStatus = ['空闲', '占用', '预定'];
    if (!validStatus.includes(status)) {
      return res.status(400).json({
        success: false,
        message: '无效的车位状态'
      });
    }
    
    // 更新车位状态
    const updatedSpace = await ParkingSpace.findOneAndUpdate(
      { spaceId },
      { 
        status,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );
    
    if (!updatedSpace) {
      return res.status(404).json({
        success: false,
        message: '车位不存在'
      });
    }
    
    res.json({
      success: true,
      message: '车位状态更新成功',
      data: updatedSpace
    });
  } catch (error) {
    console.error('更新车位状态错误:', error);
    res.status(500).json({
      success: false,
      message: '车位状态更新失败',
      error: error.message
    });
  }
};