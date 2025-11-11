<template>
  <div class="data-visualization">
    <el-row :gutter="20">
      <!-- 数据概览卡片 -->
      <el-col :xs="24" :sm="12" :md="6" v-for="card in overviewCards" :key="card.title">
        <el-card class="box-card" shadow="hover">
          <div slot="header" class="clearfix">
            <span>{{ card.title }}</span>
            <el-button style="float: right; padding: 3px 0" type="text" @click="refreshData">
              <i class="el-icon-refresh"></i>
            </el-button>
          </div>
          <div class="card-content">
            <div class="card-value">{{ card.value }}</div>
            <div class="card-trend">
              <span :class="['trend-icon', card.trend > 0 ? 'up' : 'down']">
                {{ card.trend > 0 ? '↑' : '↓' }}
              </span>
              <span :class="['trend-text', card.trend > 0 ? 'up' : 'down']">
                {{ Math.abs(card.trend) }}%
              </span>
              <span class="trend-desc">较昨日</span>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 停车场使用率趋势图 -->
      <el-col :span="16">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>停车场使用率趋势</span>
            <el-radio-group v-model="parkingUsagePeriod" size="mini" style="float: right;">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
              <el-radio-button label="year">本年</el-radio-button>
            </el-radio-group>
          </div>
          <div id="parkingUsageChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 车位类型分布饼图 -->
      <el-col :span="8">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>车位类型分布</span>
          </div>
          <div id="parkingTypeChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 收入趋势图 -->
      <el-col :span="16">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>收入趋势</span>
            <el-radio-group v-model="incomePeriod" size="mini" style="float: right;">
              <el-radio-button label="week">本周</el-radio-button>
              <el-radio-button label="month">本月</el-radio-button>
              <el-radio-button label="year">本年</el-radio-button>
            </el-radio-group>
          </div>
          <div id="incomeChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 用户活跃度分布 -->
      <el-col :span="8">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>用户活跃度分布</span>
          </div>
          <div id="userActivityChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 停车时长分布 -->
      <el-col :span="12">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>停车时长分布</span>
          </div>
          <div id="parkingDurationChart" class="chart-container"></div>
        </el-card>
      </el-col>

      <!-- 高峰时段分析 -->
      <el-col :span="12">
        <el-card class="box-card">
          <div slot="header" class="clearfix">
            <span>高峰时段分析</span>
          </div>
          <div id="peakHoursChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { getDashboardData, getParkingUsageData, getIncomeData, getUserActivityData } from '@/api/dashboard'

