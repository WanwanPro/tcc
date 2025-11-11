<template>
  <div class="parking-spaces-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>车位信息管理</span>
          <div>
            <el-button type="success" @click="importTcc1Data">导入TCC1数据</el-button>
            <el-button type="primary" @click="handleAdd">新增车位</el-button>
          </div>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="区域">
            <el-select 
              :value="safeGet(filterForm, 'area', '')" 
              @change="(val) => { if(filterForm) filterForm.area = val }"
              placeholder="请选择区域" 
              clearable
            >
              <el-option label="A区" value="A" />
              <el-option label="B区" value="B" />
              <el-option label="C区" value="C" />
              <el-option label="D区" value="D" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select 
              :value="safeGet(filterForm, 'status', '')" 
              @change="(val) => { if(filterForm) filterForm.status = val }"
              placeholder="请选择状态" 
              clearable
            >
              <el-option label="空闲" value="available" />
              <el-option label="占用" value="occupied" />
              <el-option label="预约" value="reserved" />
              <el-option label="维修中" value="maintenance" />
            </el-select>
          </el-form-item>
          <el-form-item label="车位编号">
            <el-input 
              :value="safeGet(filterForm, 'spaceId', '')" 
              @input="(val) => { if(filterForm) filterForm.spaceId = val }"
              placeholder="请输入车位编号" 
              clearable
              style="width: 200px"
            />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="parkingSpaces" style="width: 100%">
        <el-table-column prop="spaceId" label="车位编号" width="120" />
        <el-table-column prop="lotName" label="停车场" width="150" />
        <el-table-column prop="floorId" label="楼层" width="100" />
        <el-table-column prop="area" label="区域" width="80" />
        <el-table-column prop="typeText" label="车位类型" width="120" />
        <el-table-column prop="statusText" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.statusText }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="occupiedBy.vehicleNumber" label="当前车辆" width="120">
          <template #default="scope">
            {{ safeGet(scope.row, 'occupiedBy.vehicleNumber', '-') }}
          </template>
        </el-table-column>
        <el-table-column label="停车时长" width="120">
          <template #default="scope">
            {{ scope.row.status === 'occupied' ? calculateParkingTime(safeGet(scope.row, 'occupiedBy.entryTime', null)) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="scope">
              <el-button 
                type="primary" 
                size="small" 
                @click="handleEdit(scope.row)"
                :icon="Edit"
              >
                编辑
              </el-button>
              
              <el-button 
                :type="scope.row.status === 'available' ? 'warning' : 'success'" 
                size="small" 
                @click="handleChangeStatus(scope.row)"
                :icon="scope.row.status === 'available' ? Lock : Unlock"
              >
                {{ scope.row.status === 'available' ? '占用' : '释放' }}
              </el-button>
              
              <el-button 
                type="danger" 
                size="small" 
                @click="handleDelete(scope.row)"
                :icon="Delete"
              >
                删除
              </el-button>
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
    
    <!-- 添加/编辑车位对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="120px">
        <el-form-item label="停车场" prop="lotId">
          <el-select 
            :value="safeGet(form, 'lotId', '')" 
            @change="(val) => { if(form) form.lotId = val }"
            placeholder="请选择停车场" 
            style="width: 100%"
          >
            <el-option 
              v-for="lot in parkingLots" 
              :key="safeGet(lot, '_id', lot.id)" 
              :label="safeGet(lot, 'name', '未知停车场')" 
              :value="safeGet(lot, '_id', lot.id)" 
            />
          </el-select>
        </el-form-item>
        <el-form-item label="楼层" prop="floorId">
          <el-input 
            :value="safeGet(form, 'floorId', '')" 
            @input="(val) => { if(form) form.floorId = val }"
            placeholder="请输入楼层ID，如：F1"
          />
        </el-form-item>
        <el-form-item label="区域" prop="area">
          <el-select 
            :value="safeGet(form, 'area', '')" 
            @change="(val) => { if(form) form.area = val }"
            placeholder="请选择区域" 
            style="width: 100%"
          >
            <el-option label="A区" value="A" />
            <el-option label="B区" value="B" />
            <el-option label="C区" value="C" />
            <el-option label="D区" value="D" />
          </el-select>
        </el-form-item>
        <el-form-item label="车位编号" prop="spaceId">
          <el-input 
            :value="safeGet(form, 'spaceId', '')" 
            @input="(val) => { if(form) form.spaceId = val }"
            placeholder="请输入车位编号，如：A001"
          />
        </el-form-item>
        <el-form-item label="车位类型" prop="type">
          <el-radio-group 
            :value="safeGet(form, 'type', 'standard')" 
            @change="(val) => { if(form) form.type = val }"
          >
            <el-radio label="standard">普通车位</el-radio>
            <el-radio label="disabled">无障碍车位</el-radio>
            <el-radio label="electric">充电车位</el-radio>
            <el-radio label="vip">VIP车位</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-radio-group 
            :value="safeGet(form, 'status', 'available')" 
            @change="(val) => { if(form) form.status = val }"
          >
            <el-radio label="available">空闲</el-radio>
            <el-radio label="occupied">占用</el-radio>
            <el-radio label="reserved">预约</el-radio>
            <el-radio label="maintenance">维修中</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="位置坐标">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-input-number 
                :value="safeGet(form, 'position.x', 0)" 
                @change="(val) => { 
                  if(form) {
                    if(!form.position) form.position = {}
                    form.position.x = val 
                  }
                }"
                placeholder="X坐标" 
                :min="0" 
                style="width: 100%"
              />
            </el-col>
            <el-col :span="12">
              <el-input-number 
                :value="safeGet(form, 'position.y', 0)" 
                @change="(val) => { 
                  if(form) {
                    if(!form.position) form.position = {}
                    form.position.y = val 
                  }
                }"
                placeholder="Y坐标" 
                :min="0" 
                style="width: 100%"
              />
            </el-col>
          </el-row>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit" :loading="submitting">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Lock, Unlock } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { safeGet, safeGetArray, safeFormatDate, safeParseNumber } from '@/utils/safeAccess'

