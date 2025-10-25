<template>
  <div class="dashboard-container">
    <!-- 数据概览卡片 -->
    <el-row :gutter="20" class="dashboard-overview">
      <el-col :xs="24" :sm="12" :md="6" v-for="(item, index) in overviewData" :key="index">
        <el-card class="overview-card" shadow="hover">
          <div class="card-content">
            <div class="card-icon" :style="{ backgroundColor: item.color }">
              <el-icon :size="24"><component :is="item.icon" /></el-icon>
            </div>
            <div class="card-info">
              <div class="card-title">{{ item.title }}</div>
              <div class="card-value">{{ item.value }}</div>
              <div class="card-desc">{{ item.desc }}</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20" class="dashboard-charts">
      <!-- 车位占用率趋势图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>车位占用率趋势</span>
              <el-radio-group v-model="occupancyTimeRange" size="small">
                <el-radio-button label="day">今日</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="occupancyChartOption" autoresize />
          </div>
        </el-card>
      </el-col>

      <!-- 收入统计图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>收入统计</span>
              <el-radio-group v-model="revenueTimeRange" size="small">
                <el-radio-button label="day">今日</el-radio-button>
                <el-radio-button label="week">本周</el-radio-button>
                <el-radio-button label="month">本月</el-radio-button>
              </el-radio-group>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="revenueChartOption" autoresize />
          </div>
        </el-card>
      </el-col>

      <!-- 车位使用分布图 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>车位使用分布</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="distributionChartOption" autoresize />
          </div>
        </el-card>
      </el-col>

      <!-- 高峰时段分析 -->
      <el-col :xs="24" :lg="12">
        <el-card class="chart-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>高峰时段分析</span>
            </div>
          </template>
          <div class="chart-container">
            <v-chart class="chart" :option="peakHoursChartOption" autoresize />
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷操作区域 -->
    <el-row :gutter="20" class="dashboard-actions">
      <el-col :span="24">
        <el-card class="action-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>快捷操作</span>
            </div>
          </template>
          <div class="action-container">
            <el-button type="primary" :icon="Refresh" @click="resetParkingStatus">重置车位状态</el-button>
            <el-button type="success" :icon="VideoPlay" @click="startSimulation">启动数据模拟</el-button>
            <el-button type="warning" :icon="VideoPause" @click="stopSimulation">停止数据模拟</el-button>
            <el-button type="info" :icon="Download" @click="exportData">导出数据</el-button>
            <el-button type="danger" :icon="Bell" @click="sendNotification">发送系统通知</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import {
  Location,
  TrendCharts,
  User,
  Money,
  Refresh,
  VideoPlay,
  VideoPause,
  Download,
  Bell
} from '@element-plus/icons-vue'
import { getDashboardData, startSpaceSimulation, stopSpaceSimulation } from '@/api'
import { ElMessage } from 'element-plus'

// 注册必要的组件
use([
  CanvasRenderer,
  LineChart,
  BarChart,
  PieChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent
])

// 数据概览
const overviewData = reactive([
  {
    title: '当前车位占用率',
    value: '68%',
    desc: '较昨日上升 5%',
    icon: 'Location',
    color: '#409EFF'
  },
  {
    title: '今日车辆流量',
    value: '326',
    desc: '较昨日上升 12%',
    icon: 'TrendCharts',
    color: '#67C23A'
  },
  {
    title: '总车位数',
    value: '1,245',
    desc: '较昨日上升 8%',
    icon: 'User',
    color: '#E6A23C'
  },
  {
    title: '今日收入',
    value: '¥8,652',
    desc: '较昨日上升 15%',
    icon: 'Money',
    color: '#F56C6C'
  }
])

// 时间范围选择
const occupancyTimeRange = ref('day')
const revenueTimeRange = ref('day')

// 收入趋势数据
const revenueTrendData = ref([])

// 车位使用分布数据
const distributionData = ref([
  { value: 680, name: '已占用', itemStyle: { color: '#F56C6C' } },
  { value: 320, name: '空闲', itemStyle: { color: '#67C23A' } },
  { value: 50, name: '维护中', itemStyle: { color: '#E6A23C' } },
  { value: 30, name: '预约', itemStyle: { color: '#409EFF' } }
])

// 车位占用率趋势图配置
const occupancyChartOption = computed(() => ({
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
    boundaryGap: false,
    data: occupancyTimeRange.value === 'day' 
      ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
      : occupancyTimeRange.value === 'week'
      ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
      : ['第1周', '第2周', '第3周', '第4周']
  },
  yAxis: {
    type: 'value',
    axisLabel: {
      formatter: '{value}%'
    }
  },
  series: [
    {
      name: '占用率',
      type: 'line',
      smooth: true,
      data: occupancyTimeRange.value === 'day' 
        ? [30, 25, 45, 68, 85, 72, 40]
        : occupancyTimeRange.value === 'week'
        ? [65, 70, 68, 72, 75, 82, 78]
        : [68, 72, 70, 75],
      itemStyle: {
        color: '#409EFF'
      },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.5)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.1)' }
          ]
        }
      }
    }
  ]
}))

