// pages/navigation/navigation.js
const mapData = require('../../assets/map_elements.js');
const navGraph = require('../../assets/navigation_graph.js');
const { PathfindingManager } = require('../../utils/pathfinding/index.js');

/**
 * 1. 配置与常量
 */
const CELL_SIZE = 40;
const WALL = 1;
const ROAD = 0;
const SPOT = 2;
const TARGET = 3;
const OCCUPIED = 4;
const CAMERA_FOLLOW_DISTANCE = 156;
const CAMERA_PARK_DISTANCE = 38;
const CAMERA_HEADING_LERP = 0.055;
const CAMERA_FOLLOW_LERP = 0.04;
const CAMERA_PARK_LERP = 0.09;
const CAMERA_RETURN_DAMPING = 0.9;
const CAMERA_RETURN_EPSILON = 0.002;
const CAMERA_LOWER_THIRD_RATIO = 0.54;
const HUD_TOP_CLIP_RPX = 400;
const HUD_BOTTOM_CLIP_RPX = 250;
const WORLD_ROTATION = -Math.PI / 2;
const CAMERA_HORIZONTAL_OFFSET = -56;

// 全局变量 (页面级)
let car, pathfindingManager, currentPath = [];
let mapGrid = [];
let spotMap = {};
let gridToSpaceMap = {};
let viewMode = 'FOLLOW';
let cameraAngle = 0;
let cameraPos = { x: 0, y: 0 };
let cameraHeading = 0;
let arrivalHandled = false;
let isDragging = false;
let lastMouse = { x: 0, y: 0 };
let manualViewOffset = 0;
let currentTarget = null;
let carStartGrid = { x: 0, y: 0 };
let currentStats = {};
let touchSession = null;

/**
 * 2. 车辆类定义
 */
class Car {
  constructor(x, y) {
    this.gridX = x;
    this.gridY = y;
    this.x = x * CELL_SIZE + CELL_SIZE / 2;
    this.y = y * CELL_SIZE + CELL_SIZE / 2;
    this.angle = 0;
    this.path = [];
    this.targetIndex = 0;
    this.isMoving = false;
    this.speed = 1.15;
  }

  setPath(path) {
    this.path = path;
    this.targetIndex = 1;
    this.isMoving = true;
  }

  update() {
    if (!this.isMoving || this.path.length === 0) return;

    if (this.targetIndex >= this.path.length) {
      this.isMoving = false;
      return;
    }

    const targetGrid = this.path[this.targetIndex];
    const targetPixelX = targetGrid.x * CELL_SIZE + CELL_SIZE / 2;
    const targetPixelY = targetGrid.y * CELL_SIZE + CELL_SIZE / 2;

    const dx = targetPixelX - this.x;
    const dy = targetPixelY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    const targetAngle = Math.atan2(dy, dx);

    let angleDiff = targetAngle - this.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    this.angle += angleDiff * 0.05;

    if (dist < this.speed) {
      this.x = targetPixelX;
      this.y = targetPixelY;
      this.targetIndex++;
    } else {
      this.x += Math.cos(targetAngle) * this.speed;
      this.y += Math.sin(targetAngle) * this.speed;
    }
  }

