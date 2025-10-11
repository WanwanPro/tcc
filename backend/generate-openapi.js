const express = require('express');
const fs = require('fs');
const path = require('path');

// 创建OpenAPI规范文档
const generateOpenAPIDoc = () => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'TCC停车管理系统API',
      version: '1.0.0',
      description: '智能停车场车位引导与导航系统API文档',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'TCC小程序后端服务器',
      },
    ],
    paths: {
      '/api/users/login': {
        post: {
          tags: ['用户管理'],
          summary: '用户登录',
          description: '用户登录获取访问令牌',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string', description: '用户名' },
                    password: { type: 'string', description: '密码' }
                  },
                  required: ['username', 'password']
                }
              }
            }
          },
          responses: {
            200: {
              description: '登录成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          token: { type: 'string' },
                          user: {
                            type: 'object',
                            properties: {
                              id: { type: 'string' },
                              username: { type: 'string' },
                              email: { type: 'string' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/users/info/{userId}': {
        get: {
          tags: ['用户管理'],
          summary: '获取用户信息',
          description: '根据用户ID获取用户详细信息',
          parameters: [
            {
              name: 'userId',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '用户ID'
            }
          ],
          responses: {
            200: {
              description: '获取成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          username: { type: 'string' },
                          email: { type: 'string' },
                          profile: { type: 'object' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/spaces': {
        get: {
          tags: ['停车位管理'],
          summary: '获取所有车位状态',
          description: '获取停车场所有车位的当前状态',
          responses: {
            200: {
              description: '获取成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            number: { type: 'string' },
                            status: { type: 'string' },
                            floor: { type: 'string' },
                            section: { type: 'string' }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/spaces/update': {
        post: {
          tags: ['停车位管理'],
          summary: '更新车位状态',
          description: '更新指定车位的状态信息',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    spaceId: { type: 'string', description: '车位ID' },
                    status: { type: 'string', description: '车位状态' },
                    vehicleInfo: {
                      type: 'object',
                      description: '车辆信息',
                      properties: {
                        licensePlate: { type: 'string' },
                        entryTime: { type: 'string' },
                        estimatedExitTime: { type: 'string' }
                      }
                    }
                  },
                  required: ['spaceId', 'status']
                }
              }
            }
          },
          responses: {
            200: {
              description: '更新成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/path/plan': {
        post: {
          tags: ['路径规划'],
          summary: '计算最优路径',
          description: '根据起点和终点计算最优停车路径',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    start: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                        floor: { type: 'string' }
                      }
                    },
                    destination: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                        floor: { type: 'string' }
                      }
                    },
                    preferences: {
                      type: 'object',
                      properties: {
                        shortestPath: { type: 'boolean' },
                        nearestEntrance: { type: 'boolean' },
                        preferredFloor: { type: 'string' }
                      }
                    }
                  },
                  required: ['start', 'destination']
                }
              }
            }
          },
          responses: {
            200: {
              description: '路径计算成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          path: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                floor: { type: 'string' },
                                instruction: { type: 'string' }
                              }
                            }
                          },
                          distance: { type: 'number' },
                          estimatedTime: { type: 'number' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/path/adjust': {
        post: {
          tags: ['路径规划'],
          summary: '实时路径调整',
          description: '根据实时情况调整导航路径',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentPath: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' },
                          floor: { type: 'string' }
                        }
                      }
                    },
                    currentPosition: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' },
                        floor: { type: 'string' }
                      }
                    },
                    obstacles: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          x: { type: 'number' },
                          y: { type: 'number' },
                          floor: { type: 'string' },
                          type: { type: 'string' }
                        }
                      }
                    }
                  },
                  required: ['currentPath', 'currentPosition']
                }
              }
            }
          },
          responses: {
            200: {
              description: '路径调整成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          adjustedPath: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                x: { type: 'number' },
                                y: { type: 'number' },
                                floor: { type: 'string' },
                                instruction: { type: 'string' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/image/process': {
        post: {
          tags: ['图像识别'],
          summary: '上传并处理停车场图像',
          description: '上传停车场图像并识别车位状态',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  properties: {
                    image: {
                      type: 'string',
                      format: 'binary',
                      description: '停车场图像文件'
                    },
                    parkingLotId: {
                      type: 'string',
                      description: '停车场ID'
                    }
                  },
                  required: ['image']
                }
              }
            }
          },
          responses: {
            200: {
              description: '图像处理成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          processedImage: { type: 'string' },
                          detectedSpaces: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                coordinates: {
                                  type: 'object',
                                  properties: {
                                    x: { type: 'number' },
                                    y: { type: 'number' },
                                    width: { type: 'number' },
                                    height: { type: 'number' }
                                  }
                                },
                                status: { type: 'string' },
                                confidence: { type: 'number' }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      '/api/image/status': {
        get: {
          tags: ['图像识别'],
          summary: '获取最新车位状态',
          description: '获取通过图像识别的最新车位状态',
          parameters: [
            {
              name: 'parkingLotId',
              in: 'query',
              required: false,
              schema: { type: 'string' },
              description: '停车场ID'
            }
          ],
          responses: {
            200: {
              description: '获取成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          parkingLotId: { type: 'string' },
                          lastUpdated: { type: 'string' },
                          spaces: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                status: { type: 'string' },
                                lastDetected: { type: 'string' }
                              }
                            }
                          },
                          statistics: {
                            type: 'object',
                            properties: {
                              total: { type: 'number' },
                              available: { type: 'number' },
                              occupied: { type: 'number' }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  };

  return openApiSpec;
};

// 生成OpenAPI文档并保存到文件
const saveOpenAPIDoc = () => {
  const openApiSpec = generateOpenAPIDoc();
  const outputPath = path.join(__dirname, 'openapi-tcc-backend.json');
  
  fs.writeFileSync(outputPath, JSON.stringify(openApiSpec, null, 2));
  console.log(`OpenAPI文档已生成: ${outputPath}`);
  
  return outputPath;
};

// 如果直接运行此脚本，则生成文档
if (require.main === module) {
  saveOpenAPIDoc();
}

module.exports = {
  generateOpenAPIDoc,
  saveOpenAPIDoc
};