// 收入统计图配置
const revenueChartOption = computed(() => ({
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
    data: revenueTrendData.value.length > 0 
      ? revenueTrendData.value.map(item => item._id)
      : (revenueTimeRange.value === 'day' 
        ? ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
        : revenueTimeRange.value === 'week'
        ? ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        : ['第1周', '第2周', '第3周', '第4周'])
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
      barWidth: '60%',
      data: revenueTrendData.value.length > 0 
        ? revenueTrendData.value.map(item => item.revenue)
        : (revenueTimeRange.value === 'day' 
          ? [1200, 800, 2100, 3200, 2800, 1900, 600]
          : revenueTimeRange.value === 'week'
          ? [12000, 15000, 13500, 16000, 18000, 22000, 19000]
          : [52000, 61000, 58000, 65000]),
      itemStyle: {
        color: '#67C23A'
      }
    }
  ]
}))

// 车位使用分布图配置
const distributionChartOption = computed(() => ({
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
      name: '车位使用',
      type: 'pie',
      radius: ['50%', '70%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: '16',
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: distributionData.value
    }
  ]
}))

// 高峰时段分析图配置
const peakHoursChartOption = reactive({
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
    data: ['6:00', '8:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00']
  },
  yAxis: {
    type: 'value'
  },
  series: [
    {
      name: '车辆进出',
      type: 'bar',
      barWidth: '60%',
      data: [30, 120, 80, 150, 70, 180, 220, 160, 90],
      itemStyle: {
        color: '#E6A23C'
      }
    }
  ]
})

// 获取仪表盘数据
const fetchDashboardData = async () => {
  try {
    const response = await getDashboardData()
    if (response.success) {
      // 更新数据概览
      if (response.data.overview) {
        overviewData[0].value = response.data.overview.totalOccupancyRate + '%'
        overviewData[1].value = response.data.overview.todayTransactionCount
        overviewData[2].value = response.data.overview.totalSpaces
        overviewData[3].value = '¥' + response.data.overview.todayRevenue
      }
      
      // 更新收入趋势数据
      if (response.data.revenueTrend) {
        revenueTrendData.value = response.data.revenueTrend
      }
      
      // 更新车位使用分布数据
      if (response.data.lotStats) {
        distributionData.value = response.data.lotStats.map(item => ({
          name: item.name,
          value: item.occupiedSpaces
        }))
      }
    }
  } catch (error) {
    console.error('获取仪表盘数据失败:', error)
    ElMessage.error('获取仪表盘数据失败')
  }
}

// 重置车位状态
const resetParkingStatus = () => {
  ElMessage.success('车位状态已重置')
}

// 启动数据模拟
const startSimulation = async () => {
  try {
    await startSpaceSimulation({})
    ElMessage.success('数据模拟已启动')
  } catch (error) {
    console.error('启动数据模拟失败:', error)
  }
}

// 停止数据模拟
const stopSimulation = async () => {
  try {
    await stopSpaceSimulation()
    ElMessage.success('数据模拟已停止')
  } catch (error) {
    console.error('停止数据模拟失败:', error)
  }
}

// 导出数据
const exportData = () => {
  ElMessage.success('数据导出功能开发中')
}

// 发送系统通知
const sendNotification = () => {
  ElMessage.success('系统通知功能开发中')
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style lang="scss" scoped>
.dashboard-container {
  padding: 20px;
  
  .dashboard-overview {
    margin-bottom: 20px;
    
    .overview-card {
      .card-content {
        display: flex;
        align-items: center;
        
        .card-icon {
          width: 60px;
          height: 60px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 16px;
          color: #fff;
        }
        
        .card-info {
          flex: 1;
          
          .card-title {
            font-size: 14px;
            color: #909399;
            margin-bottom: 8px;
          }
          
          .card-value {
            font-size: 24px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 4px;
          }
          
          .card-desc {
            font-size: 12px;
            color: #909399;
          }
        }
      }
    }
  }
  
  .dashboard-charts {
    margin-bottom: 20px;
    
    .chart-card {
      margin-bottom: 20px;
      
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      
      .chart-container {
        height: 300px;
        
        .chart {
          height: 100%;
          width: 100%;
        }
      }
    }
  }
  
  .dashboard-actions {
    .action-card {
      .action-container {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
      }
    }
  }
}
</style>