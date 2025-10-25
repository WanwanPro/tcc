const PathService = require('../services/pathService');
const Path = require('../models/Path');
const apiAdapterService = require('../services/apiAdapterService');
const dataModelMappingService = require('../services/dataModelMappingService');

// 计算最优路径
exports.calculateOptimalPath = async (req, res) => {
  try {
    const { startPoint, endPoint, obstacles, useSystemApi } = req.body;
    
    let result;
    
    // 如果请求中指定使用System API，则从System后台获取路径
    if (useSystemApi === 'true') {
      try {
        // 使用数据模型映射服务将起点和终点转换为System格式
        const systemStartPoint = dataModelMappingService.mapPointToSystem(startPoint);
        const systemEndPoint = dataModelMappingService.mapPointToSystem(endPoint);
        
        // 从System后台获取路径
        const systemResult = await apiAdapterService.calculatePathInSystem(systemStartPoint, systemEndPoint);
        
        // 使用数据模型映射服务将System路径转换为微信小程序格式
        result = dataModelMappingService.mapPathToMiniprogram(systemResult);
      } catch (systemError) {
        console.error('从System后台获取路径失败，使用本地计算:', systemError.message);
        // 如果System API失败，回退到本地计算
        result = await PathService.calculateOptimalPath(startPoint, endPoint, obstacles);
      }
    } else {
      // 默认使用本地计算
      result = await PathService.calculateOptimalPath(startPoint, endPoint, obstacles);
    }
    
    res.json(result);
  } catch (error) {
    console.error('路径计算错误:', error);
    res.status(500).json({
      success: false,
      message: '路径计算失败',
      error: error.message
    });
  }
};

// 实时路径调整
exports.adjustPath = async (req, res) => {
  try {
    const { pathId, newObstacles, currentPosition } = req.body;
    
    // 使用路径服务调整路径
    const result = await PathService.adjustPath(pathId, newObstacles, currentPosition);
    
    res.json(result);
  } catch (error) {
    console.error('路径调整错误:', error);
    res.status(500).json({
      success: false,
      message: '路径调整失败',
      error: error.message
    });
  }
};