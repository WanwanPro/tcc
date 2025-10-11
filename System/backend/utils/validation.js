const Joi = require('joi')

// 用户验证规则
const userValidation = {
  register: Joi.object({
    username: Joi.string().alphanum().min(3).max(30).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid('admin', 'operator', 'viewer').default('viewer'),
    profile: Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
      phone: Joi.string(),
      avatar: Joi.string()
    })
  }),
  
  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
  }),
  
  updateProfile: Joi.object({
    profile: Joi.object({
      firstName: Joi.string(),
      lastName: Joi.string(),
      phone: Joi.string(),
      avatar: Joi.string()
    })
  }),
  
  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required()
  })
}

// 停车场验证规则
const parkingLotValidation = {
  create: Joi.object({
    name: Joi.string().required(),
    address: Joi.string().required(),
    totalSpaces: Joi.number().integer().min(1).required(),
    floors: Joi.number().integer().min(1).default(1),
    operatingHours: Joi.object({
      open: Joi.string(),
      close: Joi.string()
    }),
    pricing: Joi.object({
      hourly: Joi.number().min(0),
      daily: Joi.number().min(0),
      monthly: Joi.number().min(0)
    }),
    features: Joi.array().items(Joi.string()),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    })
  }),
  
  update: Joi.object({
    name: Joi.string(),
    address: Joi.string(),
    totalSpaces: Joi.number().integer().min(1),
    floors: Joi.number().integer().min(1),
    operatingHours: Joi.object({
      open: Joi.string(),
      close: Joi.string()
    }),
    pricing: Joi.object({
      hourly: Joi.number().min(0),
      daily: Joi.number().min(0),
      monthly: Joi.number().min(0)
    }),
    features: Joi.array().items(Joi.string()),
    coordinates: Joi.object({
      latitude: Joi.number().min(-90).max(90),
      longitude: Joi.number().min(-180).max(180)
    }),
    isActive: Joi.boolean()
  })
}

// 停车位验证规则
const parkingSpaceValidation = {
  create: Joi.object({
    spaceId: Joi.string().required(),
    parkingLotId: Joi.string().required(),
    floor: Joi.number().integer().min(1).required(),
    section: Joi.string(),
    spaceNumber: Joi.string().required(),
    type: Joi.string().valid('standard', 'disabled', 'electric', 'reserved').default('standard'),
    status: Joi.string().valid('available', 'occupied', 'reserved', 'out_of_order').default('available'),
    coordinates: Joi.object({
      x: Joi.number(),
      y: Joi.number()
    }),
    nodeId: Joi.string()
  }),
  
  update: Joi.object({
    floor: Joi.number().integer().min(1),
    section: Joi.string(),
    spaceNumber: Joi.string(),
    type: Joi.string().valid('standard', 'disabled', 'electric', 'reserved'),
    status: Joi.string().valid('available', 'occupied', 'reserved', 'out_of_order'),
    coordinates: Joi.object({
      x: Joi.number(),
      y: Joi.number()
    }),
    nodeId: Joi.string()
  }),
  
  batchCreate: Joi.object({
    parkingLotId: Joi.string().required(),
    floor: Joi.number().integer().min(1).required(),
    section: Joi.string(),
    startNumber: Joi.number().integer().min(1).required(),
    endNumber: Joi.number().integer().min(1).required(),
    type: Joi.string().valid('standard', 'disabled', 'electric', 'reserved').default('standard'),
    status: Joi.string().valid('available', 'occupied', 'reserved', 'out_of_order').default('available'),
    coordinates: Joi.object({
      startX: Joi.number(),
      startY: Joi.number(),
      endX: Joi.number(),
      endY: Joi.number(),
      spacing: Joi.number().default(10)
    })
  })
}

