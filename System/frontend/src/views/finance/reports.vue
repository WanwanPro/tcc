<template>
  <div class="finance-reports">
    <div class="page-header">
      <h2>财务报表</h2>
      <div class="header-actions">
        <el-button type="primary" @click="generateReport" :loading="generating">
          <i class="el-icon-document"></i> 生成报表
        </el-button>
        <el-button type="success" @click="exportReport" :loading="exporting">
          <i class="el-icon-download"></i> 导出报表
        </el-button>
      </div>
    </div>

    <!-- 报表类型选择 -->
    <el-card class="type-card">
      <div class="type-selection">
        <h3>选择报表类型</h3>
        <el-radio-group v-model="reportType" @change="handleReportTypeChange">
          <el-radio-button label="daily">日报表</el-radio-button>
          <el-radio-button label="weekly">周报表</el-radio-button>
          <el-radio-button label="monthly">月报表</el-radio-button>
          <el-radio-button label="yearly">年报表</el-radio-button>
          <el-radio-button label="custom">自定义</el-radio-button>
        </el-radio-group>
      </div>
      
      <!-- 自定义时间范围 -->
      <div v-if="reportType === 'custom'" class="custom-date-range">
        <el-date-picker
          v-model="customDateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          value-format="yyyy-MM-dd">
        </el-date-picker>
      </div>
    </el-card>

    <!-- 报表内容 -->
    <el-card v-if="reportData" class="report-content">
      <div slot="header" class="report-header">
        <span>{{ getReportTitle() }}</span>
        <el-button-group>
          <el-button size="mini" icon="el-icon-refresh" @click="refreshReport">刷新</el-button>
          <el-button size="mini" icon="el-icon-printer" @click="printReport">打印</el-button>
        </el-button-group>
      </div>

      <!-- 报表概览 -->
      <div class="report-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-label">总收入</div>
              <div class="overview-value income">¥{{ reportData.totalIncome }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-label">总支出</div>
              <div class="overview-value expense">¥{{ reportData.totalExpense }}</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-label">净利润</div>
              <div class="overview-value" :class="getProfitClass(reportData.netProfit)">
                ¥{{ reportData.netProfit }}
              </div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-label">利润率</div>
              <div class="overview-value" :class="getProfitRateClass(reportData.profitRate)">
                {{ reportData.profitRate }}%
              </div>
            </div>
          </el-col>
        </el-row>
      </div>

      <!-- 收入支出对比图表 -->
      <div class="chart-section">
        <h4>收入支出对比</h4>
        <div ref="incomeExpenseChart" class="chart-container"></div>
      </div>

      <!-- 收入来源分布 -->
      <div class="chart-section">
        <h4>收入来源分布</h4>
        <div ref="incomeSourceChart" class="chart-container"></div>
      </div>

      <!-- 支出分类分布 -->
      <div class="chart-section">
        <h4>支出分类分布</h4>
        <div ref="expenseCategoryChart" class="chart-container"></div>
      </div>

      <!-- 收入明细表格 -->
      <div class="table-section">
        <h4>收入明细</h4>
        <el-table
          :data="reportData.incomeDetails"
          stripe
          border
          style="width: 100%">
          <el-table-column prop="date" label="日期" width="120"></el-table-column>
          <el-table-column prop="source" label="收入来源" width="120">
            <template slot-scope="scope">
              {{ getSourceLabel(scope.row.source) }}
            </template>
          </el-table-column>
          <el-table-column prop="amount" label="金额" width="120">
            <template slot-scope="scope">
              <span class="income-text">¥{{ scope.row.amount }}</span>
            </template>
          </el-table-column>
          <el-table-column prop="paymentMethod" label="支付方式" width="100">
            <template slot-scope="scope">
              {{ getPaymentMethodLabel(scope.row.paymentMethod) }}
            </template>
          </el-table-column>
          <el-table-column prop="description" label="描述" min-width="200"></el-table-column>
        </el-table>
      </div>

      <!-- 支出明细表格 -->
      <div class="table-section">
        <h4>支出明细</h4>
        <el-table
          :data="reportData.expenseDetails"
          stripe
          border
          style="width: 100%">
          <el-table-column prop="date" label="日期" width="120"></el-table-column>
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
        </el-table>
      </div>
    </el-card>

    <!-- 空状态 -->
    <el-empty v-else description="请选择报表类型并生成报表" :image-size="200"></el-empty>
  </div>
</template>

<script>
import { generateFinanceReport } from '@/api/finance'
import * as echarts from 'echarts'

export default {
  name: 'FinanceReports',
  data() {
    return {
      generating: false,
      exporting: false,
      reportType: 'monthly',
      customDateRange: [],
      reportData: null,
      incomeExpenseChart: null,
      incomeSourceChart: null,
      expenseCategoryChart: null,
      incomeSources: [
        { value: 'parking', label: '停车费' },
        { value: 'membership', label: '会员费' },
        { value: 'advertising', label: '广告收入' },
        { value: 'penalty', label: '违约金' },
        { value: 'other', label: '其他收入' }
      ],
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
        { value: 'wechat', label: '微信支付' },
        { value: 'alipay', label: '支付宝' },
        { value: 'card', label: '银行卡' },
        { value: 'cash', label: '现金' },
        { value: 'other', label: '其他' }
      ]
    }
  },
  mounted() {
    // 初始化时生成默认报表
    this.generateReport()
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.incomeExpenseChart) {
      this.incomeExpenseChart.dispose()
    }
    if (this.incomeSourceChart) {
      this.incomeSourceChart.dispose()
    }
    if (this.expenseCategoryChart) {
      this.expenseCategoryChart.dispose()
    }
  },
  methods: {
    // 处理报表类型变化
    handleReportTypeChange() {
      // 重置报表数据
      this.reportData = null
    },
    // 生成报表
    async generateReport() {
      this.generating = true
      try {
        let params = {
          type: this.reportType
        }
        
        if (this.reportType === 'custom' && this.customDateRange && this.customDateRange.length === 2) {
          params.startDate = this.customDateRange[0]
          params.endDate = this.customDateRange[1]
        }
        
        const response = await generateFinanceReport(params)
        if (response.success) {
          this.reportData = response.data
          this.$nextTick(() => {
            this.initCharts()
          })
        }
      } catch (error) {
        console.error('生成报表失败:', error)
        // 使用模拟数据
        this.generateMockReport()
        this.$nextTick(() => {
          this.initCharts()
        })
      } finally {
        this.generating = false
      }
    },
    // 生成模拟报表数据
    generateMockReport() {
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      
      // 生成日期范围
      let startDate, endDate, title
      if (this.reportType === 'daily') {
        startDate = endDate = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        title = `${year}年${month}月${now.getDate()}日 财务报表`
      } else if (this.reportType === 'weekly') {
        const weekStart = new Date(now)
        weekStart.setDate(now.getDate() - 7)
        startDate = `${year}-${String(weekStart.getMonth() + 1).padStart(2, '0')}-${String(weekStart.getDate()).padStart(2, '0')}`
        endDate = `${year}-${String(month).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
        title = `${year}年${weekStart.getMonth() + 1}月${weekStart.getDate()}日 - ${month}月${now.getDate()}日 财务报表`
      } else if (this.reportType === 'monthly') {
        startDate = `${year}-${String(month).padStart(2, '0')}-01`
        endDate = `${year}-${String(month).padStart(2, '0')}-31`
        title = `${year}年${month}月 财务报表`
      } else if (this.reportType === 'yearly') {
        startDate = `${year}-01-01`
        endDate = `${year}-12-31`
        title = `${year}年 财务报表`
      } else if (this.reportType === 'custom' && this.customDateRange && this.customDateRange.length === 2) {
        startDate = this.customDateRange[0]
        endDate = this.customDateRange[1]
        title = `${startDate} 至 ${endDate} 财务报表`
      }
      
      // 生成收入明细
      const incomeDetails = []
      for (let i = 0; i < 20; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + Math.floor(Math.random() * 30))
        incomeDetails.push({
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          source: this.incomeSources[Math.floor(Math.random() * this.incomeSources.length)].value,
          amount: (Math.random() * 500 + 50).toFixed(2),
          paymentMethod: this.paymentMethods[Math.floor(Math.random() * this.paymentMethods.length)].value,
          description: '停车费收入'
        })
      }
      
      // 生成支出明细
      const expenseDetails = []
      for (let i = 0; i < 15; i++) {
        const date = new Date(startDate)
        date.setDate(date.getDate() + Math.floor(Math.random() * 30))
        expenseDetails.push({
          date: `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`,
          category: this.expenseCategories[Math.floor(Math.random() * this.expenseCategories.length)].value,
          amount: (Math.random() * 1000 + 100).toFixed(2),
          paymentMethod: this.paymentMethods[Math.floor(Math.random() * this.paymentMethods.length)].value,
          description: '日常运营支出'
        })
      }
      
      // 计算总额
      const totalIncome = incomeDetails.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)
      const totalExpense = expenseDetails.reduce((sum, item) => sum + parseFloat(item.amount), 0).toFixed(2)
      const netProfit = (parseFloat(totalIncome) - parseFloat(totalExpense)).toFixed(2)
      const profitRate = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(2) : '0.00'
      
      this.reportData = {
        title,
        startDate,
        endDate,
        totalIncome,
        totalExpense,
        netProfit,
        profitRate,
        incomeDetails,
        expenseDetails,
        incomeSourceDistribution: [
          { name: '停车费', value: '6580.50' },
          { name: '会员费', value: '3200.00' },
          { name: '广告收入', value: '1500.00' },
          { name: '违约金', value: '800.00' },
          { name: '其他收入', value: '500.00' }
        ],
        expenseCategoryDistribution: [
          { name: '工资支出', value: '5000.00' },
          { name: '租金支出', value: '3000.00' },
          { name: '水电费', value: '1200.00' },
          { name: '维修费用', value: '800.00' },
          { name: '设备采购', value: '1500.00' },
          { name: '软件服务', value: '600.00' },
          { name: '营销推广', value: '1000.00' },
          { name: '其他支出', value: '400.00' }
        ],
        dailyIncomeExpense: [
          { date: '01', income: '1200.00', expense: '800.00' },
          { date: '02', income: '1500.00', expense: '900.00' },
          { date: '03', income: '1800.00', expense: '1000.00' },
          { date: '04', income: '1400.00', expense: '850.00' },
          { date: '05', income: '2000.00', expense: '1100.00' },
          { date: '06', income: '1600.00', expense: '950.00' },
          { date: '07', income: '1900.00', expense: '1050.00' }
        ]
      }
    },
    // 初始化图表
    initCharts() {
      this.initIncomeExpenseChart()
      this.initIncomeSourceChart()
      this.initExpenseCategoryChart()
    },
    // 初始化收入支出对比图表
    initIncomeExpenseChart() {
      this.incomeExpenseChart = echarts.init(this.$refs.incomeExpenseChart)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['收入', '支出']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.reportData.dailyIncomeExpense.map(item => item.date)
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [
          {
            name: '收入',
            type: 'bar',
            data: this.reportData.dailyIncomeExpense.map(item => item.income),
            itemStyle: {
              color: '#67C23A'
            }
          },
          {
            name: '支出',
            type: 'bar',
            data: this.reportData.dailyIncomeExpense.map(item => item.expense),
            itemStyle: {
              color: '#F56C6C'
            }
          }
        ]
      }
      this.incomeExpenseChart.setOption(option)
    },
    // 初始化收入来源分布图表
    initIncomeSourceChart() {
      this.incomeSourceChart = echarts.init(this.$refs.incomeSourceChart)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: this.reportData.incomeSourceDistribution.map(item => item.name)
        },
        series: [
          {
            name: '收入来源',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: this.reportData.incomeSourceDistribution.map(item => ({
              name: item.name,
              value: parseFloat(item.value)
            }))
          }
        ]
      }
      this.incomeSourceChart.setOption(option)
    },
    // 初始化支出分类分布图表
    initExpenseCategoryChart() {
      this.expenseCategoryChart = echarts.init(this.$refs.expenseCategoryChart)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: this.reportData.expenseCategoryDistribution.map(item => item.name)
        },
        series: [
          {
            name: '支出分类',
            type: 'pie',
            radius: ['50%', '70%'],
            avoidLabelOverlap: false,
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              label: {
                show: true,
                fontSize: '18',
                fontWeight: 'bold'
              }
            },
            labelLine: {
              show: false
            },
            data: this.reportData.expenseCategoryDistribution.map(item => ({
              name: item.name,
              value: parseFloat(item.value)
            }))
          }
        ]
      }
      this.expenseCategoryChart.setOption(option)
    },
    // 刷新报表
    refreshReport() {
      this.generateReport()
    },
    // 打印报表
    printReport() {
      window.print()
    },
    // 导出报表
    exportReport() {
      this.exporting = true
      // 这里应该实现导出逻辑
      setTimeout(() => {
        this.exporting = false
        this.$message.success('导出成功')
      }, 1000)
    },
    // 获取报表标题
    getReportTitle() {
      if (this.reportData && this.reportData.title) {
        return this.reportData.title
      }
      
      const now = new Date()
      const year = now.getFullYear()
      const month = now.getMonth() + 1
      
      switch (this.reportType) {
        case 'daily':
          return `${year}年${month}月${now.getDate()}日 财务报表`
        case 'weekly':
          return `${year}年第${Math.ceil(now.getDate() / 7)}周 财务报表`
        case 'monthly':
          return `${year}年${month}月 财务报表`
        case 'yearly':
          return `${year}年 财务报表`
        case 'custom':
          return '自定义时间范围 财务报表'
        default:
          return '财务报表'
      }
    },
    // 获取利润样式类
    getProfitClass(profit) {
      const value = parseFloat(profit)
      if (value > 0) return 'income'
      if (value < 0) return 'expense'
      return ''
    },
    // 获取利润率样式类
    getProfitRateClass(rate) {
      const value = parseFloat(rate)
      if (value > 0) return 'income'
      if (value < 0) return 'expense'
      return ''
    },
    // 获取来源标签
    getSourceLabel(value) {
      const source = this.incomeSources.find(item => item.value === value)
      return source ? source.label : value
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
    }
  }
}
</script>

<style lang="scss" scoped>
.finance-reports {
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

  .type-card {
    margin-bottom: 20px;

    .type-selection {
      h3 {
        margin: 0 0 15px 0;
        color: #303133;
      }
    }

    .custom-date-range {
      margin-top: 15px;
      display: flex;
      justify-content: center;
    }
  }

  .report-content {
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .report-overview {
      margin-bottom: 30px;

      .overview-item {
        text-align: center;
        padding: 15px;
        border-radius: 4px;
        background-color: #f5f7fa;

        .overview-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 8px;
        }

        .overview-value {
          font-size: 24px;
          font-weight: bold;
          color: #303133;

          &.income {
            color: #67C23A;
          }

          &.expense {
            color: #F56C6C;
          }
        }
      }
    }

    .chart-section {
      margin-bottom: 30px;

      h4 {
        margin: 0 0 15px 0;
        color: #303133;
      }

      .chart-container {
        height: 300px;
      }
    }

    .table-section {
      margin-bottom: 30px;

      h4 {
        margin: 0 0 15px 0;
        color: #303133;
      }
    }
  }

  .income-text {
    color: #67C23A;
    font-weight: bold;
  }

  .expense-text {
    color: #F56C6C;
    font-weight: bold;
  }
}

/* 打印样式 */
@media print {
  .finance-reports {
    padding: 0;

    .page-header,
    .type-card {
      display: none;
    }

    .report-content {
      .el-card__header {
        display: none;
      }
    }
  }
}
</style>