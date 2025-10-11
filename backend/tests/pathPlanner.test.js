const PathPlanner = require('../utils/pathPlanner');

describe('PathPlanner', () => {
  let pathPlanner;

  beforeEach(() => {
    // 创建一个简单的测试环境
    const obstacles = [
      { x: 2, y: 2, width: 1, height: 1 }
    ];
    const gridSize = { width: 5, height: 5 };
    pathPlanner = new PathPlanner(obstacles, gridSize);
  });

  test('should create grid correctly', () => {
    expect(pathPlanner.grid).toBeDefined();
    expect(pathPlanner.grid.length).toBe(5);
    // 障碍物位置应该是不可通行的
    expect(pathPlanner.grid[2][2]).toBe(false);
    // 非障碍物位置应该是可通行的
    expect(pathPlanner.grid[0][0]).toBe(true);
  });

  test('should calculate manhattan distance correctly', () => {
    const point1 = { x: 0, y: 0 };
    const point2 = { x: 3, y: 4 };
    const distance = pathPlanner.manhattanDistance(point1, point2);
    expect(distance).toBe(7);
  });

  test('should find path when possible', () => {
    const start = { x: 0, y: 0 };
    const end = { x: 4, y: 4 };
    const path = pathPlanner.findPath(start, end);
    
    expect(path).not.toBeNull();
    expect(Array.isArray(path)).toBe(true);
    expect(path.length).toBeGreaterThan(0);
    expect(path[0]).toEqual(start);
    expect(path[path.length - 1]).toEqual(end);
  });

  test('should return null when no path exists', () => {
    // 创建一个完全阻塞的环境
    const obstacles = [
      { x: 1, y: 0, width: 1, height: 5 },
      { x: 3, y: 0, width: 1, height: 5 }
    ];
    const gridSize = { width: 5, height: 5 };
    const blockedPlanner = new PathPlanner(obstacles, gridSize);
    
    const start = { x: 0, y: 0 };
    const end = { x: 4, y: 0 };
    const path = blockedPlanner.findPath(start, end);
    
    expect(path).toBeNull();
  });

  test('should adjust path when new obstacles are added', () => {
    const currentPath = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 3, y: 0 },
      { x: 4, y: 0 }
    ];
    const newObstacles = [
      { x: 2, y: 0, width: 1, height: 1 }
    ];
    const currentPosition = { x: 1, y: 0 };
    
    const adjustedPath = pathPlanner.adjustPath(currentPath, newObstacles, currentPosition);
    
    expect(adjustedPath).not.toBeNull();
    expect(Array.isArray(adjustedPath)).toBe(true);
    // 调整后的路径应该避开新障碍物
    expect(adjustedPath.some(point => point.x === 2 && point.y === 0)).toBe(false);
  });
});