  drawNew(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);

    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 10;

    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    const x = -20, y = -12, w = 40, h = 24, r = 5;
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.lineTo(x + w, y + h - r);
    ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
    ctx.lineTo(x + r, y + h);
    ctx.arcTo(x, y + h, x, y + h - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.fill();

    ctx.fillStyle = '#a5f3fc';
    ctx.shadowBlur = 0;
    ctx.fillRect(4, -10, 10, 20);
    ctx.fillRect(-12, -10, 8, 20);

    ctx.fillStyle = '#fef08a';
    ctx.beginPath();
    ctx.arc(18, -8, 3, 0, Math.PI * 2);
    ctx.arc(18, 8, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.rect(-20, -10, 2, 6);
    ctx.rect(-20, 4, 2, 6);
    ctx.fill();

    ctx.restore();
  }
}

Page({
  data: {
    statusMsg: '正在生成地图...',
    btnText: '开始导航',
    showRecenter: false,
    dpr: 1,
    venueTitle: '泊车汪',
    startPointLabel: '入口1',
    destinationLabel: '请选择车位',
    routeDistanceText: '0 米',
    directionArrowStyle: 'transform: rotate(0deg);',
    currentFloor: 'B2',
    floorOptions: ['1F', 'B1', 'B2'],
    // 算法相关
    currentAlgorithm: 'dynamic-astar',
    algorithmName: '动态加权A*',
    showStats: true,
    showComparison: false,
    comparisonResults: [],
    currentStats: {
      pathLength: 0,
      nodesExpanded: 0,
      nodesVisited: 0,
      computeTime: 0,
      computeTimeFormatted: '0.00'
    }
  },

  onLoad(options) {
    this.options = options;
    this.windowInfo = wx.getWindowInfo();
    // 初始化算法管理器
    pathfindingManager = new PathfindingManager();
    pathfindingManager.setCurrent('dynamic-astar');
  },

  onReady() {
    const query = wx.createSelectorQuery();
    query.select('#parkingCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');

        const dpr = wx.getSystemInfoSync().pixelRatio;
        canvas.width = res[0].width * dpr;
        canvas.height = res[0].height * dpr;
        ctx.scale(dpr, dpr);

        this.canvas = canvas;
        this.ctx = ctx;
        this.setData({ dpr });

        this.initGame();
        this.animate();
      });
  },

  onUnload() {
    if (this.animationId) {
      this.canvas.cancelAnimationFrame(this.animationId);
    }
  },

  // === 算法选择 ===
  selectAlgorithm(e) {
    const algo = e.currentTarget.dataset.algo;
    if (pathfindingManager.setCurrent(algo)) {
      const algorithms = pathfindingManager.list();
      const selected = algorithms.find(a => a.id === algo);
      this.setData({
        currentAlgorithm: algo,
        algorithmName: selected ? selected.name : algo
      });

      // 重新计算路径
      if (currentTarget && !car.isMoving) {
        this.calculateAndStartPath();
      }

      wx.showToast({
        title: `已切换: ${selected ? selected.name : algo}`,
        icon: 'none',
        duration: 1500
      });
    }
  },

  // === 算法对比 ===
  showAlgorithmComparison() {
    this.setData({ showComparison: true });
    this.runComparison();
  },

  hideComparison() {
    this.setData({ showComparison: false });
  },

  preventClose() {
    // 阻止点击内容区域关闭弹窗
  },

  runComparison() {
    if (!currentTarget || !mapGrid.length) {
      wx.showToast({ title: '请先选择目标车位', icon: 'none' });
      return;
    }

    const startGrid = {
      x: Math.floor(car.x / CELL_SIZE),
      y: Math.floor(car.y / CELL_SIZE)
    };

    // 运行所有算法进行对比
    const results = pathfindingManager.compare(mapGrid, startGrid, currentTarget);

    // 标记最佳结果
    if (results.length > 0) {
      const bestLength = results[0].pathLength;
      results.forEach(r => {
        r.best = r.pathLength === bestLength && r.pathLength > 0;
      });
    }

    this.setData({ comparisonResults: results });
  },

