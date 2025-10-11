#!/bin/bash

# 后端API测试脚本

echo "开始运行后端API测试..."

# 运行单元测试
echo "运行单元测试..."
npm test

# 检查测试结果
if [ $? -eq 0 ]; then
    echo "所有测试通过!"
else
    echo "测试失败，请检查代码!"
    exit 1
fi

echo "测试完成。"