App({
  globalData: {
    userInfo: null,
    token: null,
    userId: '',
    baseUrl: 'http://localhost:3001/api',
    systemSettings: {
      systemName: '智能停车场系统',
      systemVersion: '1.0.0',
      companyName: '智能停车场团队',
      contactPhone: '',
      contactEmail: '',
      logoUrl: ''
    }
  },

  onLaunch() {
    // 小程序初始化时执行
    console.log('智能停车场小程序启动');

    this.ensureDevOpenId();
    // 检查登录状态
    this.checkLogin();
    this.fetchPublicSystemSettings();
  },

  ensureDevOpenId() {
    let devOpenId = wx.getStorageSync('devOpenId');
    if (!devOpenId) {
      devOpenId = `device_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
      wx.setStorageSync('devOpenId', devOpenId);
    }
    this.globalData.devOpenId = devOpenId;
    return devOpenId;
  },

  normalizeSessionPayload(data = {}) {
    const rawUserInfo = data.userInfo || data.user || null;
    const normalizedUserInfo = rawUserInfo
      ? {
          id: rawUserInfo.id || rawUserInfo.userId || '',
          userId: rawUserInfo.userId || rawUserInfo.id || '',
          openid: rawUserInfo.openid || '',
          nickName: rawUserInfo.nickName || rawUserInfo.nickname || '微信用户',
          nickname: rawUserInfo.nickname || rawUserInfo.nickName || '微信用户',
          avatarUrl: rawUserInfo.avatarUrl || rawUserInfo.avatar || '',
          avatar: rawUserInfo.avatar || rawUserInfo.avatarUrl || '',
          isGuest: !!rawUserInfo.isGuest
        }
      : null;

    return {
      token: data.token || '',
      userInfo: normalizedUserInfo,
      isNewUser: !!data.isNewUser
    };
  },

  saveSession(data = {}) {
    const normalized = this.normalizeSessionPayload(data);
    const userInfo = normalized.userInfo;
    const token = normalized.token;

    this.globalData.userInfo = userInfo;
    this.globalData.token = token;
    this.globalData.userId = userInfo?.id || '';

    if (userInfo) {
      wx.setStorageSync('userInfo', userInfo);
    }
    if (token) {
      wx.setStorageSync('token', token);
    }
  },

  clearSession() {
    this.globalData.userInfo = null;
    this.globalData.token = null;
    this.globalData.userId = '';
    wx.removeStorageSync('userInfo');
    wx.removeStorageSync('token');
  },

  fetchPublicSystemSettings() {
    return new Promise((resolve) => {
      wx.request({
        url: `${this.globalData.baseUrl}/system/public-settings`,
        method: 'GET',
        success: (res) => {
          if (res.data?.success && res.data.data) {
            this.globalData.systemSettings = {
              ...this.globalData.systemSettings,
              ...res.data.data
            };
            wx.setStorageSync('systemSettings', this.globalData.systemSettings);
          }
          resolve(this.globalData.systemSettings);
        },
        fail: () => {
          const cachedSettings = wx.getStorageSync('systemSettings');
          if (cachedSettings) {
            this.globalData.systemSettings = {
              ...this.globalData.systemSettings,
              ...cachedSettings
            };
          }
          resolve(this.globalData.systemSettings);
        }
      });
    });
  },

  // 检查登录状态
  checkLogin() {
    const token = wx.getStorageSync('token');
    const userInfo = wx.getStorageSync('userInfo');
    if (token) {
      this.globalData.token = token;
      this.globalData.userInfo = userInfo || null;
      this.globalData.userId = userInfo?.id || '';
      return !!userInfo;
    }
    return false;
  },

  // 用户登录
  login(options = {}) {
    const { userInfo = null, guest = false, success, fail } = options;

    return new Promise((resolve, reject) => {
      const onSuccess = (data) => {
        if (typeof success === 'function') {
          success(data);
        }
        resolve(data);
      };

      const onFail = (error) => {
        if (typeof fail === 'function') {
          fail(error);
        }
        reject(error);
      };

      if (guest) {
        wx.request({
          url: `${this.globalData.baseUrl}/user/guest`,
          method: 'POST',
          success: (res) => {
            if (res.data?.success) {
              const normalized = this.normalizeSessionPayload(res.data.data);
              this.saveSession(normalized);
              onSuccess(normalized);
              return;
            }

            onFail(new Error(res.data?.message || '游客登录失败'));
          },
          fail: (error) => onFail(error)
        });
        return;
      }

      wx.login({
        success: (res) => {
          if (!res.code) {
            onFail(new Error(res.errMsg || '获取微信登录凭证失败'));
            return;
          }

          wx.request({
            url: `${this.globalData.baseUrl}/user/login`,
            method: 'POST',
            data: {
              code: res.code,
              userInfo,
              devOpenId: this.ensureDevOpenId()
            },
            success: (loginRes) => {
              if (loginRes.data?.success) {
                const normalized = this.normalizeSessionPayload(loginRes.data.data);
                this.saveSession(normalized);
                onSuccess(normalized);
                return;
              }

              onFail(new Error(loginRes.data?.message || '登录失败'));
            },
            fail: (error) => onFail(error)
          });
        },
        fail: (error) => onFail(error)
      });
    });
  }
});