  // === 地图生成 ===
  generateGrid() {
    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = Infinity;
    maxLat = -Infinity;

    mapData.features.forEach(f => {
      if (f.properties.type === 'parking_spot') {
        const coords = f.geometry.coordinates[0];
        coords.forEach(c => {
          if (c[0] < minLng) minLng = c[0];
          if (c[0] > maxLng) maxLng = c[0];
          if (c[1] < minLat) minLat = c[1];
          if (c[1] > maxLat) maxLat = c[1];
        });
      }
    });

    navGraph.nodes.forEach(n => {
      if (n.coordinates[0] < minLng) minLng = n.coordinates[0];
      if (n.coordinates[0] > maxLng) maxLng = n.coordinates[0];
      if (n.coordinates[1] < minLat) minLat = n.coordinates[1];
      if (n.coordinates[1] > maxLat) maxLat = n.coordinates[1];
    });

    const padding = 0.0002;
    minLng -= padding; maxLng += padding;
    minLat -= padding; maxLat += padding;

    const GRID_W = 60;
    const step = (maxLng - minLng) / GRID_W;
    const GRID_H = Math.ceil((maxLat - minLat) / step);

    const grid = [];
    for (let y = 0; y < GRID_H; y++) {
      let row = [];
      for (let x = 0; x < GRID_W; x++) {
        row.push(WALL);
      }
      grid.push(row);
    }

    const toGrid = (lng, lat) => {
      return {
        x: Math.floor((lng - minLng) / step),
        y: Math.floor((maxLat - lat) / step)
      };
    };

    spotMap = {};
    gridToSpaceMap = {};

    let allSpots = [];
    mapData.features.forEach(f => {
      if (f.properties.type === 'parking_spot') {
        let cx = 0, cy = 0;
        const coords = f.geometry.coordinates[0];
        coords.forEach(c => { cx += c[0]; cy += c[1]; });
        cx /= coords.length;
        cy /= coords.length;
        allSpots.push({ feature: f, cx, cy });
      }
    });

    const EPSILON = 0.00005;
    allSpots.sort((a, b) => {
      if (Math.abs(a.cy - b.cy) > EPSILON) {
        return b.cy - a.cy;
      }
      return a.cx - b.cx;
    });

    allSpots.forEach((item, index) => {
      const p = toGrid(item.cx, item.cy);
      if (p.x >= 0 && p.x < GRID_W && p.y >= 0 && p.y < GRID_H) {
        grid[p.y][p.x] = SPOT;
        const numId = (index + 1).toString().padStart(3, '0');
        spotMap[numId] = { x: p.x, y: p.y, fullId: item.feature.properties.id, numId: index + 1 };
        gridToSpaceMap[`${p.x},${p.y}`] = numId;
      }
    });

    navGraph.edges.forEach(edge => {
      const fromNode = navGraph.nodes.find(n => n.id === edge.from);
      const toNode = navGraph.nodes.find(n => n.id === edge.to);

      if (fromNode && toNode) {
        const p1 = toGrid(fromNode.coordinates[0], fromNode.coordinates[1]);
        const p2 = toGrid(toNode.coordinates[0], toNode.coordinates[1]);

        let x0 = p1.x, y0 = p1.y;
        let x1 = p2.x, y1 = p2.y;

        let dx = Math.abs(x1 - x0);
        let dy = Math.abs(y1 - y0);
        let sx = (x0 < x1) ? 1 : -1;
        let sy = (y0 < y1) ? 1 : -1;
        let err = dx - dy;

        while (true) {
          if (y0 >= 0 && y0 < GRID_H && x0 >= 0 && x0 < GRID_W) {
            if (grid[y0][x0] !== SPOT) {
              grid[y0][x0] = ROAD;
            }

            for (let dy = -1; dy <= 1; dy++) {
              for (let dx = -1; dx <= 1; dx++) {
                let ny = y0 + dy, nx = x0 + dx;
                if (ny >= 0 && ny < GRID_H && nx >= 0 && nx < GRID_W) {
                  if (grid[ny][nx] !== SPOT) grid[ny][nx] = ROAD;
                }
              }
            }
          }

          if ((x0 === x1) && (y0 === y1)) break;
          let e2 = 2 * err;
          if (e2 > -dy) { err -= dy; x0 += sx; }
          if (e2 < dx) { err += dx; y0 += sy; }
        }
      }
    });

    const entrance = navGraph.nodes.find(n => n.name === '入口1');
    if (entrance) {
      carStartGrid = toGrid(entrance.coordinates[0], entrance.coordinates[1]);
    } else {
      carStartGrid = { x: 2, y: GRID_H - 2 };
    }

    if (grid[carStartGrid.y][carStartGrid.x] === WALL) {
      grid[carStartGrid.y][carStartGrid.x] = ROAD;
    }

    return grid;
  },

  initGame() {
    mapGrid = this.generateGrid();
    car = new Car(carStartGrid.x, carStartGrid.y);

    cameraPos = { x: car.x, y: car.y };
    cameraAngle = car.angle;
    cameraHeading = car.angle;
    arrivalHandled = false;

    this.fetchParkingStatus();

    if (this.options && this.options.spaceId) {
      const target = spotMap[this.options.spaceId];
      if (target) {
        this.setTarget(target.x, target.y);
      } else {
        this.findRandomTarget();
      }
    } else {
      this.findRandomTarget();
    }
  },

  findRandomTarget() {
    const keys = Object.keys(spotMap);
    if (keys.length > 0) {
      const randomKey = keys[Math.floor(Math.random() * keys.length)];
      const t = spotMap[randomKey];
      this.setTarget(t.x, t.y);
    }
  },

