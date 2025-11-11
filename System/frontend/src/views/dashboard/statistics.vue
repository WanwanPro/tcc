<template>
  <div class="dashboard-container">
    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="dashboard-overview">
      <el-col :span="6">
        <el-card class="box-card">
          <div class="card-header">
            <div class="card-icon user">
              <i class="el-icon-user"></i>
            </div>
            <div class="card-info">
              <div class="card-title">总用户数</div>
              <div class="card-value">{{ statistics.totalUsers }}</div>
              <div class="card-trend">
                <span :class="['trend', userTrend > 0 ? 'up' : 'down']">
                  {{ userTrend > 0 ? '+' : '' }}{{ userTrend }}%
                  <i :class="['el-icon', userTrend > 0 ? 'el-icon-top' : 'el-icon-bottom']"></i>
                </span>
                较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="box-card">
          <div class="card-header">
            <div class="card-icon parking">
              <i class="el-icon-location"></i>
            </div>
            <div class="card-info">
              <div class="card-title">停车场数</div>
              <div class="card-value">{{ statistics.totalParkingLots }}</div>
              <div class="card-trend">
                <span :class="['trend', parkingTrend > 0 ? 'up' : 'down']">
                  {{ parkingTrend > 0 ? '+' : '' }}{{ parkingTrend }}%
                  <i :class="['el-icon', parkingTrend > 0 ? 'el-icon-top' : 'el-icon-bottom']"></i>
                </span>
                较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="box-card">
          <div class="card-header">
            <div class="card-icon space">
              <i class="el-icon-s-grid"></i>
            </div>
            <div class="card-info">
              <div class="card-title">总车位数</div>
              <div class="card-value">{{ statistics.totalSpaces }}</div>
              <div class="card-trend">
                <span :class="['trend', spaceTrend > 0 ? 'up' : 'down']">
                  {{ spaceTrend > 0 ? '+' : '' }}{{ spaceTrend }}%
                  <i :class="['el-icon', spaceTrend > 0 ? 'el-icon-top' : 'el-icon-bottom']"></i>
                </span>
                较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="box-card">
          <div class="card-header">
            <div class="card-icon revenue">
              <i class="el-icon-money"></i>
            </div>
            <div class="card-info">
              <div class="card-title">本月收入</div>
              <div class="card-value">¥{{ statistics.monthlyRevenue }}</div>
              <div class="card-trend">
                <span :class="['trend', revenueTrend > 0 ? 'up' : 'down']">
                  {{ revenueTrend > 0 ? '+' : '' }}{{ revenueTrend }}%
                  <i :class="['el-icon', revenueTrend > 0 ? 'el-icon-top' : 'el-icon-bottom']"></i>
                </span>
                较上月
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="dashboard-charts">
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>用户增长趋势</span>
            <el-radio-group v-model="userGrowthPeriod" size="small" @change="handleUserGrowthPeriodChange">
              <el-radio-button label="week">周</el-radio-button>
              <el-radio-button label="month">月</el-radio-button>
              <el-radio-button label="year">年</el-radio-button>
            </el-radio-group>
          </div>
          <div class="chart-container">
            <div ref="userGrowthChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>停车收入统计</span>
            <el-date-picker
              v-model="revenueDateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              size="small"
              @change="handleRevenueDateChange"
            />
          </div>
          <div class="chart-container">
            <div ref="revenueChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="dashboard-charts">
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>车位使用率</span>
            <el-select v-model="selectedParkingLot" placeholder="选择停车场" size="small" @change="handleParkingLotChange">
              <el-option label="全部停车场" value=""></el-option>
              <el-option
                v-for="lot in parkingLots"
                :key="lot.id"
                :label="lot.name"
                :value="lot.id">
              </el-option>
            </el-select>
          </div>
          <div class="chart-container">
            <div ref="spaceUsageChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div slot="header" class="chart-header">
            <span>用户类型分布</span>
          </div>
          <div class="chart-container">
            <div ref="userTypeChart" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 数据表格 -->
    <el-row :gutter="20" class="dashboard-tables">
      <el-col :span="24">
        <el-card class="table-card">
          <div slot="header" class="table-header">
            <span>热门停车场排行</span>
            <el-button type="text" @click="refreshHotParkingLots">刷新</el-button>
          </div>
          <el-table :data="hotParkingLots" style="width: 100%">
            <el-table-column prop="rank" label="排名" width="60">
              <template slot-scope="scope">
                <span :class="['rank', scope.row.rank <= 3 ? 'top' : '']">{{ scope.row.rank }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="name" label="停车场名称" />
            <el-table-column prop="totalSpaces" label="总车位数" width="120" />
            <el-table-column prop="occupiedSpaces" label="已占用车位" width="120" />
            <el-table-column prop="usageRate" label="使用率" width="100">
              <template slot-scope="scope">
                <el-progress :percentage="scope.row.usageRate" :color="getUsageRateColor(scope.row.usageRate)"></el-progress>
              </template>
            </el-table-column>
            <el-table-column prop="monthlyRevenue" label="月收入" width="120">
              <template slot-scope="scope">
                ¥{{ scope.row.monthlyRevenue }}
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import { getDashboardStatistics, getParkingLotsList, getHotParkingLots } from '@/api/statistics'
import * as echarts from 'echarts'

export default {
  name: 'DashboardStatistics',
  data() {
    return {
      // 统计数据
      statistics: {
        totalUsers: 0,
        totalParkingLots: 0,
        totalSpaces: 0,
        monthlyRevenue: 0
      },
      
      // 趋势数据
      userTrend: 0,
      parkingTrend: 0,
      spaceTrend: 0,
      revenueTrend: 0,
      
      // 图表相关
      userGrowthPeriod: 'month',
      revenueDateRange: [],
      selectedParkingLot: '',
      
      // 停车场列表
      parkingLots: [],
      
      // 热门停车场
      hotParkingLots: [],
      
      // 图表实例
      userGrowthChart: null,
      revenueChart: null,
      spaceUsageChart: null,
      userTypeChart: null
    }
  },
  mounted() {
    this.initDashboard()
    this.initCharts()
  },
  beforeDestroy() {
    // 销毁图表实例
    if (this.userGrowthChart) this.userGrowthChart.dispose()
    if (this.revenueChart) this.revenueChart.dispose()
    if (this.spaceUsageChart) this.spaceUsageChart.dispose()
    if (this.userTypeChart) this.userTypeChart.dispose()
  },
  methods: {
    // 初始化仪表盘
    async initDashboard() {
      try {
        // 获取统计数据
        const statisticsRes = await getDashboardStatistics()
        this.statistics = statisticsRes.data
        
        // 设置趋势数据（模拟数据）
        this.userTrend = 12.5
        this.parkingTrend = 8.3
        this.spaceTrend = 15.7
        this.revenueTrend = 23.6
        
        // 获取停车场列表
        const parkingLotsRes = await getParkingLotsList()
        this.parkingLots = parkingLotsRes.data.items
        
        // 获取热门停车场
        const hotParkingLotsRes = await getHotParkingLots()
        this.hotParkingLots = hotParkingLotsRes.data
        
        // 设置默认日期范围（最近30天）
        const endDate = new Date()
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - 30)
        this.revenueDateRange = [startDate, endDate]
        
        // 更新图表
        this.updateCharts()
      } catch (error) {
        console.error('初始化仪表盘失败:', error)
        this.$message.error('获取统计数据失败')
      }
    },
    
    // 初始化图表
    initCharts() {
      // 用户增长趋势图
      this.userGrowthChart = echarts.init(this.$refs.userGrowthChart)
      
      // 停车收入统计图
      this.revenueChart = echarts.init(this.$refs.revenueChart)
      
      // 车位使用率图
      this.spaceUsageChart = echarts.init(this.$refs.spaceUsageChart)
      
      // 用户类型分布图
      this.userTypeChart = echarts.init(this.$refs.userTypeChart)
      
      // 监听窗口大小变化
      window.addEventListener('resize', this.handleResize)
    },
    
    // 更新图表
    updateCharts() {
      this.updateUserGrowthChart()
      this.updateRevenueChart()
      this.updateSpaceUsageChart()
      this.updateUserTypeChart()
    },
    
    // 更新用户增长趋势图
    updateUserGrowthChart() {
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['新增用户', '累计用户']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.generateDateRange(this.userGrowthPeriod)
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '新增用户',
            type: 'line',
            stack: 'Total',
            data: this.generateMockData(30, 5, 20),
            itemStyle: {
              color: '#409EFF'
            }
          },
          {
            name: '累计用户',
            type: 'line',
            stack: 'Total',
            data: this.generateCumulativeData(30, 5, 20),
            itemStyle: {
              color: '#67C23A'
            }
          }
        ]
      }
      
      this.userGrowthChart.setOption(option)
    },
    
    // 更新停车收入统计图
    updateRevenueChart() {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['停车收入', '其他收入']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.generateDateRange('day', 30)
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '¥{value}'
          }
        },
        series: [
          {
            name: '停车收入',
            type: 'line',
            data: this.generateMockData(30, 1000, 5000),
            itemStyle: {
              color: '#E6A23C'
            },
            areaStyle: {
              color: 'rgba(230, 162, 60, 0.3)'
            }
          },
          {
            name: '其他收入',
            type: 'line',
            data: this.generateMockData(30, 100, 500),
            itemStyle: {
              color: '#F56C6C'
            },
            areaStyle: {
              color: 'rgba(245, 108, 108, 0.3)'
            }
          }
        ]
      }
      
      this.revenueChart.setOption(option)
    },
    
    // 更新车位使用率图
    updateSpaceUsageChart() {
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        legend: {
          data: ['空闲车位', '占用车位', '预订车位']
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.generateTimeRange('hour', 24)
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            formatter: '{value}个'
          }
        },
        series: [
          {
            name: '空闲车位',
            type: 'bar',
            stack: 'total',
            data: this.generateMockData(24, 10, 50),
            itemStyle: {
              color: '#67C23A'
            }
          },
          {
            name: '占用车位',
            type: 'bar',
            stack: 'total',
            data: this.generateMockData(24, 20, 80),
            itemStyle: {
              color: '#E6A23C'
            }
          },
          {
            name: '预订车位',
            type: 'bar',
            stack: 'total',
            data: this.generateMockData(24, 5, 20),
            itemStyle: {
              color: '#409EFF'
            }
          }
        ]
      }
      
      this.spaceUsageChart.setOption(option)
    },
    
    // 更新用户类型分布图
    updateUserTypeChart() {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '用户类型',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 1048, name: '普通用户', itemStyle: { color: '#409EFF' } },
              { value: 735, name: 'VIP用户', itemStyle: { color: '#E6A23C' } },
              { value: 580, name: '月卡用户', itemStyle: { color: '#67C23A' } },
              { value: 484, name: '临时用户', itemStyle: { color: '#F56C6C' } }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      
      this.userTypeChart.setOption(option)
    },
    
    // 处理窗口大小变化
    handleResize() {
      this.userGrowthChart.resize()
      this.revenueChart.resize()
      this.spaceUsageChart.resize()
      this.userTypeChart.resize()
    },
    
    // 处理用户增长周期变化
    handleUserGrowthPeriodChange() {
      this.updateUserGrowthChart()
    },
    
    // 处理收入日期范围变化
    handleRevenueDateChange() {
      this.updateRevenueChart()
    },
    
    // 处理停车场选择变化
    handleParkingLotChange() {
      this.updateSpaceUsageChart()
    },
    
    // 刷新热门停车场
    async refreshHotParkingLots() {
      try {
        const res = await getHotParkingLots()
        this.hotParkingLots = res.data
        this.$message.success('数据已刷新')
      } catch (error) {
        console.error('刷新热门停车场失败:', error)
        this.$message.error('刷新失败')
      }
    },
    
    // 获取使用率颜色
    getUsageRateColor(rate) {
      if (rate < 50) return '#67C23A'
      if (rate < 80) return '#E6A23C'
      return '#F56C6C'
    },
    
    // 生成日期范围
    generateDateRange(period, count = 12) {
      const dates = []
      const now = new Date()
      
      for (let i = count - 1; i >= 0; i--) {
        const date = new Date(now)
        
        if (period === 'day') {
          date.setDate(date.getDate() - i)
          dates.push(date.toLocaleDateString())
        } else if (period === 'week') {
          date.setDate(date.getDate() - (i * 7))
          dates.push(`${date.getMonth() + 1}月第${Math.ceil(date.getDate() / 7)}周`)
        } else if (period === 'month') {
          date.setMonth(date.getMonth() - i)
          dates.push(`${date.getFullYear()}年${date.getMonth() + 1}月`)
        } else if (period === 'year') {
          date.setFullYear(date.getFullYear() - i)
          dates.push(`${date.getFullYear()}年`)
        }
      }
      
      return dates
    },
    
    // 生成时间范围
    generateTimeRange(unit, count) {
      const times = []
      
      for (let i = 0; i < count; i++) {
        if (unit === 'hour') {
          times.push(`${i}:00`)
        } else if (unit === 'minute') {
          times.push(`${Math.floor(i / 60)}:${i % 60 < 10 ? '0' : ''}${i % 60}`)
        }
      }
      
      return times
    },
    
    // 生成模拟数据
    generateMockData(count, min, max) {
      const data = []
      for (let i = 0; i < count; i++) {
        data.push(Math.floor(Math.random() * (max - min + 1)) + min)
      }
      return data
    },
    
    // 生成累计数据
    generateCumulativeData(count, min, max) {
      const data = []
      let cumulative = 0
      
      for (let i = 0; i < count; i++) {
        const value = Math.floor(Math.random() * (max - min + 1)) + min
        cumulative += value
        data.push(cumulative)
      }
      
      return data
    }
  }
}
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  
  .dashboard-overview {
    margin-bottom: 20px;
    
    .box-card {
      .card-header {
        display: flex;
        align-items: center;
        
        .card-icon {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 15px;
          
          i {
            font-size: 24px;
            color: #fff;
          }
          
          &.user {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          }
          
          &.parking {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          }
          
          &.space {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          }
          
          &.revenue {
            background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
          }
        }
        
        .card-info {
          flex: 1;
          
          .card-title {
            font-size: 14px;
            color: #909399;
            margin-bottom: 5px;
          }
          
          .card-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 5px;
          }
          
          .card-trend {
            font-size: 12px;
            color: #909399;
            
            .trend {
              font-weight: bold;
              margin-right: 5px;
              
              &.up {
                color: #67C23A;
              }
              
              &.down {
                color: #F56C6C;
              }
            }
          }
        }
      }
    }
  }
  
  .dashboard-charts {
    margin-bottom: 20px;
    
    .chart-card {
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-container {
        height: 300px;
        
        .chart {
          width: 100%;
          height: 100%;
        }
      }
    }
  }
  
  .dashboard-tables {
    .table-card {
      .table-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .rank {
        font-weight: bold;
        
        &.top {
          color: #E6A23C;
        }
      }
    }
  }
}
</style>