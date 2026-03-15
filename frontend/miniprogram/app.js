App({
  globalData: {
    userInfo: null,
    token: null,
    baseUrl: 'http://localhost:3001/api'
  },

  onLaunch() {
    // 小程序初始化时执行
    console.log('智能停车场小程序启动');

    // 检查登录状态
    this.checkLogin();
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token');
    if (token) {
      this.globalData.token = token;
      // 可以在这里验证token有效性
    }
  },

  // 用户登录
  login(successCallback) {
    wx.login({
      success: (res) => {
        if (res.code) {
          // 发送code到后端获取token
          wx.request({
            url: `${this.globalData.baseUrl}/users/login`,
            method: 'POST',
            data: {
              code: res.code
            },
            success: (loginRes) => {
              if (loginRes.data.success) {
                // 保存用户信息和token
                this.globalData.userInfo = loginRes.data.data.user;
                this.globalData.token = loginRes.data.data.token;

                // 保存到本地存储
                wx.setStorageSync('userInfo', loginRes.data.data.user);
                wx.setStorageSync('token', loginRes.data.data.token);

                if (successCallback) {
                  successCallback(loginRes.data.data);
                }
              } else {
                console.error('登录失败:', loginRes.data.message);
              }
            },
            fail: (err) => {
              console.error('登录请求失败:', err);
            }
          });
        } else {
          console.error('登录失败！' + res.errMsg);
        }
      }
    });
  }
});