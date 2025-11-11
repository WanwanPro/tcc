# 修复总结

## 已修复的问题

### 1. ✅ System后端端口错误
- **问题**：System后端启动在3000端口，而不是5000端口
- **原因**：环境变量PORT被设置为3000
- **修复**：
  - 在 `System/backend/package.json` 的 `dev` 脚本中明确设置 `PORT=5000`
  - 使用 `cross-env` 确保跨平台兼容
  - 安装 `cross-env` 作为开发依赖

### 2. ✅ 统一窗口启动
- **问题**：启动后出现4个独立窗口，管理不便
- **修复**：
  - 安装 `concurrently` 工具
  - 创建 `start-all-unified.bat` 统一启动脚本
  - 更新 `start-all.bat` 提供选择菜单（统一窗口或分离窗口）
  - 在根目录 `package.json` 添加 `start-all` 脚本

### 3. ✅ API路径问题（之前已修复）
- 前端API路径从 `/api/admin/auth/login` 改为 `/admin/auth/login`
- 代理配置指向正确的端口（5000）

## 新增文件

1. **start-all-unified.bat** - 统一窗口启动脚本
2. **package.json** (根目录) - 添加了统一启动脚本和依赖

## 修改的文件

1. **System/backend/package.json** - 添加PORT=5000环境变量和cross-env依赖
2. **start-all.bat** - 添加启动方式选择菜单
3. **System/frontend/src/api/user.js** - 修复API路径（之前）
4. **System/frontend/vite.config.js** - 修复代理端口（之前）

## 使用方法

### 方式1：统一窗口启动（推荐）
```bash
.\start-all.bat
# 选择 1 - 统一窗口启动
```
所有服务会在一个窗口中运行，输出会带颜色区分：
- 🔵 蓝色：TCC后端
- 🟢 绿色：System后端
- 🟡 黄色：系统前端

### 方式2：分离窗口启动
```bash
.\start-all.bat
# 选择 2 - 分离窗口启动
```
每个服务在独立窗口中运行（原来的方式）

### 方式3：直接使用统一脚本
```bash
.\start-all-unified.bat
```

## 端口配置

- **TCC小程序后端**：3001
- **System管理后端**：5000（已修复）
- **System管理前端**：5002

## 验证修复

启动后检查：
1. System后端应该显示：`Server running in development mode on port 5000`
2. 所有服务应该在一个窗口中显示（如果选择统一窗口）
3. 前端登录应该可以正常工作