  setTarget(x, y) {
    if (currentTarget) {
      if (mapGrid[currentTarget.y][currentTarget.x] === TARGET) {
        mapGrid[currentTarget.y][currentTarget.x] = SPOT;
      }
    }

    currentTarget = { x, y };
    mapGrid[y][x] = TARGET;

    const id = gridToSpaceMap[`${x},${y}`];
    this.setData({
      statusMsg: `目标: ${id || '未知'}`,
      btnText: "开始导航",
      destinationLabel: id ? `车位 ${id}` : '未选择车位'
    });

    this.calculateAndStartPath();
  },

  fetchParkingStatus() {
    const total = Object.keys(spotMap).length;
    const occupiedCount = 7;

    let occupied = 0;
    Object.keys(spotMap).forEach(key => {
      const spot = spotMap[key];
      if (occupied < occupiedCount && Math.random() < 0.05) {
        mapGrid[spot.y][spot.x] = OCCUPIED;
        occupied++;
      } else {
        if (mapGrid[spot.y][spot.x] !== TARGET) {
          mapGrid[spot.y][spot.x] = SPOT;
        }
      }
    });

    this.setData({
      statusMsg: `数据同步完成: 空闲 ${total - occupied}, 占用 ${occupied}`
    });
  },

  calculateAndStartPath() {
    if (!currentTarget) return;

    const startGrid = {
      x: Math.floor(car.x / CELL_SIZE),
      y: Math.floor(car.y / CELL_SIZE)
    };

    if (startGrid.x < 0) startGrid.x = 0;
    if (startGrid.y < 0) startGrid.y = 0;

    // 使用算法管理器执行寻路
    const result = pathfindingManager.findPath(mapGrid, startGrid, currentTarget);
    const path = result.path;
    const stats = result.stats;

    // 更新统计信息
    this.setData({
      currentStats: {
        pathLength: path.length,
        nodesExpanded: stats.nodesExpanded || 0,
        nodesVisited: stats.nodesVisited || 0,
        computeTime: stats.computeTime || 0,
        computeTimeFormatted: ((stats.computeTime || 0)).toFixed(2)
      },
      routeDistanceText: path.length > 0 ? `${(path.length * 3.2).toFixed(2)} 米` : '0 米'
    });

    if (path.length > 0) {
      currentPath = path;
      car.setPath(path);
      arrivalHandled = false;
      this.setData({ btnText: "行驶中..." });
      this.resetCamera();
    } else {
      this.setData({ btnText: "无法到达" });
    }
  },

  startNavigation() {
    if (car.isMoving && currentPath.length > 0) return;
    this.calculateAndStartPath();
  },

  resetSimulation() {
    car = new Car(carStartGrid.x, carStartGrid.y);
    currentPath = [];
    viewMode = 'FOLLOW';
    manualViewOffset = 0;
    cameraAngle = 0;
    cameraHeading = 0;
    arrivalHandled = false;
    this.setData({
      showRecenter: false,
      btnText: "开始导航",
      currentStats: {
        pathLength: 0,
        nodesExpanded: 0,
        nodesVisited: 0,
        computeTime: 0,
        computeTimeFormatted: '0.00'
      },
      routeDistanceText: '0 米'
    });
    this.resetCamera();
  },

  resetCamera() {
    viewMode = 'FOLLOW';
    manualViewOffset = 0;
    cameraAngle = 0;
    cameraHeading = car ? car.angle : 0;
    this.setData({ showRecenter: false });
  },

  normalizeAngle(angle) {
    let next = angle;
    while (next > Math.PI) next -= Math.PI * 2;
    while (next < -Math.PI) next += Math.PI * 2;
    return next;
  },

  rpxToPx(rpx) {
    const windowWidth = (this.windowInfo && this.windowInfo.windowWidth) || 375;
    return rpx * windowWidth / 750;
  },

  getCanvasViewport(logicWidth, logicHeight) {
    const top = this.rpxToPx(HUD_TOP_CLIP_RPX);
    const bottomInset = this.rpxToPx(HUD_BOTTOM_CLIP_RPX);
    const bottom = Math.max(top + 40, logicHeight - bottomInset);
    return {
      top,
      bottom,
      height: Math.max(40, bottom - top)
    };
  },

