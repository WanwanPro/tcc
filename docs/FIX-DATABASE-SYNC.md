# 🔧 修复数据库同步问题

## 问题描述

首页显示空闲车位和总车位数量为零，没有和数据库同步。

**原因**：TCC 后端数据库（`parking_system`）中可能没有停车位数据。

## ✅ 解决方案

### 方法 1: 使用初始化脚本（推荐）

我创建了一个初始化脚本来导入 `tcc1date1.json` 的停车位数据到 TCC 后端数据库。

#### 步骤：

1. **运行初始化脚本**：
   ```bash
   cd backend
   npm run init-spaces
   ```

   或者直接运行：
   ```bash
   node backend/scripts/init-tcc-spaces.js
   ```

2. **脚本会**：
   - 连接 TCC 后端数据库 (`parking_system`)
   - 读取 `tcc1date1.json` 中的 168 个停车位数据
   - 清除现有停车位（如果存在）
   - 导入所有停车位，并随机设置约 30% 为占用状态
   - 显示统计信息

3. **验证数据**：
   - 重新启动小程序
   - 首页应该显示正确的车位数量

### 方法 2: 通过 API 同步（如果 System 后端已有数据）

如果 System 后端已经有数据，可以使用同步功能：

1. **调用同步 API**：
   ```bash
   POST http://localhost:3001/api/spaces/sync-all
   ```

   这会从 System 后端同步车位数据到 TCC 后端。

### 方法 3: 手动检查数据库

1. **连接 MongoDB**：
   ```bash
   mongo mongodb://192.168.0.78:27017/parking_system
   ```

2. **检查停车位数据**：
   ```javascript
   db.parkingspaces.count()
   ```

3. **查看数据**：
   ```javascript
   db.parkingspaces.find().limit(5)
   ```

## 📊 数据格式

初始化脚本会将 `tcc1date1.json` 中的停车位转换为以下格式：

```javascript
{
  spaceId: "TCC1-001",  // 自动生成
  position: {
    x: 131.5,
    y: 132
  },
  status: "空闲" | "占用" | "预定",  // 随机设置
  updatedAt: Date
}
```

## 🎯 预期结果

运行初始化脚本后，应该看到：

```
✅ 数据库连接成功
📦 读取到 168 个停车位数据
🗑️  已清除 X 个现有停车位
✅ 成功插入 168 个停车位

📊 数据库统计:
   总车位: 168
   空闲: ~118
   占用: ~50
   预定: 0

✅ TCC 停车位数据初始化完成！
```

## 🔄 重新初始化

如果需要重新初始化数据（清除现有数据并重新导入）：

```bash
npm run init-spaces
```

脚本会自动清除现有数据并重新导入。

## ⚠️ 注意事项

1. **数据备份**：初始化脚本会清除现有数据，请确保已备份（如果需要）
2. **MongoDB 连接**：确保 MongoDB 服务运行并可访问
3. **数据库名称**：默认使用 `parking_system`，可在 `.env` 中配置 `MONGODB_URI`

## 📝 环境变量

如果需要修改数据库连接，在 `backend/.env` 文件中设置：

```
MONGODB_URI=mongodb://192.168.0.78:27017/parking_system
```

---

**运行初始化脚本后，首页应该能正确显示车位数量了！** ✅




