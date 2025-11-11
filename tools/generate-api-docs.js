const fs = require('fs');
const path = require('path');

// 创建TCC小程序后端的OpenAPI规范文档
const generateTCCOpenAPIDoc = () => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'TCC停车小程序API',
      version: '1.0.0',
      description: '智能停车场小程序API文档',
    },
    servers: [
      {
        url: 'http://localhost:3001',
        description: 'TCC小程序后端服务器',
      },
    ],
    paths: {
      // 用户管理接口
      '/api/users/register': {
        post: {
          tags: ['用户管理'],
          summary: '用户注册',
          description: '用户注册账号',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string', description: '用户名' },
                    password: { type: 'string', description: '密码' },
                    email: { type: 'string', description: '邮箱' },
                    phone: { type: 'string', description: '手机号' },
                    licensePlate: { type: 'string', description: '车牌号' }
                  },
                  required: ['username', 'password', 'email', 'phone']
                }
              }
            }
          },
          responses: {
            201: {
              description: '注册成功',
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
      },
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
      
      // 停车位管理接口
      '/api/parking/spaces': {
        get: {
          tags: ['停车位管理'],
          summary: '获取停车位列表',
          description: '获取可用停车位列表',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'parkingLotId',
              in: 'query',
              schema: { type: 'string' },
              description: '停车场ID'
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['available', 'occupied'] },
              description: '状态筛选'
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
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string' },
                            number: { type: 'string' },
                            status: { type: 'string' },
                            type: { type: 'string' },
                            parkingLotId: { type: 'string' },
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
      '/api/parking/spaces/{id}/reserve': {
        post: {
          tags: ['停车位管理'],
          summary: '预定停车位',
          description: '预定指定的停车位',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '停车位ID'
            }
          ],
          responses: {
            200: {
              description: '预定成功',
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
                          id: { type: 'string' },
                          status: { type: 'string' },
                          reservedUntil: { type: 'string' }
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
      
      // 路径规划接口
      '/api/navigation/routes': {
        post: {
          tags: ['路径规划'],
          summary: '获取导航路径',
          description: '计算从入口到指定停车位的导航路径',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    entranceId: { type: 'string', description: '入口ID' },
                    spaceId: { type: 'string', description: '停车位ID' },
                    preferences: {
                      type: 'array',
                      items: { type: 'string' },
                      description: '路径偏好'
                    }
                  },
                  required: ['entranceId', 'spaceId']
                }
              }
            }
          },
          responses: {
            200: {
              description: '计算成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          route: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                nodeId: { type: 'string' },
                                name: { type: 'string' },
                                instruction: { type: 'string' },
                                distance: { type: 'number' },
                                direction: { type: 'string' }
                              }
                            }
                          },
                          totalDistance: { type: 'number' },
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
      '/api/navigation/routes/{id}/optimize': {
        put: {
          tags: ['路径规划'],
          summary: '优化导航路径',
          description: '根据实时情况优化导航路径',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '路径ID'
            }
          ],
          responses: {
            200: {
              description: '优化成功',
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
                          route: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                nodeId: { type: 'string' },
                                name: { type: 'string' },
                                instruction: { type: 'string' },
                                distance: { type: 'number' },
                                direction: { type: 'string' }
                              }
                            }
                          },
                          totalDistance: { type: 'number' },
                          estimatedTime: { type: 'number' },
                          optimizationReason: { type: 'string' }
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
      
      // 图像识别接口
      '/api/recognition/recognize': {
        post: {
          tags: ['图像识别'],
          summary: '车牌识别',
          description: '识别图像中的车牌号码',
          security: [{ bearerAuth: [] }],
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
                      description: '车辆图像'
                    }
                  },
                  required: ['image']
                }
              }
            }
          },
          responses: {
            200: {
              description: '识别成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          licensePlate: { type: 'string' },
                          confidence: { type: 'number' },
                          boundingBox: {
                            type: 'object',
                            properties: {
                              x: { type: 'number' },
                              y: { type: 'number' },
                              width: { type: 'number' },
                              height: { type: 'number' }
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
      '/api/recognition/analyze': {
        post: {
          tags: ['图像识别'],
          summary: '车辆状态分析',
          description: '分析车辆状态和停车位占用情况',
          security: [{ bearerAuth: [] }],
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
                      description: '停车场图像'
                    },
                    parkingLotId: {
                      type: 'string',
                      description: '停车场ID'
                    }
                  },
                  required: ['image', 'parkingLotId']
                }
              }
            }
          },
          responses: {
            200: {
              description: '分析成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'object',
                        properties: {
                          spaceStatus: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                spaceId: { type: 'string' },
                                status: { type: 'string' },
                                confidence: { type: 'number' },
                                vehicleInfo: {
                                  type: 'object',
                                  properties: {
                                    licensePlate: { type: 'string' },
                                    type: { type: 'string' },
                                    color: { type: 'string' }
                                  }
                                }
                              }
                            }
                          },
                          totalSpaces: { type: 'integer' },
                          occupiedSpaces: { type: 'integer' },
                          availableSpaces: { type: 'integer' }
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
    }
  };
  
  return openApiSpec;
};

