<template>
  <div class="user-analysis-container">
    <el-card>
      <template #header>
        <span>用户行为分析</span>
      </template>
      
      <div class="analysis-content">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>用户活跃度分析</span>
              </template>
              <div id="userActivityChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <span>用户类型分布</span>
              </template>
              <div id="userTypeChart" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card>
              <template #header>
                <span>用户行为统计</span>
              </template>
              <el-table :data="behaviorData" style="width: 100%">
                <el-table-column prop="action" label="行为类型" />
                <el-table-column prop="count" label="次数" />
                <el-table-column prop="percentage" label="占比" />
              </el-table>
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
  name: 'UserAnalysis',
  setup() {
    const behaviorData = ref([
      { action: '登录系统', count: 1250, percentage: '35%' },
      { action: '查询车位', count: 980, percentage: '27%' },
      { action: '预订车位', count: 650, percentage: '18%' },
      { action: '支付费用', count: 420, percentage: '12%' },
      { action: '其他操作', count: 300, percentage: '8%' }
    ])
    
    const initCharts = () => {
      nextTick(() => {
        // 用户活跃度图表
        const activityChart = echarts.init(document.getElementById('userActivityChart'))
        const activityOption = {
          title: {
            text: '近7天用户活跃度'
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
            data: [120, 200, 150, 80, 70, 110, 130],
            type: 'line',
            smooth: true
          }]
        }
        activityChart.setOption(activityOption)
        
        // 用户类型分布图表
        const typeChart = echarts.init(document.getElementById('userTypeChart'))
        const typeOption = {
          title: {
            text: '用户类型分布',
            left: 'center'
          },
          tooltip: {
            trigger: 'item'
          },
          series: [
            {
              name: '用户类型',
              type: 'pie',
              radius: '50%',
              data: [
                { value: 1048, name: '临时用户' },
                { value: 735, name: '月卡用户' },
                { value: 580, name: '年卡用户' },
                { value: 484, name: 'VIP用户' }
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
        typeChart.setOption(typeOption)
        
        // 窗口大小变化时重新调整图表大小
        window.addEventListener('resize', () => {
          activityChart.resize()
          typeChart.resize()
        })
      })
    }
    
    onMounted(() => {
      initCharts()
    })
    
    return {
      behaviorData
    }
  }
}
</script>

<style scoped>
.user-analysis-container {
  padding: 20px;
}

.analysis-content {
  padding: 10px 0;
}
</style>