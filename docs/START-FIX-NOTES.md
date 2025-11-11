# 启动脚本修复说明

## 修复内容

### 1. ✅ 移除选择菜单，默认使用统一窗口
- `start-all.bat` 现在直接使用统一窗口启动，无需选择
- 移除了交互式菜单

### 2. ✅ 改进错误处理
- 添加了Node.js和npm检查
- 添加了依赖检查和自动安装
- 添加了更详细的错误信息

### 3. ✅ 修复Windows路径问题
- 使用 `npm --prefix` 替代 `cd && npm run`（在concurrently中可能有问题）
- 改用英文服务名称避免编码问题
- 添加 `--kill-others` 确保一个服务失败时停止所有服务

### 4. ✅ 优化脚本结构
- 添加了工作目录切换
- 改进了错误退出处理
- 移除了可能导致闪退的pause命令（在concurrently运行时）

## 使用方法

直接运行：
```bash
start-all.bat
```

脚本会：
1. 检查Node.js和npm
2. 检查并安装concurrently（如果需要）
3. 检查子项目依赖（如果需要会自动安装）
4. 启动所有服务到统一窗口

## 如果仍然闪退

请检查：
1. **Node.js版本**：需要Node.js 14+
   ```bash
   node --version
   ```

2. **concurrently是否正确安装**：
   ```bash
   npm list concurrently
   ```

3. **手动测试启动**：
   ```bash
   npm run start-all
   ```

4. **查看详细错误**：
   在命令提示符中运行（不是双击bat文件）：
   ```cmd
   cd C:\Users\wanan\Desktop\Sync\tcc
   start-all.bat
   ```
   这样可以看到完整的错误信息

## 故障排查步骤

1. 打开命令提示符（cmd）
2. 切换到项目目录：
   ```cmd
   cd C:\Users\wanan\Desktop\Sync\tcc
   ```
3. 手动运行：
   ```cmd
   npm run start-all
   ```
4. 查看错误信息并反馈




