// pages/navigation/navigation.js
const RenderEngine = require('../../utils/render-engine')
const { astar, findNearestNode } = require('../../utils/astar')

Page({
  data: {
    loading: true,
    isNavigating: false,
    showDestPicker: false,
    speed: 0,
    bearing: 0,
    joystickX: 50,
    joystickY: 50,
    destinations: [
      { id: 'node-001', name: '入口1', desc: '主入口' },
      { id: 'node-018', name: '出口', desc: '停车场出口' },
      { id: 'node-041', name: '电梯', desc: '前往其他楼层' },
      { id: 'node-020', name: 'B区车位', desc: '停车区B' },
      { id: 'node-006', name: 'A区车位', desc: '停车区A' }
    ]
  },

  // 状态变量
  canvas: null,
  ctx: null,
  renderEngine: null,
  mapData: null,
  navigationGraph: null,
  gameLoop: null,
  
  // 车辆状态
  vehicleState: {
    lng: 113.0,
    lat: 23.0,
    bearing: 0,
    speed: 0
  },

  // 摇杆状态
  joystickState: {
    dx: 0,
    dy: 0
  },

  // 路径
  currentPath: [],
  destinationNodeId: null,

  /**
   * 生命周期 - 页面加载
   */
  onLoad() {
    wx.showLoading({ title: '加载中...', mask: true })
    this.initCanvas()
    this.loadMapData()
  },

  /**
   * 生命周期 - 页面显示
   */
  onShow() {
    if (this.renderEngine && !this.gameLoop) {
      this.startGameLoop()
    }
  },

  /**
   * 生命周期 - 页面隐藏
   */
  onHide() {
    this.stopGameLoop()
  },

  /**
   * 生命周期 - 页面卸载
   */
  onUnload() {
    this.stopGameLoop()
  },

  /**
   * 初始化 Canvas
   */
  initCanvas() {
    const query = wx.createSelectorQuery()
    query.select('#mapCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (!res[0]) return
        
        const canvas = res[0].node
        const ctx = canvas.getContext('2d')
        
        // 使用新的 API 替代已弃用的 getSystemInfoSync
        const deviceInfo = wx.getDeviceInfo()
        const dpr = deviceInfo.pixelRatio || 2
        canvas.width = res[0].width * dpr
        canvas.height = res[0].height * dpr
        ctx.scale(dpr, dpr)
        
        this.canvas = canvas
        this.ctx = ctx
        this.renderEngine = new RenderEngine(canvas, ctx)
        
        console.log('Canvas initialized:', canvas.width, canvas.height)
      })
  },

  /**
   * 加载地图数据
   */
  async loadMapData() {
    try {
      console.log('[导航] 开始加载地图数据...')
      
      // 加载 GeoJSON（已转换为 JS 模块）
      const mapData = require('../../assets/map_elements.js')
      this.mapData = mapData
      console.log('[导航] GeoJSON 加载成功, 特征数:', mapData.features.length)
      
      // 加载导航图（已转换为 JS 模块）
      const navGraph = require('../../assets/navigation_graph.js')
      this.navigationGraph = navGraph
      console.log('[导航] 导航图加载成功, 节点数:', navGraph.nodes.length)
      
      // 等待 Canvas 初始化
      console.log('[导航] 等待 Canvas 初始化...')
      await this.waitForCanvas()
      console.log('[导航] Canvas 初始化完成')
      
      if (!this.renderEngine) {
        throw new Error('渲染引擎未初始化')
      }
      
      // 加载到渲染引擎
      this.renderEngine.loadMapData(mapData)
      console.log('[导航] 地图数据已加载到渲染引擎')
      
      // 设置初始车辆位置（入口处）
      const entranceNode = navGraph.nodes.find(n => n.name === '入口1')
      if (entranceNode) {
        this.vehicleState.lng = entranceNode.coordinates[0]
        this.vehicleState.lat = entranceNode.coordinates[1]
        const worldPos = this.renderEngine.geoToWorld(this.vehicleState.lng, this.vehicleState.lat)
        this.renderEngine.setCamera(worldPos.x, worldPos.y)
        console.log('[导航] 初始位置设置:', { lng: this.vehicleState.lng, lat: this.vehicleState.lat })
      } else {
        // 使用默认位置
        this.vehicleState.lng = 113.0
        this.vehicleState.lat = 23.0
        const worldPos = this.renderEngine.geoToWorld(this.vehicleState.lng, this.vehicleState.lat)
        this.renderEngine.setCamera(worldPos.x, worldPos.y)
        console.log('[导航] 使用默认位置')
      }
      
      // 首次渲染
      console.log('[导航] 开始首次渲染...')
      this.render()
      console.log('[导航] 首次渲染完成')
      
      // 启动游戏循环
      this.startGameLoop()
      console.log('[导航] 游戏循环已启动')
      
      this.setData({ loading: false })
      wx.hideLoading()
      
      wx.showToast({
        title: '地图加载成功',
        icon: 'success',
        duration: 2000
      })
      
    } catch (error) {
      console.error('[导航] 加载地图数据失败:', error)
      console.error('[导航] 错误堆栈:', error.stack)
      wx.hideLoading()
      this.setData({ loading: false })
      
      wx.showModal({
        title: '加载失败',
        content: `地图数据加载失败: ${error.message}`,
        showCancel: false
      })
    }
  },

  /**
   * 等待 Canvas 初始化完成
   */
  waitForCanvas() {
    return new Promise((resolve, reject) => {
      let attempts = 0
      const maxAttempts = 50 // 最多等待 5 秒
      
      const check = () => {
        attempts++
        
        if (this.canvas && this.ctx && this.renderEngine) {
          console.log('[导航] Canvas 准备就绪')
          resolve()
        } else if (attempts >= maxAttempts) {
          console.error('[导航] Canvas 初始化超时')
          reject(new Error('Canvas 初始化超时'))
        } else {
          setTimeout(check, 100)
        }
      }
      
      check()
    })
  },

  /**
   * 启动游戏循环
   */
  startGameLoop() {
    if (this.gameLoop) return
    
    this.gameLoop = setInterval(() => {
      this.updateVehicle()
      this.render()
    }, 1000 / 30)  // 30 FPS
    
    console.log('Game loop started')
  },

  /**
   * 停止游戏循环
   */
  stopGameLoop() {
    if (this.gameLoop) {
      clearInterval(this.gameLoop)
      this.gameLoop = null
      console.log('Game loop stopped')
    }
  },

  /**
   * 更新车辆状态
   */
  updateVehicle() {
    const { dx, dy } = this.joystickState
    
    if (dx === 0 && dy === 0) {
      this.vehicleState.speed = 0
      this.setData({ speed: 0 })
      return
    }
    
    // 速度和方向
    const speed = Math.sqrt(dx * dx + dy * dy) * 0.00001  // 调整速度系数
    const bearing = Math.atan2(dx, -dy) * (180 / Math.PI)
    
    this.vehicleState.speed = speed
    this.vehicleState.bearing = bearing
    
    // 更新位置
    this.vehicleState.lng += dx * 0.00001
    this.vehicleState.lat += dy * 0.00001
    
    // 更新相机
    const worldPos = this.renderEngine.geoToWorld(this.vehicleState.lng, this.vehicleState.lat)
    this.renderEngine.setCamera(worldPos.x, worldPos.y, -bearing)
    
    // 更新显示
    this.setData({
      speed: speed * 10000,  // 转换为更友好的数值
      bearing: (bearing + 360) % 360
    })
  },

  /**
   * 渲染一帧
   */
  render() {
    if (!this.renderEngine) return
    
    this.renderEngine.render(
      this.vehicleState,
      this.currentPath
    )
  },

  /**
   * 摇杆变化事件
   */
  onJoystickChange(e) {
    const { x, y } = e.detail
    
    // 计算相对中心的偏移 (-1 到 1)
    const dx = (x - 50) / 50
    const dy = (y - 50) / 50
    
    this.joystickState = { dx, dy }
  },

  /**
   * 摇杆释放事件
   */
  onJoystickRelease() {
    this.joystickState = { dx: 0, dy: 0 }
    this.setData({
      joystickX: 50,
      joystickY: 50
    })
  },

  /**
   * 开始/停止导航
   */
  toggleNavigation() {
    if (this.data.isNavigating) {
      // 停止导航
      this.currentPath = []
      this.destinationNodeId = null
      this.setData({ isNavigating: false })
      wx.showToast({ title: '导航已停止', icon: 'none' })
    } else {
      // 开始导航 - 打开目的地选择器
      this.setData({ showDestPicker: true })
    }
  },

  /**
   * 选择目的地
   */
  selectDestination() {
    this.setData({ showDestPicker: true })
  },

  /**
   * 关闭目的地选择器
   */
  closePicker() {
    this.setData({ showDestPicker: false })
  },

  /**
   * 选择一个目的地
   */
  selectDest(e) {
    const destId = e.currentTarget.dataset.id
    const dest = this.data.destinations.find(d => d.id === destId)
    
    if (!dest) return
    
    this.setData({ 
      showDestPicker: false,
      isNavigating: true
    })
    
    // 计算路径
    this.calculateRoute(destId, dest.name)
  },

  /**
   * 计算路径
   */
  calculateRoute(destNodeId, destName) {
    wx.showLoading({ title: '规划路径中...' })
    
    try {
      // 找到当前位置最近的节点
      const currentNodeId = findNearestNode(
        this.navigationGraph,
        [this.vehicleState.lng, this.vehicleState.lat]
      )
      
      // 使用 A* 算法计算路径
      const path = astar(this.navigationGraph, currentNodeId, destNodeId)
      
      if (path && path.length > 0) {
        this.currentPath = path
        this.destinationNodeId = destNodeId
        
        wx.hideLoading()
        wx.showToast({
          title: `导航至${destName}`,
          icon: 'success'
        })
      } else {
        wx.hideLoading()
        wx.showToast({
          title: '无法找到路径',
          icon: 'error'
        })
        this.setData({ isNavigating: false })
      }
      
    } catch (error) {
      console.error('路径规划失败:', error)
      wx.hideLoading()
      wx.showToast({
        title: '路径规划失败',
        icon: 'error'
      })
      this.setData({ isNavigating: false })
    }
  },

  /**
   * 重置相机
   */
  resetCamera() {
    if (!this.renderEngine) return
    
    const worldPos = this.renderEngine.geoToWorld(this.vehicleState.lng, this.vehicleState.lat)
    this.renderEngine.setCamera(worldPos.x, worldPos.y, 0)
    this.vehicleState.bearing = 0
    
    this.setData({ bearing: 0 })
    
    wx.showToast({
      title: '视角已重置',
      icon: 'success'
    })
  },

  /**
   * Canvas 触摸事件（用于缩放和拖动）
   */
  onCanvasTouchStart(e) {
    // TODO: 实现双指缩放
  },

  onCanvasTouchMove(e) {
    // TODO: 实现拖动地图
  },

  onCanvasTouchEnd(e) {
    // TODO: 结束触摸
  }
})
