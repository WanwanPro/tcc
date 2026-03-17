Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    systemName: '智能停车场系统',
    systemVersion: '1.0.0',
    companyName: '智能停车场团队'
  },

  onLoad() {
    // 页面加载时检查登录状态
    this.checkLoginStatus();
    this.loadSystemSettings();
  },

  onShow() {
    // 页面显示时更新用户信息
    this.checkLoginStatus();
    this.loadSystemSettings();
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp();
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');

    if (userInfo) {
      this.setData({
        userInfo,
        isLoggedIn: true
      });
    } else {
      this.setData({
        userInfo: null,
        isLoggedIn: false
      });
    }
  },

  loadSystemSettings() {
    const app = getApp();
    const applySettings = (settings = {}) => {
      this.setData({
        systemName: settings.systemName || '智能停车场系统',
        systemVersion: settings.systemVersion || '1.0.0',
        companyName: settings.companyName || '智能停车场团队'
      });
    };

    applySettings(app.globalData.systemSettings || wx.getStorageSync('systemSettings'));
    app.fetchPublicSystemSettings().then(applySettings);
  },

  // 用户登录
  login() {
    const app = getApp();

    wx.getUserProfile({
      desc: '用于完善会员资料',
      success: ({ userInfo }) => {
        app.login({
          userInfo,
          success: (data) => {
            this.setData({
              userInfo: data.userInfo,
              isLoggedIn: true
            });

            wx.showToast({
              title: data.isNewUser ? '注册成功' : '登录成功',
              icon: 'success'
            });
          },
          fail: (error) => {
            console.error('登录失败:', error);
            wx.showToast({
              title: error.message || '登录失败',
              icon: 'none'
            });
          }
        });
      },
      fail: () => {
        wx.showToast({
          title: '已取消登录授权',
          icon: 'none'
        });
      }
    });
  },

  guestLogin() {
    const app = getApp();

    app.login({
      guest: true,
      success: (data) => {
        this.setData({
          userInfo: data.userInfo,
          isLoggedIn: true
        });

        wx.showToast({
          title: '游客登录成功',
          icon: 'success'
        });
      },
      fail: (error) => {
        console.error('游客登录失败:', error);
        wx.showToast({
          title: error.message || '登录失败',
          icon: 'none'
        });
      }
    });
  },

  refreshProfile() {
    const app = getApp();
    const token = app.globalData.token || wx.getStorageSync('token');

    if (!token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    wx.request({
      url: `${app.globalData.baseUrl}/user/me`,
      method: 'GET',
      header: {
        Authorization: `Bearer ${token}`
      },
      success: (res) => {
        if (res.data?.success) {
          const normalized = app.normalizeSessionPayload({
            token,
            userInfo: res.data.data
          });
          app.saveSession({
            token: normalized.token,
            userInfo: normalized.userInfo
          });
          this.setData({
            userInfo: normalized.userInfo,
            isLoggedIn: true
          });
          wx.showToast({
            title: '资料已刷新',
            icon: 'success'
          });
          return;
        }

        if (res.statusCode === 401) {
          app.clearSession();
          this.setData({
            userInfo: null,
            isLoggedIn: false
          });
        }

        wx.showToast({
          title: res.data?.message || '刷新失败',
          icon: 'none'
        });
      },
      fail: () => {
        wx.showToast({
          title: '网络错误',
          icon: 'none'
        });
      }
    });
  },

  // 用户退出
  logout() {
    const app = getApp();
    app.clearSession();
    
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
