# 2.5D 停车场导航系统

## 🎯 功能概述

这是一个基于微信小程序的 2.5D 停车场导航系统，实现了以下核心功能：

- **2.5D 地图渲染**：使用 Canvas 2D API 实现伪 3D 视角的停车场地图
- **A* 路径规划**：自动计算从当前位置到目的地的最优路径
- **虚拟摇杆控制**：通过虚拟摇杆控制车辆移动
- **视角跟随**：地图视角自动跟随车辆移动并旋转
- **实时导航**：显示蓝色导航路径指引

## 📁 项目结构

```
tcc/
├── frontend/miniprogram/
│   ├── assets/
│   │   ├── map_elements.geojson      # 地图元素数据（自动生成）
│   │   └── navigation_graph.json     # 导航图数据（自动生成）
│   ├── pages/
│   │   └── navigation/                # 导航页面
│   │       ├── navigation.js
│   │       ├── navigation.wxml
│   │       ├── navigation.wxss
│   │       └── navigation.json
│   └── utils/
│       ├── astar.js                   # A* 算法实现
│       └── render-engine.js           # 2.5D 渲染引擎
├── scripts/
│   ├── convert-to-geojson.js         # 数据转换脚本
│   └── generate-navigation-graph.js   # 导航图生成脚本
└── tcc1date1.json                     # 原始停车场数据
```

## 🚀 快速开始

### 1. 生成地图数据

首次使用需要生成地图数据：

```bash
# 转换停车场数据为 GeoJSON
node scripts/convert-to-geojson.js

# 生成导航图
node scripts/generate-navigation-graph.js
```

### 2. 导入小程序开发者工具

1. 打开微信开发者工具
2. 导入项目，选择 `frontend/miniprogram` 目录
3. 配置 AppID

### 3. 运行预览

在开发者工具中编译运行，进入"导航"页面即可体验。

## 🎮 使用说明

### 基本操作

1. **移动车辆**：拖动左下角的虚拟摇杆
2. **开始导航**：
   - 点击右下角"开始导航"按钮
   - 从弹出的列表中选择目的地
   - 系统自动规划路径并显示蓝色引导线
3. **停止导航**：点击"停止导航"按钮
4. **重置视角**：点击"重置视角"按钮恢复初始视角

### 摇杆控制

- 摇杆偏离中心越远，车辆速度越快
- 摇杆方向决定车辆移动方向
- 释放摇杆自动回中并停止移动

### 相机视角

- **倾斜角度**：60° 俯视角度（2.5D 效果）
- **旋转**：相机自动跟随车辆朝向旋转
- **缩放**：可通过代码调整 zoom 参数

## 🛠️ 核心技术

### 1. 坐标转换

系统使用三层坐标系统：

```
Canvas 坐标 → 地理坐标 (GeoJSON) → 世界坐标 → 屏幕坐标
```

- **Canvas 坐标**：原始数据中的像素坐标
- **地理坐标**：伪经纬度坐标（用于 GeoJSON）
- **世界坐标**：渲染引擎内部坐标
- **屏幕坐标**：最终显示在 Canvas 上的坐标

### 2. 2.5D 投影

核心算法在 `render-engine.js` 的 `worldToScreen` 方法：

```javascript
// 1. 相对相机坐标
// 2. 旋转变换 (bearing)
// 3. 倾斜投影 (pitch)
// 4. 缩放并平移到屏幕中心
```

### 3. A* 路径规划

```javascript
// 基于节点图的 A* 算法
// 启发式函数：欧几里得距离
// 支持单向和双向边
```

### 4. 游戏循环

30 FPS 的游戏循环：

```javascript
setInterval(() => {
  updateVehicle()  // 更新车辆状态
  render()         // 渲染一帧
}, 1000 / 30)
```

## 🎨 样式定制

### 修改颜色方案

在 `render-engine.js` 中调整各元素颜色：

```javascript
case 'parking_spot':
  const color = status === 'occupied' ? '#FF5252' : '#4CAF50'
  break
```

### 调整视角参数

在 `render-engine.js` 构造函数中修改：

```javascript
this.camera = {
  pitch: 60,   // 倾斜角度（0-90）
  bearing: 0,  // 旋转角度
  zoom: 1      // 缩放级别
}
```

## 📊 数据格式

### GeoJSON 结构

```json
{
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "properties": {
        "id": "1761386568843",
        "type": "parking_spot",
        "status": "available"
      },
      "geometry": {
        "type": "Polygon",
        "coordinates": [[[lng, lat], ...]]
      }
    }
  ]
}
```

### 导航图结构

```json
{
  "nodes": [
    {
      "id": "node-001",
      "x": 165,
      "y": 225,
      "name": "入口1",
      "coordinates": [lng, lat]
    }
  ],
  "edges": [
    {
      "from": "node-001",
      "to": "node-002",
      "oneway": false
    }
  ]
}
```

## 🔧 扩展开发

### 添加新的地图元素

1. 在 `tcc1date1.json` 中添加数据
2. 在 `convert-to-geojson.js` 中添加转换逻辑
3. 在 `render-engine.js` 中添加渲染逻辑

### 添加新的导航节点

1. 在 `generate-navigation-graph.js` 的 `nodes` 数组中添加节点
2. 在 `edges` 数组中添加连接关系
3. 重新运行生成脚本

### 优化性能

- 减少渲染的多边形数量
- 实现视锥剔除（只渲染可见区域）
- 降低帧率或使用 requestAnimationFrame
- 使用离屏 Canvas 预渲染静态元素

## 🐛 常见问题

### Q: 地图不显示？
A: 检查 Canvas 是否初始化完成，查看控制台日志。

### Q: 路径规划失败？
A: 确保起点和终点节点ID正确，检查导航图是否连通。

### Q: 摇杆不响应？
A: 检查 movable-view 的 direction 和 out-of-bounds 属性。

### Q: 性能卡顿？
A: 减少渲染元素，降低帧率，或优化渲染逻辑。

## 📝 TODO

- [ ] 实现双指缩放功能
- [ ] 添加地图拖动功能
- [ ] 实现车位状态实时更新
- [ ] 添加语音导航提示
- [ ] 支持多楼层切换
- [ ] 添加路径平滑算法
- [ ] 实现碰撞检测
- [ ] 添加更多 POI 标注

## 📄 License

MIT License

## 👥 贡献

欢迎提交 Issue 和 Pull Request！

---

**享受你的 2.5D 导航体验！** 🚗💨




