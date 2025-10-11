<template>
  <div class="reports-container">
    <el-card class="page-header">
      <div class="header-content">
        <h1>报表中心</h1>
        <p>生成和管理各类停车业务报表</p>
      </div>
    </el-card>

    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="报表类型">
          <el-select v-model="filterForm.reportType" placeholder="选择报表类型" clearable>
            <el-option label="日报" value="daily" />
            <el-option label="周报" value="weekly" />
            <el-option label="月报" value="monthly" />
            <el-option label="年报" value="yearly" />
            <el-option label="自定义" value="custom" />
          </el-select>
        </el-form-item>
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
        <el-form-item>
          <el-button type="primary" @click="generateReport">生成报表</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <el-card class="reports-list-card">
      <div class="card-header">
        <h3>历史报表</h3>
        <el-button type="primary" icon="Download" @click="exportReport">导出报表</el-button>
      </div>
      
      <el-table :data="reportsList" style="width: 100%" v-loading="loading">
        <el-table-column prop="reportName" label="报表名称" />
        <el-table-column prop="reportType" label="报表类型">
          <template #default="scope">
            <el-tag :type="getReportTypeTag(scope.row.reportType)">
              {{ getReportTypeText(scope.row.reportType) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="dateRange" label="时间范围" />
        <el-table-column prop="createTime" label="生成时间" />
        <el-table-column prop="status" label="状态">
          <template #default="scope">
            <el-tag :type="getStatusTag(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" type="primary" @click="viewReport(scope.row)">查看</el-button>
            <el-button size="small" type="success" @click="downloadReport(scope.row)">下载</el-button>
            <el-button size="small" type="danger" @click="deleteReport(scope.row)">删除</el-button>
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

    <!-- 报表预览对话框 -->
    <el-dialog v-model="reportDialogVisible" title="报表预览" width="80%">
      <div class="report-preview" v-if="currentReport">
        <div class="report-header">
          <h2>{{ currentReport.reportName }}</h2>
          <div class="report-info">
            <span>报表类型: {{ getReportTypeText(currentReport.reportType) }}</span>
            <span>时间范围: {{ currentReport.dateRange }}</span>
            <span>生成时间: {{ currentReport.createTime }}</span>
          </div>
        </div>
        
        <div class="report-content">
          <el-tabs v-model="activeTab">
            <el-tab-pane label="数据概览" name="overview">
              <div class="overview-cards">
                <el-card class="overview-card">
                  <div class="card-content">
                    <div class="card-value">¥{{ reportData.totalRevenue || 0 }}</div>
                    <div class="card-label">总收入</div>
                  </div>
                </el-card>
                <el-card class="overview-card">
                  <div class="card-content">
                    <div class="card-value">{{ reportData.totalVehicles || 0 }}</div>
                    <div class="card-label">总车流量</div>
                  </div>
                </el-card>
                <el-card class="overview-card">
                  <div class="card-content">
                    <div class="card-value">{{ reportData.avgParkingDuration || 0 }}h</div>
                    <div class="card-label">平均停车时长</div>
                  </div>
                </el-card>
                <el-card class="overview-card">
                  <div class="card-content">
                    <div class="card-value">{{ reportData.occupancyRate || 0 }}%</div>
                    <div class="card-label">平均占用率</div>
                  </div>
                </el-card>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="趋势图表" name="charts">
              <div class="charts-container">
                <div class="chart-item">
                  <div class="chart-title">收入趋势</div>
                  <div ref="revenueChart" class="chart"></div>
                </div>
                <div class="chart-item">
                  <div class="chart-title">车流量趋势</div>
                  <div ref="vehicleChart" class="chart"></div>
                </div>
              </div>
            </el-tab-pane>
            
            <el-tab-pane label="详细数据" name="details">
              <el-table :data="reportData.details || []" style="width: 100%">
                <el-table-column prop="date" label="日期" />
                <el-table-column prop="revenue" label="收入" />
                <el-table-column prop="vehicles" label="车流量" />
                <el-table-column prop="avgDuration" label="平均停车时长" />
                <el-table-column prop="occupancy" label="占用率" />
              </el-table>
            </el-tab-pane>
          </el-tabs>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import * as echarts from 'echarts'

// 筛选表单
const filterForm = reactive({
  reportType: '',
  dateRange: []
})

// 分页
const pagination = reactive({
  currentPage: 1,
  pageSize: 10,
  total: 0
})

// 报表列表
const reportsList = ref([])
const loading = ref(false)

// 报表预览
const reportDialogVisible = ref(false)
const currentReport = ref(null)
const activeTab = ref('overview')
const reportData = ref({})

// 图表引用
const revenueChart = ref(null)
const vehicleChart = ref(null)

// 获取报表列表
const getReportsList = async () => {
  loading.value = true
  try {
    // 模拟API请求
    setTimeout(() => {
      reportsList.value = [
        {
          id: 1,
          reportName: '2023年12月停车业务月报',
          reportType: 'monthly',
          dateRange: '2023-12-01 至 2023-12-31',
          createTime: '2024-01-05 09:30:00',
          status: 'completed'
        },
        {
          id: 2,
          reportName: '2023年第48周停车业务周报',
          reportType: 'weekly',
          dateRange: '2023-11-27 至 2023-12-03',
          createTime: '2023-12-04 10:15:00',
          status: 'completed'
        },
        {
          id: 3,
          reportName: '2023年11月停车业务月报',
          reportType: 'monthly',
          dateRange: '2023-11-01 至 2023-11-30',
          createTime: '2023-12-01 14:20:00',
          status: 'completed'
        },
        {
          id: 4,
          reportName: '2023-11月20日停车业务日报',
          reportType: 'daily',
          dateRange: '2023-11-20',
          createTime: '2023-11-21 08:45:00',
          status: 'completed'
        },
        {
          id: 5,
          reportName: '2023年第3季度停车业务季报',
          reportType: 'quarterly',
          dateRange: '2023-07-01 至 2023-09-30',
          createTime: '2023-10-05 16:30:00',
          status: 'completed'
        }
      ]
      pagination.total = reportsList.value.length
      loading.value = false
    }, 500)
  } catch (error) {
    console.error('获取报表列表失败:', error)
    ElMessage.error('获取报表列表失败')
    loading.value = false
  }
}

// 生成报表
const generateReport = async () => {
  if (!filterForm.reportType) {
    ElMessage.warning('请选择报表类型')
    return
  }
  
  if (!filterForm.dateRange || filterForm.dateRange.length === 0) {
    ElMessage.warning('请选择时间范围')
    return
  }
  
  ElMessage.success('报表生成中，请稍候...')
  
  // 模拟生成报表
  setTimeout(() => {
    const newReport = {
      id: Date.now(),
      reportName: `${filterForm.reportType === 'daily' ? '日报' : 
                   filterForm.reportType === 'weekly' ? '周报' : 
                   filterForm.reportType === 'monthly' ? '月报' : 
                   filterForm.reportType === 'yearly' ? '年报' : '自定义报表'} - ${filterForm.dateRange[0]} 至 ${filterForm.dateRange[1]}`,
      reportType: filterForm.reportType,
      dateRange: `${filterForm.dateRange[0]} 至 ${filterForm.dateRange[1]}`,
      createTime: new Date().toLocaleString(),
      status: 'completed'
    }
    
    reportsList.value.unshift(newReport)
    pagination.total = reportsList.value.length
    ElMessage.success('报表生成成功')
  }, 1500)
}

// 重置筛选
const resetFilter = () => {
  filterForm.reportType = ''
  filterForm.dateRange = []
}

// 查看报表
const viewReport = async (report) => {
  currentReport.value = report
  reportDialogVisible.value = true
  
  // 模拟获取报表数据
  setTimeout(() => {
    reportData.value = {
      totalRevenue: '125,680.50',
      totalVehicles: '3,847',
      avgParkingDuration: '2.5',
      occupancyRate: '78.5',
      details: [
        { date: '2023-12-01', revenue: '4,250.00', vehicles: '128', avgDuration: '2.3h', occupancy: '76.2%' },
        { date: '2023-12-02', revenue: '4,580.50', vehicles: '137', avgDuration: '2.5h', occupancy: '79.1%' },
        { date: '2023-12-03', revenue: '4,120.00', vehicles: '124', avgDuration: '2.4h', occupancy: '75.8%' },
        { date: '2023-12-04', revenue: '4,750.00', vehicles: '142', avgDuration: '2.6h', occupancy: '81.3%' },
        { date: '2023-12-05', revenue: '4,890.00', vehicles: '148', avgDuration: '2.7h', occupancy: '82.5%' }
      ]
    }
    
    // 初始化图表
    nextTick(() => {
      initCharts()
    })
  }, 500)
}

// 初始化图表
const initCharts = () => {
  // 收入趋势图
  const revenueChartInstance = echarts.init(revenueChart.value)
  const revenueOption = {
    title: { text: '收入趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: reportData.value.details.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [{
      data: reportData.value.details.map(item => item.revenue),
      type: 'line',
      smooth: true
    }]
  }
  revenueChartInstance.setOption(revenueOption)
  
  // 车流量趋势图
  const vehicleChartInstance = echarts.init(vehicleChart.value)
  const vehicleOption = {
    title: { text: '车流量趋势' },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: reportData.value.details.map(item => item.date)
    },
    yAxis: { type: 'value' },
    series: [{
      data: reportData.value.details.map(item => item.vehicles),
      type: 'bar'
    }]
  }
  vehicleChartInstance.setOption(vehicleOption)
}

