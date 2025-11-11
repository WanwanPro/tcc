<template>
  <div class="expenses-management">
    <div class="page-header">
      <h2>支出管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <i class="el-icon-plus"></i> 添加支出
        </el-button>
        <el-button type="success" @click="exportExpenses" :loading="exporting">
          <i class="el-icon-download"></i> 导出记录
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="支出分类">
          <el-select v-model="filterForm.category" placeholder="请选择支出分类" clearable>
            <el-option
              v-for="category in expenseCategories"
              :key="category.value"
              :label="category.label"
              :value="category.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="filterForm.paymentMethod" placeholder="请选择支付方式" clearable>
            <el-option
              v-for="method in paymentMethods"
              :key="method.value"
              :label="method.label"
              :value="method.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd">
          </el-date-picker>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="filterExpenses">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 支出统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon total">
              <i class="el-icon-money"></i>
            </div>
            <div class="stats-info">
              <div class="stats-value">¥{{ expenseStats.totalExpense }}</div>
              <div class="stats-label">总支出</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon today">
              <i class="el-icon-date"></i>
            </div>
            <div class="stats-info">
              <div class="stats-value">¥{{ expenseStats.todayExpense }}</div>
              <div class="stats-label">今日支出</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon month">
              <i class="el-icon-time"></i>
            </div>
            <div class="stats-info">
              <div class="stats-value">¥{{ expenseStats.monthExpense }}</div>
              <div class="stats-label">本月支出</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon count">
              <i class="el-icon-document-checked"></i>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ expenseStats.totalCount }}</div>
              <div class="stats-label">支出笔数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 支出记录表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="expensesList"
        stripe
        border
        style="width: 100%">
        <el-table-column prop="transactionId" label="交易ID" width="150"></el-table-column>
        <el-table-column prop="category" label="支出分类" width="120">
          <template slot-scope="scope">
            {{ getCategoryLabel(scope.row.category) }}
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template slot-scope="scope">
            <span class="expense-text">¥{{ scope.row.amount }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100">
          <template slot-scope="scope">
            {{ getPaymentMethodLabel(scope.row.paymentMethod) }}
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template slot-scope="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusLabel(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              @click="viewExpenseDetail(scope.row)">
              详情
            </el-button>
            <el-button
              size="mini"
              type="warning"
              @click="editExpense(scope.row)">
              编辑
            </el-button>
            <el-button
              size="mini"
              type="danger"
              @click="deleteExpense(scope.row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="pagination.page"
          :page-sizes="[10, 20, 50, 100]"
          :page-size="pagination.limit"
          layout="total, sizes, prev, pager, next, jumper"
          :total="pagination.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 添加/编辑支出对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="expenseDialogVisible"
      width="50%"
      @close="resetExpenseForm">
      <el-form
        ref="expenseForm"
        :model="expenseForm"
        :rules="expenseRules"
        label-width="100px">
        <el-form-item label="支出分类" prop="category">
          <el-select v-model="expenseForm.category" placeholder="请选择支出分类" style="width: 100%">
            <el-option
              v-for="category in expenseCategories"
              :key="category.value"
              :label="category.label"
              :value="category.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number
            v-model="expenseForm.amount"
            :min="0"
            :precision="2"
            style="width: 100%">
          </el-input-number>
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="expenseForm.paymentMethod" placeholder="请选择支付方式" style="width: 100%">
            <el-option
              v-for="method in paymentMethods"
              :key="method.value"
              :label="method.label"
              :value="method.value">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input
            type="textarea"
            v-model="expenseForm.description"
            placeholder="请输入支出描述"
            :rows="3">
          </el-input>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="expenseDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveExpense" :loading="saving">保存</el-button>
      </div>
    </el-dialog>

    <!-- 支出详情对话框 -->
    <el-dialog
      title="支出详情"
      :visible.sync="expenseDetailVisible"
      width="50%">
      <div v-if="currentExpense" class="expense-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="交易ID">{{ currentExpense.transactionId }}</el-descriptions-item>
          <el-descriptions-item label="支出分类">{{ getCategoryLabel(currentExpense.category) }}</el-descriptions-item>
          <el-descriptions-item label="金额">
            <span class="expense-text">¥{{ currentExpense.amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPaymentMethodLabel(currentExpense.paymentMethod) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentExpense.status)">
              {{ getStatusLabel(currentExpense.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentExpense.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(currentExpense.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentExpense.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getExpenses, createExpense, updateExpense, deleteExpense } from '@/api/finance'

export default {
  name: 'ExpensesManagement',
  data() {
    return {
      loading: false,
      saving: false,
      exporting: false,
      expensesList: [],
      expenseStats: {
        totalExpense: '0.00',
        todayExpense: '0.00',
        monthExpense: '0.00',
        totalCount: 0
      },
      filterForm: {
        category: '',
        paymentMethod: '',
        dateRange: []
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0
      },
      expenseDialogVisible: false,
      expenseDetailVisible: false,
      isEdit: false,
      currentExpense: null,
      expenseForm: {
        category: '',
        amount: 0,
        paymentMethod: '',
        description: ''
      },
      expenseRules: {
        category: [
          { required: true, message: '请选择支出分类', trigger: 'change' }
        ],
        amount: [
          { required: true, message: '请输入金额', trigger: 'blur' },
          { type: 'number', min: 0, message: '金额必须大于0', trigger: 'blur' }
        ],
        paymentMethod: [
          { required: true, message: '请选择支付方式', trigger: 'change' }
        ],
        description: [
          { required: true, message: '请输入支出描述', trigger: 'blur' }
        ]
      },
      expenseCategories: [
        { value: 'salary', label: '工资支出' },
        { value: 'rent', label: '租金支出' },
        { value: 'utilities', label: '水电费' },
        { value: 'maintenance', label: '维修费用' },
        { value: 'equipment', label: '设备采购' },
        { value: 'software', label: '软件服务' },
        { value: 'marketing', label: '营销推广' },
        { value: 'other', label: '其他支出' }
      ],
      paymentMethods: [
        { value: 'cash', label: '现金' },
        { value: 'card', label: '银行卡' },
        { value: 'mobile', label: '移动支付' },
        { value: 'online', label: '在线支付' },
        { value: 'other', label: '其他' }
      ]
    }
  },
  computed: {
    dialogTitle() {
      return this.isEdit ? '编辑支出' : '添加支出'
    }
  },
  mounted() {
    this.fetchExpenses()
    this.calculateExpenseStats()
  },
  methods: {
    // 获取支出记录
    async fetchExpenses() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit
        }
        
        if (this.filterForm.category) {
          params.category = this.filterForm.category
        }
        
        if (this.filterForm.paymentMethod) {
          params.paymentMethod = this.filterForm.paymentMethod
        }
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }

        const response = await getExpenses(params)
        if (response.success) {
          this.expensesList = response.data.expenses
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('获取支出记录失败:', error)
        this.$message.error('获取支出记录失败')
      } finally {
        this.loading = false
      }
    },
    // 计算支出统计
    calculateExpenseStats() {
      // 这里应该调用API获取统计数据，暂时使用模拟数据
      this.expenseStats = {
        totalExpense: '12580.50',
        todayExpense: '320.00',
        monthExpense: '4560.75',
        totalCount: 42
      }
    },
    // 显示添加对话框
    showAddDialog() {
      this.isEdit = false
      this.expenseDialogVisible = true
    },
    // 编辑支出
    editExpense(expense) {
      this.isEdit = true
      this.currentExpense = expense
      this.expenseForm = {
        category: expense.category,
        amount: expense.amount,
        paymentMethod: expense.paymentMethod,
        description: expense.description
      }
      this.expenseDialogVisible = true
    },
    // 保存支出
    async saveExpense() {
      this.$refs.expenseForm.validate(async (valid) => {
        if (valid) {
          this.saving = true
          try {
            if (this.isEdit) {
              // 更新支出
              const response = await updateExpense(this.currentExpense._id, this.expenseForm)
              if (response.success) {
                this.$message.success('支出更新成功')
                this.expenseDialogVisible = false
                this.fetchExpenses()
              }
            } else {
              // 创建支出
              const response = await createExpense(this.expenseForm)
              if (response.success) {
                this.$message.success('支出创建成功')
                this.expenseDialogVisible = false
                this.fetchExpenses()
              }
            }
          } catch (error) {
            console.error('保存支出失败:', error)
            this.$message.error('保存支出失败')
          } finally {
            this.saving = false
          }
        }
      })
    },
    // 删除支出
    deleteExpense(expense) {
      this.$confirm('确定要删除这条支出记录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          const response = await deleteExpense(expense._id)
          if (response.success) {
            this.$message.success('支出删除成功')
            this.fetchExpenses()
          }
        } catch (error) {
          console.error('删除支出失败:', error)
          this.$message.error('删除支出失败')
        }
      }).catch(() => {
        this.$message.info('已取消删除')
      })
    },
    // 查看支出详情
    viewExpenseDetail(expense) {
      this.currentExpense = expense
      this.expenseDetailVisible = true
    },
    // 导出支出记录
    exportExpenses() {
      this.exporting = true
      // 这里应该实现导出逻辑
      setTimeout(() => {
        this.exporting = false
        this.$message.success('导出成功')
      }, 1000)
    },
    // 筛选支出记录
    filterExpenses() {
      this.pagination.page = 1
      this.fetchExpenses()
    },
    // 重置筛选
    resetFilter() {
      this.filterForm = {
        category: '',
        paymentMethod: '',
        dateRange: []
      }
      this.filterExpenses()
    },
    // 重置表单
    resetExpenseForm() {
      this.$refs.expenseForm && this.$refs.expenseForm.resetFields()
      this.expenseForm = {
        category: '',
        amount: 0,
        paymentMethod: '',
        description: ''
      }
      this.currentExpense = null
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.pagination.limit = val
      this.fetchExpenses()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchExpenses()
    },
    // 获取分类标签
    getCategoryLabel(value) {
      const category = this.expenseCategories.find(item => item.value === value)
      return category ? category.label : value
    },
    // 获取支付方式标签
    getPaymentMethodLabel(value) {
      const method = this.paymentMethods.find(item => item.value === value)
      return method ? method.label : value
    },
    // 获取状态类型
    getStatusType(status) {
      switch (status) {
        case 'pending':
          return 'warning'
        case 'completed':
          return 'success'
        case 'cancelled':
          return 'danger'
        default:
          return 'info'
      }
    },
    // 获取状态标签
    getStatusLabel(status) {
      switch (status) {
        case 'pending':
          return '待处理'
        case 'completed':
          return '已完成'
        case 'cancelled':
          return '已取消'
        default:
          return status
      }
    },
    // 格式化日期时间
    formatDateTime(dateTime) {
      if (!dateTime) return '-'
      const date = new Date(dateTime)
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`
    }
  }
}
</script>

<style lang="scss" scoped>
.expenses-management {
  padding: 20px;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      color: #303133;
    }

    .header-actions {
      display: flex;
      gap: 10px;
    }
  }

  .filter-card {
    margin-bottom: 20px;
  }

  .stats-row {
    margin-bottom: 20px;

    .stats-card {
      .stats-content {
        display: flex;
        align-items: center;

        .stats-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          font-size: 24px;
          color: white;

          &.total {
            background-color: #F56C6C;
          }

          &.today {
            background-color: #E6A23C;
          }

          &.month {
            background-color: #409EFF;
          }

          &.count {
            background-color: #67C23A;
          }
        }

        .stats-info {
          .stats-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 5px;
          }

          .stats-label {
            font-size: 14px;
            color: #909399;
          }
        }
      }
    }
  }

  .table-card {
    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }
  }

  .expense-detail {
    .el-descriptions {
      margin-bottom: 20px;
    }
  }

  .expense-text {
    color: #F56C6C;
    font-weight: bold;
  }
}
</style>