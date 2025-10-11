<template>
  <div class="operation-logs-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>操作日志</span>
          <el-button type="primary" @click="handleExport">导出日志</el-button>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="操作人">
            <el-input v-model="filterForm.operator" placeholder="请输入操作人" clearable />
          </el-form-item>
          <el-form-item label="操作类型">
            <el-select v-model="filterForm.operationType" placeholder="请选择操作类型" clearable>
              <el-option label="登录" value="登录" />
              <el-option label="登出" value="登出" />
              <el-option label="新增" value="新增" />
              <el-option label="修改" value="修改" />
              <el-option label="删除" value="删除" />
              <el-option label="查询" value="查询" />
              <el-option label="导出" value="导出" />
            </el-select>
          </el-form-item>
          <el-form-item label="操作模块">
            <el-select v-model="filterForm.module" placeholder="请选择操作模块" clearable>
              <el-option label="用户管理" value="用户管理" />
              <el-option label="车位管理" value="车位管理" />
              <el-option label="停车记录" value="停车记录" />
              <el-option label="收费标准" value="收费标准" />
              <el-option label="地图配置" value="地图配置" />
              <el-option label="系统设置" value="系统设置" />
            </el-select>
          </el-form-item>
          <el-form-item label="时间范围">
            <el-date-picker
              v-model="filterForm.dateRange"
              type="datetimerange"
              range-separator="至"
              start-placeholder="开始日期"
              end-placeholder="结束日期"
              format="YYYY-MM-DD HH:mm:ss"
              value-format="YYYY-MM-DD HH:mm:ss"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="operationLogs" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="operator" label="操作人" width="120" />
        <el-table-column prop="operationType" label="操作类型" width="100">
          <template #default="scope">
            <el-tag :type="getOperationTypeColor(scope.row.operationType)">
              {{ scope.row.operationType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="module" label="操作模块" width="120" />
        <el-table-column prop="description" label="操作描述" min-width="200" />
        <el-table-column prop="ip" label="IP地址" width="130" />
        <el-table-column prop="userAgent" label="用户代理" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '成功' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="操作时间" width="180" />
        <el-table-column label="操作" width="100">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
          </template>
        </el-table-column>
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          :total="total"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>
    
    <!-- 日志详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="操作日志详情"
      width="700px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="日志ID">{{ currentLog.id }}</el-descriptions-item>
        <el-descriptions-item label="操作人">{{ currentLog.operator }}</el-descriptions-item>
        <el-descriptions-item label="操作类型">
          <el-tag :type="getOperationTypeColor(currentLog.operationType)">
            {{ currentLog.operationType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="操作模块">{{ currentLog.module }}</el-descriptions-item>
        <el-descriptions-item label="操作描述" :span="2">{{ currentLog.description }}</el-descriptions-item>
        <el-descriptions-item label="IP地址">{{ currentLog.ip }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentLog.status === '成功' ? 'success' : 'danger'">
            {{ currentLog.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="用户代理" :span="2">{{ currentLog.userAgent }}</el-descriptions-item>
        <el-descriptions-item label="操作时间">{{ currentLog.createTime }}</el-descriptions-item>
        <el-descriptions-item label="响应时间">{{ currentLog.responseTime }}ms</el-descriptions-item>
        <el-descriptions-item label="请求参数" :span="2">
          <pre>{{ currentLog.requestParams || '无' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="响应结果" :span="2">
          <pre>{{ currentLog.responseResult || '无' }}</pre>
        </el-descriptions-item>
        <el-descriptions-item label="错误信息" :span="2" v-if="currentLog.errorInfo">
          <pre style="color: #F56C6C;">{{ currentLog.errorInfo }}</pre>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'

export default {
  name: 'OperationLogs',
  setup() {
    const operationLogs = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const detailDialogVisible = ref(false)
    const filterForm = ref({
      operator: '',
      operationType: '',
      module: '',
      dateRange: []
    })
    const currentLog = ref({})
    
    // 模拟数据
    const mockData = [
      {
        id: 1,
        operator: '管理员',
        operationType: '登录',
        module: '系统',
        description: '管理员登录系统',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        status: '成功',
        createTime: '2023-06-01 08:30:00',
        responseTime: 120,
        requestParams: '{"username":"admin","password":"******"}',
        responseResult: '{"code":200,"message":"登录成功","data":{"token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}}'
      },
      {
        id: 2,
        operator: '管理员',
        operationType: '新增',
        module: '用户管理',
        description: '新增用户：张三',
        ip: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        status: '成功',
        createTime: '2023-06-01 09:15:00',
        responseTime: 200,
        requestParams: '{"username":"zhangsan","name":"张三","phone":"13800138000","role":"user"}',
        responseResult: '{"code":200,"message":"添加成功","data":{"id":123}}'
      },
      {
        id: 3,
        operator: '操作员',
        operationType: '修改',
        module: '车位管理',
        description: '修改车位状态：A001 从占用改为空闲',
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        status: '成功',
        createTime: '2023-06-01 10:30:00',
        responseTime: 150,
        requestParams: '{"id":"A001","status":"空闲"}',
        responseResult: '{"code":200,"message":"更新成功"}'
      },
      {
        id: 4,
        operator: '操作员',
        operationType: '删除',
        module: '停车记录',
        description: '删除停车记录：ID 456',
        ip: '192.168.1.101',
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        status: '失败',
        createTime: '2023-06-01 11:45:00',
        responseTime: 80,
        requestParams: '{"id":456}',
        responseResult: '{"code":500,"message":"删除失败"}',
        errorInfo: 'Error: 删除失败，记录不存在或已被删除'
      }
    ]
    
    const fetchOperationLogs = () => {
      // 模拟API请求
      setTimeout(() => {
        operationLogs.value = mockData
        total.value = mockData.length
      }, 500)
    }
    
    const getOperationTypeColor = (type) => {
      switch (type) {
        case '登录': return 'success'
        case '登出': return 'info'
        case '新增': return 'primary'
        case '修改': return 'warning'
        case '删除': return 'danger'
        case '查询': return ''
        case '导出': return 'success'
        default: return ''
      }
    }
    
    const handleView = (row) => {
      currentLog.value = { ...row }
      detailDialogVisible.value = true
    }
    
    const handleExport = () => {
      ElMessage.success('导出功能待实现')
    }
    
    const handleFilter = () => {
      // 模拟筛选
      ElMessage.success('筛选功能待实现')
    }
    
    const resetFilter = () => {
      filterForm.value = {
        operator: '',
        operationType: '',
        module: '',
        dateRange: []
      }
      fetchOperationLogs()
    }
    
    const handleSizeChange = (val) => {
      pageSize.value = val
      fetchOperationLogs()
    }
    
    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchOperationLogs()
    }
    
    onMounted(() => {
      fetchOperationLogs()
    })
    
    return {
      operationLogs,
      currentPage,
      pageSize,
      total,
      detailDialogVisible,
      filterForm,
      currentLog,
      getOperationTypeColor,
      handleView,
      handleExport,
      handleFilter,
      resetFilter,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.operation-logs-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-container {
  margin-bottom: 20px;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}

pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  background-color: #f5f7fa;
  padding: 10px;
  border-radius: 4px;
  max-height: 200px;
  overflow-y: auto;
}
</style>