// 地图节点验证规则
const mapNodeValidation = {
  create: Joi.object({
    nodeId: Joi.string().required(),
    parkingLotId: Joi.string().required(),
    floor: Joi.number().integer().min(1).required(),
    type: Joi.string().valid('entrance', 'exit', 'parking_space', 'intersection', 'elevator', 'stairs', 'amenity').required(),
    name: Joi.string(),
    coordinates: Joi.object({
      x: Joi.number().required(),
      y: Joi.number().required()
    }).required(),
    connections: Joi.array().items(Joi.object({
      nodeId: Joi.string().required(),
      distance: Joi.number().min(0),
      floor: Joi.number().integer().min(1),
      type: Joi.string().valid('walkway', 'stairs', 'elevator', 'ramp').default('walkway')
    }))
  }),
  
  update: Joi.object({
    floor: Joi.number().integer().min(1),
    type: Joi.string().valid('entrance', 'exit', 'parking_space', 'intersection', 'elevator', 'stairs', 'amenity'),
    name: Joi.string(),
    coordinates: Joi.object({
      x: Joi.number(),
      y: Joi.number()
    }),
    connections: Joi.array().items(Joi.object({
      nodeId: Joi.string().required(),
      distance: Joi.number().min(0),
      floor: Joi.number().integer().min(1),
      type: Joi.string().valid('walkway', 'stairs', 'elevator', 'ramp').default('walkway')
    })),
    isActive: Joi.boolean()
  }),
  
  batchCreate: Joi.object({
    parkingLotId: Joi.string().required(),
    floor: Joi.number().integer().min(1).required(),
    nodes: Joi.array().items(Joi.object({
      nodeId: Joi.string().required(),
      type: Joi.string().valid('entrance', 'exit', 'parking_space', 'intersection', 'elevator', 'stairs', 'amenity').required(),
      name: Joi.string(),
      coordinates: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required()
      }).required()
    })).min(1).required()
  })
}

// 导航路径验证规则
const navigationPathValidation = {
  create: Joi.object({
    name: Joi.string().required(),
    parkingLotId: Joi.string().required(),
    startPoint: Joi.object({
      nodeId: Joi.string().required(),
      floor: Joi.number().integer().min(1).required(),
      type: Joi.string().required(),
      name: Joi.string()
    }).required(),
    endPoint: Joi.object({
      nodeId: Joi.string().required(),
      floor: Joi.number().integer().min(1).required(),
      type: Joi.string().required(),
      name: Joi.string()
    }).required(),
    path: Joi.array().items(Joi.object({
      nodeId: Joi.string().required(),
      floor: Joi.number().integer().min(1).required(),
      coordinates: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required()
      }).required(),
      instruction: Joi.string()
    })).min(1).required(),
    distance: Joi.number().min(0),
    estimatedTime: Joi.number().min(0),
    isRecommended: Joi.boolean().default(false)
  }),
  
  update: Joi.object({
    name: Joi.string(),
    startPoint: Joi.object({
      nodeId: Joi.string().required(),
      floor: Joi.number().integer().min(1).required(),
      type: Joi.string().required(),
      name: Joi.string()
    }),
    endPoint: Joi.object({
      nodeId: Joi.string().required(),
      floor: Joi.number().integer().min(1).required(),
      type: Joi.string().required(),
      name: Joi.string()
    }),
    path: Joi.array().items(Joi.object({
      nodeId: Joi.string().required(),
      floor: Joi.number().integer().min(1).required(),
      coordinates: Joi.object({
        x: Joi.number().required(),
        y: Joi.number().required()
      }).required(),
      instruction: Joi.string()
    })),
    distance: Joi.number().min(0),
    estimatedTime: Joi.number().min(0),
    isRecommended: Joi.boolean(),
    isActive: Joi.boolean()
  }),
  
  calculatePath: Joi.object({
    parkingLotId: Joi.string().required(),
    startNodeId: Joi.string().required(),
    endNodeId: Joi.string().required(),
    algorithm: Joi.string().valid('dijkstra', 'astar').default('dijkstra'),
    startFloor: Joi.number().integer().min(1),
    endFloor: Joi.number().integer().min(1)
  }),
  
  navigateEntranceToSpace: Joi.object({
    parkingLotId: Joi.string().required(),
    parkingSpaceId: Joi.string().required(),
    algorithm: Joi.string().valid('dijkstra', 'astar').default('dijkstra')
  })
}