// 下载报表
const downloadReport = (report) => {
  ElMessage.success(`正在下载报表: ${report.reportName}`)
}

// 导出报表
const exportReport = () => {
  ElMessage.success('正在导出报表列表')
}

// 删除报表
const deleteReport = (report) => {
  ElMessageBox.confirm(`确定要删除报表"${report.reportName}"吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    const index = reportsList.value.findIndex(item => item.id === report.id)
    if (index !== -1) {
      reportsList.value.splice(index, 1)
      pagination.total = reportsList.value.length
      ElMessage.success('删除成功')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 分页处理
const handleSizeChange = (val) => {
  pagination.pageSize = val
  getReportsList()
}

const handleCurrentChange = (val) => {
  pagination.currentPage = val
  getReportsList()
}

// 获取报表类型标签
const getReportTypeTag = (type) => {
  const typeMap = {
    daily: 'success',
    weekly: 'primary',
    monthly: 'warning',
    yearly: 'danger',
    custom: 'info'
  }
  return typeMap[type] || 'info'
}

// 获取报表类型文本
const getReportTypeText = (type) => {
  const typeMap = {
    daily: '日报',
    weekly: '周报',
    monthly: '月报',
    yearly: '年报',
    custom: '自定义'
  }
  return typeMap[type] || '未知'
}

// 获取状态标签
const getStatusTag = (status) => {
  const statusMap = {
    completed: 'success',
    processing: 'warning',
    failed: 'danger'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    completed: '已完成',
    processing: '生成中',
    failed: '失败'
  }
  return statusMap[status] || '未知'
}

// 页面加载时获取报表列表
onMounted(() => {
  getReportsList()
})
</script>

<style scoped>
.reports-container {
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

.reports-list-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-header h3 {
  margin: 0;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.report-preview {
  padding: 20px;
}

.report-header {
  margin-bottom: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #eee;
}

.report-header h2 {
  margin: 0 0 10px;
}

.report-info {
  display: flex;
  gap: 20px;
  color: #666;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.overview-card {
  text-align: center;
}

.card-content {
  padding: 10px;
}

.card-value {
  font-size: 24px;
  font-weight: bold;
  color: #409EFF;
  margin-bottom: 5px;
}

.card-label {
  color: #666;
}

.charts-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
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
  height: 300px;
}
</style>