  clampCameraToMap(anchorX, anchorY, logicWidth, viewport) {
    if (!mapGrid.length || !mapGrid[0] || !mapGrid[0].length) return;

    const mapWidth = mapGrid[0].length * CELL_SIZE;
    const mapHeight = mapGrid.length * CELL_SIZE;

    // After a -90deg world rotation, screen X corresponds to world Y,
    // and screen Y corresponds to world X. Clamp camera so the clipped
    // viewport always remains inside the map.
    const minCameraX = viewport.bottom - anchorY;
    const maxCameraX = mapWidth - (anchorY - viewport.top);
    const minCameraY = anchorX;
    const maxCameraY = mapHeight - (logicWidth - anchorX);

    cameraPos.x = Math.min(Math.max(cameraPos.x, minCameraX), Math.max(minCameraX, maxCameraX));
    cameraPos.y = Math.min(Math.max(cameraPos.y, minCameraY), Math.max(minCameraY, maxCameraY));
  },

  // === 动画循环 ===
  animate() {
    if (!this.canvas) return;

    car.update();

    if (!car.isMoving && this.data.btnText === '行驶中...' && !arrivalHandled) {
      arrivalHandled = true;
      this.setData({ btnText: '导航结束', statusMsg: '已到达目的地' });
      this.handleArrival();
    }

    const ctx = this.ctx;
    const canvas = this.canvas;
    const logicWidth = canvas.width / this.data.dpr;
    const logicHeight = canvas.height / this.data.dpr;
    const viewport = this.getCanvasViewport(logicWidth, logicHeight);
    const anchorX = logicWidth / 2 + CAMERA_HORIZONTAL_OFFSET;
    const anchorY = viewport.top + viewport.height * CAMERA_LOWER_THIRD_RATIO;
    ctx.clearRect(0, 0, logicWidth, logicHeight);
    manualViewOffset = 0;

    const headingDelta = this.normalizeAngle(car.angle - cameraHeading);
    cameraHeading += headingDelta * CAMERA_HEADING_LERP;
    cameraAngle = cameraHeading;

    const parked = !car.isMoving && this.data.btnText === '导航结束';
    const followDistance = parked ? CAMERA_PARK_DISTANCE : CAMERA_FOLLOW_DISTANCE;
    const followLerp = parked ? CAMERA_PARK_LERP : CAMERA_FOLLOW_LERP;
    const followTargetX = car.x + Math.cos(cameraAngle) * followDistance;
    const followTargetY = car.y + Math.sin(cameraAngle) * followDistance;
    cameraPos.x += (followTargetX - cameraPos.x) * followLerp;
    cameraPos.y += (followTargetY - cameraPos.y) * followLerp;
    this.clampCameraToMap(anchorX, anchorY, logicWidth, viewport);
    this.updateDirectionArrow();

    ctx.save();
    ctx.beginPath();
    ctx.rect(0, viewport.top, logicWidth, viewport.height);
    ctx.clip();
    ctx.translate(anchorX, anchorY);
    ctx.rotate(WORLD_ROTATION);
    ctx.translate(-cameraPos.x, -cameraPos.y);

    if (!this.data.showComparison) {
      this.drawMap(ctx);
      this.drawPath(ctx);
      car.drawNew(ctx);
    }

    ctx.restore();

    this.animationId = this.canvas.requestAnimationFrame(() => this.animate());
  },

  updateDirectionArrow() {
    const rotationDeg = Math.round((car.angle * 180) / Math.PI);
    const nextStyle = `transform: rotate(${rotationDeg}deg);`;
    if (this.data.directionArrowStyle !== nextStyle) {
      this.setData({ directionArrowStyle: nextStyle });
    }
  },

  drawRoundedRect(ctx, x, y, width, height, radius) {
    const r = Math.min(radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.arcTo(x + width, y, x + width, y + height, r);
    ctx.lineTo(x + width, y + height - r);
    ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
    ctx.lineTo(x + r, y + height);
    ctx.arcTo(x, y + height, x, y + height - r, r);
    ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r);
    ctx.closePath();
  },

