Page({
  data: {
    freeSpaces: 0,
    totalSpaces: 100,
    parkingName: "智能停车场",
    notices: [
      "欢迎使用智能停车场系统",
      "请遵守停车场相关规定",
      "如有问题请联系管理员"
    ]
  },

  onLoad() {
    // 页面加载时获取数据
    this.getSpaceInfo();
  },

  onShow() {
    // 页面显示时更新数据
    this.getSpaceInfo();
  },

  // 获取车位信息
  getSpaceInfo() {
    const app = getApp();
    
    wx.request({
      url: `${app.globalData.baseUrl}/spaces`,
      success: (res) => {
        if (res.data.success) {
          // 计算空闲车位数
          const spaces = res.data.data;
          const freeSpaces = spaces.filter(space => space.status === '空闲').length;
          
          this.setData({
            freeSpaces: freeSpaces,
            totalSpaces: spaces.length
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

  // 跳转到地图页面
  goToMap() {
    wx.switchTab({
      url: '/pages/map/map'
    });
  },

  // 跳转到导航页面
  goToNavigation() {
    wx.switchTab({
      url: '/pages/navigation/navigation'
    });
  }
});