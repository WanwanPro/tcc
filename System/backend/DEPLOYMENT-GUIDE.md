# 智能停车场导航系统 - 部署指南

## 概述

本指南详细说明了如何部署智能停车场导航系统的后端服务。系统基于Node.js和Express框架，使用MongoDB作为数据库。

## 系统要求

- Node.js 16.x 或更高版本
- MongoDB 4.4 或更高版本
- npm 或 yarn 包管理器
- 至少 2GB 可用内存
- 至少 5GB 可用磁盘空间

## 部署步骤

### 1. 环境准备

#### 1.1 安装Node.js

```bash
# 使用nvm安装Node.js (推荐)
nvm install 18
nvm use 18

# 或者直接从官网下载安装
# https://nodejs.org/
```

#### 1.2 安装MongoDB

```bash
# Windows
# 下载并安装MongoDB Community Server
# https://www.mongodb.com/try/download/community

# Ubuntu/Debian
sudo apt-get install -y mongodb

# macOS (使用Homebrew)
brew tap mongodb/brew
brew install mongodb-community
```

#### 1.3 启动MongoDB服务

```bash
# Windows
net start MongoDB

# Linux
sudo systemctl start mongod
sudo systemctl enable mongod

# macOS
brew services start mongodb/brew/mongodb-community
```

### 2. 项目部署

#### 2.1 获取项目代码

```bash
# 克隆项目仓库
git clone https://github.com/your-repo/parking-navigation-system.git
cd parking-navigation-system/backend

# 或者直接上传项目文件到服务器
```

#### 2.2 安装项目依赖

```bash
# 安装npm依赖
npm install

# 或者使用yarn
yarn install
```

#### 2.3 配置环境变量

创建 `.env` 文件并配置以下环境变量：

```env
# 服务器配置
PORT=5000
NODE_ENV=production

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/parking_navigation

# JWT配置
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

# 微信小程序配置
WECHAT_APP_ID=your_wechat_app_id
WECHAT_APP_SECRET=your_wechat_app_secret

# 其他配置
BCRYPT_ROUNDS=12
```

#### 2.4 数据库初始化

```bash
# 运行数据库初始化脚本
npm run init-db

# 或者手动执行
node scripts/init-database.js
```

### 3. 启动服务

#### 3.1 直接启动

```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

#### 3.2 使用PM2管理进程 (推荐)

```bash
# 安装PM2
npm install -g pm2

# 启动应用
pm2 start ecosystem.config.js

# 查看进程状态
pm2 status

# 查看日志
pm2 logs

# 重启应用
pm2 restart parking-navigation-api
```

#### 3.3 PM2配置文件示例

创建 `ecosystem.config.js` 文件：

```javascript
module.exports = {
  apps: [{
    name: 'parking-navigation-api',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 5000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

### 4. 反向代理配置

#### 4.1 Nginx配置

创建Nginx配置文件 `/etc/nginx/sites-available/parking-navigation-api`：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

启用配置并重启Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/parking-navigation-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### 4.2 SSL配置 (可选)

使用Let's Encrypt免费SSL证书：

```bash
# 安装Certbot
sudo apt-get install certbot python3-certbot-nginx

# 获取SSL证书
sudo certbot --nginx -d your-domain.com

# 自动续期
sudo crontab -e
# 添加以下行
0 12 * * * /usr/bin/certbot renew --quiet
```

### 5. 监控与日志

#### 5.1 日志配置

确保日志目录存在：

```bash
mkdir -p logs
```

#### 5.2 监控配置

使用PM2监控：

```bash
# 安装PM2监控
pm2 install pm2-logrotate

# 配置日志轮转
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
pm2 set pm2-logrotate:compress true
```

### 6. 备份策略

#### 6.1 数据库备份

创建备份脚本 `scripts/backup-db.sh`：

```bash
#!/bin/bash

# 配置
DB_NAME="parking_navigation"
BACKUP_DIR="/var/backups/mongodb"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/parking_navigation_$DATE.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
mongodump --db $DB_NAME --gzip --archive=$BACKUP_FILE

# 删除7天前的备份
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

设置定时备份：

```bash
# 添加到crontab
crontab -e

# 每天凌晨2点备份
0 2 * * * /path/to/scripts/backup-db.sh
```

#### 6.2 应用备份

```bash
# 创建应用备份脚本
#!/bin/bash

APP_DIR="/path/to/parking-navigation-system"
BACKUP_DIR="/var/backups/app"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/parking-navigation-app_$DATE.tar.gz"

# 创建备份目录
mkdir -p $BACKUP_DIR

# 执行备份
tar -czf $BACKUP_FILE -C $APP_DIR .

# 删除30天前的备份
find $BACKUP_DIR -name "*.tar.gz" -mtime +30 -delete

echo "App backup completed: $BACKUP_FILE"
```

### 7. 性能优化

#### 7.1 数据库优化

```javascript
// 创建索引
db.parking_lots.createIndex({ "location": "2dsphere" })
db.parking_spaces.createIndex({ "parking_lot_id": 1, "floor": 1 })
db.parking_records.createIndex({ "user_id": 1, "entry_time": -1 })
db.miniprogram_users.createIndex({ "openid": 1 })
```

#### 7.2 应用优化

```javascript
// 启用压缩
const compression = require('compression');
app.use(compression());

// 设置缓存
app.use(express.static('public', {
  maxAge: '1d'
}));

// 连接池配置
mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
});
```

### 8. 故障排除

#### 8.1 常见问题

1. **端口被占用**
   ```bash
   # 查找占用端口的进程
   lsof -i :5000
   
   # 终止进程
   kill -9 <PID>
   ```

2. **数据库连接失败**
   ```bash
   # 检查MongoDB服务状态
   sudo systemctl status mongod
   
   # 重启MongoDB
   sudo systemctl restart mongod
   ```

3. **内存不足**
   ```bash
   # 增加交换空间
   sudo fallocate -l 2G /swapfile
   sudo chmod 600 /swapfile
   sudo mkswap /swapfile
   sudo swapon /swapfile
   echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
   ```

#### 8.2 日志分析

```bash
# 查看应用错误日志
tail -f logs/err.log

# 查看Nginx错误日志
tail -f /var/log/nginx/error.log

# 查看MongoDB日志
tail -f /var/log/mongodb/mongod.log
```

## 安全建议

1. 定期更新系统和依赖包
2. 使用强密码和SSH密钥认证
3. 配置防火墙，只开放必要端口
4. 定期备份数据
5. 监控系统资源使用情况
6. 实施访问控制和权限管理

## 联系支持

如果在部署过程中遇到问题，请联系技术支持团队：

- 邮箱: support@parking-navigation.com
- 电话: +86-xxx-xxxx-xxxx
- 文档: https://docs.parking-navigation.com