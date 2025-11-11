# 🔄 数据统一同步指南

## 问题分析

目前存在数据不一致的问题：

| 页面/系统 | 显示数量 | 数据来源 |
|----------|---------|---------|
| 仪表盘 `/dashboard` | 160 | System后端 - `parking_admin` 数据库 |
| 车位状态 `/parking/status` | 200 (硬编码初始值) | System后端 - `parking_admin` 数据库 |
| 微信小程序 | 168 | TCC后端 - `parking_system` 数据库 |

**根本原因**：
- System后端使用 `parking_admin` 数据库
- TCC后端使用 `parking_system` 数据库
- 两个数据库数据不同步

## ✅ 解决方案

### 方案1：统一使用 System 数据库（推荐）

将所有数据同步到 System 后端的 `parking_admin` 数据库，让所有系统使用同一个数据源。

#### 步骤1：运行同步脚本

```bash
cd System/backend
node scripts/sync-from-tcc-db.js
```

这个脚本会：
1. 从 TCC 数据库（`parking_system`）读取 168 个车位
2. 转换数据格式（中文状态 → 英文状态）
3. 同步到 System 数据库（`parking_admin`）
4. 更新停车场的总车位数

#### 步骤2：修改 TCC 后端使用 System 数据库（可选）

如果要让 TCC 后端也使用 System 数据库，修改 `backend/server.js`：

```javascript
const conn = await mongoose.connect(
  process.env.MONGODB_URI || 'mongodb://192.168.0.78:27017/parking_admin',
  // ...
)
```

### 方案2：定期同步数据

创建一个定时任务，定期从 TCC 同步到 System。

### 方案3：使用单一数据源

让微信小程序直接调用 System 后端 API，而不是 TCC 后端。

## 🔧 已修复的问题

### 1. ✅ 前端硬编码初始值

修复了 `parking/status.vue` 中的硬编码值：
- 从 `total: 200` 改为 `total: 0`
- 现在会从 API 实时获取数据

### 2. ✅ 创建了同步脚本

创建了 `System/backend/scripts/sync-from-tcc-db.js` 用于数据同步

## 📝 执行同步

### 立即执行同步

```bash
cd System/backend
node scripts/sync-from-tcc-db.js
```

### 预期输出

```
开始同步车位数据...

1. 连接 TCC 数据库...
   ✅ TCC 数据库连接成功
2. 连接 System 数据库...
   ✅ System 数据库连接成功

3. 从 TCC 数据库读取车位数据...
   ✅ 读取到 168 个车位

4. 查找或创建 TCC1 停车场...
   ✅ 找到 TCC1 停车场

5. 清除 System 数据库中的旧数据...
   ✅ 删除了 X 个旧车位

6. 转换并同步车位数据...
   ✅ 成功插入 168 个车位

   ✅ 更新了停车场统计信息

📊 同步结果统计:
   总车位: 168
   available: 121
   occupied: 47

✅ 数据同步完成！
```

## 🎯 同步后验证

### 1. 验证仪表盘

访问 `http://localhost:5002/dashboard`，应该显示：
- **总车位数**: 168

### 2. 验证车位状态页面

访问 `http://localhost:5002/parking/status`，应该显示：
- **总车位数**: 168（从实际数据计算）

### 3. 验证小程序

刷新小程序首页，应该显示：
- **总车位数**: 168
- **空闲车位**: 121

## 🔄 后续维护

### 定期同步（如果需要保持两个数据库同步）

可以设置定时任务，或者在 TCC 后端更新数据时自动同步到 System 后端。

### 推荐方案

**建议统一使用 System 数据库**：
1. 修改 TCC 后端连接 System 数据库
2. 所有系统使用同一个数据源
3. 避免数据不一致问题

---

**运行同步脚本后，所有页面应该显示相同的车位数量（168）！** ✅




