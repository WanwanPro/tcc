<template>
  <div class="users-analytics-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>用户分析</h1>
        <p>用户行为和偏好分析</p>
      </div>
    </el-card>

    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            format="YYYY-MM-DD"
            value-format="YYYY-MM-DD"
          />
        </el-form-item>
        <el-form-item label="用户类型">
          <el-select v-model="filterForm.userType" placeholder="选择用户类型" clearable>
            <el-option label="临时用户" value="temporary" />
            <el-option label="月卡用户" value="monthly" />
            <el-option label="年卡用户" value="yearly" />
            <el-option label="VIP用户" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilter">应用筛选</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-value">{{ userStats.totalUsers }}</div>
            <div class="stats-label">总用户数</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-value">{{ userStats.activeUsers }}</div>
            <div class="stats-label">活跃用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-value">{{ userStats.newUsers }}</div>
            <div class="stats-label">新增用户</div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card class="stats-card">
          <div class="stats-content">
            <div class="stats-value">{{ userStats.retentionRate }}%</div>
            <div class="stats-label">用户留存率</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <h3>用户增长趋势</h3>
          </div>
          <div ref="userGrowthChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <h3>用户类型分布</h3>
          </div>
          <div ref="userTypeChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <h3>用户活跃度</h3>
          </div>
          <div ref="userActivityChart" class="chart-container"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card class="chart-card">
          <div class="card-header">
            <h3>用户停车时长分布</h3>
          </div>
          <div ref="parkingDurationChart" class="chart-container"></div>
        </el-card>
      </el-col>
    </el-row>

    <el-card class="table-card">
      <div class="card-header">
        <h3>用户详情</h3>
        <el-button type="primary" @click="exportData">导出数据</el-button>
      </div>
      
      <el-table :data="usersList" style="width: 100%" v-loading="loading">
        <el-table-column prop="userId" label="用户ID" />
        <el-table-column prop="userName" label="用户名" />
        <el-table-column prop="userType" label="用户类型">
          <template #default="scope">
            <el-tag :type="getUserTypeTag(scope.row.userType)">
              {{ getUserTypeText(scope.row.userType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="registerTime" label="注册时间" />
        <el-table-column prop="lastActiveTime" label="最后活跃时间" />
        <el-table-column prop="totalParkingTimes" label="停车次数" />
        <el-table-column prop="totalAmount" label="消费总额" />
        <el-table-column prop="avgParkingDuration" label="平均停车时长" />
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewUserDetail(scope.row)">详情</el-button>
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

    <!-- 用户详情对话框 -->
    <el-dialog v-model="userDetailDialogVisible" title="用户详情" width="70%">
      <div class="user-detail" v-if="currentUser">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">{{ currentUser.userId }}</el-descriptions-item>
          <el-descriptions-item label="用户名">{{ currentUser.userName }}</el-descriptions-item>
          <el-descriptions-item label="用户类型">
            <el-tag :type="getUserTypeTag(currentUser.userType)">
              {{ getUserTypeText(currentUser.userType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="手机号">{{ currentUser.phone }}</el-descriptions-item>
          <el-descriptions-item label="注册时间">{{ currentUser.registerTime }}</el-descriptions-item>
          <el-descriptions-item label="最后活跃时间">{{ currentUser.lastActiveTime }}</el-descriptions-item>
          <el-descriptions-item label="停车次数">{{ currentUser.totalParkingTimes }}</el-descriptions-item>
          <el-descriptions-item label="消费总额">¥{{ currentUser.totalAmount }}</el-descriptions-item>
          <el-descriptions-item label="平均停车时长">{{ currentUser.avgParkingDuration }}</el-descriptions-item>
          <el-descriptions-item label="常用停车场">{{ currentUser.favoriteParking }}</el-descriptions-item>
        </el-descriptions>
        
        <div class="user-charts">
          <div class="chart-item">
            <div class="chart-title">用户月度停车次数</div>
            <div ref="userMonthlyChart" class="chart"></div>
          </div>
          <div class="chart-item">
            <div class="chart-title">用户月度消费金额</div>
            <div ref="userAmountChart" class="chart"></div>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import * as echarts from 'echarts'

// 筛选表单
const filterForm = reactive({
  dateRange: [],
  userType: ''
})

// 用户统计数据
const userStats = reactive({
  totalUsers: 0,
  activeUsers: 0,
  newUsers: 0,
  retentionRate: 0
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 用户列表
const usersList = ref([])
const loading = ref(false)

// 用户详情
const userDetailDialogVisible = ref(false)
const currentUser = ref(null)

// 图表引用
const userGrowthChart = ref(null)
const userTypeChart = ref(null)
const userActivityChart = ref(null)
const parkingDurationChart = ref(null)
const userMonthlyChart = ref(null)
const userAmountChart = ref(null)

// 获取用户统计数据
const getUserStats = async () => {
  try {
    // 模拟API请求
    setTimeout(() => {
      userStats.totalUsers = 8562
      userStats.activeUsers = 3247
      userStats.newUsers = 187
      userStats.retentionRate = 78.5
    }, 500)
  } catch (error) {
    console.error('获取用户统计数据失败:', error)
    ElMessage.error('获取用户统计数据失败')
  }
}

// 获取用户列表
const getUsersList = async () => {
  loading.value = true
  try {
    // 模拟API请求
    setTimeout(() => {
      usersList.value = [
        {
          id: 1,
          userId: 'U202312001',
          userName: '张三',
          userType: 'monthly',
          phone: '138****5678',
          registerTime: '2023-01-15 10:30:00',
          lastActiveTime: '2023-12-10 14:25:00',
          totalParkingTimes: 48,
          totalAmount: '1,280.50',
          avgParkingDuration: '2.5小时',
          favoriteParking: 'A区停车场'
        },
        {
          id: 2,
          userId: 'U202312002',
          userName: '李四',
          userType: 'temporary',
          phone: '139****1234',
          registerTime: '2023-06-20 09:15:00',
          lastActiveTime: '2023-12-09 16:40:00',
          totalParkingTimes: 12,
          totalAmount: '360.00',
          avgParkingDuration: '1.8小时',
          favoriteParking: 'B区停车场'
        },
        {
          id: 3,
          userId: 'U202312003',
          userName: '王五',
          userType: 'yearly',
          phone: '137****9876',
          registerTime: '2022-08-10 11:20:00',
          lastActiveTime: '2023-12-10 08:50:00',
          totalParkingTimes: 156,
          totalAmount: '4,680.00',
          avgParkingDuration: '3.2小时',
          favoriteParking: 'C区停车场'
        },
        {
          id: 4,
          userId: 'U202312004',
          userName: '赵六',
          userType: 'vip',
          phone: '136****5432',
          registerTime: '2022-03-25 14:45:00',
          lastActiveTime: '2023-12-10 09:30:00',
          totalParkingTimes: 248,
          totalAmount: '8,950.00',
          avgParkingDuration: '4.1小时',
          favoriteParking: 'VIP停车场'
        },
        {
          id: 5,
          userId: 'U202312005',
          userName: '钱七',
          userType: 'monthly',
          phone: '135****6789',
          registerTime: '2023-04-12 16:10:00',
          lastActiveTime: '2023-12-08 18:20:00',
          totalParkingTimes: 36,
          totalAmount: '980.00',
          avgParkingDuration: '2.2小时',
          favoriteParking: 'D区停车场'
        }
      ]
      pagination.total = usersList.value.length
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('获取用户列表失败:', error)
    ElMessage.error('获取用户列表失败')
    loading.value = false
  }
}

// 初始化图表
const initCharts = () => {
  // 用户增长趋势图
  const userGrowthChartInstance = echarts.init(userGrowthChart.value)
  const userGrowthOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '新增用户',
        type: 'bar',
        data: [120, 132, 101, 134, 90, 230, 210, 220, 182, 191, 234, 187]
      },
      {
        name: '累计用户',
        type: 'line',
        data: [820, 932, 901, 934, 1290, 1330, 1320, 1540, 1200, 1100, 1380, 1420]
      }
    ]
  }
  userGrowthChartInstance.setOption(userGrowthOption)
  
  // 用户类型分布图
  const userTypeChartInstance = echarts.init(userTypeChart.value)
  const userTypeOption = {
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
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
  userTypeChartInstance.setOption(userTypeOption)
  
  // 用户活跃度图
  const userActivityChartInstance = echarts.init(userActivityChart.value)
  const userActivityOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '活跃用户数',
        type: 'line',
        areaStyle: {},
        data: [820, 932, 901, 934, 1290, 1330, 1320]
      }
    ]
  }
  userActivityChartInstance.setOption(userActivityOption)
  
  // 用户停车时长分布图
  const parkingDurationChartInstance = echarts.init(parkingDurationChart.value)
  const parkingDurationOption = {
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: ['0-1小时', '1-2小时', '2-4小时', '4-8小时', '8-12小时', '12小时以上']
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '用户数',
        type: 'bar',
        data: [320, 302, 301, 334, 390, 330]
      }
    ]
  }
  parkingDurationChartInstance.setOption(parkingDurationOption)
}

// 查看用户详情
const viewUserDetail = async (user) => {
  currentUser.value = user
  userDetailDialogVisible.value = true
  
  // 初始化用户详情图表
  nextTick(() => {
    // 用户月度停车次数图
    const userMonthlyChartInstance = echarts.init(userMonthlyChart.value)
    const userMonthlyOption = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '停车次数',
          type: 'bar',
          data: [5, 8, 12, 6, 9, 15, 10, 8, 7, 11, 9, 12]
        }
      ]
    }
    userMonthlyChartInstance.setOption(userMonthlyOption)
    
    // 用户月度消费金额图
    const userAmountChartInstance = echarts.init(userAmountChart.value)
    const userAmountOption = {
      tooltip: { trigger: 'axis' },
      xAxis: {
        type: 'category',
        data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
      },
      yAxis: { type: 'value' },
      series: [
        {
          name: '消费金额',
          type: 'line',
          data: [120, 200, 150, 80, 170, 250, 180, 150, 130, 220, 180, 240]
        }
      ]
    }
    userAmountChartInstance.setOption(userAmountOption)
  })
}

