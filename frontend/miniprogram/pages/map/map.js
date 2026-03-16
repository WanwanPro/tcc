const RenderEngine = require('../../utils/render-engine.js');

Page({
  data: {
    spaces: [],
    freeSpaces: 0,
    selectedSpace: null,
    mapHeight: 500,
    mapWidth: 600,
    scale: 1.0,  // 恢复默认缩放比例
    scrollLeft: 0,
    scrollTop: 0,
    isUsingCanvas: true,  // 使用Canvas渲染引擎
    vehicleState: null,  // 车辆状态
    routePath: null,     // 路线路径
    camera: {            // 相机状态
      zoom: 1.0,
      bearing: 0,
      pitch: 45
    }
  },

  onLoad() {
    // 初始化渲染引擎
    this.initRenderEngine();
    
    // 获取车位信息
    this.getSpaceInfo();
    
    // 设置地图高度
    this.setMapHeight();
  },

  // 初始化渲染引擎
  initRenderEngine() {
    const query = wx.createSelectorQuery();
    query.select('#parking-canvas').node().exec((res) => {
      if (res[0]) {
        const canvas = res[0].node;
        this.renderEngine = new RenderEngine(canvas);
        this.renderEngine.camera = this.data.camera;
        
        // 设置画布大小
        this.renderEngine.setSize(this.data.mapWidth, this.data.mapHeight);
        
        // 绑定触摸事件
        this.bindTouchEvents();
      }
    });
  },

  // 绑定触摸事件
  bindTouchEvents() {
    const query = wx.createSelectorQuery();
    query.select('#parking-canvas').boundingClientRect();
    query.exec((res) => {
      if (res[0]) {
        const canvasRect = res[0];
        this.canvasRect = canvasRect;
      }
    });
  },

  onShow() {
    // 页面显示时更新数据
    this.getSpaceInfo();
  },

  // 设置地图高度
  setMapHeight() {
    // 使用新的 API 替代已弃用的 getSystemInfoSync
    const windowInfo = wx.getWindowInfo();
    const mapHeight = windowInfo.windowHeight - 100;
    this.setData({
      mapHeight: mapHeight
    });
  },

  // 获取车位信息
  getSpaceInfo() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/spaces?useLocalApi=true`,
      success: (res) => {
        if (res.data.success) {
          const spaces = res.data.data;
          if (!Array.isArray(spaces) || spaces.length === 0) {
            wx.showToast({ title: '未获取到数据', icon: 'error' });
          }
          this.processMapData(spaces);
        } else {
          console.error('获取车位信息失败:', res.data.message);
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
      }
    });
  },

  // 处理地图数据，转换为渲染引擎需要的格式
  processMapData(spaces) {
    // 转换车位数据为 GeoJSON 格式
    const features = spaces.map(space => {
      const [lng, lat] = space.position.lngLat || [113.0 + space.position.x / 100000, 23.0 + space.position.y / 100000];
      const statusKey = space.statusKey || (space.status === '空闲' || space.status === 'available' ? 'available' : 'occupied');
      const statusText = space.statusText || space.status || (statusKey === 'available' ? '空闲' : '占用');
      
      return {
        type: 'Feature',
        properties: {
          type: 'parking_spot',
          spaceId: space.spaceId,
          status: statusKey,
          statusText,
          area: space.area,
          floorId: space.floorId
        },
        geometry: {
          type: 'Polygon',
          coordinates: [[
            [lng - 0.0001, lat - 0.0001],
            [lng + 0.0001, lat - 0.0001],
            [lng + 0.0001, lat + 0.0001],
            [lng - 0.0001, lat + 0.0001],
            [lng - 0.0001, lat - 0.0001]
          ]]
        }
      };
    });

    const mapData = {
      type: 'FeatureCollection',
      features: features
    };

    // 更新数据
    const freeSpaces = features.filter(f => f.properties.status === 'available').length;
    this.mapData = mapData;
    
    this.setData({
      spaces: spaces,
      freeSpaces: freeSpaces
    });

    // 如果渲染引擎已初始化，更新渲染
    if (this.renderEngine) {
      this.renderEngine.mapData = mapData;
      // 居中相机到地图要素
      try {
        let minLng = Infinity, minLat = Infinity, maxLng = -Infinity, maxLat = -Infinity;
        for (const f of features) {
          const coords = f.geometry.coordinates[0];
          for (const c of coords) {
            if (c[0] < minLng) minLng = c[0];
            if (c[1] < minLat) minLat = c[1];
            if (c[0] > maxLng) maxLng = c[0];
            if (c[1] > maxLat) maxLat = c[1];
          }
        }
        if (isFinite(minLng) && isFinite(minLat) && isFinite(maxLng) && isFinite(maxLat)) {
          const centerLng = (minLng + maxLng) / 2;
          const centerLat = (minLat + maxLat) / 2;
          const world = this.renderEngine.geoToWorld(centerLng, centerLat);
          this.renderEngine.setCamera(world.x, world.y);
        }
      } catch (e) {}
      this.render();
    }
  },

  // 渲染地图
  render() {
    if (this.renderEngine) {
      this.renderEngine.render(this.data.vehicleState, this.data.routePath);
    }
  },

  // 选择车位
  selectSpace(e) {
    if (this.data.isUsingCanvas) {
      // Canvas模式下通过坐标检测选中的车位
      const touch = e.touches[0];
      this.handleCanvasTouch(touch);
    } else {
      // 传统View模式
      const spaceId = e.currentTarget.dataset.spaceId;
      const selectedSpace = this.data.spaces.find(space => space.spaceId === spaceId);
      
      this.setData({
        selectedSpace: selectedSpace
      });
      
      // 添加选中效果
      wx.showToast({
        title: `已选择车位 ${spaceId}`,
        icon: 'success',
        duration: 1000
      });
    }
  },

  // 处理Canvas触摸事件
  handleCanvasTouch(touch) {
    if (!this.renderEngine || !this.mapData) return;

    const canvasRect = this.canvasRect;
    const x = touch.clientX - canvasRect.left;
    const y = touch.clientY - canvasRect.top;

    // 检测点击的车位
    const clickedSpace = this.detectClickedSpace(x, y);
    
    if (clickedSpace) {
      this.setData({
        selectedSpace: clickedSpace
      });
      
      // 平滑移动相机到选中的车位
      this.animateToSpace(clickedSpace);
      
      wx.showToast({
        title: `已选择车位 ${clickedSpace.spaceId}`,
        icon: 'success',
        duration: 1000
      });
    }
  },

  // 检测点击的车位
  detectClickedSpace(screenX, screenY) {
    if (!this.mapData || !this.renderEngine) return null;

    for (const feature of this.mapData.features) {
      const coords = feature.geometry.coordinates[0];
      const worldPoints = coords.map(coord => {
        const world = this.renderEngine.geoToWorld(coord[0], coord[1]);
        return this.renderEngine.worldToScreen(world.x, world.y);
      });

      // 简单边界检测
      const minX = Math.min(...worldPoints.map(p => p.x));
      const maxX = Math.max(...worldPoints.map(p => p.x));
      const minY = Math.min(...worldPoints.map(p => p.y));
      const maxY = Math.max(...worldPoints.map(p => p.y));

      if (screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY) {
        return {
          spaceId: feature.properties.spaceId,
          status: feature.properties.status,
          statusText: feature.properties.statusText,
          area: feature.properties.area,
          floorId: feature.properties.floorId
        };
      }
    }
    return null;
  },

  // 平滑移动相机到指定车位
  animateToSpace(space) {
    if (!this.renderEngine || !this.mapData) return;

    // 找到车位对应的特征
    const feature = this.mapData.features.find(f => f.properties.spaceId === space.spaceId);
    if (!feature) return;

    const coords = feature.geometry.coordinates[0];
    const centerLng = coords.reduce((sum, coord) => sum + coord[0], 0) / coords.length;
    const centerLat = coords.reduce((sum, coord) => sum + coord[1], 0) / coords.length;

    // 计算目标相机位置
    const targetWorld = this.renderEngine.geoToWorld(centerLng, centerLat);
    
    // 获取当前相机位置
    const startX = this.renderEngine.camera.x;
    const startY = this.renderEngine.camera.y;

    // 简单的平滑移动动画
    const steps = 30;
    let currentStep = 0;
    
    const animate = () => {
      if (currentStep >= steps) {
        // 确保最终位置准确
        this.renderEngine.setCamera(targetWorld.x, targetWorld.y);
        this.render();
        return;
      }
      
      const progress = currentStep / steps;
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      
      // 插值计算当前位置
      const currentX = startX + (targetWorld.x - startX) * easeProgress;
      const currentY = startY + (targetWorld.y - startY) * easeProgress;
      
      this.renderEngine.setCamera(currentX, currentY);
      this.render();
      
      currentStep++;
      this.canvas.requestAnimationFrame(animate);
    };
    
    // 使用 canvas 对象的 requestAnimationFrame
    const query = wx.createSelectorQuery();
    query.select('#parking-canvas').node().exec((res) => {
      if (res[0]) {
        this.canvas = res[0].node;
        this.canvas.requestAnimationFrame(animate);
      }
    });
  },

  // 导航到车位
  navigateToSpace() {
    if (!this.data.selectedSpace) {
      wx.showToast({
        title: '请先选择车位',
        icon: 'error'
      });
      return;
    }
    if (this.data.selectedSpace.status === 'occupied') {
      wx.showToast({
        title: this.data.selectedSpace.statusText || '该车位已占用',
        icon: 'error'
      });
      return;
    }

    const spaceId = this.data.selectedSpace.spaceId;
    let centerLng = null;
    let centerLat = null;

    if (this.mapData) {
      const feature = this.mapData.features.find(f => f.properties.spaceId === spaceId);
      if (feature) {
        const coords = feature.geometry.coordinates[0];
        centerLng = coords.reduce((sum, c) => sum + c[0], 0) / coords.length;
        centerLat = coords.reduce((sum, c) => sum + c[1], 0) / coords.length;
      }
    }

    if (centerLng === null || centerLat === null) {
      const p = this.data.selectedSpace.position;
      if (p && Array.isArray(p.lngLat)) {
        centerLng = p.lngLat[0];
        centerLat = p.lngLat[1];
      } else if (p && typeof p.x === 'number' && typeof p.y === 'number') {
        centerLng = 113.0 + p.x / 100000;
        centerLat = 23.0 + p.y / 100000;
      }
    }

    if (centerLng === null || centerLat === null) {
      wx.showToast({ title: '无法定位车位', icon: 'error' });
      return;
    }

    const url = `/pages/navigation/navigation?spaceId=${spaceId}&lng=${centerLng}&lat=${centerLat}`;
    wx.navigateTo({ url });
  },

  // 刷新车位状态
  refreshSpaces() {
    this.getSpaceInfo();
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  },

  // 地图缩放功能
  scaleMap(e) {
    const scaleType = e.currentTarget.dataset.type;
    
    if (this.data.isUsingCanvas) {
      // Canvas模式下的缩放
      let newZoom = this.data.camera.zoom;
      
      if (scaleType === 'in') {
        newZoom = Math.min(this.data.camera.zoom * 1.2, 5); // 最大放大到5倍
      } else {
        newZoom = Math.max(this.data.camera.zoom * 0.8, 0.2); // 最小缩小到0.2倍
      }
      
      this.setData({
        'camera.zoom': newZoom
      });
      
      if (this.renderEngine) {
        this.renderEngine.camera.zoom = newZoom;
        this.render();
      }
    } else {
      // 传统模式的缩放
      let newScale = this.data.scale;
      
      if (scaleType === 'in') {
        newScale = Math.min(this.data.scale + 0.1, 2); // 最大放大到2倍
      } else {
        newScale = Math.max(this.data.scale - 0.1, 0.3); // 最小缩小到0.3倍
      }
      
      this.setData({
        scale: newScale,
        mapWidth: 1200 * newScale,
        mapHeight: 500 * newScale
      });
      
      // 重新处理车位位置
      this.getSpaceInfo();
    }
  },

  // 旋转地图
  rotateMap(e) {
    const direction = e.currentTarget.dataset.direction;
    
    if (this.data.isUsingCanvas && this.renderEngine) {
      let newBearing = this.data.camera.bearing;
      
      if (direction === 'left') {
        newBearing = (newBearing - 15 + 360) % 360; // 向左旋转15度
      } else {
        newBearing = (newBearing + 15) % 360; // 向右旋转15度
      }
      
      this.setData({
        'camera.bearing': newBearing
      });
      
      this.renderEngine.camera.bearing = newBearing;
      this.render();
    }
  },

  // 重置视角
  resetView() {
    if (this.data.isUsingCanvas) {
      this.setData({
        'camera.zoom': 1.0,
        'camera.bearing': 0,
        'camera.pitch': 45
      });
      
      if (this.renderEngine) {
        this.renderEngine.camera = this.data.camera;
        this.render();
      }
    }
  },

  // 查找最近空闲车位
  findNearestFreeSpace() {
    const freeSpaces = this.data.spaces.filter(space => space.status === 'available');
    
    if (freeSpaces.length === 0) {
      wx.showToast({
        title: '当前没有空闲车位',
        icon: 'error'
      });
      return;
    }
    
    // 随机选择一个空闲车位（实际应用中可以根据用户位置计算最近距离）
    const randomIndex = Math.floor(Math.random() * freeSpaces.length);
    const nearestSpace = freeSpaces[randomIndex];
    
    this.setData({
      selectedSpace: nearestSpace
    });
    
    // 滚动到选中的车位
    this.scrollToSpace(nearestSpace);
    
    wx.showToast({
      title: `已找到空闲车位 ${nearestSpace.spaceId}`,
      icon: 'success'
    });
  },

  // Canvas触摸事件处理
  onCanvasTouchStart(e) {
    if (!this.data.isUsingCanvas) return;
    
    this.touchStartX = e.touches[0].clientX;
    this.touchStartY = e.touches[0].clientY;
    this.lastTouchTime = Date.now();
  },

  onCanvasTouchMove(e) {
    if (!this.data.isUsingCanvas) return;
    
    const touch = e.touches[0];
    const deltaX = touch.clientX - this.touchStartX;
    const deltaY = touch.clientY - this.touchStartY;
    
    // 拖拽移动地图
    if (this.renderEngine && (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5)) {
      // 这里可以实现地图平移逻辑
      // 简化处理，仅重新渲染
      this.render();
    }
    
    this.touchStartX = touch.clientX;
    this.touchStartY = touch.clientY;
  },

  onCanvasTouchEnd(e) {
    if (!this.data.isUsingCanvas) return;
    
    // 检测是否为点击事件
    const touchDuration = Date.now() - this.lastTouchTime;
    if (touchDuration < 300) {
      const touch = e.changedTouches[0];
      this.handleCanvasTouch(touch);
    }
  },

  // 切换渲染模式
  toggleRenderMode() {
    this.setData({
      isUsingCanvas: !this.data.isUsingCanvas
    });
    
    if (this.data.isUsingCanvas && !this.renderEngine) {
      this.initRenderEngine();
    } else if (!this.data.isUsingCanvas) {
      this.renderEngine = null;
    }
  },

  // 滚动到指定车位（传统模式）
  scrollToSpace(space) {
    if (!this.data.isUsingCanvas) {
      // 获取地图容器
      const query = wx.createSelectorQuery();
      query.select('.map-container').boundingClientRect();
      query.exec((res) => {
        if (res[0]) {
          const containerWidth = res[0].width;
          const containerHeight = res[0].height;
          
          // 计算需要滚动的位置
          const scrollLeft = space.position.x - containerWidth / 2;
          const scrollTop = space.position.y - containerHeight / 2;
          
          // 设置滚动位置
          this.setData({
            scrollLeft: scrollLeft,
            scrollTop: scrollTop
          });
        }
      });
    }
  }
});
