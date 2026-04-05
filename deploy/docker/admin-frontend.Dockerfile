# 管理后台前端镜像
# 说明：
# 1. 前端为 Vite 项目，构建产物目录为 dist
# 2. 该文件只用于云部署，不影响本地使用 npm run dev

FROM node:20-bookworm-slim AS build

WORKDIR /app

COPY System/frontend/package*.json ./
RUN npm ci

COPY System/frontend ./
RUN npm run build

FROM nginx:1.27-alpine

COPY System/frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

