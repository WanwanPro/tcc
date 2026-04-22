const defaultNotices = [
  "欢迎使用智能停车场系统",
  "请遵守停车场相关规定",
  "如有问题请联系管理员"
];

const {
  checkLocationAuth,
  requestLocationAuth
} = require('../../utils/location');

Page({
  data: {
    freeSpaces: 0,
    totalSpaces: 100,
    parkingName: "智能停车场",
    notices: defaultNotices,
    // 定位相关
    locationLoading: false,
    currentLocation: null
  },

  // 定时刷新定时器
  refreshTimer: null,

  onLoad() {
    // 页面加载时获取数据
    this.getSpaceInfo();
    this.getNoticeList();

    // 启动定时刷新（每30秒自动刷新一次）
    this.startAutoRefresh();

    // 自动获取定位
    this.autoGetLocation();
  },

  onUnload() {
    // 页面卸载时清除定时器
    this.stopAutoRefresh();
    this.stopLocationRefresh();
  },

  onHide() {
    // 页面隐藏时停止定位刷新
    this.stopLocationRefresh();
  },

  onShow() {
    // 页面显示时更新数据
    this.getSpaceInfo();
    this.getNoticeList();

    // 确保定时器在运行
    if (!this.refreshTimer) {
      this.startAutoRefresh();
    }

    // 恢复定位刷新
    this.startLocationRefresh();
  },

  onShow() {
    // 页面显示时更新数据
    this.getSpaceInfo();
    this.getNoticeList();
    
    // 确保定时器在运行
    if (!this.refreshTimer) {
      this.startAutoRefresh();
    }
  },

  onHide() {
    // 页面隐藏时可以停止定时刷新以节省资源（可选）
    // this.stopAutoRefresh();
  },

  // 下拉刷新处理
  onPullDownRefresh() {
    console.log('[微信小程序] 下拉刷新触发');
    this.getSpaceInfo(true); // 传入true表示是手动刷新
    this.getNoticeList();
  },

  // 启动自动刷新
  startAutoRefresh() {
    // 清除之前的定时器
    this.stopAutoRefresh();
    
    // 每15秒自动刷新一次（避免请求过于频繁）
    this.refreshTimer = setInterval(() => {
      console.log('[微信小程序] 定时刷新触发');
      this.getSpaceInfo();
    }, 15000); // 15秒 = 15000毫秒（推荐值，可根据需要调整）
  },

  getNoticeList() {
    const app = getApp();

    wx.request({
      url: `${app.globalData.baseUrl}/system/notices?limit=5&_t=${Date.now()}`,
      method: 'GET',
      success: (res) => {
        if (res.data?.success && Array.isArray(res.data.data) && res.data.data.length > 0) {
          const notices = res.data.data.map(item => {
            if (item.title && item.content) {
              return `${item.title}：${item.content}`;
            }
            return item.content || item.title;
          }).filter(Boolean);

          this.setData({
            notices: notices.length ? notices : defaultNotices
          });
          return;
        }

        this.setData({
          notices: defaultNotices
        });
      },
      fail: (error) => {
        console.error('获取公告失败:', error);
        this.setData({
          notices: defaultNotices
        });
      }
    });
  },

  // 停止自动刷新
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },

  // 获取车位信息
  getSpaceInfo(isManualRefresh = false) {
    const app = getApp();
    
    // 添加时间戳防止缓存
    const timestamp = Date.now();
    
    wx.request({
      url: `${app.globalData.baseUrl}/spaces?_t=${timestamp}`,
      success: (res) => {
        if (res.data.success) {
          // 计算空闲车位数
          const spaces = res.data.data || [];
          console.log('[微信小程序] 获取到车位数据:', spaces.length, '个');
          if (spaces.length === 0) {
            wx.showToast({ title: '未获取到数据', icon: 'error' });
          }
          
          // 统计所有状态分布
          const statusBreakdown = spaces.reduce((acc, space) => {
            const status = space.statusKey || space.status || 'unknown';
            acc[status] = (acc[status] || 0) + 1;
            return acc;
          }, {});
          
          // 支持中文状态和英文状态
          // 空闲状态包括：'空闲' 或 'available'
          // 占用状态：'占用'/'occupied'/'reserved'/'预定'/'maintenance'
          const freeSpaces = spaces.filter(space => {
            const status = space.statusKey || space.status;
            return status === 'available' || status === '空闲';
          }).length;
          
          const occupiedSpaces = spaces.filter(space => {
            const status = space.statusKey || space.status;
            return status === 'occupied' || status === '占用' || 
                   status === 'reserved' || status === '预定' || 
                   status === 'maintenance' || status === '维护中';
          }).length;
          
          console.log('[微信小程序] 统计:', {
            total: spaces.length,
            free: freeSpaces,
            occupied: occupiedSpaces,
            statusBreakdown: statusBreakdown,
            calculation: `空闲=${freeSpaces}, 占用=${occupiedSpaces}, 总计=${freeSpaces + occupiedSpaces}, 差异=${spaces.length - (freeSpaces + occupiedSpaces)}`
          });
          
          this.setData({
            freeSpaces: freeSpaces,
            totalSpaces: spaces.length
          });
          
          // 如果是手动下拉刷新，显示提示
          if (isManualRefresh) {
            wx.showToast({
              title: '刷新成功',
              icon: 'success',
              duration: 1500
            });
          }
        } else {
          console.error('获取车位信息失败:', res.data.message);
          if (isManualRefresh) {
            wx.showToast({
              title: '刷新失败',
              icon: 'error'
            });
          }
        }
        
        // 停止下拉刷新动画
        if (isManualRefresh) {
          wx.stopPullDownRefresh();
        }
      },
      fail: (err) => {
        console.error('请求失败:', err);
        wx.showToast({
          title: '网络错误',
          icon: 'error'
        });
        
        // 停止下拉刷新动画
        if (isManualRefresh) {
          wx.stopPullDownRefresh();
        }
      }
    });
  },

  // ============ 定位功能 ============

  async autoGetLocation() {
    this.setData({ locationLoading: true });

    try {
      // 1. 检查权限
      const auth = await checkLocationAuth();

      if (!auth.authorized) {
        if (auth.status === 'denied') {
          wx.showModal({
            title: '需要定位权限',
            content: '开启定位可查找附近停车场',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                wx.openSetting();
              }
            }
          });
          this.setData({ locationLoading: false });
          return;
        }
        await requestLocationAuth();
      }

      // 2. 获取原生定位（不依赖腾讯服务）
      const { getNativeLocation } = require('../../utils/location');
      const location = await getNativeLocation({ highAccuracy: true });
      console.log('[定位] 当前位置:', location);

      // 格式化显示（先显示加载中，等地址解析完成后再更新）
      const displayLocation = {
        latitude: location.latitude,
        longitude: location.longitude,
        formattedAddress: '正在获取地址信息...',
        address: '正在获取地址信息...',
        adInfo: { city: '', district: '' }
      };

      this.setData({
        currentLocation: displayLocation,
        locationLoading: false
      });

      // 3. 尝试获取详细地址（腾讯服务）
      this.fetchAddressDetail(location);

    } catch (err) {
      console.error('[定位] 失败:', err);
      this.setData({ locationLoading: false });
      wx.showToast({
        title: err.message || '定位失败',
        icon: 'none'
      });
    }
  },

  async fetchAddressDetail(location) {
    try {
      const { reverseGeocode } = require('../../utils/location');
      const addressInfo = await reverseGeocode(location.latitude, location.longitude);

      console.log('[定位] 地址解析结果:', addressInfo);

      // 更新位置信息，显示详细地址
      const city = addressInfo.adInfo?.city || '';
      const district = addressInfo.adInfo?.district || '';
      const street = addressInfo.adInfo?.street || '';
      const streetNumber = addressInfo.adInfo?.streetNumber || '';

      // 构建地址描述
      const addressParts = [city, district, street, streetNumber].filter(Boolean);
      const addressDesc = addressParts.length > 0
        ? addressParts.join('')
        : (addressInfo.formattedAddress || addressInfo.address || '位置已获取');

      this.setData({
        currentLocation: {
          ...this.data.currentLocation,
          formattedAddress: addressDesc,
          address: addressDesc,
          adInfo: addressInfo.adInfo || { city, district }
        }
      });

    } catch (err) {
      console.log('[定位] 地址解析失败，使用经纬度:', err.message);
      // 保持默认的经纬度显示
      const lat = location.latitude.toFixed(6);
      const lng = location.longitude.toFixed(6);
      this.setData({
        currentLocation: {
          ...this.data.currentLocation,
          formattedAddress: `当前位置: ${lat}, ${lng}`,
          address: `当前位置: ${lat}, ${lng}`
        }
      });
    }
  },



  // 手动刷新定位
  refreshLocation() {
    this.autoGetLocation();
  },

  // ============ 持续定位刷新（可选） ============

  startLocationRefresh() {
    this.stopLocationRefresh();
    // 每 10 秒刷新一次位置
    this.locationTimer = setInterval(() => {
      this.autoGetLocation();
    }, 10000);
  },

  stopLocationRefresh() {
    if (this.locationTimer) {
      clearInterval(this.locationTimer);
      this.locationTimer = null;
    }
  },

  // 跳转到导航页面
  goToNavigation() {
    wx.switchTab({
      url: '/pages/navigation/navigation'
    });
  }
});
