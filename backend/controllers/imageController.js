const ImageRecognitionService = require('../services/imageRecognitionService');

/**
 * 处理上传的停车场图像
 */
exports.processImage = async (req, res) => {
  try {
    // 检查是否有上传文件
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '请上传停车场图像文件'
      });
    }

    const imageFile = req.file;
    
    // 在实际应用中，这里应该验证文件类型和大小
    // 然后将文件数据传递给图像识别服务
    
    // 调用图像识别服务处理图像
    const result = await ImageRecognitionService.processParkingImage(imageFile.data);
    
    res.json(result);
  } catch (error) {
    console.error('图像处理错误:', error);
    res.status(500).json({
      success: false,
      message: '图像处理失败',
      error: error.message
    });
  }
};

/**
 * 获取最新的车位状态
 */
exports.getParkingStatus = async (req, res) => {
  try {
    const result = await ImageRecognitionService.getLatestParkingStatus();
    
    if (result.success) {
      res.json({
        success: true,
        message: '获取车位状态成功',
        data: result.data
      });
    } else {
      res.status(500).json({
        success: false,
        message: '获取车位状态失败',
        error: result.error
      });
    }
  } catch (error) {
    console.error('获取车位状态错误:', error);
    res.status(500).json({
      success: false,
      message: '获取车位状态失败',
      error: error.message
    });
  }
};