# 小程序后端镜像
# 说明：
# 1. 使用仓库根目录作为构建上下文
# 2. 保留 shared 目录，避免破坏 backend 对共享代码的相对引用
# 3. 该文件只用于云部署，不影响本地开发启动方式

FROM node:20-bookworm-slim

WORKDIR /app

ENV NODE_ENV=production

COPY backend/package*.json ./
COPY shared ./shared

RUN npm ci --omit=dev

COPY backend ./backend

WORKDIR /app/backend
RUN mkdir -p uploads

EXPOSE 3001

CMD ["npm", "start"]
