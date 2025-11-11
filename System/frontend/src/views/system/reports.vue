<template>
  <div class="report-management">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>报表管理</span>
        <el-button
          style="float: right; padding: 3px 0"
          type="text"
          @click="handleCreateReport"
        >创建报表</el-button>
      </div>

      <!-- 报表类型选择 -->
      <el-row :gutter="20" style="margin-bottom: 20px;">
        <el-col :span="6">
          <el-select v-model="reportType" placeholder="选择报表类型" style="width: 100%;">
            <el-option
              v-for="item in reportTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%;"
          />
        </el-col>
        <el-col :span="6">
          <el-button type="primary" @click="generateReport">生成报表</el-button>
          <el-button type="success" @click="exportReport">导出报表</el-button>
        </el-col>
      </el-row>

      <!-- 报表预览区域 -->
      <div v-if="reportData" class="report-preview">
        <h3>{{ currentReportType.label }}报表</h3>
        <div class="report-summary">
          <el-row :gutter="20">
            <el-col :span="6" v-for="(item, index) in summaryData" :key="index">
              <div class="summary-item">
                <div class="summary-title">{{ item.title }}</div>
                <div class="summary-value">{{ item.value }}</div>
              </div>
            </el-col>
          </el-row>
        </div>

        <!-- 报表表格 -->
        <el-table
          :data="reportData.tableData"
          border
          style="width: 100%; margin-top: 20px;"
        >
          <el-table-column
            v-for="column in reportData.columns"
            :key="column.prop"
            :prop="column.prop"
            :label="column.label"
            :width="column.width"
          />
        </el-table>

        <!-- 报表图表 -->
        <div class="report-chart" style="margin-top: 20px;">
          <div :id="chartId" class="chart-container"></div>
        </div>
      </div>

      <!-- 历史报表列表 -->
      <div v-if="!reportData" class="history-reports">
        <h3>历史报表</h3>
        <el-table
          :data="historyReports"
          border
          style="width: 100%;"
        >
          <el-table-column prop="name" label="报表名称" width="200" />
          <el-table-column prop="type" label="报表类型" width="150" />
          <el-table-column prop="createTime" label="创建时间" width="180" />
          <el-table-column prop="creator" label="创建人" width="120" />
          <el-table-column label="操作">
            <template slot-scope="scope">
              <el-button size="mini" @click="viewReport(scope.row)">查看</el-button>
              <el-button size="mini" type="success" @click="downloadReport(scope.row)">下载</el-button>
              <el-button size="mini" type="danger" @click="deleteReport(scope.row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </el-card>

    <!-- 创建报表对话框 -->
    <el-dialog title="创建自定义报表" :visible.sync="dialogVisible">
      <el-form :model="reportForm" label-width="100px">
        <el-form-item label="报表名称">
          <el-input v-model="reportForm.name" placeholder="请输入报表名称"></el-input>
        </el-form-item>
        <el-form-item label="报表类型">
          <el-select v-model="reportForm.type" placeholder="请选择报表类型" style="width: 100%;">
            <el-option
              v-for="item in reportTypes"
              :key="item.value"
              :label="item.label"
              :value="item.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="数据源">
          <el-select v-model="reportForm.dataSource" placeholder="请选择数据源" style="width: 100%;">
            <el-option label="停车记录" value="parking_records"></el-option>
            <el-option label="用户数据" value="user_data"></el-option>
            <el-option label="收入数据" value="income_data"></el-option>
            <el-option label="车位使用数据" value="parking_usage"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="时间范围">
          <el-date-picker
            v-model="reportForm.dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="width: 100%;"
          />
        </el-form-item>
        <el-form-item label="图表类型">
          <el-checkbox-group v-model="reportForm.chartTypes">
            <el-checkbox label="table">表格</el-checkbox>
            <el-checkbox label="line">折线图</el-checkbox>
            <el-checkbox label="bar">柱状图</el-checkbox>
            <el-checkbox label="pie">饼图</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCustomReport">保存</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { parseTime } from '@/utils'

