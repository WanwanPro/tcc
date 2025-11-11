<template>
  <div class="finance-overview">
    <div class="page-header">
      <h2>财务管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="exportReport" :loading="exporting">
          <i class="el-icon-download"></i> 导出报表
        </el-button>
        <el-button type="success" @click="refreshData">
          <i class="el-icon-refresh"></i> 刷新数据
        </el-button>
      </div>
    </div>

    <!-- 时间筛选 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="yyyy-MM-dd"
            :picker-options="pickerOptions">
          </el-date-picker>
        </el-form-item>
        <el-form-item label="停车场">
          <el-select v-model="filterForm.parkingLotId" placeholder="请选择停车场" clearable>
            <el-option
              v-for="lot in parkingLots"
              :key="lot._id"
              :label="lot.name"
              :value="lot._id">
            </el-option>
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="filterData">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 收入概览卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon total">
              <i class="el-icon-coin"></i>
            </div>
            <div class="stats-info">
              <div class="stats-value">¥{{ financeData.totalRevenue }}</div>
              <div class="stats-label">总收入</div>
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
              <div class="stats-value">¥{{ financeData.todayRevenue }}</div>
              <div class="stats-label">今日收入</div>
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
              <div class="stats-value">¥{{ financeData.monthRevenue }}</div>
              <div class="stats-label">本月收入</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon transactions">
              <i class="el-icon-document-checked"></i>
            </div>
            <div class="stats-info">
              <div class="stats-value">{{ financeData.totalTransactions }}</div>
              <div class="stats-label">总交易笔数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 收入趋势图表 -->
    <el-card class="chart-card">
      <div slot="header" class="card-header">
        <span>收入趋势</span>
        <el-radio-group v-model="revenueChartPeriod" size="small" @change="updateRevenueChart">
          <el-radio-button label="day">日</el-radio-button>
          <el-radio-button label="week">周</el-radio-button>
          <el-radio-button label="month">月</el-radio-button>
          <el-radio-button label="year">年</el-radio-button>
        </el-radio-group>
      </div>
      <div class="chart-container">
        <div id="revenueChart" style="width: 100%; height: 300px;"></div>
      </div>
    </el-card>

    <!-- 收入分布和支付方式 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="card-header">
            <span>收入分布</span>
          </div>
          <div class="chart-container">
            <div id="distributionChart" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="card-header">
            <span>支付方式分布</span>
          </div>
          <div class="chart-container">
            <div id="paymentMethodChart" style="width: 100%; height: 300px;"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 财务明细表格 -->
    <el-card class="table-card">
      <div slot="header" class="card-header">
        <span>财务明细</span>
        <el-button-group>
          <el-button 
            size="small" 
            :type="transactionType === 'all' ? 'primary' : ''" 
            @click="transactionType = 'all'; fetchTransactions()">
            全部
          </el-button>
          <el-button 
            size="small" 
            :type="transactionType === 'income' ? 'primary' : ''" 
            @click="transactionType = 'income'; fetchTransactions()">
            收入
          </el-button>
          <el-button 
            size="small" 
            :type="transactionType === 'expense' ? 'primary' : ''" 
            @click="transactionType = 'expense'; fetchTransactions()">
            支出
          </el-button>
        </el-button-group>
      </div>
      <el-table
        v-loading="loading"
        :data="transactionsList"
        stripe
        border
        style="width: 100%">
        <el-table-column prop="transactionId" label="交易ID" width="120"></el-table-column>
        <el-table-column prop="type" label="类型" width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.type === 'income' ? 'success' : 'danger'">
              {{ scope.row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100"></el-table-column>
        <el-table-column prop="amount" label="金额" width="120">
          <template slot-scope="scope">
            <span :class="scope.row.type === 'income' ? 'income-text' : 'expense-text'">
              {{ scope.row.type === 'income' ? '+' : '-' }}¥{{ scope.row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="paymentMethod" label="支付方式" width="100"></el-table-column>
        <el-table-column prop="relatedId" label="关联ID" width="120"></el-table-column>
        <el-table-column prop="description" label="描述" min-width="150"></el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template slot-scope="scope">
            {{ formatDateTime(scope.row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              @click="viewTransactionDetail(scope.row)">
              详情
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

    <!-- 交易详情对话框 -->
    <el-dialog
      title="交易详情"
      :visible.sync="transactionDetailVisible"
      width="50%">
      <div v-if="currentTransaction" class="transaction-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="交易ID">{{ currentTransaction.transactionId }}</el-descriptions-item>
          <el-descriptions-item label="类型">
            <el-tag :type="currentTransaction.type === 'income' ? 'success' : 'danger'">
              {{ currentTransaction.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="分类">{{ currentTransaction.category }}</el-descriptions-item>
          <el-descriptions-item label="金额">
            <span :class="currentTransaction.type === 'income' ? 'income-text' : 'expense-text'">
              {{ currentTransaction.type === 'income' ? '+' : '-' }}¥{{ currentTransaction.amount }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ currentTransaction.paymentMethod || '-' }}</el-descriptions-item>
          <el-descriptions-item label="关联ID">{{ currentTransaction.relatedId || '-' }}</el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentTransaction.description }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentTransaction.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(currentTransaction.updatedAt) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getFinanceOverview, getFinanceTransactions, getParkingLots } from '@/api/parking'
import { getRevenueTrend, getRevenueDistribution, getPaymentMethodDistribution } from '@/api/statistics'
import { exportFinanceReport } from '@/api/statistics'
import * as echarts from 'echarts'

export default {
  name: 'FinanceOverview',
  data() {
    return {
      loading: false,
      exporting: false,
      parkingLots: [],
      financeData: {
        totalRevenue: 0,
        todayRevenue: 0,
        monthRevenue: 0,
        totalTransactions: 0
      },
      filterForm: {
        dateRange: [],
        parkingLotId: ''
      },
      revenueChartPeriod: 'month',
      transactionsList: [],
      transactionType: 'all',
      pagination: {
        page: 1,
        limit: 20,
        total: 0
      },
      transactionDetailVisible: false,
      currentTransaction: null,
      pickerOptions: {
        shortcuts: [{
          text: '最近一周',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近一个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
            picker.$emit('pick', [start, end])
          }
        }, {
          text: '最近三个月',
          onClick(picker) {
            const end = new Date()
            const start = new Date()
            start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
            picker.$emit('pick', [start, end])
          }
        }]
      },
      revenueChart: null,
      distributionChart: null,
      paymentMethodChart: null
    }
  },
  mounted() {
    this.fetchParkingLots()
    this.fetchFinanceData()
    this.fetchTransactions()
    this.initCharts()
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.revenueChart) {
      this.revenueChart.dispose()
    }
    if (this.distributionChart) {
      this.distributionChart.dispose()
    }
    if (this.paymentMethodChart) {
      this.paymentMethodChart.dispose()
    }
  },
  methods: {
    // 获取停车场列表
    async fetchParkingLots() {
      try {
        const response = await getParkingLots()
        if (response.success) {
          this.parkingLots = response.data
        }
      } catch (error) {
        console.error('获取停车场列表失败:', error)
      }
    },
    // 获取财务数据
    async fetchFinanceData() {
      try {
        const params = {}
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }
        
        if (this.filterForm.parkingLotId) {
          params.parkingLotId = this.filterForm.parkingLotId
        }

        const response = await getFinanceOverview(params)
        if (response.success) {
          this.financeData = response.data
        }
      } catch (error) {
        console.error('获取财务数据失败:', error)
        this.$message.error('获取财务数据失败')
      }
    },
    // 获取交易记录
    async fetchTransactions() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit,
          type: this.transactionType
        }
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }
        
        if (this.filterForm.parkingLotId) {
          params.parkingLotId = this.filterForm.parkingLotId
        }

        const response = await getFinanceTransactions(params)
        if (response.success) {
          this.transactionsList = response.data.transactions
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('获取交易记录失败:', error)
        this.$message.error('获取交易记录失败')
      } finally {
        this.loading = false
      }
    },
    // 初始化图表
    initCharts() {
      this.$nextTick(() => {
        this.initRevenueChart()
        this.initDistributionChart()
        this.initPaymentMethodChart()
      })
    },
    // 初始化收入趋势图表
    initRevenueChart() {
      this.revenueChart = echarts.init(document.getElementById('revenueChart'))
      this.updateRevenueChart()
    },
    // 更新收入趋势图表
    async updateRevenueChart() {
      try {
        const params = {
          period: this.revenueChartPeriod
        }
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }
        
        if (this.filterForm.parkingLotId) {
          params.parkingLotId = this.filterForm.parkingLotId
        }

        const response = await getRevenueTrend(params)
        if (response.success) {
          const data = response.data
          const xAxisData = data.map(item => {
            if (this.revenueChartPeriod === 'day') {
              return `${item._id}日`
            } else if (this.revenueChartPeriod === 'week') {
              return `第${item._id}周`
            } else if (this.revenueChartPeriod === 'month') {
              return `${item._id}月`
            } else {
              return `${item._id}年`
            }
          })
          const seriesData = data.map(item => item.totalRevenue)

          const option = {
            title: {
              text: '收入趋势',
              left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              formatter: '{b}: ¥{c}'
            },
            xAxis: {
              type: 'category',
              data: xAxisData
            },
            yAxis: {
              type: 'value',
              axisLabel: {
                formatter: '¥{value}'
              }
            },
            series: [{
              data: seriesData,
              type: 'line',
              smooth: true,
              areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
                  { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
                ])
              },
              itemStyle: {
                color: '#409EFF'
              }
            }]
          }

          this.revenueChart.setOption(option)
        }
      } catch (error) {
        console.error('获取收入趋势数据失败:', error)
      }
    },
    // 初始化收入分布图表
    initDistributionChart() {
      this.distributionChart = echarts.init(document.getElementById('distributionChart'))
      this.updateDistributionChart()
    },
    // 更新收入分布图表
    async updateDistributionChart() {
      try {
        const params = {}
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }
        
        if (this.filterForm.parkingLotId) {
          params.parkingLotId = this.filterForm.parkingLotId
        }

        const response = await getRevenueDistribution(params)
        if (response.success) {
          const data = response.data
          const chartData = data.map(item => ({
            name: item._id,
            value: item.totalRevenue
          }))

          const option = {
            title: {
              text: '收入分布',
              left: 'center'
            },
            tooltip: {
              trigger: 'item',
              formatter: '{a} <br/>{b}: ¥{c} ({d}%)'
            },
            legend: {
              orient: 'vertical',
              left: 'left'
            },
            series: [{
              name: '收入分布',
              type: 'pie',
              radius: '50%',
              data: chartData,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }]
          }

          this.distributionChart.setOption(option)
        }
      } catch (error) {
        console.error('获取收入分布数据失败:', error)
      }
    },
    // 初始化支付方式分布图表
    initPaymentMethodChart() {
      this.paymentMethodChart = echarts.init(document.getElementById('paymentMethodChart'))
      this.updatePaymentMethodChart()
    },
    // 更新支付方式分布图表
    async updatePaymentMethodChart() {
      try {
        const params = {}
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }
        
        if (this.filterForm.parkingLotId) {
          params.parkingLotId = this.filterForm.parkingLotId
        }

        const response = await getPaymentMethodDistribution(params)
        if (response.success) {
          const data = response.data
          const xAxisData = data.map(item => item._id)
          const seriesData = data.map(item => item.count)

          const option = {
            title: {
              text: '支付方式分布',
              left: 'center'
            },
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            xAxis: {
              type: 'category',
              data: xAxisData
            },
            yAxis: {
              type: 'value'
            },
            series: [{
              data: seriesData,
              type: 'bar',
              itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: '#83bff6' },
                  { offset: 0.5, color: '#188df0' },
                  { offset: 1, color: '#188df0' }
                ])
              }
            }]
          }

          this.paymentMethodChart.setOption(option)
        }
      } catch (error) {
        console.error('获取支付方式分布数据失败:', error)
      }
    },
    // 筛选数据
    filterData() {
      this.fetchFinanceData()
      this.fetchTransactions()
      this.updateRevenueChart()
      this.updateDistributionChart()
      this.updatePaymentMethodChart()
    },
    // 重置筛选
    resetFilter() {
      this.filterForm = {
        dateRange: [],
        parkingLotId: ''
      }
      this.filterData()
    },
    // 刷新数据
    refreshData() {
      this.fetchFinanceData()
      this.fetchTransactions()
      this.updateRevenueChart()
      this.updateDistributionChart()
      this.updatePaymentMethodChart()
    },
    // 导出报表
    async exportReport() {
      this.exporting = true
      try {
        const params = {
          type: 'finance'
        }
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }
        
        if (this.filterForm.parkingLotId) {
          params.parkingLotId = this.filterForm.parkingLotId
        }

        const response = await exportFinanceReport(params)
        if (response.success) {
          this.$message.success('导出成功')
          // 这里应该实现文件下载逻辑
          // window.open(response.data.downloadUrl)
        }
      } catch (error) {
        console.error('导出财务报表失败:', error)
        this.$message.error('导出财务报表失败')
      } finally {
        this.exporting = false
      }
    },
    // 查看交易详情
    viewTransactionDetail(transaction) {
      this.currentTransaction = transaction
      this.transactionDetailVisible = true
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.pagination.limit = val
      this.fetchTransactions()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchTransactions()
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
.finance-overview {
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
            background-color: #409EFF;
          }

          &.today {
            background-color: #67C23A;
          }

          &.month {
            background-color: #E6A23C;
          }

          &.transactions {
            background-color: #F56C6C;
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

  .chart-card {
    margin-bottom: 20px;

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-container {
      padding: 10px 0;
    }
  }

  .charts-row {
    margin-bottom: 20px;
  }

  .table-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }
  }

  .transaction-detail {
    .el-descriptions {
      margin-bottom: 20px;
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
</style>