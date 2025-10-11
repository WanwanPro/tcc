<template>
  <div class="parking-analytics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>停车分析</span>
          <el-button type="primary" @click="refreshData" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新数据
          </el-button>
        </div>
      </template>
      
      <div class="analytics-controls">
        <el-form :inline="true" :model="analyticsForm" class="analytics-form">
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="analyticsForm.dateRange"
              type="daterange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD"
              value-format="YYYY-MM-DD"
            />
          </el-form-item>
          <el-form-item label="分析维度">
            <el-select v-model="analyticsForm.dimension" placeholder="请选择分析维度">
              <el-option label="按区域" value="area" />
              <el-option label="按时段" value="time" />
              <el-option label="按车位类型" value="spaceType" />
              <el-option label="按车辆类型" value="vehicleType" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="runAnalysis">分析</el-button>
            <el-button @click="exportData">导出</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="analytics-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-value">{{ overviewData.totalParking }}</div>
              <div class="overview-label">总停车次数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-value">{{ overviewData.avgDuration }}h</div>
              <div class="overview-label">平均停车时长</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-value">¥{{ overviewData.totalRevenue }}</div>
              <div class="overview-label">总收入</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="overview-item">
              <div class="overview-value">{{ overviewData.turnoverRate }}%</div>
              <div class="overview-label">车位周转率</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <div class="analytics-charts">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>停车时长分布</span>
              </template>
              <div ref="durationChart" class="chart"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>收入分布</span>
              </template>
              <div ref="revenueChart" class="chart"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>{{ getDimensionTitle() }}</span>
              </template>
              <div ref="dimensionChart" class="chart"></div>
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
      
      <div class="analytics-table">
        <el-card>
          <template #header>
            <span>详细数据</span>
          </template>
          <el-table :data="tableData" style="width: 100%">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column prop="totalParking" label="停车次数" width="100" />
            <el-table-column prop="avgDuration" label="平均时长(小时)" width="140" />
            <el-table-column prop="totalRevenue" label="收入(元)" width="120" />
            <el-table-column prop="occupancyRate" label="占用率(%)" width="120" />
            <el-table-column prop="peakHours" label="高峰时段" width="180" />
            <el-table-column label="操作" width="120">
              <template #default="scope">
                <el-button type="text" @click="viewDetails(scope.row)">查看详情</el-button>
              </template>
            </el-table-column>
          </el-table>
          
          <div class="pagination-container">
            <el-pagination
              v-model:current-page="pagination.currentPage"
              v-model:page-size="pagination.pageSize"
              :page-sizes="[10, 20, 50, 100]"
              layout="total, sizes, prev, pager, next, jumper"
              :total="pagination.total"
              @size-change="handleSizeChange"
              @current-change="handleCurrentChange"
            />
          </div>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

