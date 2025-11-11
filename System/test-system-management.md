# 系统管理功能测试

## 测试目的
验证系统管理功能，包括：
1. 重置车位状态
2. 启动数据模拟
3. 停止数据模拟

## 测试步骤

### 1. 登录获取令牌
```bash
curl -X POST http://localhost:3000/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'
```

### 2. 重置车位状态
```bash
curl -X POST http://localhost:3000/api/admin/system/reset-parking-spaces \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

### 3. 启动数据模拟
```bash
curl -X POST http://localhost:3000/api/admin/system/start-data-simulation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"interval": 3000, "maxChanges": 10}'
```

### 4. 停止数据模拟
```bash
curl -X POST http://localhost:3000/api/admin/system/stop-data-simulation \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{}'
```

## 测试结果

### API直接测试结果
- ✅ 登录API：正常工作
- ✅ 重置车位状态API：正常工作，返回"成功重置 160 个车位状态"
- ✅ 启动数据模拟API：正常工作，返回"数据模拟已启动"
- ✅ 停止数据模拟API：正常工作，返回"数据模拟已停止"

### 前端集成测试结果
- ✅ 仪表盘页面：正常加载
- ✅ 数据刷新：正常工作
- ⚠️ 系统管理按钮：需要进一步测试

## 修复的问题
1. 前端API路径错误：修复了`frontend/src/api/index.js`中的API路径，移除了重复的`/api`前缀
2. API函数不匹配：确认了前端组件使用的API函数与定义的函数一致

## 后续工作
1. 在前端仪表盘页面测试系统管理按钮
2. 确保数据模拟能够实时更新仪表盘数据
3. 添加错误处理和用户反馈