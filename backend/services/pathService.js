const Path = require('../models/Path');
const PathPlanner = require('../utils/pathPlanner');

/**
 * 路径服务
 * 负责计算和管理停车场内的导航路径
 */
class PathService {
  /**
   * 计算最优路径
   * @param {Object} startPoint - 起点坐标 {x, y}
   * @param {Object} endPoint - 终点坐标 {x, y}
   * @param {Array} obstacles - 障碍物列表
   * @returns {Object} 路径信息
   */
  static async calculateOptimalPath(startPoint, endPoint, obstacles = []) {
    try {
      // 创建路径规划器实例
      const pathPlanner = new PathPlanner(obstacles);
      
      // 使用A*算法计算路径
      const route = pathPlanner.findPath(startPoint, endPoint);
      
      if (!route) {
        return {
          success: false,
          message: '无法找到从起点到终点的路径'
        };
      }
      
      // 计算路径距离（简化为路径点数）
      const distance = route.length - 1;
      
      // 估算时间（假设每步耗时1秒）
      const estimatedTime = distance;
      
      // 创建路径记录
      const path = new Path({
        pathId: `path_${Date.now()}`,
        startPoint,
        endPoint,
        route,
        distance,
        estimatedTime
      });
      
      // 保存到数据库
      await path.save();
      
      return {
        success: true,
        message: '路径计算成功',
        data: path
      };
    } catch (error) {
      console.error('路径计算错误:', error);
      return {
        success: false,
        message: '路径计算失败',
        error: error.message
      };
    }
  }

  /**
   * 实时调整路径
   * @param {String} pathId - 路径ID
   * @param {Array} newObstacles - 新障碍物
   * @param {Object} currentPosition - 当前位置 {x, y}
   * @returns {Object} 调整后的路径信息
   */
  static async adjustPath(pathId, newObstacles, currentPosition) {
    try {
      // 查找现有路径
      const existingPath = await Path.findOne({ pathId });
      
      if (!existingPath) {
        return {
          success: false,
          message: '路径不存在'
        };
      }
      
      // 创建路径规划器实例
      const pathPlanner = new PathPlanner(existingPath.obstacles || []);
      
      // 调整路径
      const adjustedRoute = pathPlanner.adjustPath(
        existingPath.route, 
        newObstacles, 
        currentPosition
      );
      
      if (!adjustedRoute) {
        return {
          success: false,
          message: '无法调整路径'
        };
      }
      
      // 更新路径信息
      existingPath.route = adjustedRoute;
      existingPath.distance = adjustedRoute.length - 1;
      existingPath.estimatedTime = existingPath.distance;
      existingPath.obstacles = [...(existingPath.obstacles || []), ...newObstacles];
      existingPath.updatedAt = new Date();
      
      // 保存到数据库
      await existingPath.save();
      
      return {
        success: true,
        message: '路径调整成功',
        data: existingPath
      };
    } catch (error) {
      console.error('路径调整错误:', error);
      return {
        success: false,
        message: '路径调整失败',
        error: error.message
      };
    }
  }

  /**
   * 获取路径详情
   * @param {String} pathId - 路径ID
   * @returns {Object} 路径详情
   */
  static async getPathDetails(pathId) {
    try {
      const path = await Path.findOne({ pathId });
      
      if (!path) {
        return {
          success: false,
          message: '路径不存在'
        };
      }
      
      return {
        success: true,
        message: '获取路径详情成功',
        data: path
      };
    } catch (error) {
      console.error('获取路径详情错误:', error);
      return {
        success: false,
        message: '获取路径详情失败',
        error: error.message
      };
    }
  }
}

module.exports = PathService;