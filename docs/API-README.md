# TCC停车管理系统 API文档

本目录包含TCC停车管理系统的完整API文档，已按照OpenAPI 3.0规范格式化，可以直接导入到Apifox中进行管理和测试。

## 文件说明

- `tcc-api.json` - TCC小程序后端API文档（8个接口）
- `system-admin-api.json` - System管理后端API文档（64个接口）
- `api-import-guide.html` - API导入到Apifox的详细指南
- `generate-api-docs.js` - 生成API文档的脚本

## API接口统计

| 模块 | 接口数量 | 说明 |
|------|----------|------|
| TCC小程序后端 | 8 | 用户管理(2)、停车位管理(2)、路径规划(2)、图像识别(2) |
| System管理后端 | 64 | 认证管理(4)、用户管理(5)、停车场管理(12)、地图管理(6)、导航管理(6)、数据模拟(6)、财务管理(7)、数据分析(9)、系统管理(9) |
| **总计** | **72** | **涵盖所有功能模块** |

## 如何导入到Apifox

### 方法一：使用导入指南页面

1. 在浏览器中打开 `api-import-guide.html` 文件
2. 按照页面上的说明下载API文档并导入到Apifox

### 方法二：手动导入

1. 打开Apifox客户端
2. 点击"导入"按钮
3. 选择"OpenAPI/Swagger"导入方式
4. 上传 `tcc-api.json` 和 `system-admin-api.json` 文件
5. 根据提示完成导入过程

## API服务器地址

- TCC小程序后端：`http://localhost:3001`
- System管理后端：`http://localhost:5000`

## 认证方式

所有需要认证的接口都使用Bearer Token（JWT）认证方式。在Apifox中，可以设置全局环境变量，例如：

```
{{baseUrl}} - API服务器地址
{{token}} - 认证令牌
```

## 重新生成API文档

如果需要重新生成API文档，可以运行以下命令：

```bash
node generate-api-docs.js
```

这将根据最新的代码重新生成API文档。

## 注意事项

1. 导入前请确保已安装最新版本的Apifox
2. 导入后可以根据需要调整API分组和命名
3. 建议在Apifox中设置环境变量，方便切换开发、测试和生产环境
4. 导入完成后，可以在Apifox中进行API测试和文档协作

## 技术支持

如有问题，请参考：
- [Apifox官方文档](https://www.apifox.cn/help/)
- [OpenAPI规范](https://swagger.io/specification/)