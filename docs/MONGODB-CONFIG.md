# MongoDB数据库配置说明

## 数据库连接信息

您的MongoDB数据库已配置为连接到：`192.168.0.78:27017`

## 数据库配置详情

### 微信小程序后端
- 数据库名称：`parking_system`
- 连接端口：`5000`
- 环境变量文件：`backend/.env`

### 后台管理系统后端
- 数据库名称：`parking_admin`
- 连接端口：`3000`
- 环境变量文件：`System/backend/.env`

## 启动服务

### 方法一：使用启动脚本
1. 双击运行 `start-system.bat`
2. 根据提示选择要启动的服务

### 方法二：手动启动
1. 启动微信小程序后端：
   ```
   cd backend
   npm run dev
   ```

2. 启动后台管理系统后端：
   ```
   cd System/backend
   npm run dev
   ```

3. 启动后台管理系统前端：
   ```
   cd System/frontend
   npm run dev
   ```

## 访问地址

- 微信小程序后端API：http://localhost:5000
- 后台管理系统后端API：http://localhost:3000
- 后台管理系统前端：http://localhost:3001

## 微信小程序开发

1. 打开微信开发者工具
2. 导入项目：`frontend/miniprogram` 目录
3. 配置AppID（如需要）
4. 在开发者工具中预览和调试

## 注意事项

1. 确保MongoDB服务器（192.168.0.78）已启动并可访问
2. 首次运行前请确保已安装所有依赖包
3. 如需修改数据库连接信息，请编辑相应的 `.env` 文件
4. 两个后端服务使用不同的数据库，避免数据冲突

## 故障排除

如果遇到连接问题，请检查：
1. MongoDB服务器是否运行在192.168.0.78:27017
2. 网络连接是否正常
3. 防火墙设置是否阻止了连接
4. MongoDB是否允许远程连接

可以运行 `backend/test-db-connection.js` 脚本来测试数据库连接。