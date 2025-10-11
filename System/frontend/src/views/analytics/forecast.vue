<template>
  <div class="forecast-analytics">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>预测分析</span>
          <el-button type="primary" @click="runForecast" :loading="forecastLoading">
            <el-icon><Refresh /></el-icon>
            运行预测
          </el-button>
        </div>
      </template>
      
      <div class="forecast-controls">
        <el-form :inline="true" :model="forecastForm" class="forecast-form">
          <el-form-item label="预测类型">
            <el-select v-model="forecastForm.type" placeholder="请选择预测类型">
              <el-option label="车流量预测" value="traffic" />
              <el-option label="收入预测" value="revenue" />
              <el-option label="车位使用率预测" value="occupancy" />
            </el-select>
          </el-form-item>
          <el-form-item label="预测周期">
            <el-select v-model="forecastForm.period" placeholder="请选择预测周期">
              <el-option label="未来7天" value="7days" />
              <el-option label="未来30天" value="30days" />
              <el-option label="未来90天" value="90days" />
            </el-option>
          </el-form-item>
          <el-form-item label="预测模型">
            <el-select v-model="forecastForm.model" placeholder="请选择预测模型">
              <el-option label="线性回归" value="linear" />
              <el-option label="时间序列" value="timeseries" />
              <el-option label="神经网络" value="neural" />
            </el-select>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="forecast-results" v-if="forecastData.length > 0">
        <el-row :gutter="20">
          <el-col :span="16">
            <el-card>
              <template #header>
                <span>{{ getForecastTitle() }}</span>
              </template>
              <div ref="forecastChart" class="chart"></div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card>
              <template #header>
                <span>预测指标</span>
              </template>
              <div class="forecast-metrics">
                <div class="metric-item">
                  <div class="metric-label">平均准确率</div>
                  <div class="metric-value">{{ forecastMetrics.accuracy }}%</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">平均误差</div>
                  <div class="metric-value">{{ forecastMetrics.error }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">预测趋势</div>
                  <div class="metric-value">
                    <el-tag :type="getTrendType(forecastMetrics.trend)">
                      {{ getTrendText(forecastMetrics.trend) }}
                    </el-tag>
                  </div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">预测峰值</div>
                  <div class="metric-value">{{ forecastMetrics.peak }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">预测谷值</div>
                  <div class="metric-value">{{ forecastMetrics.valley }}</div>
                </div>
              </div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span>预测数据表</span>
              </template>
              <el-table :data="forecastData" style="width: 100%">
                <el-table-column prop="date" label="日期" width="120" />
                <el-table-column prop="predicted" label="预测值" />
                <el-table-column prop="confidence" label="置信区间" width="200">
                  <template #default="scope">
                    {{ scope.row.lower }} - {{ scope.row.upper }}
                  </template>
                </el-table-column>
                <el-table-column prop="confidenceLevel" label="置信度" width="120">
                  <template #default="scope">
                    <el-progress 
                      :percentage="scope.row.confidenceLevel" 
                      :color="getConfidenceColor(scope.row.confidenceLevel)"
                    />
                  </template>
                </el-table-column>
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>
      
      <div class="empty-state" v-else>
        <el-empty description="暂无预测数据，请运行预测模型" />
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import * as echarts from 'echarts'

export default {
  name: 'ForecastAnalytics',
  components: {
    Refresh
  },
  setup() {
    const forecastLoading = ref(false)
    const forecastChart = ref(null)
    
    const forecastForm = reactive({
      type: 'traffic',
      period: '7days',
      model: 'linear'
    })
    
    const forecastData = ref([])
    
    const forecastMetrics = ref({
      accuracy: 0,
      error: 0,
      trend: 'stable',
      peak: 0,
      valley: 0
    })
    
    // 运行预测
    const runForecast = () => {
      forecastLoading.value = true
      
      // 模拟API调用
      setTimeout(() => {
        generateForecastData()
        updateForecastMetrics()
        renderForecastChart()
        forecastLoading.value = false
      }, 2000)
    }
    
    // 生成预测数据
    const generateForecastData = () => {
      const data = []
      const days = forecastForm.period === '7days' ? 7 : forecastForm.period === '30days' ? 30 : 90
      const today = new Date()
      
      for (let i = 1; i <= days; i++) {
        const date = new Date(today)
        date.setDate(today.getDate() + i)
        
        // 根据预测类型生成不同的数据
        let predicted, unit
        if (forecastForm.type === 'traffic') {
          predicted = Math.floor(Math.random() * 200) + 300
          unit = '辆'
        } else if (forecastForm.type === 'revenue') {
          predicted = (Math.random() * 5000 + 10000).toFixed(2)
          unit = '元'
        } else {
          predicted = (Math.random() * 20 + 70).toFixed(1)
          unit = '%'
        }
        
        const variance = parseFloat(predicted) * 0.1
        const lower = (parseFloat(predicted) - variance).toFixed(2)
        const upper = (parseFloat(predicted) + variance).toFixed(2)
        const confidenceLevel = Math.floor(Math.random() * 20) + 75
        
        data.push({
          date: `${date.getMonth() + 1}/${date.getDate()}`,
          predicted: predicted + unit,
          lower: lower + unit,
          upper: upper + unit,
          confidenceLevel
        })
      }
      
      forecastData.value = data
    }
    
    // 更新预测指标
    const updateForecastMetrics = () => {
      const accuracy = Math.floor(Math.random() * 10) + 85
      let error, trend, peak, valley
      
      if (forecastForm.type === 'traffic') {
        error = (Math.random() * 20 + 10).toFixed(1) + '辆'
        peak = Math.floor(Math.random() * 100) + 400 + '辆'
        valley = Math.floor(Math.random() * 50) + 200 + '辆'
      } else if (forecastForm.type === 'revenue') {
        error = (Math.random() * 500 + 200).toFixed(2) + '元'
        peak = (Math.random() * 2000 + 12000).toFixed(2) + '元'
        valley = (Math.random() * 1000 + 8000).toFixed(2) + '元'
      } else {
        error = (Math.random() * 5 + 2).toFixed(1) + '%'
        peak = (Math.random() * 10 + 85).toFixed(1) + '%'
        valley = (Math.random() * 10 + 60).toFixed(1) + '%'
      }
      
      const trendOptions = ['up', 'down', 'stable']
      trend = trendOptions[Math.floor(Math.random() * trendOptions.length)]
      
      forecastMetrics.value = {
        accuracy,
        error,
        trend,
        peak,
        valley
      }
    }
    
    // 渲染预测图表
    const renderForecastChart = () => {
      nextTick(() => {
        if (!forecastChart.value) return
        
        const chartInstance = echarts.init(forecastChart.value)
        
        const dates = forecastData.value.map(item => item.date)
        const predicted = forecastData.value.map(item => parseFloat(item.predicted))
        const lower = forecastData.value.map(item => parseFloat(item.lower))
        const upper = forecastData.value.map(item => parseFloat(item.upper))
        
        const option = {
          title: {
            text: ''
          },
          tooltip: {
            trigger: 'axis',
            axisPointer: {
              type: 'cross'
            }
          },
          legend: {
            data: ['预测值', '置信区间']
          },
          xAxis: {
            type: 'category',
            data: dates
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '预测值',
              type: 'line',
              data: predicted,
              smooth: true,
              itemStyle: {
                color: '#409EFF'
              }
            },
            {
              name: '置信区间',
              type: 'line',
              data: upper,
              lineStyle: {
                opacity: 0
              },
              stack: 'confidence',
              symbol: 'none'
            },
            {
              name: '置信区间',
              type: 'line',
              data: lower,
              lineStyle: {
                opacity: 0
              },
              areaStyle: {
                color: '#409EFF',
                opacity: 0.2
              },
              stack: 'confidence',
              symbol: 'none'
            }
          ]
        }
        
        chartInstance.setOption(option)
        
        // 响应式调整
        window.addEventListener('resize', () => {
          chartInstance.resize()
        })
      })
    }
    
    // 获取预测标题
    const getForecastTitle = () => {
      const typeMap = {
        'traffic': '车流量预测',
        'revenue': '收入预测',
        'occupancy': '车位使用率预测'
      }
      
      const periodMap = {
        '7days': '未来7天',
        '30days': '未来30天',
        '90days': '未来90天'
      }
      
      return `${typeMap[forecastForm.type]} - ${periodMap[forecastForm.period]}`
    }
    
    // 获取趋势类型
    const getTrendType = (trend) => {
      const trendMap = {
        'up': 'success',
        'down': 'danger',
        'stable': 'info'
      }
      return trendMap[trend] || 'info'
    }
    
    // 获取趋势文本
    const getTrendText = (trend) => {
      const trendMap = {
        'up': '上升趋势',
        'down': '下降趋势',
        'stable': '保持稳定'
      }
      return trendMap[trend] || '未知'
    }
    
    // 获取置信度颜色
    const getConfidenceColor = (confidence) => {
      if (confidence >= 90) return '#67C23A'
      if (confidence >= 80) return '#E6A23C'
      return '#F56C6C'
    }
    
    onMounted(() => {
      // 初始化时可以运行一次默认预测
      runForecast()
    })
    
    return {
      forecastLoading,
      forecastChart,
      forecastForm,
      forecastData,
      forecastMetrics,
      runForecast,
      getForecastTitle,
      getTrendType,
      getTrendText,
      getConfidenceColor
    }
  }
}
</script>

<style scoped>
.forecast-analytics {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.forecast-controls {
  margin-bottom: 20px;
}

.forecast-form {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.forecast-results {
  margin-top: 20px;
}

.chart {
  height: 400px;
  width: 100%;
}

.forecast-metrics {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.metric-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 0;
  border-bottom: 1px solid #EBEEF5;
}

.metric-item:last-child {
  border-bottom: none;
}

.metric-label {
  font-size: 14px;
  color: #606266;
}

.metric-value {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}

.empty-state {
  margin-top: 50px;
}
</style>