export default {
  name: 'ReportManagement',
  data() {
    return {
      reportType: 'parking_usage',
      dateRange: [],
      reportTypes: [
        { value: 'parking_usage', label: '车位使用报表' },
        { value: 'income', label: '收入报表' },
        { value: 'user_activity', label: '用户活跃度报表' },
        { value: 'peak_hours', label: '高峰时段分析报表' }
      ],
      reportData: null,
      chartId: 'reportChart',
      chart: null,
      summaryData: [],
      historyReports: [
        {
          id: 1,
          name: '2023年6月车位使用报表',
          type: '车位使用报表',
          createTime: '2023-07-01 10:30:00',
          creator: '管理员'
        },
        {
          id: 2,
          name: '2023年第二季度收入报表',
          type: '收入报表',
          createTime: '2023-07-05 14:20:00',
          creator: '财务人员'
        },
        {
          id: 3,
          name: '2023年5月用户活跃度报表',
          type: '用户活跃度报表',
          createTime: '2023-06-01 09:15:00',
          creator: '运营人员'
        }
      ],
      dialogVisible: false,
      reportForm: {
        name: '',
        type: '',
        dataSource: '',
        dateRange: [],
        chartTypes: ['table']
      }
    }
  },
  computed: {
    currentReportType() {
      return this.reportTypes.find(type => type.value === this.reportType) || {}
    }
  },
  mounted() {
    // 默认选择最近7天
    const end = new Date()
    const start = new Date()
    start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
    this.dateRange = [start, end]
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    generateReport() {
      if (!this.dateRange || this.dateRange.length === 0) {
        this.$message.warning('请选择时间范围')
        return
      }

      // 模拟生成报表数据
      this.reportData = this.getMockReportData(this.reportType)
      this.summaryData = this.getSummaryData(this.reportType)
      
      // 延迟渲染图表，确保DOM已更新
      this.$nextTick(() => {
        this.renderChart()
      })
      
      this.$message.success('报表生成成功')
    },
    getMockReportData(type) {
      let data = {
        columns: [],
        tableData: []
      }

      if (type === 'parking_usage') {
        data.columns = [
          { prop: 'date', label: '日期', width: 120 },
          { prop: 'totalSpaces', label: '总车位数', width: 100 },
          { prop: 'usedSpaces', label: '已用车位', width: 100 },
          { prop: 'availableSpaces', label: '可用车位', width: 100 },
          { prop: 'usageRate', label: '使用率', width: 100 }
        ]
        
        // 生成7天的模拟数据
        for (let i = 0; i < 7; i++) {
          const date = new Date()
          date.setDate(date.getDate() - 6 + i)
          const totalSpaces = 1200
          const usedSpaces = Math.floor(Math.random() * 400) + 700
          const availableSpaces = totalSpaces - usedSpaces
          const usageRate = ((usedSpaces / totalSpaces) * 100).toFixed(2) + '%'
          
          data.tableData.push({
            date: parseTime(date, '{y}-{m}-{d}'),
            totalSpaces,
            usedSpaces,
            availableSpaces,
            usageRate
          })
        }
      } else if (type === 'income') {
        data.columns = [
          { prop: 'date', label: '日期', width: 120 },
          { prop: 'parkingIncome', label: '停车收入', width: 120 },
          { prop: 'chargingIncome', label: '充电收入', width: 120 },
          { prop: 'otherIncome', label: '其他收入', width: 120 },
          { prop: 'totalIncome', label: '总收入', width: 120 }
        ]
        
        // 生成7天的模拟数据
        for (let i = 0; i < 7; i++) {
          const date = new Date()
          date.setDate(date.getDate() - 6 + i)
          const parkingIncome = Math.floor(Math.random() * 3000) + 5000
          const chargingIncome = Math.floor(Math.random() * 1000) + 1500
          const otherIncome = Math.floor(Math.random() * 500) + 200
          const totalIncome = parkingIncome + chargingIncome + otherIncome
          
          data.tableData.push({
            date: parseTime(date, '{y}-{m}-{d}'),
            parkingIncome: `¥${parkingIncome}`,
            chargingIncome: `¥${chargingIncome}`,
            otherIncome: `¥${otherIncome}`,
            totalIncome: `¥${totalIncome}`
          })
        }
      } else if (type === 'user_activity') {
        data.columns = [
          { prop: 'date', label: '日期', width: 120 },
          { prop: 'newUsers', label: '新增用户', width: 100 },
          { prop: 'activeUsers', label: '活跃用户', width: 100 },
          { prop: 'totalOrders', label: '总订单数', width: 100 },
          { prop: 'avgParkingTime', label: '平均停车时长(小时)', width: 150 }
        ]
        
        // 生成7天的模拟数据
        for (let i = 0; i < 7; i++) {
          const date = new Date()
          date.setDate(date.getDate() - 6 + i)
          const newUsers = Math.floor(Math.random() * 20) + 10
          const activeUsers = Math.floor(Math.random() * 200) + 300
          const totalOrders = Math.floor(Math.random() * 100) + 150
          const avgParkingTime = (Math.random() * 2 + 2).toFixed(2)
          
          data.tableData.push({
            date: parseTime(date, '{y}-{m}-{d}'),
            newUsers,
            activeUsers,
            totalOrders,
            avgParkingTime
          })
        }
      } else if (type === 'peak_hours') {
        data.columns = [
          { prop: 'hour', label: '时段', width: 100 },
          { prop: 'monday', label: '周一', width: 80 },
          { prop: 'tuesday', label: '周二', width: 80 },
          { prop: 'wednesday', label: '周三', width: 80 },
          { prop: 'thursday', label: '周四', width: 80 },
          { prop: 'friday', label: '周五', width: 80 },
          { prop: 'saturday', label: '周六', width: 80 },
          { prop: 'sunday', label: '周日', width: 80 },
          { prop: 'avg', label: '平均', width: 80 }
        ]
        
        // 生成24小时的模拟数据
        for (let i = 0; i < 24; i++) {
          const hour = `${i}:00`
          const monday = Math.floor(Math.random() * 100) + 20
          const tuesday = Math.floor(Math.random() * 100) + 20
          const wednesday = Math.floor(Math.random() * 100) + 20
          const thursday = Math.floor(Math.random() * 100) + 20
          const friday = Math.floor(Math.random() * 100) + 20
          const saturday = Math.floor(Math.random() * 80) + 10
          const sunday = Math.floor(Math.random() * 80) + 10
          const avg = Math.floor((monday + tuesday + wednesday + thursday + friday + saturday + sunday) / 7)
          
          data.tableData.push({
            hour,
            monday,
            tuesday,
            wednesday,
            thursday,
            friday,
            saturday,
            sunday,
            avg
          })
        }
      }
      
      return data
    },
    getSummaryData(type) {
      let data = []
      
      if (type === 'parking_usage') {
        data = [
          { title: '平均使用率', value: '75.8%' },
          { title: '最高使用率', value: '92.5%' },
          { title: '最低使用率', value: '45.2%' },
          { title: '总车位数', value: '1,200' }
        ]
      } else if (type === 'income') {
        data = [
          { title: '总收入', value: '¥58,960' },
          { title: '日均收入', value: '¥8,423' },
          { title: '最高日收入', value: '¥12,580' },
          { title: '最低日收入', value: '¥5,240' }
        ]
      } else if (type === 'user_activity') {
        data = [
          { title: '总活跃用户', value: '2,456' },
          { title: '日均活跃用户', value: '351' },
          { title: '新增用户', value: '112' },
          { title: '总订单数', value: '1,234' }
        ]
      } else if (type === 'peak_hours') {
        data = [
          { title: '最高峰时段', value: '18:00-19:00' },
          { title: '最高峰车流量', value: '185辆/小时' },
          { title: '最低峰时段', value: '03:00-04:00' },
          { title: '最低峰车流量', value: '12辆/小时' }
        ]
      }
      
      return data
    },
    renderChart() {
      if (this.chart) {
        this.chart.dispose()
      }
      
      const chartDom = document.getElementById(this.chartId)
      this.chart = echarts.init(chartDom)
      
      let option = {}
      
      if (this.reportType === 'parking_usage') {
        option = {
          title: {
            text: '车位使用率趋势',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          xAxis: {
            type: 'category',
            data: this.reportData.tableData.map(item => item.date)
          },
          yAxis: {
            type: 'value',
            axisLabel: {
              formatter: '{value}%'
            }
          },
          series: [
            {
              name: '使用率',
              type: 'line',
              data: this.reportData.tableData.map(item => parseFloat(item.usageRate)),
              smooth: true,
              areaStyle: {
                opacity: 0.3
              }
            }
          ]
        }
      } else if (this.reportType === 'income') {
        option = {
          title: {
            text: '收入趋势',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['停车收入', '充电收入', '其他收入'],
            bottom: 0
          },
          xAxis: {
            type: 'category',
            data: this.reportData.tableData.map(item => item.date)
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
              type: 'bar',
              stack: 'total',
              data: this.reportData.tableData.map(item => parseInt(item.parkingIncome.replace('¥', '')))
            },
            {
              name: '充电收入',
              type: 'bar',
              stack: 'total',
              data: this.reportData.tableData.map(item => parseInt(item.chargingIncome.replace('¥', '')))
            },
            {
              name: '其他收入',
              type: 'bar',
              stack: 'total',
              data: this.reportData.tableData.map(item => parseInt(item.otherIncome.replace('¥', '')))
            }
          ]
        }
      } else if (this.reportType === 'user_activity') {
        option = {
          title: {
            text: '用户活跃度',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['新增用户', '活跃用户'],
            bottom: 0
          },
          xAxis: {
            type: 'category',
            data: this.reportData.tableData.map(item => item.date)
          },
          yAxis: {
            type: 'value'
          },
          series: [
            {
              name: '新增用户',
              type: 'bar',
              data: this.reportData.tableData.map(item => item.newUsers)
            },
            {
              name: '活跃用户',
              type: 'line',
              data: this.reportData.tableData.map(item => item.activeUsers),
              smooth: true
            }
          ]
        }
      } else if (this.reportType === 'peak_hours') {
        option = {
          title: {
            text: '高峰时段分析',
            left: 'center'
          },
          tooltip: {
            trigger: 'axis'
          },
          legend: {
            data: ['工作日', '周末'],
            bottom: 0
          },
          xAxis: {
            type: 'category',
            data: this.reportData.tableData.map(item => item.hour)
          },
          yAxis: {
            type: 'value',
            name: '车辆数'
          },
          series: [
            {
              name: '工作日',
              type: 'line',
              data: this.reportData.tableData.map(item => {
                return Math.floor((item.monday + item.tuesday + item.wednesday + item.thursday + item.friday) / 5)
              }),
              smooth: true
            },
            {
              name: '周末',
              type: 'line',
              data: this.reportData.tableData.map(item => {
                return Math.floor((item.saturday + item.sunday) / 2)
              }),
              smooth: true
            }
          ]
        }
      }
      
      this.chart.setOption(option)
    },
    exportReport() {
      if (!this.reportData) {
        this.$message.warning('请先生成报表')
        return
      }
      
      // 这里可以实现实际的导出功能，比如导出为Excel或PDF
      this.$message.success('报表导出成功')
    },
    handleCreateReport() {
      this.dialogVisible = true
    },
    saveCustomReport() {
      // 这里可以保存自定义报表配置
      this.$message.success('自定义报表保存成功')
      this.dialogVisible = false
    },
    viewReport(row) {
      // 查看历史报表
      this.$message.info(`查看报表: ${row.name}`)
    },
    downloadReport(row) {
      // 下载历史报表
      this.$message.success(`下载报表: ${row.name}`)
    },
    deleteReport(row) {
      this.$confirm('确定要删除此报表吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        // 这里可以调用API删除报表
        this.$message.success('报表删除成功')
      })
    }
  }
}
</script>

<style scoped>
.report-management {
  padding: 20px;
}

.report-preview {
  margin-top: 20px;
}

.report-summary {
  margin-bottom: 20px;
}

.summary-item {
  background-color: #f5f7fa;
  padding: 15px;
  border-radius: 4px;
  text-align: center;
}

.summary-title {
  font-size: 14px;
  color: #909399;
  margin-bottom: 10px;
}

.summary-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.chart-container {
  height: 400px;
  width: 100%;
}

.history-reports {
  margin-top: 20px;
}
</style>