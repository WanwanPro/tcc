Page({
  data: {
    spaces: [],
    freeSpaces: 0,
    selectedSpace: null,
    mapHeight: 500
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
          const freeSpaces = spaces.filter(space => space.status === '空闲').length;
          
          this.setData({
            spaces: spaces,
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
    
    // 可以在这里添加导航逻辑
  },

  // 刷新车位状态
  refreshSpaces() {
    this.getSpaceInfo();
    wx.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  }
});