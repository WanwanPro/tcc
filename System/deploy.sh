#!/bin/bash

echo "正在部署智能停车场管理系统..."
echo

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: 未检测到Docker，请先安装Docker"
    echo "下载地址: https://docs.docker.com/get-docker/"
    exit 1
fi

# 检查Docker Compose是否安装
if ! command -v docker-compose &> /dev/null; then
    echo "错误: 未检测到Docker Compose，请先安装Docker Compose"
    echo "下载地址: https://docs.docker.com/compose/install/"
    exit 1
fi

# 停止并删除现有容器（如果有）
echo "停止现有容器..."
docker-compose down

# 构建并启动服务
echo "构建并启动服务..."
docker-compose up --build -d

# 等待服务启动
echo "等待服务启动..."
sleep 30

# 检查服务状态
echo "检查服务状态..."
docker-compose ps

echo
echo "部署完成!"
echo
echo "访问地址:"
echo "- 前端应用: http://localhost"
echo "- 后端API: http://localhost/api"
echo
echo "默认管理员账户:"
echo "- 用户名: admin"
echo "- 密码: admin123"
echo