// 交易记录验证规则
const transactionValidation = {
  create: Joi.object({
    transactionId: Joi.string().required(),
    parkingSpaceId: Joi.string().required(),
    parkingLotId: Joi.string().required(),
    vehicleInfo: Joi.object({
      licensePlate: Joi.string().required(),
      type: Joi.string().valid('car', 'motorcycle', 'truck', 'electric').default('car')
    }).required(),
    entryTime: Joi.date().required(),
    exitTime: Joi.date(),
    duration: Joi.number().integer().min(0),
    amount: Joi.number().min(0).required(),
    paymentMethod: Joi.string().valid('cash', 'card', 'mobile', 'subscription').required(),
    paymentStatus: Joi.string().valid('pending', 'completed', 'failed', 'refunded').default('pending'),
    status: Joi.string().valid('active', 'completed', 'cancelled').default('active'),
    operatorId: Joi.string()
  }),
  
  update: Joi.object({
    exitTime: Joi.date(),
    duration: Joi.number().integer().min(0),
    amount: Joi.number().min(0),
    paymentMethod: Joi.string().valid('cash', 'card', 'mobile', 'subscription'),
    paymentStatus: Joi.string().valid('pending', 'completed', 'failed', 'refunded'),
    status: Joi.string().valid('active', 'completed', 'cancelled'),
    operatorId: Joi.string()
  }),
  
  calculateFee: Joi.object({
    parkingSpaceId: Joi.string().required(),
    entryTime: Joi.date().required(),
    exitTime: Joi.date(),
    billingRuleId: Joi.string()
  })
}

// 计费规则验证规则
const billingRuleValidation = {
  create: Joi.object({
    name: Joi.string().required(),
    parkingLotId: Joi.string(),
    vehicleType: Joi.string().valid('all', 'car', 'motorcycle', 'truck', 'electric').default('all'),
    timeBasedRates: Joi.array().items(Joi.object({
      duration: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').required(),
      rate: Joi.number().min(0).required(),
      maxDuration: Joi.number().integer().min(0)
    })).min(1).required(),
    specialRates: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      conditions: Joi.string().required(),
      rate: Joi.number().min(0).required(),
      isActive: Joi.boolean().default(true)
    })),
    gracePeriod: Joi.number().integer().min(0).default(15)
  }),
  
  update: Joi.object({
    name: Joi.string(),
    vehicleType: Joi.string().valid('all', 'car', 'motorcycle', 'truck', 'electric'),
    timeBasedRates: Joi.array().items(Joi.object({
      duration: Joi.string().valid('hourly', 'daily', 'weekly', 'monthly').required(),
      rate: Joi.number().min(0).required(),
      maxDuration: Joi.number().integer().min(0)
    })),
    specialRates: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      conditions: Joi.string().required(),
      rate: Joi.number().min(0).required(),
      isActive: Joi.boolean().default(true)
    })),
    gracePeriod: Joi.number().integer().min(0),
    isActive: Joi.boolean()
  })
}

