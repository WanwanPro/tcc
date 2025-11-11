# 登录问题修复总结

## 发现的问题

### 1. API路径重复 ❌
- **错误**：前端请求路径变成了 `/api/api/admin/auth/login`
- **原因**：
  - `request.js` 的 `baseURL` 已经是 `/api`
  - API调用时又使用了 `/api/admin/auth/login`
  - 导致路径重复
- **修复**：将API路径从 `/api/admin/auth/login` 改为 `/admin/auth/login`

### 2. System后端未启动 ❌
- **错误**：`ECONNREFUSED :5000` - 无法连接到5000端口
- **原因**：System后端服务可能未成功启动
- **解决方案**：需要检查后端启动日志

## 已修复的文件

1. ✅ `System/frontend/src/api/user.js`
   - 修复所有认证相关API路径（移除多余的 `/api` 前缀）

2. ✅ `System/frontend/vite.config.js`
   - 修复代理目标端口（从3000改为5000）

3. ✅ `System/backend/server.js`
   - 添加前端端口到CORS允许列表

## 修复后的API路径

- 登录：`/api/admin/auth/login`（实际：baseURL `/api` + 路径 `/admin/auth/login`）
- 获取信息：`/api/admin/auth/info`
- 登出：`/api/admin/auth/logout`
- 修改密码：`/api/admin/auth/change-password`

## 下一步操作

1. **重启前端服务**（让vite配置生效）
   - 关闭前端窗口
   - 重新运行 `start-all.bat` 或手动启动前端

2. **确认System后端已启动**
   - 检查 "System Management Backend" 窗口
   - 应该看到 "Server running in development mode on port 5000"
   - 如果有错误，请查看错误信息

3. **测试登录**
   - 刷新浏览器页面
   - 使用 admin / admin123 登录

## 如果System后端仍然无法启动

请检查：
1. MongoDB是否在运行（192.168.0.78:27017）
2. System/backend目录下是否有 node_modules
3. 是否有端口冲突（5000端口被占用）
4. 查看后端启动窗口的错误信息




