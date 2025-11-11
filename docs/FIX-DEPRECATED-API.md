# 🔧 修复弃用 API

## 问题描述

微信小程序控制台提示：
```
wx.getSystemInfoSync is deprecated. Please use wx.getSystemSetting/wx.getAppAuthorizeSetting/wx.getDeviceInfo/wx.getWindowInfo/wx.getAppBaseInfo instead.
```

## ✅ 已修复

### 1. navigation.js

**修复前**：
```javascript
const dpr = wx.getSystemInfoSync().pixelRatio
```

**修复后**：
```javascript
const deviceInfo = wx.getDeviceInfo()
const dpr = deviceInfo.pixelRatio || 2
```

### 2. map.js

**修复前**：
```javascript
const systemInfo = wx.getSystemInfoSync();
const mapHeight = systemInfo.windowHeight - 100;
```

**修复后**：
```javascript
const windowInfo = wx.getWindowInfo();
const mapHeight = windowInfo.windowHeight - 100;
```

## 📝 新的 API 说明

| 旧 API | 新 API | 用途 |
|--------|--------|------|
| `wx.getSystemInfoSync()` | `wx.getDeviceInfo()` | 获取设备信息（如 pixelRatio） |
| | `wx.getWindowInfo()` | 获取窗口信息（如 windowHeight, windowWidth） |
| | `wx.getAppBaseInfo()` | 获取 App 基础信息 |
| | `wx.getSystemSetting()` | 获取系统设置 |
| | `wx.getAppAuthorizeSetting()` | 获取授权设置 |

## 🎯 修改的文件

1. ✅ `frontend/miniprogram/pages/navigation/navigation.js`
2. ✅ `frontend/miniprogram/pages/map/map.js`

---

**所有弃用 API 已替换为新的推荐 API！** ✅




