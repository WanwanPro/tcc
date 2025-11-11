<template>
  <div class="parking-dashboard">
    <div class="page-header">
      <h2>车位监控仪表板</h2>
      <div class="header-actions">
        <el-button type="primary" @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新数据
        </el-button>
        <el-button @click="exportReport">
          <el-icon><Download /></el-icon>
          导出报告
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon total">
                <el-icon><Grid /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.totalSpaces }}</div>
                <div class="stats-label">总车位数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon available">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.availableSpaces }}</div>
                <div class="stats-label">可用车位</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon occupied">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.occupiedSpaces }}</div>
                <div class="stats-label">占用车位</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon rate">
                <el-icon><PieChart /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.occupancyRate }}%</div>
                <div class="stats-label">占用率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <!-- 车位状态饼图 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>车位状态分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="statusChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 车位类型分布 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>车位类型分布</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="typeChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" style="margin-top: 20px;">
      <!-- 楼层占用率 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>楼层占用率</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="floorChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
      
      <!-- 区域占用率 -->
      <el-col :span="12">
        <el-card class="chart-card">
          <template #header>
            <div class="card-header">
              <span>区域占用率</span>
            </div>
          </template>
          <div class="chart-container">
            <div ref="areaChartRef" class="chart"></div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 实时状态变化 -->
    <el-card class="status-history-card" style="margin-top: 20px;">
      <template #header>
        <div class="card-header">
          <span>实时状态变化</span>
          <el-switch
            v-model="autoRefresh"
            active-text="自动刷新"
            @change="toggleAutoRefresh"
          />
        </div>
      </template>
      
      <el-table :data="statusHistory" v-loading="historyLoading" height="300">
        <el-table-column prop="changeTime" label="时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.changeTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="spaceId" label="车位编号" width="120" />
        <el-table-column prop="lotId.name" label="停车场" width="150" />
        <el-table-column prop="previousStatus" label="原状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.previousStatus)">
              {{ getStatusText(scope.row.previousStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="newStatus" label="新状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.newStatus)">
              {{ getStatusText(scope.row.newStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100">
          <template #default="scope">
            {{ getSourceText(scope.row.source) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorId.username" label="操作人" width="120" />
        <el-table-column prop="changeReason" label="原因" />
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="historyPagination.currentPage"
          v-model:page-size="historyPagination.pageSize"
          layout="total, prev, pager, next"
          :total="historyPagination.total"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, onUnmounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { 
  Refresh, Download, Grid, CircleCheck, CircleClose, PieChart 
} from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

export default {
  name: 'ParkingDashboard',
  components: {
    Refresh, Download, Grid, CircleCheck, CircleClose, PieChart
  },
  setup() {
    // 图表引用
    const statusChartRef = ref(null)
    const typeChartRef = ref(null)
    const floorChartRef = ref(null)
    const areaChartRef = ref(null)
    
    // 图表实例
    let statusChart = null
    let typeChart = null
    let floorChart = null
    let areaChart = null
    
    // 数据状态
    const loading = ref(false)
    const historyLoading = ref(false)
    const statusHistory = ref([])
    const autoRefresh = ref(false)
    let refreshTimer = null
    
    // 统计数据
    const stats = reactive({
      totalSpaces: 0,
      availableSpaces: 0,
      occupiedSpaces: 0,
      occupancyRate: 0
    })
    
    // 分页
    const historyPagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const response = await request.get('/parking-enhanced/spaces/stats')
        
        if (response.success) {
          const { overview } = response.data
          stats.totalSpaces = overview.totalSpaces
          stats.availableSpaces = overview.availableSpaces
          stats.occupiedSpaces = overview.occupiedSpaces
          stats.occupancyRate = overview.occupancyRate
          
          // 更新状态饼图
          updateStatusChart(response.data.statusDistribution)
          
          // 更新类型饼图
          updateTypeChart(response.data.typeDistribution)
          
          // 更新楼层柱状图
          updateFloorChart(response.data.floorDistribution)
          
          // 更新区域柱状图
          updateAreaChart(response.data.areaDistribution)
        }
      } catch (error) {
        ElMessage.error('获取统计数据失败')
      }
    }
    
    // 获取状态历史
    const fetchStatusHistory = async () => {
      historyLoading.value = true
      try {
        const params = {
          page: historyPagination.currentPage,
          limit: historyPagination.pageSize
        }
        
        const response = await request.get('/parking-enhanced/logs', { params })
        
        if (response.success) {
          statusHistory.value = response.data.logs
          historyPagination.total = response.data.pagination.totalItems
        }
      } catch (error) {
        ElMessage.error('获取状态历史失败')
      } finally {
        historyLoading.value = false
      }
    }
    
    // 刷新数据
    const refreshData = () => {
      fetchStats()
      fetchStatusHistory()
    }
    
    // 切换自动刷新
    const toggleAutoRefresh = (value) => {
      if (value) {
        refreshTimer = setInterval(() => {
          fetchStats()
          fetchStatusHistory()
        }, 30000) // 每30秒刷新一次
        ElMessage.success('已开启自动刷新，每30秒更新一次数据')
      } else {
        if (refreshTimer) {
          clearInterval(refreshTimer)
          refreshTimer = null
        }
        ElMessage.info('已关闭自动刷新')
      }
    }
    
    // 导出报告
    const exportReport = () => {
      ElMessage.info('报告导出功能开发中...')
    }
    
    // 处理历史分页
    const handleHistoryPageChange = (page) => {
      historyPagination.currentPage = page
      fetchStatusHistory()
    }
    
    // 初始化状态饼图
    const initStatusChart = () => {
      if (!statusChartRef.value) return
      
      statusChart = echarts.init(statusChartRef.value)
      const option = {
        title: {
          text: '车位状态分布',
          left: 'center'
        },
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
            name: '车位状态',
            type: 'pie',
            radius: '50%',
            data: [],
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
      statusChart.setOption(option)
    }
    
    // 初始化类型饼图
    const initTypeChart = () => {
      if (!typeChartRef.value) return
      
      typeChart = echarts.init(typeChartRef.value)
      const option = {
        title: {
          text: '车位类型分布',
          left: 'center'
        },
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
            name: '车位类型',
            type: 'pie',
            radius: '50%',
            data: [],
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
      typeChart.setOption(option)
    }
    
    // 初始化楼层柱状图
    const initFloorChart = () => {
      if (!floorChartRef.value) return
      
      floorChart = echarts.init(floorChartRef.value)
      const option = {
        title: {
          text: '楼层占用率',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: '{b}<br/>占用率: {c}%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: '占用率',
            type: 'bar',
            data: []
          }
        ]
      }
      floorChart.setOption(option)
    }
    
    // 初始化区域柱状图
    const initAreaChart = () => {
      if (!areaChartRef.value) return
      
      areaChart = echarts.init(areaChartRef.value)
      const option = {
        title: {
          text: '区域占用率',
          left: 'center'
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          formatter: '{b}<br/>占用率: {c}%'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: []
        },
        yAxis: {
          type: 'value',
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: '占用率',
            type: 'bar',
            data: []
          }
        ]
      }
      areaChart.setOption(option)
    }
    
    // 更新状态饼图
    const updateStatusChart = (data) => {
      if (!statusChart || !data) return
      
      const chartData = Object.keys(data).map(status => ({
        name: getStatusText(status),
        value: data[status]
      }))
      
      statusChart.setOption({
        series: [
          {
            data: chartData
          }
        ]
      })
    }
    
    // 更新类型饼图
    const updateTypeChart = (data) => {
      if (!typeChart || !data) return
      
      const chartData = Object.keys(data).map(type => ({
        name: getTypeText(type),
        value: data[type]
      }))
      
      typeChart.setOption({
        series: [
          {
            data: chartData
          }
        ]
      })
    }
    
    // 更新楼层柱状图
    const updateFloorChart = (data) => {
      if (!floorChart || !data) return
      
      const floors = Object.keys(data).sort((a, b) => a - b)
      const occupancyRates = floors.map(floor => data[floor].occupancyRate)
      
      floorChart.setOption({
        xAxis: {
          data: floors.map(floor => `${floor}楼`)
        },
        series: [
          {
            data: occupancyRates
          }
        ]
      })
    }
    
    // 更新区域柱状图
    const updateAreaChart = (data) => {
      if (!areaChart || !data) return
      
      const areas = Object.keys(data)
      const occupancyRates = areas.map(area => data[area].occupancyRate)
      
      areaChart.setOption({
        xAxis: {
          data: areas
        },
        series: [
          {
            data: occupancyRates
          }
        ]
      })
    }
    
    // 获取状态标签类型
    const getStatusTagType = (status) => {
      const statusMap = {
        available: 'success',
        occupied: 'danger',
        reserved: 'warning',
        maintenance: 'info'
      }
      return statusMap[status] || ''
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        available: '可用',
        occupied: '占用',
        reserved: '预订',
        maintenance: '维护'
      }
      return statusMap[status] || status
    }
    
    // 获取类型文本
    const getTypeText = (type) => {
      const typeMap = {
        standard: '标准',
        disabled: '残疾人',
        electric: '电动车',
        vip: 'VIP'
      }
      return typeMap[type] || type
    }
    
    // 获取来源文本
    const getSourceText = (source) => {
      const sourceMap = {
        manual: '手动',
        sensor: '传感器',
        system: '系统',
        sync: '同步'
      }
      return sourceMap[source] || source
    }
    
    // 格式化日期时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN')
    }
    
    // 窗口大小变化时重新调整图表
    const handleResize = () => {
      statusChart?.resize()
      typeChart?.resize()
      floorChart?.resize()
      areaChart?.resize()
    }
    
    // 生命周期
    onMounted(() => {
      refreshData()
      
      // 初始化图表
      nextTick(() => {
        initStatusChart()
        initTypeChart()
        initFloorChart()
        initAreaChart()
      })
      
      // 监听窗口大小变化
      window.addEventListener('resize', handleResize)
    })
    
    onUnmounted(() => {
      // 清除定时器
      if (refreshTimer) {
        clearInterval(refreshTimer)
      }
      
      // 销毁图表实例
      statusChart?.dispose()
      typeChart?.dispose()
      floorChart?.dispose()
      areaChart?.dispose()
      
      // 移除事件监听
      window.removeEventListener('resize', handleResize)
    })
    
    return {
      // 引用
      statusChartRef,
      typeChartRef,
      floorChartRef,
      areaChartRef,
      
      // 数据
      loading,
      historyLoading,
      statusHistory,
      autoRefresh,
      stats,
      historyPagination,
      
      // 方法
      fetchStats,
      fetchStatusHistory,
      refreshData,
      toggleAutoRefresh,
      exportReport,
      handleHistoryPageChange,
      getStatusTagType,
      getStatusText,
      getTypeText,
      getSourceText,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.parking-dashboard {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  height: 100px;
}

.stats-content {
  display: flex;
  align-items: center;
  height: 100%;
}

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
}

.stats-icon.total {
  background-color: #409EFF;
}

.stats-icon.available {
  background-color: #67C23A;
}

.stats-icon.occupied {
  background-color: #F56C6C;
}

.stats-icon.rate {
  background-color: #E6A23C;
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-container {
  height: 320px;
}

.chart {
  width: 100%;
  height: 100%;
}

.status-history-card {
  height: 450px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>