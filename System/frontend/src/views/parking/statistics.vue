<template>
  <div class="parking-statistics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>停车统计</span>
          <el-radio-group v-model="timeRange" size="small">
            <el-radio-button label="day">今日</el-radio-button>
            <el-radio-button label="week">本周</el-radio-button>
            <el-radio-button label="month">本月</el-radio-button>
            <el-radio-button label="year">本年</el-radio-button>
          </el-radio-group>
        </div>
      </template>
      
      <div class="statistics-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalRevenue }}</div>
              <div class="stat-label">总收入 (元)</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.totalCars }}</div>
              <div class="stat-label">总车流量</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.avgDuration }}</div>
              <div class="stat-label">平均停车时长 (小时)</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="stat-item">
              <div class="stat-value">{{ statistics.occupancyRate }}%</div>
              <div class="stat-label">车位使用率</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <div class="charts-container">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>收入趋势</span>
              </template>
              <div ref="revenueChart" class="chart"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>车流量趋势</span>
              </template>
              <div ref="trafficChart" class="chart"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>车位使用情况</span>
              </template>
              <div ref="occupancyChart" class="chart"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>高峰时段分析</span>
              </template>
              <div ref="peakHoursChart" class="chart"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

export default {
  name: 'ParkingStatistics',
  setup() {
    const timeRange = ref('day')
    const revenueChart = ref(null)
    const trafficChart = ref(null)
    const occupancyChart = ref(null)
    const peakHoursChart = ref(null)
    
    const statistics = ref({
      totalRevenue: 12580,
      totalCars: 342,
      avgDuration: 2.5,
      occupancyRate: 75
    })
    
    // 初始化图表
    const initCharts = () => {
      // 收入趋势图
      const revenueChartInstance = echarts.init(revenueChart.value)
      revenueChartInstance.setOption({
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['收入']
        },
        xAxis: {
          type: 'category',
          data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          name: '收入',
          data: [120, 200, 1500, 2800, 2200, 1800, 800],
          type: 'line',
          smooth: true,
          areaStyle: {}
        }]
      })
      
      // 车流量趋势图
      const trafficChartInstance = echarts.init(trafficChart.value)
      trafficChartInstance.setOption({
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['进入', '离开']
        },
        xAxis: {
          type: 'category',
          data: ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
        },
        yAxis: {
          type: 'value'
        },
        series: [
          {
            name: '进入',
            data: [5, 10, 35, 50, 40, 30, 15],
            type: 'line',
            smooth: true
          },
          {
            name: '离开',
            data: [3, 8, 25, 40, 35, 25, 10],
            type: 'line',
            smooth: true
          }
        ]
      })
      
      // 车位使用情况图
      const occupancyChartInstance = echarts.init(occupancyChart.value)
      occupancyChartInstance.setOption({
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 10,
          data: ['已占用', '空闲', '预留', '维修中']
        },
        series: [
          {
            name: '车位状态',
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
              { value: 75, name: '已占用' },
              { value: 20, name: '空闲' },
              { value: 3, name: '预留' },
              { value: 2, name: '维修中' }
            ]
          }
        ]
      })
      
      // 高峰时段分析图
      const peakHoursChartInstance = echarts.init(peakHoursChart.value)
      peakHoursChartInstance.setOption({
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        xAxis: {
          type: 'category',
          data: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [30, 85, 65, 75, 55, 90, 95, 60, 35],
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          }
        }]
      })
      
      // 响应式调整
      window.addEventListener('resize', () => {
        revenueChartInstance.resize()
        trafficChartInstance.resize()
        occupancyChartInstance.resize()
        peakHoursChartInstance.resize()
      })
    }
    
    onMounted(() => {
      nextTick(() => {
        initCharts()
      })
    })
    
    return {
      timeRange,
      statistics,
      revenueChart,
      trafficChart,
      occupancyChart,
      peakHoursChart
    }
  }
}
</script>

<style scoped>
.parking-statistics {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistics-overview {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.charts-container {
  margin-top: 20px;
}

.chart {
  height: 300px;
  width: 100%;
}
</style>