// 分析报告验证规则
const analyticsReportValidation = {
  create: Joi.object({
    name: Joi.string().required(),
    type: Joi.string().valid('occupancy', 'revenue', 'traffic', 'custom').required(),
    parkingLotId: Joi.string(),
    period: Joi.object({
      startDate: Joi.date().required(),
      endDate: Joi.date().required().min(Joi.ref('startDate'))
    }).required(),
    data: Joi.object({
      summary: Joi.object(),
      details: Joi.array(),
      charts: Joi.array()
    }),
    isScheduled: Joi.boolean().default(false),
    schedule: Joi.object({
      frequency: Joi.string(),
      nextRun: Joi.date()
    })
  }),
  
  update: Joi.object({
    name: Joi.string(),
    type: Joi.string().valid('occupancy', 'revenue', 'traffic', 'custom'),
    parkingLotId: Joi.string(),
    period: Joi.object({
      startDate: Joi.date(),
      endDate: Joi.date().min(Joi.ref('startDate'))
    }),
    data: Joi.object({
      summary: Joi.object(),
      details: Joi.array(),
      charts: Joi.array()
    }),
    isScheduled: Joi.boolean(),
    schedule: Joi.object({
      frequency: Joi.string(),
      nextRun: Joi.date()
    })
  }),
  
  generateOccupancyReport: Joi.object({
    parkingLotId: Joi.string(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required().min(Joi.ref('startDate')),
    groupBy: Joi.string().valid('hour', 'day', 'week', 'month').default('day')
  }),
  
  generateRevenueReport: Joi.object({
    parkingLotId: Joi.string(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required().min(Joi.ref('startDate')),
    groupBy: Joi.string().valid('hour', 'day', 'week', 'month').default('day'),
    paymentMethod: Joi.string().valid('cash', 'card', 'mobile', 'subscription')
  })
}

// 系统配置验证规则
const systemConfigValidation = {
  create: Joi.object({
    key: Joi.string().required(),
    category: Joi.string().required(),
    value: Joi.required(),
    description: Joi.string(),
    dataType: Joi.string().valid('string', 'number', 'boolean', 'object', 'array').default('string'),
    isActive: Joi.boolean().default(true),
    properties: Joi.object()
  }),
  
  update: Joi.object({
    category: Joi.string(),
    value: Joi.required(),
    description: Joi.string(),
    dataType: Joi.string().valid('string', 'number', 'boolean', 'object', 'array'),
    isActive: Joi.boolean(),
    properties: Joi.object()
  }),
  
  batchUpdate: Joi.object({
    configs: Joi.array().items(Joi.object({
      id: Joi.string().required(),
      value: Joi.required(),
      isActive: Joi.boolean()
    })).min(1).required()
  })
}

// 数据模拟验证规则
const simulationValidation = {
  simulateParkingSpaceStatus: Joi.object({
    status: Joi.string().valid('available', 'occupied', 'reserved', 'out_of_order').required(),
    vehicleInfo: Joi.when('status', {
      is: 'occupied',
      then: Joi.object({
        licensePlate: Joi.string().required(),
        entryTime: Joi.date().default(Date.now),
        estimatedExitTime: Joi.date()
      }).required(),
      otherwise: Joi.optional()
    })
  }),
  
  batchSimulateStatus: Joi.object({
    parkingSpaceIds: Joi.array().items(Joi.string()).min(1).required(),
    status: Joi.string().valid('available', 'occupied', 'reserved', 'out_of_order').required(),
    vehicleInfo: Joi.when('status', {
      is: 'occupied',
      then: Joi.object({
        licensePlate: Joi.string().required(),
        entryTime: Joi.date().default(Date.now),
        estimatedExitTime: Joi.date()
      }).required(),
      otherwise: Joi.optional()
    })
  }),
  
  simulateRandomStatus: Joi.object({
    parkingLotId: Joi.string().required(),
    floor: Joi.number().integer().min(1),
    occupancyRate: Joi.number().min(0).max(1).default(0.7),
    section: Joi.string()
  }),
  
  resetSimulation: Joi.object({
    parkingLotId: Joi.string(),
    floor: Joi.number().integer().min(1),
    section: Joi.string()
  })
}

// 验证中间件
const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property])
    
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      })
    }
    
    req[property] = value
    next()
  }
}

module.exports = {
  userValidation,
  parkingLotValidation,
  parkingSpaceValidation,
  mapNodeValidation,
  navigationPathValidation,
  transactionValidation,
  billingRuleValidation,
  analyticsReportValidation,
  systemConfigValidation,
  simulationValidation,
  validate
}