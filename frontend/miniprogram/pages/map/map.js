Page({
  data: {
    spaces: [],
    freeSpaces: 0,
    selectedSpace: null,
    mapHeight: 500,
    mapWidth: 600,  // 调整地图宽度以适应屏幕
    scale: 0.5,  // 添加缩放比例
    scrollLeft: 0,
    scrollTop: 0
  },

  onLoad() {
    // 获取车位信息
    this.getSpaceInfo();
    
    // 设置地图高度
    this.setMapHeight();
  },

  onShow() {
    // 页面显示时更新数据
    this.getSpaceInfo();
  },

  // 设置地图高度
  setMapHeight() {
    const systemInfo = wx.getSystemInfoSync();
    const mapHeight = systemInfo.windowHeight - 100;
    this.setData({
      mapHeight: mapHeight
    });
  },

  // 获取车位信息
  getSpaceInfo() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/spaces`,
      success: (res) => {
        if (res.data.success) {
          const spaces = res.data.data;
          // 处理车位数据，添加width和height属性，并应用缩放
          const processedSpaces = spaces.map(space => {
            return {
              ...space,
              position: {
                ...space.position,
                x: space.position.x * this.data.scale,
                y: space.position.y * this.data.scale,
                width: 30 * this.data.scale,  // 设置默认宽度并应用缩放
                height: 60 * this.data.scale  // 设置默认高度并应用缩放
              }
            };
          });
          
          const freeSpaces = processedSpaces.filter(space => space.status === 'available').length;
          
          this.setData({
            spaces: processedSpaces,
            freeSpaces: freeSpaces
          });
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

  // 选择车位
  selectSpace(e) {
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

    // 这里可以调用导航API或跳转到导航页面
    wx.showToast({
      title: `正在规划到${this.data.selectedSpace.spaceId}的路线`,
      icon: 'loading',
      duration: 1500
    });

    // 模拟导航过程
    setTimeout(() => {
      wx.showToast({
        title: '路线规划完成',
        icon: 'success'
      });
    }, 1500);
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

  // 滚动到指定车位
  scrollToSpace(space) {
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
});