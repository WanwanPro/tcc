const defaultNotices = [
  "欢迎使用智能停车场系统",
  "请遵守停车场相关规定",
  "如有问题请联系管理员"
];

Page({
  data: {
    freeSpaces: 0,
    totalSpaces: 100,
    parkingName: "智能停车场",
    notices: defaultNotices
  },

  // 定时刷新定时器
  refreshTimer: null,

  onLoad() {
    // 页面加载时获取数据
    this.getSpaceInfo();
    this.getNoticeList();
    
    // 启动定时刷新（每30秒自动刷新一次）
    this.startAutoRefresh();
  },

  onUnload() {
    // 页面卸载时清除定时器
    this.stopAutoRefresh();
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

  // 跳转到导航页面
  goToNavigation() {
    wx.switchTab({
      url: '/pages/navigation/navigation'
    });
  }
});
