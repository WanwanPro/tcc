# 智能停车场管理系统后台部署文档

## 1. 系统概述

智能停车场管理系统后台是一个基于Node.js和Vue.js的全栈Web应用，提供停车场管理、用户管理、数据分析等功能。本文档详细介绍了系统的部署流程、环境要求和配置方法。

## 2. 系统架构

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端 (Vue.js) │────│  后端 (Node.js) │────│  数据库 (MongoDB) │
│   Port: 5002    │    │  Port: 5001     │    │  Port: 27017    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 3. 环境要求

### 3.1 硬件要求

- CPU: 2核心及以上
- 内存: 4GB及以上
- 存储: 20GB可用空间
- 网络: 稳定的互联网连接

### 3.2 软件要求

- 操作系统: Windows 10/11, Linux (Ubuntu 18.04+), macOS 10.14+
- Node.js: 16.0及以上版本
- npm: 7.0及以上版本
- MongoDB: 4.4及以上版本
- Git: 最新版本

## 4. 部署步骤

### 4.1 准备工作

1. 克隆项目代码
```bash
git clone [项目仓库地址]
cd System
```

2. 安装Node.js
   - 访问 [Node.js官网](https://nodejs.org/) 下载并安装LTS版本
   - 验证安装: `node --version` 和 `npm --version`

3. 安装MongoDB
   - 访问 [MongoDB官网](https://www.mongodb.com/) 下载并安装
   - 启动MongoDB服务

### 4.2 后端部署

1. 进入后端目录
```bash
cd backend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
   - 复制 `.env.example` 为 `.env`
   - 修改 `.env` 文件中的配置项

```env
# 服务器配置
PORT=5001
NODE_ENV=production

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/parking_system
MONGODB_TEST_URI=mongodb://localhost:27017/parking_system_test

# JWT配置
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRE=7d

# 其他配置
BCRYPT_ROUNDS=10
```

4. 初始化数据库
```bash
node init-db.js
```

5. 创建管理员账户
```bash
node create-admin.js
```

6. 启动后端服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

### 4.3 前端部署

1. 进入前端目录
```bash
cd frontend
```

2. 安装依赖
```bash
npm install
```

3. 配置环境变量
   - 复制 `.env.example` 为 `.env.production`
   - 修改 `.env.production` 文件中的配置项

```env
# API地址
VITE_API_BASE_URL=http://localhost:5001/api

# 其他配置
VITE_APP_TITLE=智能停车场管理系统
```

4. 构建前端项目
```bash
npm run build
```

5. 配置Web服务器 (Nginx示例)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # 前端静态文件
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }
    
    # API代理
    location /api {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

6. 启动前端服务 (开发环境)
```bash
npm run dev
```

### 4.4 使用Docker部署 (可选)

1. 构建并启动所有服务
```bash
# 在System目录下执行
docker-compose up -d
```

2. 查看服务状态
```bash
docker-compose ps
```

## 5. 验证部署

1. 访问前端应用
   - 开发环境: http://localhost:5002
   - 生产环境: http://your-domain.com

2. 访问API文档
   - API文档: http://localhost:5001/api-docs

3. 登录系统
   - 使用创建的管理员账户登录
   - 验证各项功能是否正常

## 6. 常见问题与解决方案

### 6.1 数据库连接问题

**问题**: 后端启动时提示数据库连接失败
**解决方案**:
1. 检查MongoDB服务是否启动
2. 验证 `.env` 文件中的数据库连接字符串
3. 确认数据库权限设置

### 6.2 端口占用问题

**问题**: 服务启动时提示端口被占用
**解决方案**:
1. 查找占用端口的进程: `netstat -ano | findstr :5001`
2. 终止占用进程或修改 `.env` 文件中的端口配置

### 6.3 前端构建问题

**问题**: 前端构建失败
**解决方案**:
1. 清除缓存: `npm cache clean --force`
2. 删除 `node_modules` 并重新安装依赖
3. 检查Node.js版本是否符合要求

### 6.4 权限问题

**问题**: Linux环境下权限不足
**解决方案**:
1. 使用 `sudo` 命令提升权限
2. 修改文件和目录的所有者: `chown -R user:group /path/to/project`

## 7. 维护与监控

### 7.1 日志管理

- 后端日志位置: `backend/logs/`
- 前端日志: 浏览器开发者工具控制台
- 系统日志: `/var/log/mongodb/`, `/var/log/nginx/`

### 7.2 数据备份

1. MongoDB数据备份
```bash
mongodump --db parking_system --out /backup/$(date +%Y%m%d)
```

2. 定期备份脚本
```bash
#!/bin/bash
BACKUP_DIR="/backup/$(date +%Y%m%d)"
mkdir -p $BACKUP_DIR
mongodump --db parking_system --out $BACKUP_DIR
tar -czf "$BACKUP_DIR.tar.gz" $BACKUP_DIR
rm -rf $BACKUP_DIR
```

### 7.3 性能监控

1. 使用PM2管理Node.js进程
```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 monit
```

2. 监控系统资源
```bash
top
htop
iostat
```

## 8. 安全建议

1. 定期更新系统和依赖包
2. 使用HTTPS协议
3. 配置防火墙规则
4. 定期备份数据
5. 实施访问控制和权限管理
6. 监控异常活动

## 9. 更新与升级

1. 更新代码
```bash
git pull origin main
```

2. 更新依赖
```bash
# 后端
cd backend && npm update

# 前端
cd frontend && npm update
```

3. 重新构建和部署
```bash
# 后端
cd backend && npm run build

# 前端
cd frontend && npm run build
```

## 10. 联系支持

如遇到部署问题，请联系技术支持团队:
- 邮箱: support@example.com
- 电话: +86 123-4567-8900
- 文档: [在线文档地址]

---

**注意**: 本文档基于当前系统版本编写，实际部署时请根据最新代码和配置进行调整。