export default {
  name: 'DataVisualization',
  data() {
    return {
      parkingUsagePeriod: 'week',
      incomePeriod: 'week',
      overviewCards: [
        { title: '总车位数', value: '1,200', trend: 5.2 },
        { title: '已占用车位', value: '856', trend: 2.8 },
        { title: '今日收入', value: '¥12,580', trend: 12.5 },
        { title: '活跃用户', value: '3,247', trend: -1.3 }
      ],
      parkingUsageChart: null,
      parkingTypeChart: null,
      incomeChart: null,
      userActivityChart: null,
      parkingDurationChart: null,
      peakHoursChart: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts()
    })
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize)
    // 销毁图表实例
    if (this.parkingUsageChart) this.parkingUsageChart.dispose()
    if (this.parkingTypeChart) this.parkingTypeChart.dispose()
    if (this.incomeChart) this.incomeChart.dispose()
    if (this.userActivityChart) this.userActivityChart.dispose()
    if (this.parkingDurationChart) this.parkingDurationChart.dispose()
    if (this.peakHoursChart) this.peakHoursChart.dispose()
  },
  watch: {
    parkingUsagePeriod() {
      this.updateParkingUsageChart()
    },
    incomePeriod() {
      this.updateIncomeChart()
    }
  },
  methods: {
    initCharts() {
      this.initParkingUsageChart()
      this.initParkingTypeChart()
      this.initIncomeChart()
      this.initUserActivityChart()
      this.initParkingDurationChart()
      this.initPeakHoursChart()
    },
    initParkingUsageChart() {
      const chartDom = document.getElementById('parkingUsageChart')
      this.parkingUsageChart = echarts.init(chartDom)
      this.updateParkingUsageChart()
    },
    updateParkingUsageChart() {
      const option = {
        title: {
          text: '停车场使用率 (%)',
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#666'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['使用率'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.getPeriodData(this.parkingUsagePeriod).dates
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: '使用率',
            type: 'line',
            smooth: true,
            areaStyle: {
              opacity: 0.3
            },
            data: this.getPeriodData(this.parkingUsagePeriod).values
          }
        ]
      }
      this.parkingUsageChart.setOption(option)
    },
    initParkingTypeChart() {
      const chartDom = document.getElementById('parkingTypeChart')
      this.parkingTypeChart = echarts.init(chartDom)
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['普通车位', '充电车位', '无障碍车位', 'VIP车位']
        },
        series: [
          {
            name: '车位类型',
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
            data: [
              { value: 800, name: '普通车位' },
              { value: 200, name: '充电车位' },
              { value: 100, name: '无障碍车位' },
              { value: 100, name: 'VIP车位' }
            ]
          }
        ]
      }
      this.parkingTypeChart.setOption(option)
    },
    initIncomeChart() {
      const chartDom = document.getElementById('incomeChart')
      this.incomeChart = echarts.init(chartDom)
      this.updateIncomeChart()
    },
    updateIncomeChart() {
      const option = {
        title: {
          text: '收入趋势 (元)',
          left: 'center',
          textStyle: {
            fontSize: 14,
            color: '#666'
          }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['停车收入', '充电收入', '其他收入'],
          bottom: 0
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.getPeriodData(this.incomePeriod).dates
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
            stack: '总量',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: this.getIncomeData('parking', this.incomePeriod)
          },
          {
            name: '充电收入',
            type: 'line',
            stack: '总量',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: this.getIncomeData('charging', this.incomePeriod)
          },
          {
            name: '其他收入',
            type: 'line',
            stack: '总量',
            areaStyle: {},
            emphasis: {
              focus: 'series'
            },
            data: this.getIncomeData('other', this.incomePeriod)
          }
        ]
      }
      this.incomeChart.setOption(option)
    },
    initUserActivityChart() {
      const chartDom = document.getElementById('userActivityChart')
      this.userActivityChart = echarts.init(chartDom)
      
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['高频用户', '中频用户', '低频用户', '休眠用户']
        },
        series: [
          {
            name: '用户活跃度',
            type: 'pie',
            radius: '60%',
            data: [
              { value: 1048, name: '高频用户' },
              { value: 735, name: '中频用户' },
              { value: 580, name: '低频用户' },
              { value: 884, name: '休眠用户' }
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
      this.userActivityChart.setOption(option)
    },
    initParkingDurationChart() {
      const chartDom = document.getElementById('parkingDurationChart')
      this.parkingDurationChart = echarts.init(chartDom)
      
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
          type: 'value',
          boundaryGap: [0, 0.01]
        },
        yAxis: {
          type: 'category',
          data: ['0-1小时', '1-2小时', '2-4小时', '4-8小时', '8-12小时', '12小时以上']
        },
        series: [
          {
            name: '车辆数',
            type: 'bar',
            data: [182, 234, 290, 104, 56, 30]
          }
        ]
      }
      this.parkingDurationChart.setOption(option)
    },
    initPeakHoursChart() {
      const chartDom = document.getElementById('peakHoursChart')
      this.peakHoursChart = echarts.init(chartDom)
      
      const hours = Array.from({ length: 24 }, (_, i) => `${i}:00`)
      const data = Array.from({ length: 24 }, () => Math.floor(Math.random() * 100) + 20)
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: hours
        },
        yAxis: {
          type: 'value',
          name: '车辆数'
        },
        series: [
          {
            name: '停车数量',
            type: 'line',
            smooth: true,
            areaStyle: {
              opacity: 0.3
            },
            data: data,
            markPoint: {
              data: [
                { type: 'max', name: '最大值' },
                { type: 'min', name: '最小值' }
              ]
            },
            markLine: {
              data: [
                { type: 'average', name: '平均值' }
              ]
            }
          }
        ]
      }
      this.peakHoursChart.setOption(option)
    },
    getPeriodData(period) {
      let dates, values
      
      if (period === 'week') {
        dates = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        values = [65, 72, 78, 82, 85, 68, 62]
      } else if (period === 'month') {
        dates = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
        values = Array.from({ length: 30 }, () => Math.floor(Math.random() * 30) + 60)
      } else {
        dates = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
        values = [65, 68, 72, 78, 82, 85, 88, 86, 82, 78, 72, 68]
      }
      
      return { dates, values }
    },
    getIncomeData(type, period) {
      let length
      
      if (period === 'week') {
        length = 7
      } else if (period === 'month') {
        length = 30
      } else {
        length = 12
      }
      
      let baseValue = 0
      if (type === 'parking') {
        baseValue = 5000
      } else if (type === 'charging') {
        baseValue = 2000
      } else {
        baseValue = 500
      }
      
      return Array.from({ length }, () => Math.floor(Math.random() * baseValue) + baseValue / 2)
    },
    refreshData() {
      // 这里可以调用API刷新数据
      this.$message.success('数据已刷新')
      
      // 重新初始化所有图表
      this.updateParkingUsageChart()
      this.updateIncomeChart()
    },
    handleResize() {
      if (this.parkingUsageChart) this.parkingUsageChart.resize()
      if (this.parkingTypeChart) this.parkingTypeChart.resize()
      if (this.incomeChart) this.incomeChart.resize()
      if (this.userActivityChart) this.userActivityChart.resize()
      if (this.parkingDurationChart) this.parkingDurationChart.resize()
      if (this.peakHoursChart) this.peakHoursChart.resize()
    }
  }
}
</script>

<style scoped>
.data-visualization {
  padding: 20px;
}

.box-card {
  height: 100%;
}

.card-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.card-value {
  font-size: 28px;
  font-weight: bold;
  margin: 10px 0;
}

.card-trend {
  display: flex;
  align-items: center;
  font-size: 14px;
}

.trend-icon {
  margin-right: 5px;
  font-weight: bold;
}

.trend-icon.up {
  color: #67C23A;
}

.trend-icon.down {
  color: #F56C6C;
}

.trend-text {
  margin-right: 5px;
  font-weight: bold;
}

.trend-text.up {
  color: #67C23A;
}

.trend-text.down {
  color: #F56C6C;
}

.trend-desc {
  color: #909399;
}

.chart-container {
  height: 300px;
  width: 100%;
}
</style>