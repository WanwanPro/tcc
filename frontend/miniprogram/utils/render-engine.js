/**
 * 2.5D 渲染引擎
 * 实现伪 3D 视角的停车场地图渲染
 */

class RenderEngine {
  constructor(canvas, context) {
    this.canvas = canvas
    this.ctx = context || (canvas && typeof canvas.getContext === 'function' ? canvas.getContext('2d') : null)
    this.camera = {
      x: 0,
      y: 0,
      zoom: 1,
      pitch: 60,  // 倾斜角度（度）
      bearing: 0  // 旋转角度（度）
    }
    this.mapData = null
    this.vehiclePosition = null
    this.routePath = []
  }

  setSize(width, height) {
    if (!this.canvas) return
    const dpr = typeof wx !== 'undefined' && wx.getDeviceInfo ? (wx.getDeviceInfo().pixelRatio || 1) : 1
    this.canvas.width = Math.max(1, Math.floor(width * dpr))
    this.canvas.height = Math.max(1, Math.floor(height * dpr))
    if (this.ctx && dpr !== 1) {
      this.ctx.setTransform(1, 0, 0, 1, 0, 0)
      this.ctx.scale(dpr, dpr)
    }
  }

  /**
   * 加载地图数据
   */
  loadMapData(geojson) {
    this.mapData = geojson
  }

  /**
   * 设置相机位置
   */
  setCamera(x, y, bearing = null) {
    this.camera.x = x
    this.camera.y = y
    if (bearing !== null) {
      this.camera.bearing = bearing
    }
  }

  /**
   * 世界坐标转屏幕坐标（应用 2.5D 投影）
   */
  worldToScreen(worldX, worldY) {
    // 1. 相对相机的坐标
    let dx = worldX - this.camera.x
    let dy = worldY - this.camera.y

    // 2. 旋转（bearing）
    const bearing = this.camera.bearing * Math.PI / 180
    const rotX = dx * Math.cos(bearing) - dy * Math.sin(bearing)
    const rotY = dx * Math.sin(bearing) + dy * Math.cos(bearing)

    // 3. 应用倾斜（pitch）- 简化的伪3D投影
    const pitch = this.camera.pitch * Math.PI / 180
    const projY = rotY * Math.cos(pitch)
    
    // 4. 缩放和平移到屏幕中心
    const screenX = rotX * this.camera.zoom + this.canvas.width / 2
    const screenY = projY * this.camera.zoom + this.canvas.height / 2

    return { x: screenX, y: screenY }
  }

  /**
   * 坐标转换（地理坐标到世界坐标）
   */
  geoToWorld(lng, lat) {
    // 简单的比例转换
    const scale = 100000  // 根据实际需要调整
    return {
      x: (lng - 113.0) * scale,
      y: (lat - 23.0) * scale
    }
  }

  /**
   * 绘制多边形
   */
  drawPolygon(coordinates, fillStyle, strokeStyle = null) {
    if (!coordinates || coordinates.length === 0) return

    this.ctx.beginPath()
    const firstPoint = this.geoToWorld(coordinates[0][0], coordinates[0][1])
    const firstScreen = this.worldToScreen(firstPoint.x, firstPoint.y)
    this.ctx.moveTo(firstScreen.x, firstScreen.y)

    for (let i = 1; i < coordinates.length; i++) {
      const point = this.geoToWorld(coordinates[i][0], coordinates[i][1])
      const screen = this.worldToScreen(point.x, point.y)
      this.ctx.lineTo(screen.x, screen.y)
    }

    this.ctx.closePath()

    if (fillStyle) {
      this.ctx.fillStyle = fillStyle
      this.ctx.fill()
    }

    if (strokeStyle) {
      this.ctx.strokeStyle = strokeStyle
      this.ctx.lineWidth = 1
      this.ctx.stroke()
    }
  }

  /**
   * 绘制线路
   */
  drawLineString(coordinates, strokeStyle, lineWidth) {
    if (!coordinates || coordinates.length < 2) return

    this.ctx.beginPath()
    const firstPoint = this.geoToWorld(coordinates[0][0], coordinates[0][1])
    const firstScreen = this.worldToScreen(firstPoint.x, firstPoint.y)
    this.ctx.moveTo(firstScreen.x, firstScreen.y)

    for (let i = 1; i < coordinates.length; i++) {
      const point = this.geoToWorld(coordinates[i][0], coordinates[i][1])
      const screen = this.worldToScreen(point.x, point.y)
      this.ctx.lineTo(screen.x, screen.y)
    }

    this.ctx.strokeStyle = strokeStyle
    this.ctx.lineWidth = lineWidth
    this.ctx.stroke()
  }

  /**
   * 绘制点（圆形）
   */
  drawPoint(coordinates, fillStyle, radius) {
    const point = this.geoToWorld(coordinates[0], coordinates[1])
    const screen = this.worldToScreen(point.x, point.y)

    this.ctx.beginPath()
    this.ctx.arc(screen.x, screen.y, radius, 0, 2 * Math.PI)
    this.ctx.fillStyle = fillStyle
    this.ctx.fill()
  }

  /**
   * 渲染地图元素
   */
  renderMapElements() {
    if (!this.mapData) return

    this.mapData.features.forEach(feature => {
      const type = feature.properties.type
      const geometry = feature.geometry

      switch (type) {
        case 'parking_spot':
          const color = feature.properties.status === 'occupied' ? '#FF5252' : '#4CAF50'
          this.drawPolygon(geometry.coordinates[0], color, '#333')
          break

        case 'wall':
          this.drawPolygon(geometry.coordinates[0], '#757575', '#424242')
          break

        case 'obstacle':
          this.drawPolygon(geometry.coordinates[0], '#FF9800', '#F57C00')
          break

        case 'entrance':
          this.drawPoint(geometry.coordinates, '#2196F3', 8)
          break

        case 'elevator':
          this.drawPoint(geometry.coordinates, '#9C27B0', 8)
          break

        case 'traffic_sign':
          this.drawPoint(geometry.coordinates, '#FFC107', 5)
          break
      }
    })
  }

  /**
   * 渲染路径
   */
  renderPath(path) {
    if (!path || path.length < 2) return
    this.drawLineString(path, '#1E90FF', 6)
  }

  /**
   * 渲染车辆
   */
  renderVehicle(lng, lat, bearing) {
    const point = this.geoToWorld(lng, lat)
    const screen = this.worldToScreen(point.x, point.y)

    this.ctx.save()
    this.ctx.translate(screen.x, screen.y)
    this.ctx.rotate((bearing + this.camera.bearing) * Math.PI / 180)

    // 绘制三角形代表车辆
    this.ctx.beginPath()
    this.ctx.moveTo(0, -15)
    this.ctx.lineTo(-10, 15)
    this.ctx.lineTo(10, 15)
    this.ctx.closePath()

    this.ctx.fillStyle = '#FF4081'
    this.ctx.fill()
    this.ctx.strokeStyle = '#fff'
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    this.ctx.restore()
  }

  /**
   * 清空画布
   */
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    
    // 绘制背景
    this.ctx.fillStyle = '#E0E0E0'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * 渲染一帧
   */
  render(vehicleState, routePath) {
    this.clear()
    this.renderMapElements()
    
    if (routePath && routePath.length > 0) {
      this.renderPath(routePath)
    }
    
    if (vehicleState) {
      this.renderVehicle(vehicleState.lng, vehicleState.lat, vehicleState.bearing)
    }
  }
}

module.exports = RenderEngine




