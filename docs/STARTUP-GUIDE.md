# 综合启动脚本使用说明

## 功能概述
- 同时启动微信小程序前端、微信小程序后端（TCC API）、后台管理系统后端（Admin API）与前端（Admin UI）
- 单终端日志聚合，输出带服务名称前缀
- 启动顺序控制与健康检查，异常自动退出并提示

## 目录结构与脚本位置
- 启动脚本：`tools/start_all.py`
- Windows双击入口：`tools/start-all.bat`
- 小程序项目路径：`frontend/miniprogram`
- 后端服务路径：`backend`、`System/backend`
- 管理前端路径：`System/frontend`

## 环境依赖
- 必须安装并配置到 `PATH`：`Node.js`、`npm`
- 建议安装：`Python 3.8+`
- 可选：已安装微信开发者工具并启用 CLI，Windows 常见路径为：`%LOCALAPPDATA%\Programs\微信开发者工具\cli.bat`
- 可通过环境变量 `WECHAT_DEVTOOLS_CLI` 指定 CLI 路径

## Windows 快速启动
- 进入仓库 `tools` 目录，双击运行：`start-all.bat`
- 首次运行会自动执行各项目的 `npm install`
- 启动成功后：
  - TCC API: `http://localhost:3001/health`
  - Admin API: `http://localhost:5001/api/health`
  - Admin UI: `http://localhost:5002`
  - 微信开发者工具：自动打开项目或在控制台提示手动打开路径

## 跨平台启动
- 命令行执行：
  - Windows: `py -3 tools\start_all.py` 或 `python tools\start_all.py`
  - macOS/Linux: `python3 tools/start_all.py`

## 日志与前缀
- 控制台日志统一输出，前缀如下：
  - `[TCC-API]` 小程序后端
  - `[ADMIN-API]` 后台管理后端
  - `[ADMIN-UI]` 后台管理前端
  - `[WECHAT-DEVTOOLS]` 微信开发者工具 CLI

## 故障与退出
- 任一服务启动失败或异常退出，脚本会终止所有子进程并退出
- `Ctrl + C` 可安全结束所有服务
- 微信开发者工具 CLI 未检测到时，脚本会提示手动在 `frontend/miniprogram` 路径中打开项目

## 端口与代理
- 小程序后端：`3001`
- 后台管理后端：`5001`
- 后台管理前端：`5002`（已在 `System/frontend/vite.config.js` 配置代理到 `5001`）

## 常见问题
- 若提示未安装 Python，请从 `python.org` 安装并勾选 “Add Python to PATH”
- 若 `npm install` 失败，请检查网络代理或重试：在对应目录手动执行 `npm install`
- 如需调整端口，可修改：
  - 小程序后端：环境变量 `PORT`
  - 后台管理前端端口：`System/frontend/vite.config.js`
