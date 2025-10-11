# 部署指南

本文档提供了智能停车场管理系统的多种部署方式。

## 系统要求

- Docker 20.10+
- Docker Compose 1.29+
- 至少2GB可用内存
- 至少5GB可用磁盘空间

## 部署方式

### 1. 一键部署（推荐）

#### Windows系统

```bash
# 运行部署脚本
deploy.bat
```

#### Linux/macOS系统

```bash
# 添加执行权限
chmod +x deploy.sh

# 运行部署脚本
./deploy.sh
```

### 2. 手动部署

1. 克隆项目
```bash
git clone <repository-url>
cd parking-management-system
```

2. 构建并启动服务
```bash
# 构建并启动所有服务
docker-compose up --build -d

# 查看服务状态
docker-compose ps

# 查看日志
docker-compose logs -f
```

3. 初始化数据库
```bash
# 进入后端容器
docker-compose exec backend sh

# 运行数据库初始化脚本
npm run init-db

# 退出容器
exit
```

### 3. 分步部署

#### 部署MongoDB

```bash
# 启动MongoDB
docker-compose up -d mongodb

# 等待MongoDB启动
sleep 10

# 检查MongoDB状态
docker-compose logs mongodb
```

#### 部署后端API

```bash
# 构建后端镜像
docker-compose build backend

# 启动后端服务
docker-compose up -d backend

# 检查后端服务状态
docker-compose logs backend
```

#### 部署前端应用

```bash
# 构建前端镜像
docker-compose build frontend

# 启动前端服务
docker-compose up -d frontend

# 检查前端服务状态
docker-compose logs frontend
```

#### 部署Nginx反向代理（可选）

```bash
# 启动Nginx
docker-compose up -d nginx

# 检查Nginx状态
docker-compose logs nginx
```

## 访问系统

部署完成后，可以通过以下地址访问系统：

- 前端应用: http://localhost
- 后端API: http://localhost/api
- API文档: http://localhost/api/docs

## 默认账户

系统初始化后会创建一个默认管理员账户：

- 用户名: `admin`
- 密码: `admin123`

## 常见问题

### 1. 端口冲突

如果80或3000端口已被占用，可以修改`docker-compose.yml`中的端口映射：

```yaml
services:
  frontend:
    ports:
      - "8080:80"  # 将80端口改为8080
      
  backend:
    ports:
      - "3001:3000"  # 将3000端口改为3001
```

### 2. 数据持久化

MongoDB数据存储在Docker卷中，即使容器重启也不会丢失。如需备份数据：

```bash
# 备份数据
docker-compose exec mongodb mongodump --out /backup

# 恢复数据
docker-compose exec mongodb mongorestore /backup
```

### 3. 日志查看

查看所有服务日志：
```bash
docker-compose logs -f
```

查看特定服务日志：
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mongodb
```

### 4. 服务重启

重启所有服务：
```bash
docker-compose restart
```

重启特定服务：
```bash
docker-compose restart backend
```

### 5. 更新系统

1. 拉取最新代码
```bash
git pull origin main
```

2. 重新构建并部署
```bash
docker-compose down
docker-compose up --build -d
```

## 生产环境配置

### 1. 安全配置

修改`docker-compose.yml`中的环境变量：

```yaml
services:
  backend:
    environment:
      JWT_SECRET: your_secure_jwt_secret_key
      MONGODB_URI: mongodb://username:password@mongodb:27017/parking_admin?authSource=admin
```

### 2. HTTPS配置

1. 获取SSL证书
2. 将证书文件放在`nginx/ssl/`目录下
3. 取消`nginx/nginx.conf`中HTTPS配置的注释

### 3. 性能优化

1. 增加MongoDB内存限制
2. 配置Nginx缓存
3. 启用Gzip压缩

### 4. 监控配置

可以使用以下工具监控系统状态：

- Prometheus + Grafana
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Docker健康检查

## 卸载系统

如需完全卸载系统：

```bash
# 停止并删除容器
docker-compose down

# 删除卷（注意：这将删除所有数据）
docker-compose down -v

# 删除镜像
docker-compose down --rmi all
```