Page({
  data: {
    startPoint: null,
    endPoint: null,
    path: null,
    distance: 0,
    estimatedTime: 0,
    isNavigating: false
  },

  onLoad() {
    // 初始化导航页面
  },

  // 设置起点
  setStartPoint() {
    // 在实际应用中，这里可能需要获取用户当前位置
    this.setData({
      startPoint: { x: 10, y: 10 }
    });
  },

  // 设置终点
  setEndPoint() {
    // 在实际应用中，这里可能需要让用户选择目标车位
    this.setData({
      endPoint: { x: 200, y: 150 }
    });
  },

  // 计算路径
  calculatePath() {
    if (!this.data.startPoint || !this.data.endPoint) {
      wx.showToast({
        title: '请先设置起点和终点',
        icon: 'none'
      });
      return;
    }

    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/path/plan`,
      method: 'POST',
      data: {
        startPoint: this.data.startPoint,
        endPoint: this.data.endPoint,
        obstacles: [] // 在实际应用中传递障碍物信息
      },
      success: (res) => {
        if (res.data.success) {
          const pathData = res.data.data;
          
          this.setData({
            path: pathData.route,
            distance: pathData.distance,
            estimatedTime: pathData.estimatedTime,
            isNavigating: true
          });
          
          wx.showToast({
            title: '路径计算成功',
            icon: 'success'
          });
        } else {
          console.error('路径计算失败:', res.data.message);
          wx.showToast({
            title: '路径计算失败',
            icon: 'error'
          });
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

  // 开始导航
  startNavigation() {
    this.setStartPoint();
    this.setEndPoint();
    this.calculatePath();
  },

  // 结束导航
  endNavigation() {
    this.setData({
      startPoint: null,
      endPoint: null,
      path: null,
      distance: 0,
      estimatedTime: 0,
      isNavigating: false
    });
  }
});