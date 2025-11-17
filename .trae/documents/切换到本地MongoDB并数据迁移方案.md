## 现状端口与不一致点

* 微信小程序后端：`backend/server.js:70` 默认端口 `3001`，脚本输出 Local/Network（`backend/server.js:76-80`）。

* System后台后端：`System/backend/server.js:151` 默认端口 `5000`，但 `package.json` 开发脚本固定为 `PORT=5001`（`System/backend/package.json:7-13`）。

* System前端（Vite）：`System/frontend/vite.config.js:14` 端口 `5002`，代理目标为 `http://localhost:5001`（`vite.config.js:18`）。

* 启动脚本冲突：

  * `tools/start-backend-services.bat:5-14` 文案写“微信后端:5000、后台后端:3000”，与实际不符。

  * `tools/start-all-simple.bat:16/22/28` 使用 3001/5000/5002，System 后端端口与当前前端代理不一致（应为 5001）。

  * `tools/start-all.bat:59-61` 文案使用 3001/5001/5002，但依赖根 `npm run start-all`（根无 `package.json`）。

## 统一端口策略（建议）

* 微信小程序后端（API）：`3001`

* System后台后端（API）：`5001`

* System后台前端（Vite）：`5002`

* 原使用 `3000/5000/5001` 的脚本与示例统一改为以上配置。

## 拟实施变更

* 后端代码与配置

  * System 后端：将默认端口回退值调整为 `5001`，与开发脚本一致（修改 `System/backend/server.js` 的 `PORT` 回退值）。

  * System 后端 `.env.example`：\`PORT=500

