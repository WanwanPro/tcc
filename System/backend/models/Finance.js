const mongoose = require('mongoose');

const financeSchema = new mongoose.Schema({
  // 交易类型: income(收入), expense(支出), report(报表)
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense', 'report']
  },
  
  // 交易分类
  category: {
    type: String,
    required: true
  },
  
  // 金额
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // 交易ID，系统自动生成
  transactionId: {
    type: String,
    required: true,
    unique: true
  },
  
  // 支付方式
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'mobile', 'online', 'other']
  },
  
  // 关联的停车记录ID
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingRecord'
  },
  
  // 关联的停车场ID
  parkingLotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ParkingLot'
  },
  
  // 关联的用户ID
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  
  // 描述
  description: {
    type: String,
    required: true
  },
  
  // 附加数据，用于存储报表等复杂数据
  relatedData: {
    type: mongoose.Schema.Types.Mixed
  },
  
  // 状态: pending(待处理), completed(已完成), cancelled(已取消)
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled'],
    default: 'completed'
  },
  
  // 创建时间
  createdAt: {
    type: Date,
    default: Date.now
  },
  
  // 更新时间
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// 创建索引
financeSchema.index({ type: 1, createdAt: -1 });
financeSchema.index({ transactionId: 1 });
financeSchema.index({ relatedId: 1 });
financeSchema.index({ parkingLotId: 1 });
financeSchema.index({ userId: 1 });
financeSchema.index({ createdAt: -1 });

// 更新时间中间件
financeSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// 静态方法：根据日期范围获取收入统计
financeSchema.statics.getRevenueStatsByDateRange = function(startDate, endDate, parkingLotId) {
  const matchCondition = {
    type: 'income',
    status: 'completed',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (parkingLotId) {
    matchCondition.parkingLotId = parkingLotId;
  }
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: null,
        totalRevenue: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// 静态方法：根据日期范围获取支出统计
financeSchema.statics.getExpenseStatsByDateRange = function(startDate, endDate, category) {
  const matchCondition = {
    type: 'expense',
    status: 'completed',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (category) {
    matchCondition.category = category;
  }
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: '$category',
        totalExpense: { $sum: '$amount' },
        totalTransactions: { $sum: 1 },
        avgAmount: { $avg: '$amount' }
      }
    }
  ]);
};

// 静态方法：获取月度财务报表
financeSchema.statics.getMonthlyReport = function(year, month, parkingLotId) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  const matchCondition = {
    status: 'completed',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (parkingLotId) {
    matchCondition.parkingLotId = parkingLotId;
  }
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: {
          type: '$type',
          category: '$category'
        },
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        categories: {
          $push: {
            category: '$_id.category',
            totalAmount: '$totalAmount',
            totalTransactions: '$totalTransactions'
          }
        },
        totalAmount: { $sum: '$totalAmount' },
        totalTransactions: { $sum: '$totalTransactions' }
      }
    }
  ]);
};

// 静态方法：获取年度财务报表
financeSchema.statics.getYearlyReport = function(year, parkingLotId) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  
  const matchCondition = {
    status: 'completed',
    createdAt: {
      $gte: startDate,
      $lte: endDate
    }
  };
  
  if (parkingLotId) {
    matchCondition.parkingLotId = parkingLotId;
  }
  
  return this.aggregate([
    { $match: matchCondition },
    {
      $group: {
        _id: {
          type: '$type',
          month: { $month: '$createdAt' }
        },
        totalAmount: { $sum: '$amount' },
        totalTransactions: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: {
          type: '$_id.type',
          month: '$_id.month'
        },
        totalAmount: { $first: '$totalAmount' },
        totalTransactions: { $first: '$totalTransactions' }
      }
    },
    {
      $group: {
        _id: '$_id.type',
        monthlyData: {
          $push: {
            month: '$_id.month',
            totalAmount: '$totalAmount',
            totalTransactions: '$totalTransactions'
          }
        },
        totalAmount: { $sum: '$totalAmount' },
        totalTransactions: { $sum: '$totalTransactions' }
      }
    }
  ]);
};

// 实例方法：生成交易ID
financeSchema.methods.generateTransactionId = function() {
  const prefix = this.type === 'income' ? 'INC' : 
                  this.type === 'expense' ? 'EXP' : 'RPT';
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  this.transactionId = `${prefix}-${timestamp}-${random}`;
  return this.transactionId;
};

const Finance = mongoose.model('Finance', financeSchema);

module.exports = Finance;