export default {
  name: 'ParkingAnalytics',
  components: {
    Refresh
  },
  setup() {
    const loading = ref(false)
    const durationChart = ref(null)
    const revenueChart = ref(null)
    const dimensionChart = ref(null)
    const peakHoursChart = ref(null)
    
    const analyticsForm = reactive({
      dateRange: [],
      dimension: 'area'
    })
    
    const overviewData = ref({
      totalParking: 1258,
      avgDuration: 2.5,
      totalRevenue: 25680,
      turnoverRate: 85
    })
    
    const tableData = ref([])
    
    const pagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 100
    })
    
    // 刷新数据
    const refreshData = () => {
      loading.value = true
      setTimeout(() => {
        generateTableData()
        renderCharts()
        loading.value = false
      }, 1000)
    }
    
    // 运行分析
    const runAnalysis = () => {
      loading.value = true
      setTimeout(() => {
        generateTableData()
        renderCharts()
        loading.value = false
      }, 1500)
    }
    
    // 导出数据
    const exportData = () => {
      // 模拟导出功能
      console.log('导出数据')
    }
    
    // 生成表格数据
    const generateTableData = () => {
      const data = []
      const today = new Date()
      
      for (let i = 0; i < pagination.pageSize; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() - i)
        
        data.push({
          date: `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`,
          totalParking: Math.floor(Math.random() * 100) + 50,
          avgDuration: (Math.random() * 5 + 0.5).toFixed(1),
          totalRevenue: (Math.random() * 2000 + 500).toFixed(2),
          occupancyRate: Math.floor(Math.random() * 30) + 60,
          peakHours: `${Math.floor(Math.random() * 2) + 8}:00 - ${Math.floor(Math.random() * 2) + 17}:00`
        })
      }
      
      tableData.value = data
    }
    
    // 渲染图表
    const renderCharts = () => {
      nextTick(() => {
        renderDurationChart()
        renderRevenueChart()
        renderDimensionChart()
        renderPeakHoursChart()
      })
    }
    
    // 渲染停车时长分布图
    const renderDurationChart = () => {
      if (!durationChart.value) return
      
      const chartInstance = echarts.init(durationChart.value)
      
      const option = {
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
          data: ['小于1小时', '1-2小时', '2-4小时', '4-8小时', '大于8小时']
        },
        series: [
          {
            name: '停车时长',
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
              { value: 335, name: '小于1小时' },
              { value: 310, name: '1-2小时' },
              { value: 234, name: '2-4小时' },
              { value: 135, name: '4-8小时' },
              { value: 48, name: '大于8小时' }
            ]
          }
        ]
      }
      
      chartInstance.setOption(option)
      
      // 响应式调整
      window.addEventListener('resize', () => {
        chartInstance.resize()
      })
    }
    
    // 渲染收入分布图
    const renderRevenueChart = () => {
      if (!revenueChart.value) return
      
      const chartInstance = echarts.init(revenueChart.value)
      
      const option = {
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
        },
        yAxis: {
          type: 'value'
        },
        series: [{
          data: [1200, 1400, 1000, 1600, 1800, 2200, 2000],
          type: 'bar',
          showBackground: true,
          backgroundStyle: {
            color: 'rgba(180, 180, 180, 0.2)'
          }
        }]
      }
      
      chartInstance.setOption(option)
      
      // 响应式调整
      window.addEventListener('resize', () => {
        chartInstance.resize()
      })
    }
    
    // 渲染维度分析图
    const renderDimensionChart = () => {
      if (!dimensionChart.value) return
      
      const chartInstance = echarts.init(dimensionChart.value)
      
      let option = {}
      
      if (analyticsForm.dimension === 'area') {
        option = {
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
            data: ['A区', 'B区', 'C区', 'D区']
          },
          series: [
            {
              name: '区域分布',
              type: 'pie',
              radius: '50%',
              data: [
                { value: 335, name: 'A区' },
                { value: 310, name: 'B区' },
                { value: 234, name: 'C区' },
                { value: 135, name: 'D区' }
              ]
            }
          ]
        }
      } else if (analyticsForm.dimension === 'time') {
        option = {
          title: {
            text: ''
          },
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: ['0-6时', '6-12时', '12-18时', '18-24时']
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: [120, 200, 350, 280],
            type: 'line',
            smooth: true,
            areaStyle: {}
          }]
        }
      } else if (analyticsForm.dimension === 'spaceType') {
        option = {
          title: {
            text: ''
          },
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: ['普通车位', '充电车位', '无障碍车位', 'VIP车位']
          },
          yAxis: {
            type: 'value'
          },
          series: [{
            data: [420, 180, 60, 40],
            type: 'bar'
          }]
        }
      } else {
        option = {
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
            data: ['小型车', '中型车', '大型车']
          },
          series: [
            {
              name: '车辆类型',
              type: 'pie',
              radius: '50%',
              data: [
                { value: 535, name: '小型车' },
                { value: 210, name: '中型车' },
                { value: 134, name: '大型车' }
              ]
            }
          ]
        }
      }
      
      chartInstance.setOption(option)
      
      // 响应式调整
      window.addEventListener('resize', () => {
        chartInstance.resize()
      })
    }
    
    // 渲染高峰时段分析图
    const renderPeakHoursChart = () => {
      if (!peakHoursChart.value) return
      
      const chartInstance = echarts.init(peakHoursChart.value)
      
      const hours = []
      const data = []
      
      for (let i = 0; i < 24; i++) {
        hours.push(`${i}:00`)
        let value
        if (i >= 8 && i <= 10) {
          value = Math.floor(Math.random() * 30) + 70
        } else if (i >= 17 && i <= 19) {
          value = Math.floor(Math.random() * 30) + 80
        } else if (i >= 0 && i <= 6) {
          value = Math.floor(Math.random() * 20) + 10
        } else {
          value = Math.floor(Math.random() * 40) + 40
        }
        data.push(value)
      }
      
      const option = {
        title: {
          text: ''
        },
        tooltip: {
          trigger: 'axis'
        },
        xAxis: {
          type: 'category',
          data: hours
        },
        yAxis: {
          type: 'value',
          name: '车流量'
        },
        series: [{
          data: data,
          type: 'line',
          smooth: true,
          areaStyle: {}
        }]
      }
      
      chartInstance.setOption(option)
      
      // 响应式调整
      window.addEventListener('resize', () => {
        chartInstance.resize()
      })
    }
    
    // 获取维度标题
    const getDimensionTitle = () => {
      const titleMap = {
        'area': '区域分析',
        'time': '时段分析',
        'spaceType': '车位类型分析',
        'vehicleType': '车辆类型分析'
      }
      return titleMap[analyticsForm.dimension] || '维度分析'
    }
    
    // 查看详情
    const viewDetails = (row) => {
      console.log('查看详情', row)
    }
    
    // 处理分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      generateTableData()
    }
    
    // 处理当前页变化
    const handleCurrentChange = (page) => {
      pagination.currentPage = page
      generateTableData()
    }
    
    onMounted(() => {
      // 设置默认日期范围为最近7天
      const today = new Date()
      const weekAgo = new Date(today)
      weekAgo.setDate(today.getDate() - 7)
      
      analyticsForm.dateRange = [
        `${weekAgo.getFullYear()}-${(weekAgo.getMonth() + 1).toString().padStart(2, '0')}-${weekAgo.getDate().toString().padStart(2, '0')}`,
        `${today.getFullYear()}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getDate().toString().padStart(2, '0')}`
      ]
      
      generateTableData()
      renderCharts()
    })
    
    return {
      loading,
      durationChart,
      revenueChart,
      dimensionChart,
      peakHoursChart,
      analyticsForm,
      overviewData,
      tableData,
      pagination,
      refreshData,
      runAnalysis,
      exportData,
      viewDetails,
      getDimensionTitle,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.parking-analytics {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.analytics-controls {
  margin-bottom: 20px;
}

.analytics-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.analytics-overview {
  margin-bottom: 20px;
}

.overview-item {
  text-align: center;
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.overview-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 8px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
}

.analytics-charts {
  margin-bottom: 20px;
}

.chart {
  height: 300px;
  width: 100%;
}

.analytics-table {
  margin-top: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>