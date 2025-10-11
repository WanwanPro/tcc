const ImageProcessor = require('../utils/imageProcessor');
const ParkingSpace = require('../models/ParkingSpace');

/**
 * 图像识别服务
 * 负责处理停车场图像并更新车位状态
 */
class ImageRecognitionService {
  /**
   * 处理停车场图像并更新车位状态
   * @param {Buffer} imageBuffer - 停车场图像数据
   * @returns {Object} 处理结果
   */
  static async processParkingImage(imageBuffer) {
    try {
      // 1. 图像预处理
      const processedImage = ImageProcessor.preprocessImage(imageBuffer);
      
      // 2. 车位区域定位
      const spaces = ImageProcessor.detectParkingSpaces(processedImage);
      
      // 3. 车位占用状态识别
      const statuses = ImageProcessor.recognizeSpaceStatus(imageBuffer, spaces);
      
      // 4. 后处理识别结果
      const finalStatuses = ImageProcessor.postProcessResults(statuses);
      
      // 5. 更新数据库中的车位状态
      const updateResults = await this.updateParkingSpaceStatuses(finalStatuses);
      
      return {
        success: true,
        message: '图像处理完成',
        data: {
          processedImage,
          detectedSpaces: spaces.length,
          updatedSpaces: updateResults.updatedCount,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('图像处理错误:', error);
      return {
        success: false,
        message: '图像处理失败',
        error: error.message
      };
    }
  }

  /**
   * 更新车位状态到数据库
   * @param {Array} statuses - 车位状态数组
   * @returns {Object} 更新结果
   */
  static async updateParkingSpaceStatuses(statuses) {
    let updatedCount = 0;
    
    try {
      for (const status of statuses) {
        // 查找或创建车位记录
        let parkingSpace = await ParkingSpace.findOne({ spaceId: status.spaceId });
        
        if (!parkingSpace) {
          // 如果车位不存在，则创建新记录
          parkingSpace = new ParkingSpace({
            spaceId: status.spaceId,
            position: status.position,
            status: status.status
          });
        } else {
          // 更新现有车位状态
          parkingSpace.status = status.status;
          parkingSpace.position = status.position;
        }
        
        // 保存车位信息
        await parkingSpace.save();
        updatedCount++;
      }
      
      return {
        success: true,
        updatedCount: updatedCount
      };
    } catch (error) {
      console.error('更新车位状态错误:', error);
      return {
        success: false,
        updatedCount: updatedCount,
        error: error.message
      };
    }
  }

  /**
   * 获取最新的车位状态
   * @returns {Array} 车位状态列表
   */
  static async getLatestParkingStatus() {
    try {
      const spaces = await ParkingSpace.find({});
      return {
        success: true,
        data: spaces
      };
    } catch (error) {
      console.error('获取车位状态错误:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = ImageRecognitionService;