export default {
  name: 'ParkingSpaces',
  components: {
    Edit,
    Delete,
    Lock,
    Unlock
  },
  setup() {
    const parkingSpaces = ref([])
    const loading = ref(false)
    const dialogVisible = ref(false)
    const dialogTitle = ref('')
    const isEdit = ref(false)
    const submitting = ref(false)
    const formRef = ref(null)

    // 分页相关
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)

    // 筛选条件
    const filterForm = ref({
      area: '',
      status: '',
      spaceId: ''
    })

    // 表单数据
    const form = ref({
      lotId: '',
      floorId: '',
      area: '',
      spaceId: '',
      type: 'standard',
      status: 'available',
      position: {
        x: 0,
        y: 0
      }
    })

    // 停车场列表
    const parkingLots = ref([])

    // 表单验证规则
    const rules = {
      lotId: [{ required: true, message: '请选择停车场', trigger: 'change' }],
      floorId: [{ required: true, message: '请输入楼层ID', trigger: 'blur' }],
      area: [{ required: true, message: '请选择区域', trigger: 'change' }],
      spaceId: [
        { required: true, message: '请输入车位编号', trigger: 'blur' },
        { pattern: /^[A-Z]\d{3}$/, message: '车位编号格式不正确，应为字母+3位数字，如A001', trigger: 'blur' }
      ],
      type: [{ required: true, message: '请选择车位类型', trigger: 'change' }],
      status: [{ required: true, message: '请选择车位状态', trigger: 'change' }]
    }
    
    // 模拟数据
    const mockData = [
      { id: 1, area: 'A', number: 'A001', type: '普通车位', status: '空闲', currentCar: '-', parkingTime: '-' },
      { id: 2, area: 'A', number: 'A002', type: 'VIP车位', status: '占用', currentCar: '京A12345', parkingTime: '2小时30分' },
      { id: 3, area: 'B', number: 'B001', type: '充电车位', status: '占用', currentCar: '沪B67890', parkingTime: '1小时15分' },
      { id: 4, area: 'B', number: 'B002', type: '普通车位', status: '维修中', currentCar: '-', parkingTime: '-' },
      { id: 5, area: 'C', number: 'C001', type: '普通车位', status: '空闲', currentCar: '-', parkingTime: '-' }
    ]
    
    const importTcc1Data = async () => {
      try {
        ElMessageBox.confirm(
          '确定要导入TCC1数据吗？这将清除现有车位数据并导入新的数据。',
          '警告',
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning',
          }
        ).then(async () => {
          const response = await request.post('/admin/import/import-tcc1-data')
          
          if (response.success) {
            ElMessage.success(`成功导入 ${response.data.importedSpaces} 个车位`)
            fetchParkingSpaces()
          } else {
            ElMessage.error('导入失败: ' + response.message)
          }
        }).catch(() => {
          ElMessage.info('已取消导入')
        })
      } catch (error) {
        console.error('导入TCC1数据错误:', error)
        ElMessage.error('导入TCC1数据错误')
      }
    }
    
    // 获取停车场列表
    const fetchParkingLots = async () => {
      try {
        const response = await request.get('/admin/parking/lots', {
          params: { page: 1, pageSize: 100 }
        })
        if (response.success) {
          parkingLots.value = response.data.lots || []
        }
      } catch (error) {
        console.error('获取停车场列表失败:', error)
      }
    }

    // 获取车位列表
    const fetchParkingSpaces = async () => {
      loading.value = true
      try {
        const params = {
          page: currentPage.value,
          limit: pageSize.value
        }
        
        // 添加筛选条件
        if (filterForm.value) {
          if (safeGet(filterForm.value, 'area')) {
            params.area = safeGet(filterForm.value, 'area')
          }
          if (safeGet(filterForm.value, 'status')) {
            params.status = safeGet(filterForm.value, 'status')
          }
          if (safeGet(filterForm.value, 'spaceId')) {
            params.search = safeGet(filterForm.value, 'spaceId')
          }
        }
        
        const response = await request.get('/admin/parking/spaces', { params })
        
        if (response.success) {
          // 转换数据格式
          parkingSpaces.value = safeGetArray(response.data, 'spaces', []).map(space => ({
            ...space,
            // 转换状态为中文显示
            statusText: getStatusText(safeGet(space, 'status', '')),
            // 转换类型为中文显示
            typeText: getTypeText(safeGet(space, 'type', '')),
            // 添加停车场名称
            lotName: safeGet(space, 'lotId.name', '未知停车场')
          }))
          
          total.value = safeParseNumber(safeGet(response.data, 'pagination.total', 0), 0)
        } else {
          ElMessage.error(safeGet(response, 'message', '获取车位列表失败'))
        }
      } catch (error) {
        console.error('获取车位列表失败:', error)
        ElMessage.error('获取车位列表失败')
      } finally {
        loading.value = false
      }
    }

    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'available': '空闲',
        'occupied': '占用',
        'reserved': '预约',
        'maintenance': '维修中'
      }
      return statusMap[status] || status
    }

    // 获取类型文本
    const getTypeText = (type) => {
      const typeMap = {
        'standard': '普通车位',
        'disabled': '无障碍车位',
        'electric': '充电车位',
        'vip': 'VIP车位'
      }
      return typeMap[type] || type
    }

    // 重置表单
    const resetForm = () => {
      // 确保form.value存在
      if (!form.value) {
        form.value = {}
      }
      
      form.value = {
        lotId: '',
        floorId: '',
        area: '',
        spaceId: '',
        type: 'standard',
        status: 'available',
        position: {
          x: 0,
          y: 0
        }
      }
      if (formRef.value) {
        formRef.value.resetFields()
      }
    }
    
    const getStatusType = (status) => {
      switch (status) {
        case 'available': return 'success'
        case 'occupied': return 'danger'
        case 'maintenance': return 'warning'
        case 'reserved': return 'info'
        default: return 'info'
      }
    }
    
    // 计算停车时长
    const calculateParkingTime = (entryTime) => {
      if (!entryTime) return '-'
      
      const entry = new Date(entryTime)
      const now = new Date()
      const diff = now - entry
      
      if (diff < 0) return '0分钟'
      
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours > 0) {
        return `${hours}小时${minutes}分钟`
      } else {
        return `${minutes}分钟`
      }
    }
    
    const handleAdd = () => {
      isEdit.value = false
      dialogTitle.value = '新增车位'
      resetForm()
      dialogVisible.value = true
    }
    
    const handleEdit = (row) => {
  isEdit.value = true
  dialogTitle.value = '编辑车位'
  
  // 填充表单数据
  form.value.lotId = safeGet(row, 'lotId._id', safeGet(row, 'lotId', ''))
  form.value.floorId = safeGet(row, 'floorId', '')
  form.value.area = safeGet(row, 'area', '')
  form.value.spaceId = safeGet(row, 'spaceId', '')
  form.value.type = safeGet(row, 'type') === '普通车位' ? 'standard' : safeGet(row, 'type', 'standard')
  form.value.status = safeGet(row, 'status') === '空闲' ? 'available' : safeGet(row, 'status') === '占用' ? 'occupied' : safeGet(row, 'status', 'available')
  form.value.position.x = safeParseNumber(safeGet(row, 'position.x', 0), 0)
  form.value.position.y = safeParseNumber(safeGet(row, 'position.y', 0), 0)
  
  dialogVisible.value = true
}
    
    const handleChangeStatus = (row) => {
      if (!row) {
        ElMessage.error('无效的车位数据')
        return
      }
      
      const statusOptions = [
        { label: '空闲', value: 'available' },
        { label: '占用', value: 'occupied' },
        { label: '预约', value: 'reserved' },
        { label: '维修中', value: 'maintenance' }
      ]
      
      const currentIndex = statusOptions.findIndex(option => option.value === safeGet(row, 'status'))
      const nextIndex = (currentIndex + 1) % statusOptions.length
      const newStatus = statusOptions[nextIndex].value
      
      ElMessageBox.confirm(
        `确定要将车位 ${safeGet(row, 'spaceId', '')} 状态变更为 ${statusOptions[nextIndex].label} 吗？`,
        '状态变更确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(async () => {
        try {
          // 使用MongoDB的_id作为标识
          const spaceId = safeGet(row, '_id', safeGet(row, 'id', ''))
          if (!spaceId) {
            ElMessage.error('找不到要修改状态的车位ID')
            return
          }
          
          const response = await request.put(`/admin/parking/spaces/${spaceId}`, {
            status: newStatus
          })
          if (response.success) {
            ElMessage.success('状态变更成功')
            fetchParkingSpaces()
          } else {
            ElMessage.error(safeGet(response, 'message', '状态变更失败'))
          }
        } catch (error) {
          console.error('状态变更失败:', error)
          ElMessage.error('状态变更失败')
        }
      }).catch(() => {
        ElMessage.info('已取消状态变更')
      })
    }
    
    const handleDelete = (row) => {
      if (!row) {
        ElMessage.error('无效的车位数据')
        return
      }
      
      ElMessageBox.confirm(
        `确定要删除车位 ${safeGet(row, 'spaceId', '')} 吗？此操作不可恢复。`,
        '删除确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(async () => {
        try {
          // 使用MongoDB的_id作为标识
          const spaceId = safeGet(row, '_id', safeGet(row, 'id', ''))
          if (!spaceId) {
            ElMessage.error('找不到要删除的车位ID')
            return
          }
          
          const response = await request.delete(`/admin/parking/spaces/${spaceId}`)
          if (response.success) {
            ElMessage.success('删除成功')
            fetchParkingSpaces()
          } else {
            ElMessage.error(safeGet(response, 'message', '删除失败'))
          }
        } catch (error) {
          console.error('删除失败:', error)
          ElMessage.error('删除失败')
        }
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const handleSubmit = async () => {
      if (!formRef.value) return
      
      try {
        await formRef.value.validate()
        submitting.value = true
        
        // 检查form.value是否存在
        if (!form.value) {
          ElMessage.error('表单数据无效')
          return
        }
        
        const data = { ...form.value }
        
        if (isEdit.value) {
          // 编辑车位 - 使用MongoDB的_id作为标识
          const spaceId = safeGet(parkingSpaces.value.find(s => s.spaceId === safeGet(form.value, 'spaceId')), '_id', '')
          if (!spaceId) {
            ElMessage.error('找不到要编辑的车位')
            return
          }
          
          const response = await request.put(`/admin/parking/spaces/${spaceId}`, data)
          if (response.success) {
            ElMessage.success('车位信息更新成功')
          } else {
            ElMessage.error(safeGet(response, 'message', '更新车位失败'))
            return
          }
        } else {
          // 添加车位
          const response = await request.post('/admin/parking/spaces', data)
          if (response.success) {
            ElMessage.success('车位添加成功')
          } else {
            ElMessage.error(safeGet(response, 'message', '添加车位失败'))
            return
          }
        }
        
        dialogVisible.value = false
        fetchParkingSpaces()
      } catch (error) {
        console.error('提交失败:', error)
        if (safeGet(error, 'response.data.message')) {
          ElMessage.error(safeGet(error, 'response.data.message'))
        } else {
          ElMessage.error(isEdit.value ? '更新车位失败' : '添加车位失败')
        }
      } finally {
        submitting.value = false
      }
    }
    
    const handleFilter = () => {
      currentPage.value = 1
      
      // 确保filterForm.value存在
      if (!filterForm.value) {
        filterForm.value = {
          area: '',
          status: '',
          spaceId: ''
        }
      }
      
      fetchParkingSpaces()
    }
    
    const resetFilter = () => {
      // 确保filterForm.value存在
      if (!filterForm.value) {
        filterForm.value = {}
      }
      
      filterForm.value = {
        area: '',
        status: '',
        spaceId: ''
      }
      currentPage.value = 1
      fetchParkingSpaces()
    }
    
    const handleSizeChange = (size) => {
      if (!size || size <= 0) {
        ElMessage.error('无效的页面大小')
        return
      }
      
      pageSize.value = size
      currentPage.value = 1
      fetchParkingSpaces()
    }
    
    const handleCurrentChange = (val) => {
      if (!val || val <= 0) {
        ElMessage.error('无效的页码')
        return
      }
      
      currentPage.value = val
      fetchParkingSpaces()
    }
    
    onMounted(() => {
      fetchParkingLots()
      fetchParkingSpaces()
    })
    
    // 添加activated钩子，确保在路由切换时组件能够正确更新
    onActivated(() => {
      fetchParkingSpaces()
    })
    
    return {
      parkingSpaces,
      loading,
      dialogVisible,
      dialogTitle,
      isEdit,
      submitting,
      formRef,
      currentPage,
      pageSize,
      total,
      filterForm,
      form,
      parkingLots,
      rules,
      getStatusType,
      calculateParkingTime,
      importTcc1Data,
      fetchParkingLots,
      fetchParkingSpaces,
      getStatusText,
      getTypeText,
      resetForm,
      handleAdd,
      handleEdit,
      handleChangeStatus,
      handleDelete,
      handleSubmit,
      handleFilter,
      resetFilter,
      handleSizeChange,
      handleCurrentChange,
      Edit,
      Delete,
      Lock,
      Unlock
    }
  }
}
</script>

<style scoped>
.parking-spaces-container {
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
</style>