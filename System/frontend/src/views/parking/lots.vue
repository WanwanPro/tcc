<template>
  <div class="parking-lots-container">
    <!-- 页面标题区域 -->
    <div class="page-header">
      <h2 class="page-title">停车场管理</h2>
      <div class="page-actions">
        <el-button type="primary" :icon="Plus" @click="handleAdd">新增停车场</el-button>
        <el-button :icon="Refresh" @click="fetchData">刷新</el-button>
      </div>
    </div>

    <!-- 搜索筛选区域 -->
    <el-card class="filter-card" shadow="never">
      <el-form :model="searchForm" inline>
        <el-form-item label="停车场名称">
          <el-input v-model="searchForm.name" placeholder="请输入停车场名称" clearable />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="searchForm.status" placeholder="请选择状态" clearable>
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
            <el-option label="维护中" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" :icon="Search" @click="handleSearch">搜索</el-button>
          <el-button @click="resetSearch">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 数据表格区域 -->
    <el-card class="table-card" shadow="never">
      <el-table
        v-loading="loading"
        :data="tableData"
        style="width: 100%"
        border
        stripe
      >
        <el-table-column prop="name" label="停车场名称" min-width="120" />
        <el-table-column prop="address" label="地址" min-width="180" show-overflow-tooltip />
        <el-table-column prop="totalSpaces" label="总车位数" width="100" align="center" />
        <el-table-column prop="availableSpaces" label="可用车位数" width="120" align="center" />
        <el-table-column prop="hourlyRate" label="小时费率(元)" width="120" align="center" />
        <el-table-column prop="dailyRate" label="日费率(元)" width="120" align="center" />
        <el-table-column prop="status" label="状态" width="100" align="center">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ getStatusText(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180" align="center">
          <template #default="{ row }">
            {{ formatDateTime(row.createdAt) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" align="center" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" :icon="View" @click="handleView(row)">查看</el-button>
            <el-button type="warning" size="small" :icon="Edit" @click="handleEdit(row)">编辑</el-button>
            <el-button type="danger" size="small" :icon="Delete" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.size"
          :page-sizes="[10, 20, 50, 100]"
          :total="pagination.total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="formRules"
        label-width="120px"
      >
        <el-form-item label="停车场名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入停车场名称" />
        </el-form-item>
        <el-form-item label="地址" prop="address">
          <el-input v-model="form.address" type="textarea" placeholder="请输入停车场地址" />
        </el-form-item>
        <el-form-item label="总车位数" prop="totalSpaces">
          <el-input-number v-model="form.totalSpaces" :min="1" :max="10000" />
        </el-form-item>
        <el-form-item label="小时费率" prop="hourlyRate">
          <el-input-number v-model="form.hourlyRate" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="日费率" prop="dailyRate">
          <el-input-number v-model="form.dailyRate" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio label="active">启用</el-radio>
            <el-radio label="inactive">禁用</el-radio>
            <el-radio label="maintenance">维护中</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="描述" prop="description">
          <el-input v-model="form.description" type="textarea" placeholder="请输入停车场描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitLoading">确定</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 查看详情对话框 -->
    <el-dialog
      v-model="viewDialogVisible"
      title="停车场详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="停车场名称">{{ viewData.name }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="getStatusType(viewData.status)">
            {{ getStatusText(viewData.status) }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="地址" :span="2">{{ viewData.address }}</el-descriptions-item>
        <el-descriptions-item label="总车位数">{{ viewData.totalSpaces }}</el-descriptions-item>
        <el-descriptions-item label="可用车位数">{{ viewData.availableSpaces }}</el-descriptions-item>
        <el-descriptions-item label="占用率">{{ calculateOccupancyRate(viewData) }}%</el-descriptions-item>
        <el-descriptions-item label="小时费率">¥{{ viewData.hourlyRate }}/小时</el-descriptions-item>
        <el-descriptions-item label="日费率">¥{{ viewData.dailyRate }}/天</el-descriptions-item>
        <el-descriptions-item label="创建时间" :span="2">{{ formatDateTime(viewData.createdAt) }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{ viewData.description || '暂无描述' }}</el-descriptions-item>
      </el-descriptions>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Search, View, Edit, Delete } from '@element-plus/icons-vue'
import { getParkingLots, createParkingLot, updateParkingLot, deleteParkingLot } from '@/api/parking'

// 表格数据
const tableData = ref([])
const loading = ref(false)

// 搜索表单
const searchForm = reactive({
  name: '',
  status: ''
})

// 分页
const pagination = reactive({
  page: 1,
  size: 10,
  total: 0
})

// 对话框控制
const dialogVisible = ref(false)
const viewDialogVisible = ref(false)
const dialogTitle = ref('')
const submitLoading = ref(false)

// 表单引用
const formRef = ref(null)

// 表单数据
const form = reactive({
  id: null,
  name: '',
  address: '',
  totalSpaces: 100,
  hourlyRate: 5,
  dailyRate: 30,
  status: 'active',
  description: ''
})

// 表单验证规则
const formRules = {
  name: [
    { required: true, message: '请输入停车场名称', trigger: 'blur' }
  ],
  address: [
    { required: true, message: '请输入停车场地址', trigger: 'blur' }
  ],
  totalSpaces: [
    { required: true, message: '请输入总车位数', trigger: 'blur' }
  ],
  hourlyRate: [
    { required: true, message: '请输入小时费率', trigger: 'blur' }
  ],
  dailyRate: [
    { required: true, message: '请输入日费率', trigger: 'blur' }
  ],
  status: [
    { required: true, message: '请选择状态', trigger: 'change' }
  ]
}

// 查看数据
const viewData = ref({})

// 获取状态类型
const getStatusType = (status) => {
  const statusMap = {
    active: 'success',
    inactive: 'danger',
    maintenance: 'warning'
  }
  return statusMap[status] || 'info'
}

// 获取状态文本
const getStatusText = (status) => {
  const statusMap = {
    active: '启用',
    inactive: '禁用',
    maintenance: '维护中'
  }
  return statusMap[status] || '未知'
}

// 格式化日期时间
const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN')
}

// 计算占用率
const calculateOccupancyRate = (data) => {
  if (!data.totalSpaces || data.totalSpaces === 0) return 0
  const occupied = data.totalSpaces - (data.availableSpaces || 0)
  return Math.round((occupied / data.totalSpaces) * 100)
}

// 获取数据
const fetchData = async () => {
  loading.value = true
  try {
    const params = {
      page: pagination.page,
      size: pagination.size,
      name: searchForm.name || undefined,
      status: searchForm.status || undefined
    }
    
    const response = await getParkingLots(params)
    
    if (response.success) {
      tableData.value = response.data.list || []
      pagination.total = response.data.total || 0
    } else {
      ElMessage.error(response.message || '获取停车场列表失败')
    }
  } catch (error) {
    console.error('获取停车场列表失败:', error)
    ElMessage.error('获取停车场列表失败')
  } finally {
    loading.value = false
  }
}

// 搜索
const handleSearch = () => {
  pagination.page = 1
  fetchData()
}

// 重置搜索
const resetSearch = () => {
  searchForm.name = ''
  searchForm.status = ''
  handleSearch()
}

// 分页大小变化
const handleSizeChange = (size) => {
  pagination.size = size
  pagination.page = 1
  fetchData()
}

// 当前页变化
const handleCurrentChange = (page) => {
  pagination.page = page
  fetchData()
}

// 新增
const handleAdd = () => {
  dialogTitle.value = '新增停车场'
  dialogVisible.value = true
  resetForm()
}

// 编辑
const handleEdit = (row) => {
  dialogTitle.value = '编辑停车场'
  dialogVisible.value = true
  Object.assign(form, {
    id: row._id,
    name: row.name,
    address: row.address,
    totalSpaces: row.totalSpaces,
    hourlyRate: row.hourlyRate,
    dailyRate: row.dailyRate,
    status: row.status,
    description: row.description || ''
  })
}

// 查看
const handleView = (row) => {
  viewData.value = { ...row }
  viewDialogVisible.value = true
}

// 删除
const handleDelete = (row) => {
  ElMessageBox.confirm(
    `确定要删除停车场"${row.name}"吗？此操作不可恢复！`,
    '删除确认',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(async () => {
    try {
      const response = await deleteParkingLot(row._id)
      if (response.success) {
        ElMessage.success('删除成功')
        fetchData()
      } else {
        ElMessage.error(response.message || '删除失败')
      }
    } catch (error) {
      console.error('删除停车场失败:', error)
      ElMessage.error('删除停车场失败')
    }
  }).catch(() => {
    // 用户取消删除
  })
}

// 提交表单
const handleSubmit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        let response
        if (form.id) {
          // 编辑
          response = await updateParkingLot(form.id, form)
        } else {
          // 新增
          response = await createParkingLot(form)
        }
        
        if (response.success) {
          ElMessage.success(form.id ? '编辑成功' : '新增成功')
          dialogVisible.value = false
          fetchData()
        } else {
          ElMessage.error(response.message || (form.id ? '编辑失败' : '新增失败'))
        }
      } catch (error) {
        console.error('提交失败:', error)
        ElMessage.error('提交失败')
      } finally {
        submitLoading.value = false
      }
    }
  })
}

// 重置表单
const resetForm = () => {
  form.id = null
  form.name = ''
  form.address = ''
  form.totalSpaces = 100
  form.hourlyRate = 5
  form.dailyRate = 30
  form.status = 'active'
  form.description = ''
  
  // 重置表单验证
  if (formRef.value) {
    formRef.value.resetFields()
  }
}

// 初始化
onMounted(() => {
  fetchData()
})
</script>

<style lang="scss" scoped>
.parking-lots-container {
  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    
    .page-title {
      margin: 0;
      font-size: 20px;
      font-weight: bold;
      color: #303133;
    }
    
    .page-actions {
      display: flex;
      gap: 10px;
    }
  }
  
  .filter-card {
    margin-bottom: 20px;
  }
  
  .table-card {
    .pagination-container {
      margin-top: 20px;
      display: flex;
      justify-content: center;
    }
  }
}
</style>