// 应用筛选
const applyFilter = () => {
  ElMessage.success('筛选条件已应用')
  getUsersList()
}

// 重置筛选
const resetFilter = () => {
  filterForm.dateRange = []
  filterForm.userType = ''
  getUsersList()
}

// 导出数据
const exportData = () => {
  ElMessage.success('正在导出用户数据')
}

// 分页处理
const handleSizeChange = (val) => {
  pagination.pageSize = val
  getUsersList()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  getUsersList()
}

// 获取用户类型标签
const getUserTypeTag = (type) => {
  const typeMap = {
    temporary: 'info',
    monthly: 'primary',
    yearly: 'success',
    vip: 'warning'
  }
  return typeMap[type] || 'info'
}

// 获取用户类型文本
const getUserTypeText = (type) => {
  const typeMap = {
    temporary: '临时用户',
    monthly: '月卡用户',
    yearly: '年卡用户',
    vip: 'VIP用户'
  }
  return typeMap[type] || '未知'
}

// 页面加载时获取数据
onMounted(() => {
  getUserStats()
  getUsersList()
  
  nextTick(() => {
    initCharts()
  })
})
</script>

<style scoped>
.users-analytics-container {
  padding: 20px;
}

.page-header {
  margin-bottom: 20px;
  background: linear-gradient(135deg, #409EFF, #36D1DC);
  color: white;
}

.header-content h1 {
  margin: 0;
  font-size: 24px;
}

.header-content p {
  margin: 5px 0 0;
  opacity: 0.8;
}

.filter-card {
  margin-bottom: 20px;
}

.stats-row {
  margin-bottom: 20px;
}

.stats-card {
  text-align: center;
}

.stats-content {
  padding: 10px;
}

.stats-value {
  font-size: 28px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.stats-label {
  color: #666;
}

.charts-row {
  margin-bottom: 20px;
}

.chart-card {
  height: 400px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.card-header h3 {
  margin: 0;
}

.chart-container {
  height: 320px;
}

.table-card {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.user-detail {
  padding: 20px;
}

.user-charts {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  margin-top: 20px;
}

.chart-item {
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 4px;
}

.chart-title {
  font-size: 16px;
  font-weight: bold;
  margin-bottom: 10px;
  text-align: center;
}

.chart {
  height: 250px;
}
</style>
