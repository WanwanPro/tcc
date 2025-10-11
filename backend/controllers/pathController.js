const PathService = require('../services/pathService');
const Path = require('../models/Path');

// 计算最优路径
exports.calculateOptimalPath = async (req, res) => {
  try {
    const { startPoint, endPoint, obstacles } = req.body;
    
    // 使用路径服务计算最优路径
    const result = await PathService.calculateOptimalPath(startPoint, endPoint, obstacles);
    
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