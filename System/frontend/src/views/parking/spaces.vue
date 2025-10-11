<template>
  <div class="parking-spaces-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>车位信息管理</span>
          <el-button type="primary" @click="handleAdd">新增车位</el-button>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="区域">
            <el-select v-model="filterForm.area" placeholder="请选择区域" clearable>
              <el-option label="A区" value="A" />
              <el-option label="B区" value="B" />
              <el-option label="C区" value="C" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
              <el-option label="空闲" value="空闲" />
              <el-option label="占用" value="占用" />
              <el-option label="维修中" value="维修中" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="parkingSpaces" style="width: 100%">
        <el-table-column prop="id" label="车位ID" width="100" />
        <el-table-column prop="area" label="区域" width="80" />
        <el-table-column prop="number" label="车位号" width="100" />
        <el-table-column prop="type" label="车位类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.type === '普通车位' ? 'primary' : 'success'">
              {{ scope.row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="currentCar" label="当前车辆" width="120" />
        <el-table-column prop="parkingTime" label="停车时长" width="120" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === '占用' ? 'warning' : 'success'" 
              @click="handleChangeStatus(scope.row)"
            >
              {{ scope.row.status === '占用' ? '释放' : '占用' }}
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)">删除</el-button>
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
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="区域">
          <el-select v-model="form.area" placeholder="请选择区域">
            <el-option label="A区" value="A" />
            <el-option label="B区" value="B" />
            <el-option label="C区" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="车位号">
          <el-input v-model="form.number" placeholder="请输入车位号"></el-input>
        </el-form-item>
        <el-form-item label="车位类型">
          <el-radio-group v-model="form.type">
            <el-radio label="普通车位">普通车位</el-radio>
            <el-radio label="VIP车位">VIP车位</el-radio>
            <el-radio label="充电车位">充电车位</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="空闲">空闲</el-radio>
            <el-radio label="占用">占用</el-radio>
            <el-radio label="维修中">维修中</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'ParkingSpaces',
  setup() {
    const parkingSpaces = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const dialogVisible = ref(false)
    const dialogTitle = ref('新增车位')
    const filterForm = ref({
      area: '',
      status: ''
    })
    const form = ref({
      id: null,
      area: '',
      number: '',
      type: '普通车位',
      status: '空闲'
    })
    
    // 模拟数据
    const mockData = [
      { id: 1, area: 'A', number: 'A001', type: '普通车位', status: '空闲', currentCar: '-', parkingTime: '-' },
      { id: 2, area: 'A', number: 'A002', type: 'VIP车位', status: '占用', currentCar: '京A12345', parkingTime: '2小时30分' },
      { id: 3, area: 'B', number: 'B001', type: '充电车位', status: '占用', currentCar: '沪B67890', parkingTime: '1小时15分' },
      { id: 4, area: 'B', number: 'B002', type: '普通车位', status: '维修中', currentCar: '-', parkingTime: '-' },
      { id: 5, area: 'C', number: 'C001', type: '普通车位', status: '空闲', currentCar: '-', parkingTime: '-' }
    ]
    
    const fetchParkingSpaces = () => {
      // 模拟API请求
      setTimeout(() => {
        parkingSpaces.value = mockData
        total.value = mockData.length
      }, 500)
    }
    
    const getStatusType = (status) => {
      switch (status) {
        case '空闲': return 'success'
        case '占用': return 'danger'
        case '维修中': return 'warning'
        default: return 'info'
      }
    }
    
    const handleAdd = () => {
      dialogTitle.value = '新增车位'
      form.value = {
        id: null,
        area: '',
        number: '',
        type: '普通车位',
        status: '空闲'
      }
      dialogVisible.value = true
    }
    
    const handleEdit = (row) => {
      dialogTitle.value = '编辑车位'
      form.value = { ...row }
      dialogVisible.value = true
    }
    
    const handleChangeStatus = (row) => {
      const newStatus = row.status === '占用' ? '空闲' : '占用'
      const action = newStatus === '占用' ? '占用' : '释放'
      
      ElMessageBox.confirm(
        `确定要${action}车位 ${row.area}${row.number} 吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        row.status = newStatus
        if (newStatus === '空闲') {
          row.currentCar = '-'
          row.parkingTime = '-'
        }
        ElMessage.success(`${action}成功`)
      }).catch(() => {
        ElMessage.info(`已取消${action}`)
      })
    }
    
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除车位 ${row.area}${row.number} 吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        ElMessage.success('删除成功')
        fetchParkingSpaces()
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const handleSubmit = () => {
      if (!form.value.area || !form.value.number) {
        ElMessage.error('请填写完整信息')
        return
      }
      
      // 模拟提交
      setTimeout(() => {
        ElMessage.success(dialogTitle.value === '新增车位' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        fetchParkingSpaces()
      }, 500)
    }
    
    const handleFilter = () => {
      // 模拟筛选
      ElMessage.success('筛选功能待实现')
    }
    
    const resetFilter = () => {
      filterForm.value = {
        area: '',
        status: ''
      }
      fetchParkingSpaces()
    }
    
    const handleSizeChange = (val) => {
      pageSize.value = val
      fetchParkingSpaces()
    }
    
    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchParkingSpaces()
    }
    
    onMounted(() => {
      fetchParkingSpaces()
    })
    
    return {
      parkingSpaces,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      dialogTitle,
      filterForm,
      form,
      getStatusType,
      handleAdd,
      handleEdit,
      handleChangeStatus,
      handleDelete,
      handleSubmit,
      handleFilter,
      resetFilter,
      handleSizeChange,
      handleCurrentChange
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