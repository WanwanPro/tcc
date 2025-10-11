Page({
  data: {
    userInfo: null,
    isLoggedIn: false
  },

  onLoad() {
    // 页面加载时检查登录状态
    this.checkLoginStatus();
  },

  onShow() {
    // 页面显示时更新用户信息
    this.checkLoginStatus();
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        isLoggedIn: true
      });
    } else {
      // 从本地存储获取用户信息
      const userInfo = wx.getStorageSync('userInfo');
      if (userInfo) {
        this.setData({
          userInfo: userInfo,
          isLoggedIn: true
        });
      }
    }
  },

  // 用户登录
  login() {
    const app = getApp();
    
    app.login((data) => {
      this.setData({
        userInfo: data.user,
        isLoggedIn: true
      });
      
      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });
    });
  },

  // 用户退出
  logout() {
    // 清除本地存储的用户信息
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
    
    // 清除全局数据
    const app = getApp();
    app.globalData.userInfo = null;
    app.globalData.token = null;
    
    // 更新页面数据
    this.setData({
      userInfo: null,
      isLoggedIn: false
    });
    
    wx.showToast({
      title: '已退出登录',
      icon: 'success'
    });
  },

  // 查看历史记录
  viewHistory() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  },

  // 系统设置
  systemSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    });
  }
});