// 创建System管理后端的OpenAPI规范文档
const generateSystemOpenAPIDoc = () => {
  const openApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'TCC停车管理系统后台管理API',
      version: '1.0.0',
      description: '智能停车场后台管理系统API文档',
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'TCC管理系统后端服务器',
      },
    ],
    paths: {
      // 认证相关接口
      '/api/admin/auth/login': {
        post: {
          tags: ['认证管理'],
          summary: '管理员登录',
          description: '管理员登录获取访问令牌',
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
                              email: { type: 'string' },
                              role: { type: 'string' }
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
      '/api/admin/auth/me': {
        get: {
          tags: ['认证管理'],
          summary: '获取当前用户信息',
          description: '获取当前登录管理员信息',
          security: [{ bearerAuth: [] }],
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
                          role: { type: 'string' }
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
      '/api/admin/auth/logout': {
        post: {
          tags: ['认证管理'],
          summary: '用户登出',
          description: '管理员登出系统',
          security: [{ bearerAuth: [] }],
          responses: {
            200: {
              description: '登出成功',
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
      '/api/admin/auth/change-password': {
        put: {
          tags: ['认证管理'],
          summary: '修改密码',
          description: '管理员修改登录密码',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    currentPassword: { type: 'string', description: '当前密码' },
                    newPassword: { type: 'string', description: '新密码' }
                  },
                  required: ['currentPassword', 'newPassword']
                }
              }
            }
          },
          responses: {
            200: {
              description: '密码修改成功',
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
      
      // 用户管理接口
      '/api/admin/users': {
        get: {
          tags: ['用户管理'],
          summary: '获取管理员列表',
          description: '分页获取管理员列表，支持搜索和筛选',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: '页码'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: '每页数量'
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: '搜索关键词'
            },
            {
              name: 'role',
              in: 'query',
              schema: { type: 'string' },
              description: '角色筛选'
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
                          users: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                username: { type: 'string' },
                                email: { type: 'string' },
                                role: { type: 'string' },
                                isActive: { type: 'boolean' },
                                createdAt: { type: 'string' }
                              }
                            }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              pages: { type: 'integer' }
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
        post: {
          tags: ['用户管理'],
          summary: '创建管理员',
          description: '创建新的管理员账号',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    username: { type: 'string', description: '用户名' },
                    email: { type: 'string', description: '邮箱' },
                    password: { type: 'string', description: '密码' },
                    role: { type: 'string', description: '角色' },
                    profile: {
                      type: 'object',
                      properties: {
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phone: { type: 'string' }
                      }
                    }
                  },
                  required: ['username', 'email', 'password', 'role']
                }
              }
            }
          },
          responses: {
            201: {
              description: '创建成功',
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
                          id: { type: 'string' },
                          username: { type: 'string' },
                          email: { type: 'string' },
                          role: { type: 'string' }
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
      '/api/admin/users/{id}': {
        get: {
          tags: ['用户管理'],
          summary: '获取管理员详情',
          description: '根据ID获取管理员详细信息',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '管理员ID'
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
                          role: { type: 'string' },
                          profile: {
                            type: 'object',
                            properties: {
                              firstName: { type: 'string' },
                              lastName: { type: 'string' },
                              phone: { type: 'string' }
                            }
                          },
                          isActive: { type: 'boolean' },
                          createdAt: { type: 'string' },
                          updatedAt: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['用户管理'],
          summary: '更新管理员信息',
          description: '更新管理员账号信息',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '管理员ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', description: '邮箱' },
                    role: { type: 'string', description: '角色' },
                    profile: {
                      type: 'object',
                      properties: {
                        firstName: { type: 'string' },
                        lastName: { type: 'string' },
                        phone: { type: 'string' }
                      }
                    },
                    isActive: { type: 'boolean', description: '是否激活' }
                  }
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
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          username: { type: 'string' },
                          email: { type: 'string' },
                          role: { type: 'string' }
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
      
      // 停车场管理接口
      '/api/admin/parking/lots': {
        get: {
          tags: ['停车场管理'],
          summary: '获取停车场列表',
          description: '分页获取停车场列表，支持搜索和状态筛选',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: '页码'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: '每页数量'
            },
            {
              name: 'search',
              in: 'query',
              schema: { type: 'string' },
              description: '搜索关键词'
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: '状态筛选'
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
                          parkingLots: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                address: { type: 'string' },
                                totalSpaces: { type: 'integer' },
                                availableSpaces: { type: 'integer' },
                                status: { type: 'string' },
                                createdAt: { type: 'string' }
                              }
                            }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              pages: { type: 'integer' }
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
        post: {
          tags: ['停车场管理'],
          summary: '创建停车场',
          description: '创建新的停车场',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: '停车场名称' },
                    address: { type: 'string', description: '停车场地址' },
                    description: { type: 'string', description: '停车场描述' },
                    totalSpaces: { type: 'integer', description: '总车位数' },
                    floors: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          name: { type: 'string' },
                          sections: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                name: { type: 'string' },
                                spaceCount: { type: 'integer' }
                              }
                            }
                          }
                        }
                      }
                    },
                    operatingHours: {
                      type: 'object',
                      properties: {
                        open: { type: 'string' },
                        close: { type: 'string' }
                      }
                    },
                    pricing: {
                      type: 'object',
                      properties: {
                        hourly: { type: 'number' },
                        daily: { type: 'number' },
                        monthly: { type: 'number' }
                      }
                    }
                  },
                  required: ['name', 'address', 'totalSpaces']
                }
              }
            }
          },
          responses: {
            201: {
              description: '创建成功',
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
                          id: { type: 'string' },
                          name: { type: 'string' },
                          address: { type: 'string' },
                          totalSpaces: { type: 'integer' }
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
      '/api/admin/parking/lots/{id}': {
        get: {
          tags: ['停车场管理'],
          summary: '获取停车场详情',
          description: '根据ID获取停车场详细信息，包括车位和节点信息',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
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
                          id: { type: 'string' },
                          name: { type: 'string' },
                          address: { type: 'string' },
                          description: { type: 'string' },
                          totalSpaces: { type: 'integer' },
                          availableSpaces: { type: 'integer' },
                          status: { type: 'string' },
                          floors: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                sections: {
                                  type: 'array',
                                  items: {
                                    type: 'object',
                                    properties: {
                                      id: { type: 'string' },
                                      name: { type: 'string' },
                                      spaces: {
                                        type: 'array',
                                        items: {
                                          type: 'object',
                                          properties: {
                                            id: { type: 'string' },
                                            number: { type: 'string' },
                                            status: { type: 'string' },
                                            type: { type: 'string' }
                                          }
                                        }
                                      }
                                    }
                                  }
                                }
                              }
                            }
                          },
                          nodes: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                name: { type: 'string' },
                                type: { type: 'string' },
                                coordinates: {
                                  type: 'object',
                                  properties: {
                                    x: { type: 'number' },
                                    y: { type: 'number' },
                                    floor: { type: 'string' }
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
          }
        },
        put: {
          tags: ['停车场管理'],
          summary: '更新停车场信息',
          description: '更新停车场基本信息',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '停车场ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', description: '停车场名称' },
                    address: { type: 'string', description: '停车场地址' },
                    description: { type: 'string', description: '停车场描述' },
                    totalSpaces: { type: 'integer', description: '总车位数' },
                    status: { type: 'string', description: '状态' },
                    operatingHours: {
                      type: 'object',
                      properties: {
                        open: { type: 'string' },
                        close: { type: 'string' }
                      }
                    },
                    pricing: {
                      type: 'object',
                      properties: {
                        hourly: { type: 'number' },
                        daily: { type: 'number' },
                        monthly: { type: 'number' }
                      }
                    }
                  }
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
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          name: { type: 'string' },
                          address: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['停车场管理'],
          summary: '删除停车场',
          description: '根据ID删除停车场',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '停车场ID'
            }
          ],
          responses: {
            200: {
              description: '删除成功',
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
      '/api/admin/parking/spaces': {
        get: {
          tags: ['停车场管理'],
          summary: '获取停车位列表',
          description: '分页获取停车位列表，支持多条件筛选',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'page',
              in: 'query',
              schema: { type: 'integer', default: 1 },
              description: '页码'
            },
            {
              name: 'limit',
              in: 'query',
              schema: { type: 'integer', default: 10 },
              description: '每页数量'
            },
            {
              name: 'parkingLotId',
              in: 'query',
              schema: { type: 'string' },
              description: '停车场ID'
            },
            {
              name: 'floor',
              in: 'query',
              schema: { type: 'string' },
              description: '楼层'
            },
            {
              name: 'section',
              in: 'query',
              schema: { type: 'string' },
              description: '区域'
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string' },
              description: '状态筛选'
            },
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string' },
              description: '类型筛选'
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
                          spaces: {
                            type: 'array',
                            items: {
                              type: 'object',
                              properties: {
                                id: { type: 'string' },
                                number: { type: 'string' },
                                status: { type: 'string' },
                                type: { type: 'string' },
                                parkingLotId: { type: 'string' },
                                floor: { type: 'string' },
                                section: { type: 'string' },
                                coordinates: {
                                  type: 'object',
                                  properties: {
                                    x: { type: 'number' },
                                    y: { type: 'number' }
                                  }
                                }
                              }
                            }
                          },
                          pagination: {
                            type: 'object',
                            properties: {
                              page: { type: 'integer' },
                              limit: { type: 'integer' },
                              total: { type: 'integer' },
                              pages: { type: 'integer' }
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
        post: {
          tags: ['停车场管理'],
          summary: '创建停车位',
          description: '创建新的停车位',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    number: { type: 'string', description: '车位编号' },
                    parkingLotId: { type: 'string', description: '停车场ID' },
                    floor: { type: 'string', description: '楼层' },
                    section: { type: 'string', description: '区域' },
                    type: { type: 'string', description: '车位类型' },
                    coordinates: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' }
                      }
                    }
                  },
                  required: ['number', 'parkingLotId', 'floor', 'section', 'type']
                }
              }
            }
          },
          responses: {
            201: {
              description: '创建成功',
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
                          id: { type: 'string' },
                          number: { type: 'string' },
                          parkingLotId: { type: 'string' }
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
      '/api/admin/parking/spaces/{id}': {
        get: {
          tags: ['停车场管理'],
          summary: '获取停车位详情',
          description: '根据ID获取停车位详细信息',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '停车位ID'
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
                          number: { type: 'string' },
                          status: { type: 'string' },
                          type: { type: 'string' },
                          parkingLotId: { type: 'string' },
                          floor: { type: 'string' },
                          section: { type: 'string' },
                          coordinates: {
                            type: 'object',
                            properties: {
                              x: { type: 'number' },
                              y: { type: 'number' }
                            }
                          },
                          vehicleInfo: {
                            type: 'object',
                            properties: {
                              licensePlate: { type: 'string' },
                              entryTime: { type: 'string' },
                              estimatedExitTime: { type: 'string' }
                            }
                          },
                          createdAt: { type: 'string' },
                          updatedAt: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        put: {
          tags: ['停车场管理'],
          summary: '更新停车位信息',
          description: '更新停车位信息',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '停车位ID'
            }
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    number: { type: 'string', description: '车位编号' },
                    status: { type: 'string', description: '状态' },
                    type: { type: 'string', description: '车位类型' },
                    coordinates: {
                      type: 'object',
                      properties: {
                        x: { type: 'number' },
                        y: { type: 'number' }
                      }
                    },
                    vehicleInfo: {
                      type: 'object',
                      properties: {
                        licensePlate: { type: 'string' },
                        entryTime: { type: 'string' },
                        estimatedExitTime: { type: 'string' }
                      }
                    }
                  }
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
                      message: { type: 'string' },
                      data: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          number: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        delete: {
          tags: ['停车场管理'],
          summary: '删除停车位',
          description: '根据ID删除停车位',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '停车位ID'
            }
          ],
          responses: {
            200: {
              description: '删除成功',
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
    }
  };
  
  return openApiSpec;
};

// 导出API文档到文件
const exportAPIDocs = () => {
  // 导出TCC小程序后端API文档
  const tccOpenApiSpec = generateTCCOpenAPIDoc();
  const tccFilePath = path.join(__dirname, 'tcc-api.json');
  fs.writeFileSync(tccFilePath, JSON.stringify(tccOpenApiSpec, null, 2));
  console.log(`TCC小程序后端API文档已导出到: ${tccFilePath}`);
  
  // 导出System管理后端API文档
  const systemOpenApiSpec = generateSystemOpenAPIDoc();
  const systemFilePath = path.join(__dirname, 'system-admin-api.json');
  fs.writeFileSync(systemFilePath, JSON.stringify(systemOpenApiSpec, null, 2));
  console.log(`System管理后端API文档已导出到: ${systemFilePath}`);
  
  return {
    tcc: tccFilePath,
    system: systemFilePath
  };
};

// 执行导出
exportAPIDocs();

module.exports = { generateTCCOpenAPIDoc, generateSystemOpenAPIDoc, exportAPIDocs };