# 启动问题调试指南

## 当前问题
启动脚本显示端口信息后立即闪退

## 已修复的内容
1. ✅ 添加了详细的错误处理
2. ✅ 使用npx直接运行concurrently
3. ✅ 添加了pause命令确保窗口不立即关闭
4. ✅ 改进了批处理文件的错误检查

## 调试步骤

### 方法1：手动测试concurrently
打开命令提示符，运行：
```cmd
cd C:\Users\wanan\Desktop\Sync\tcc
npx concurrently -n "TCC,System,Frontend" -c "blue,green,yellow" "start-tcc-backend.bat" "start-system-backend.bat" "start-frontend.bat"
```

### 方法2：逐个测试服务
测试TCC后端：
```cmd
cd C:\Users\wanan\Desktop\Sync\tcc
start-tcc-backend.bat
```

测试System后端：
```cmd
cd C:\Users\wanan\Desktop\Sync\tcc
start-system-backend.bat
```

测试前端：
```cmd
cd C:\Users\wanan\Desktop\Sync\tcc
start-frontend.bat
```

### 方法3：检查npm脚本
```cmd
cd C:\Users\wanan\Desktop\Sync\tcc
npm run start-all
```

## 可能的解决方案

如果concurrently仍然有问题，可以使用简单的分离窗口方式：

运行 `start-all-simple.bat`（如果存在）

或者手动启动：
```cmd
start cmd /k "cd /d C:\Users\wanan\Desktop\Sync\tcc\backend && npm run dev"
start cmd /k "cd /d C:\Users\wanan\Desktop\Sync\tcc\System\backend && npm run dev"
start cmd /k "cd /d C:\Users\wanan\Desktop\Sync\tcc\System\frontend && npm run dev"
```




