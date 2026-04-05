# TCC停车管理系统

## 系统概述

TCC停车管理系统包含以下三个主要组件：

1. **TCC小程序后端** - 为微信小程序提供基于Node.js的API服务 (端口: 3001)
2. **System管理后端** - 为管理前端提供基于Node.js的API服务 (端口: 5001)
3. **System管理前端** - 基于Vue 3的系统管理界面 (端口: 5002)
4. **TCC微信小程序** - 停车引导与导航客户端界面 (frontend/miniprogram)

## 数据库配置

系统使用MongoDB作为数据库，已配置连接到：
- 服务器地址: 192.168.0.78
- 端口: 27017
- 数据库名称: 
  - parking_system (TCC小程序后端)
  - parking_admin (System管理后端)

## 快速启动

### 方法一：使用PowerShell脚本（推荐）

1. 在项目根目录打开PowerShell
2. 执行以下命令：
   ```powershell
   powershell -ExecutionPolicy Bypass -File start-all.ps1
   ```

### 方法二：使用批处理文件

1. 在项目根目录双击运行 `start-all.bat`
2. 或在命令行中执行：
   ```cmd
   .\start-all.bat
   ```

## 停止所有服务

执行以下命令停止所有服务：
```cmd
.\stop-all.bat
```

## 访问地址

启动成功后，您可以通过以下地址访问各个服务：

- TCC小程序后端API: http://localhost:3001
- System管理后端API: http://localhost:5001
- System管理前端界面: http://localhost:5002

## 项目结构

```text
tcc/
├── backend/              # TCC小程序后端代码 (Node.js)
│   ├── .env             # 环境变量配置
│   ├── server.js        # 服务器入口文件
│   └── ...
├── frontend/             # 停车客户端代码
│   └── miniprogram/      # 微信小程序前端代码
├── System/               # 后台管理系统代码
│   ├── backend/         # System管理后端 (Node.js)
│   │   ├── .env         # 环境变量配置
│   │   └── server.js    # 服务器入口文件
│   └── frontend/        # System管理前端 (Vue 3)
│       ├── vite.config.js  # Vite配置文件
│       └── ...
├── tools/                # 工具脚本目录 (包含启动脚本等)
├── start-all.bat        # 批处理启动脚本
├── start-all.ps1        # PowerShell启动脚本
├── stop-all.bat         # 停止服务脚本
└── README.md            # 项目说明文档
```

## 注意事项

1. 确保已安装Node.js和npm
2. 确保MongoDB服务正在运行
3. 首次运行前，请在各子目录执行 `npm install` 安装依赖
4. 如果遇到端口占用问题，请运行 `stop-all.bat` 清理端口

## 故障排除

如果遇到服务启动失败的问题：

1. 检查Node.js是否正确安装
2. 检查MongoDB是否正在运行
3. 检查端口是否被其他程序占用
4. 查看各服务的控制台输出获取详细错误信息