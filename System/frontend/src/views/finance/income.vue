<template>
  <div class="income-management">
    <div class="page-header">
      <h2>收入管理</h2>
      <div class="header-actions">
        <el-button type="success" @click="exportIncome" :loading="exporting">
          <i class="el-icon-download"></i> 导出记录
        </el-button>
      </div>
    </div>

    <!-- 筛选条件 -->
    <el-card class="filter-card">
      <el-form :inline="true" :model="filterForm" class="filter-form">
        <el-form-item label="收入来源">
          <el-select v-model="filterForm.source" placeholder="请选择收入来源" clearable>
            <el-option
              v-for="source in incomeSources"
              :key="source.value"
              :label="source.label"
              :value="source.value">
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
          <el-button type="primary" @click="filterIncome">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 收入统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-icon total">
              <i class="el-icon-money"></i>
            </div>
            <div class="stats-info">
              <div class="stats-value">¥{{ incomeStats.totalIncome }}</div>
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
              <div class="stats-value">¥{{ incomeStats.todayIncome }}</div>
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
              <div class="stats-value">¥{{ incomeStats.monthIncome }}</div>
              <div class="stats-label">本月收入</div>
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
              <div class="stats-value">{{ incomeStats.totalCount }}</div>
              <div class="stats-label">收入笔数</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 收入趋势图表 -->
    <el-card class="chart-card">
      <div slot="header" class="chart-header">
        <span>收入趋势</span>
        <el-radio-group v-model="chartPeriod" size="small" @change="updateIncomeChart">
          <el-radio-button label="week">本周</el-radio-button>
          <el-radio-button label="month">本月</el-radio-button>
          <el-radio-button label="year">本年</el-radio-button>
        </el-radio-group>
      </div>
      <div ref="incomeChart" class="chart-container"></div>
    </el-card>

    <!-- 收入记录表格 -->
    <el-card class="table-card">
      <el-table
        v-loading="loading"
        :data="incomeList"
        stripe
        border
        style="width: 100%">
        <el-table-column prop="transactionId" label="交易ID" width="150"></el-table-column>
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
        <el-table-column prop="parkingRecordId" label="停车记录ID" width="120">
          <template slot-scope="scope">
            <el-button
              v-if="scope.row.parkingRecordId"
              type="text"
              @click="viewParkingRecord(scope.row.parkingRecordId)">
              {{ scope.row.parkingRecordId }}
            </el-button>
            <span v-else>-</span>
          </template>
        </el-table-column>
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
        <el-table-column label="操作" width="120" fixed="right">
          <template slot-scope="scope">
            <el-button
              size="mini"
              type="primary"
              @click="viewIncomeDetail(scope.row)">
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

    <!-- 收入详情对话框 -->
    <el-dialog
      title="收入详情"
      :visible.sync="incomeDetailVisible"
      width="50%">
      <div v-if="currentIncome" class="income-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="交易ID">{{ currentIncome.transactionId }}</el-descriptions-item>
          <el-descriptions-item label="收入来源">{{ getSourceLabel(currentIncome.source) }}</el-descriptions-item>
          <el-descriptions-item label="金额">
            <span class="income-text">¥{{ currentIncome.amount }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPaymentMethodLabel(currentIncome.paymentMethod) }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getStatusType(currentIncome.status)">
              {{ getStatusLabel(currentIncome.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ formatDateTime(currentIncome.createdAt) }}</el-descriptions-item>
          <el-descriptions-item label="更新时间">{{ formatDateTime(currentIncome.updatedAt) }}</el-descriptions-item>
          <el-descriptions-item label="停车记录ID">
            <el-button
              v-if="currentIncome.parkingRecordId"
              type="text"
              @click="viewParkingRecord(currentIncome.parkingRecordId)">
              {{ currentIncome.parkingRecordId }}
            </el-button>
            <span v-else>-</span>
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">{{ currentIncome.description }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>

    <!-- 停车记录详情对话框 -->
    <el-dialog
      title="停车记录详情"
      :visible.sync="parkingRecordVisible"
      width="60%">
      <div v-if="currentParkingRecord" class="parking-record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">{{ currentParkingRecord.recordId }}</el-descriptions-item>
          <el-descriptions-item label="车牌号">{{ currentParkingRecord.plateNumber }}</el-descriptions-item>
          <el-descriptions-item label="停车场">{{ currentParkingRecord.parkingLotName }}</el-descriptions-item>
          <el-descriptions-item label="车位号">{{ currentParkingRecord.spaceNumber }}</el-descriptions-item>
          <el-descriptions-item label="入场时间">{{ formatDateTime(currentParkingRecord.entryTime) }}</el-descriptions-item>
          <el-descriptions-item label="出场时间">{{ formatDateTime(currentParkingRecord.exitTime) }}</el-descriptions-item>
          <el-descriptions-item label="停车时长">{{ currentParkingRecord.duration }}</el-descriptions-item>
          <el-descriptions-item label="停车费用">¥{{ currentParkingRecord.fee }}</el-descriptions-item>
          <el-descriptions-item label="支付状态">
            <el-tag :type="getPaymentStatusType(currentParkingRecord.paymentStatus)">
              {{ getPaymentStatusLabel(currentParkingRecord.paymentStatus) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="支付方式">{{ getPaymentMethodLabel(currentParkingRecord.paymentMethod) }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getIncome, getIncomeTrend } from '@/api/finance'
import { getParkingRecord } from '@/api/parking'
import * as echarts from 'echarts'

export default {
  name: 'IncomeManagement',
  data() {
    return {
      loading: false,
      exporting: false,
      incomeList: [],
      incomeStats: {
        totalIncome: '0.00',
        todayIncome: '0.00',
        monthIncome: '0.00',
        totalCount: 0
      },
      filterForm: {
        source: '',
        paymentMethod: '',
        dateRange: []
      },
      pagination: {
        page: 1,
        limit: 20,
        total: 0
      },
      incomeDetailVisible: false,
      parkingRecordVisible: false,
      currentIncome: null,
      currentParkingRecord: null,
      chartPeriod: 'month',
      incomeChart: null,
      incomeSources: [
        { value: 'parking', label: '停车费' },
        { value: 'membership', label: '会员费' },
        { value: 'advertising', label: '广告收入' },
        { value: 'penalty', label: '违约金' },
        { value: 'other', label: '其他收入' }
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
    this.fetchIncome()
    this.calculateIncomeStats()
    this.$nextTick(() => {
      this.initIncomeChart()
    })
  },
  beforeDestroy() {
    if (this.incomeChart) {
      this.incomeChart.dispose()
    }
  },
  methods: {
    // 获取收入记录
    async fetchIncome() {
      this.loading = true
      try {
        const params = {
          page: this.pagination.page,
          limit: this.pagination.limit
        }
        
        if (this.filterForm.source) {
          params.source = this.filterForm.source
        }
        
        if (this.filterForm.paymentMethod) {
          params.paymentMethod = this.filterForm.paymentMethod
        }
        
        if (this.filterForm.dateRange && this.filterForm.dateRange.length === 2) {
          params.startDate = this.filterForm.dateRange[0]
          params.endDate = this.filterForm.dateRange[1]
        }

        const response = await getIncome(params)
        if (response.success) {
          this.incomeList = response.data.income
          this.pagination.total = response.data.total
        }
      } catch (error) {
        console.error('获取收入记录失败:', error)
        this.$message.error('获取收入记录失败')
      } finally {
        this.loading = false
      }
    },
    // 计算收入统计
    calculateIncomeStats() {
      // 这里应该调用API获取统计数据，暂时使用模拟数据
      this.incomeStats = {
        totalIncome: '35680.50',
        todayIncome: '1280.00',
        monthIncome: '12560.75',
        totalCount: 128
      }
    },
    // 初始化收入趋势图表
    initIncomeChart() {
      this.incomeChart = echarts.init(this.$refs.incomeChart)
      this.updateIncomeChart()
    },
    // 更新收入趋势图表
    async updateIncomeChart() {
      try {
        const response = await getIncomeTrend({ period: this.chartPeriod })
        if (response.success) {
          const { dates, income } = response.data
          const option = {
            tooltip: {
              trigger: 'axis',
              axisPointer: {
                type: 'shadow'
              }
            },
            grid: {
              left: '3%',
              right: '4%',
              bottom: '3%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: dates
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
                data: income,
                itemStyle: {
                  color: '#67C23A'
                }
              }
            ]
          }
          this.incomeChart.setOption(option)
        }
      } catch (error) {
        console.error('获取收入趋势数据失败:', error)
        // 使用模拟数据
        const dates = this.generateDates()
        const income = this.generateIncomeData()
        const option = {
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'shadow'
            }
          },
          grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
          },
          xAxis: {
            type: 'category',
            data: dates
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
              data: income,
              itemStyle: {
                color: '#67C23A'
              }
            }
          ]
        }
        this.incomeChart.setOption(option)
      }
    },
    // 生成日期数据
    generateDates() {
      const dates = []
      const now = new Date()
      const period = this.chartPeriod
      
      let count = 7
      if (period === 'month') count = 30
      if (period === 'year') count = 12
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now)
        
        if (period === 'week' || period === 'month') {
          date.setDate(date.getDate() - i)
          dates.push(`${date.getMonth() + 1}/${date.getDate()}`)
        } else {
          date.setMonth(date.getMonth() - i)
          dates.push(`${date.getMonth() + 1}月`)
        }
      }
      
      return dates
    },
    // 生成收入数据
    generateIncomeData() {
      const data = []
      const count = this.chartPeriod === 'week' ? 7 : (this.chartPeriod === 'month' ? 30 : 12)
      
      for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * 1000) + 200)
      }
      
      return data
    },
    // 查看收入详情
    viewIncomeDetail(income) {
      this.currentIncome = income
      this.incomeDetailVisible = true
    },
    // 查看停车记录
    async viewParkingRecord(recordId) {
      try {
        const response = await getParkingRecord(recordId)
        if (response.success) {
          this.currentParkingRecord = response.data
          this.parkingRecordVisible = true
        }
      } catch (error) {
        console.error('获取停车记录失败:', error)
        this.$message.error('获取停车记录失败')
      }
    },
    // 导出收入记录
    exportIncome() {
      this.exporting = true
      // 这里应该实现导出逻辑
      setTimeout(() => {
        this.exporting = false
        this.$message.success('导出成功')
      }, 1000)
    },
    // 筛选收入记录
    filterIncome() {
      this.pagination.page = 1
      this.fetchIncome()
    },
    // 重置筛选
    resetFilter() {
      this.filterForm = {
        source: '',
        paymentMethod: '',
        dateRange: []
      }
      this.filterIncome()
    },
    // 分页大小改变
    handleSizeChange(val) {
      this.pagination.limit = val
      this.fetchIncome()
    },
    // 当前页改变
    handleCurrentChange(val) {
      this.pagination.page = val
      this.fetchIncome()
    },
    // 获取来源标签
    getSourceLabel(value) {
      const source = this.incomeSources.find(item => item.value === value)
      return source ? source.label : value
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
    // 获取支付状态类型
    getPaymentStatusType(status) {
      switch (status) {
        case 'paid':
          return 'success'
        case 'unpaid':
          return 'danger'
        case 'refunded':
          return 'warning'
        default:
          return 'info'
      }
    },
    // 获取支付状态标签
    getPaymentStatusLabel(status) {
      switch (status) {
        case 'paid':
          return '已支付'
        case 'unpaid':
          return '未支付'
        case 'refunded':
          return '已退款'
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
.income-management {
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
            background-color: #67C23A;
          }

          &.today {
            background-color: #409EFF;
          }

          &.month {
            background-color: #E6A23C;
          }

          &.count {
            background-color: #909399;
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

    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .chart-container {
      height: 300px;
    }
  }

  .table-card {
    .pagination-container {
      margin-top: 20px;
      text-align: right;
    }
  }

  .income-detail, .parking-record-detail {
    .el-descriptions {
      margin-bottom: 20px;
    }
  }

  .income-text {
    color: #67C23A;
    font-weight: bold;
  }
}
</style>