  drawLaneMarking(ctx, px, py) {
    const centerX = px + CELL_SIZE / 2;
    const centerY = py + CELL_SIZE / 2;
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.42)';
    ctx.lineWidth = 2;
    ctx.setLineDash([8, 7]);
    ctx.beginPath();
    ctx.moveTo(centerX - 12, centerY);
    ctx.lineTo(centerX + 12, centerY);
    ctx.stroke();
    ctx.restore();
  },

  drawMap(ctx) {
    const mapWidth = mapGrid[0] ? mapGrid[0].length * CELL_SIZE : 0;
    const mapHeight = mapGrid.length * CELL_SIZE;

    ctx.save();
    ctx.fillStyle = '#dfe5ec';
    ctx.fillRect(0, 0, mapWidth, mapHeight);
    ctx.restore();

    for (let y = 0; y < mapGrid.length; y++) {
      for (let x = 0; x < mapGrid[y].length; x++) {
        const type = mapGrid[y][x];
        const px = x * CELL_SIZE;
        const py = y * CELL_SIZE;

        if (type === WALL) {
          ctx.save();
          ctx.fillStyle = '#8b949f';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          ctx.fillStyle = '#727b87';
          ctx.fillRect(px + 2, py + 2, CELL_SIZE - 4, CELL_SIZE - 4);
          ctx.strokeStyle = 'rgba(255,255,255,0.08)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px + 4, py + 4);
          ctx.lineTo(px + CELL_SIZE - 4, py + CELL_SIZE - 4);
          ctx.moveTo(px + CELL_SIZE - 4, py + 4);
          ctx.lineTo(px + 4, py + CELL_SIZE - 4);
          ctx.stroke();
          ctx.restore();
        } else if (type === OCCUPIED) {
          ctx.save();
          ctx.fillStyle = '#eef2f6';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          this.drawRoundedRect(ctx, px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8, 4);
          ctx.fillStyle = '#fef2f2';
          ctx.fill();
          ctx.strokeStyle = '#f87171';
          ctx.lineWidth = 2;
          ctx.stroke();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(px + 10, py + 10);
          ctx.lineTo(px + CELL_SIZE - 10, py + CELL_SIZE - 10);
          ctx.moveTo(px + CELL_SIZE - 10, py + 10);
          ctx.lineTo(px + 10, py + CELL_SIZE - 10);
          ctx.stroke();

          const id = gridToSpaceMap[`${x},${y}`];
          if (id) {
            ctx.fillStyle = '#b91c1c';
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(id, px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 13);
          }
          ctx.restore();
        } else if (type === SPOT || type === TARGET) {
          ctx.save();
          ctx.fillStyle = '#eef2f6';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          this.drawRoundedRect(ctx, px + 4, py + 4, CELL_SIZE - 8, CELL_SIZE - 8, 4);
          ctx.fillStyle = type === TARGET ? '#dcfce7' : '#ffffff';
          ctx.fill();
          ctx.strokeStyle = type === TARGET ? '#16a34a' : '#cbd5e1';
          ctx.lineWidth = type === TARGET ? 2.5 : 2;
          ctx.stroke();

          const id = gridToSpaceMap[`${x},${y}`];
          if (id) {
            ctx.fillStyle = type === TARGET ? '#166534' : '#64748b';
            ctx.font = '9px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(id, px + CELL_SIZE / 2, py + CELL_SIZE / 2 + 4);
          }

          if (type === TARGET) {
            ctx.fillStyle = '#22c55e';
            ctx.beginPath();
            ctx.arc(px + CELL_SIZE / 2, py + 11, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillRect(px + CELL_SIZE / 2 - 1, py + 11, 2, 10);
          }
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = '#d4dae2';
          ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          this.drawLaneMarking(ctx, px, py);
          ctx.restore();
        }
      }
    }
  },

  drawPath(ctx) {
    if (currentPath.length < 2) return;

    ctx.save();
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 10;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.moveTo(car.x, car.y);
    let startIndex = car.targetIndex;

    if (startIndex < currentPath.length) {
      const next = currentPath[startIndex];
      ctx.lineTo(next.x * CELL_SIZE + CELL_SIZE / 2, next.y * CELL_SIZE + CELL_SIZE / 2);

      for (let i = startIndex + 1; i < currentPath.length; i++) {
        const p = currentPath[i];
        ctx.lineTo(p.x * CELL_SIZE + CELL_SIZE / 2, p.y * CELL_SIZE + CELL_SIZE / 2);
      }
    }
    ctx.stroke();

    ctx.beginPath();
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 6;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.setLineDash([12, 10]);

    const offset = (Date.now() / 50) % 20;
    ctx.lineDashOffset = -offset;

    ctx.moveTo(car.x, car.y);
    startIndex = car.targetIndex;

    if (startIndex < currentPath.length) {
      const next = currentPath[startIndex];
      ctx.lineTo(next.x * CELL_SIZE + CELL_SIZE / 2, next.y * CELL_SIZE + CELL_SIZE / 2);

      for (let i = startIndex + 1; i < currentPath.length; i++) {
        const p = currentPath[i];
        ctx.lineTo(p.x * CELL_SIZE + CELL_SIZE / 2, p.y * CELL_SIZE + CELL_SIZE / 2);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  },

  handleArrival() {
    if (!currentTarget) return;

    const tx = currentTarget.x;
    const ty = currentTarget.y;
    mapGrid[ty][tx] = OCCUPIED;

    const id = gridToSpaceMap[`${tx},${ty}`];

    const app = getApp();
    if (app && app.globalData && app.globalData.baseUrl) {
      wx.request({
        url: `${app.globalData.baseUrl}/spaces/update`,
        method: 'POST',
        data: { spaceId: id, status: '占用' },
        success: () => wx.showToast({ title: '已落锁', icon: 'success' })
      });
    } else {
      wx.showToast({ title: '已到达(模拟)', icon: 'success' });
    }
  },

  // === 触摸事件 ===
  onTouchStart(e) {
    const touch = e.touches[0];
    isDragging = true;
    lastMouse = { x: touch.x, y: touch.y };
    touchSession = {
      start: { x: touch.x, y: touch.y },
      last: { x: touch.x, y: touch.y },
      moved: false
    };
  },

  onTouchMove(e) {
    if (!isDragging) return;
    const touch = e.touches[0];
    const dx = touch.x - lastMouse.x;
    const dy = touch.y - lastMouse.y;
    lastMouse = { x: touch.x, y: touch.y };

    if (touchSession) {
      touchSession.last = { x: touch.x, y: touch.y };
      if (Math.abs(touch.x - touchSession.start.x) > 8 || Math.abs(touch.y - touchSession.start.y) > 8) {
        touchSession.moved = true;
      }
    }
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
      // Disable manual camera dragging: the map stays fixed and only auto-follow is used.
      return;
    }
  },

  onTouchEnd() {
    if (touchSession && !touchSession.moved) {
      this.onCanvasTap({
        detail: {
          x: touchSession.last.x,
          y: touchSession.last.y
        }
      });
    }
    isDragging = false;
    touchSession = null;
  },

  selectFloor(e) {
    const floor = e.currentTarget.dataset.floor;
    if (!floor) return;
    this.setData({ currentFloor: floor });
  },

  exitSelection() {
    this.resetSimulation();
  },

  onCanvasTap(e) {
    const touch = e.detail;
    const logicWidth = this.canvas.width / this.data.dpr;
    const logicHeight = this.canvas.height / this.data.dpr;
    const viewport = this.getCanvasViewport(logicWidth, logicHeight);
    const anchorX = logicWidth / 2 + CAMERA_HORIZONTAL_OFFSET;
    const anchorY = viewport.top + viewport.height * CAMERA_LOWER_THIRD_RATIO;

    if (touch.y < viewport.top || touch.y > viewport.bottom) {
      return;
    }

    const offsetX = touch.x - anchorX;
    const offsetY = touch.y - anchorY;
    const invRotation = -WORLD_ROTATION;
    const worldX = offsetX * Math.cos(invRotation) - offsetY * Math.sin(invRotation) + cameraPos.x;
    const worldY = offsetX * Math.sin(invRotation) + offsetY * Math.cos(invRotation) + cameraPos.y;

    const gridX = Math.floor(worldX / CELL_SIZE);
    const gridY = Math.floor(worldY / CELL_SIZE);

    if (gridY >= 0 && gridY < mapGrid.length && gridX >= 0 && gridX < mapGrid[0].length) {
      const type = mapGrid[gridY][gridX];

      if (type === SPOT || type === TARGET) {
        this.setTarget(gridX, gridY);
      } else if (type === OCCUPIED) {
        const id = gridToSpaceMap[`${gridX},${gridY}`];
        this.setData({
          statusMsg: `⚠️ 车位 ${id || ''} 已被占用`
        });
      }
    }
  }
});
