<template>
  <div class="parking-spaces-enhanced">
    <div class="page-header">
      <h2>车位管理</h2>
      <div class="header-actions">
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加车位
        </el-button>
        <el-button type="success" @click="showBatchUpdateDialog" :disabled="selectedSpaces.length === 0">
          <el-icon><Edit /></el-icon>
          批量更新
        </el-button>
        <el-button @click="refreshData">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="stats-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon total">
                <el-icon><Grid /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.totalSpaces }}</div>
                <div class="stats-label">总车位数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon available">
                <el-icon><CircleCheck /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.availableSpaces }}</div>
                <div class="stats-label">可用车位</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon occupied">
                <el-icon><CircleClose /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.occupiedSpaces }}</div>
                <div class="stats-label">占用车位</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stats-card">
            <div class="stats-content">
              <div class="stats-icon rate">
                <el-icon><PieChart /></el-icon>
              </div>
              <div class="stats-info">
                <div class="stats-value">{{ stats.occupancyRate }}%</div>
                <div class="stats-label">占用率</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 筛选器 -->
    <el-card class="filter-card">
      <el-form :model="filterForm" inline>
        <el-form-item label="停车场">
          <el-select v-model="filterForm.lotId" placeholder="选择停车场" clearable @change="handleFilter">
            <el-option
              v-for="lot in parkingLots"
              :key="lot._id"
              :label="lot.name"
              :value="lot._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="区域">
          <el-input v-model="filterForm.area" placeholder="区域" clearable @input="handleFilter" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="filterForm.status" placeholder="选择状态" clearable @change="handleFilter">
            <el-option label="可用" value="available" />
            <el-option label="占用" value="occupied" />
            <el-option label="预订" value="reserved" />
            <el-option label="维护" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="filterForm.type" placeholder="选择类型" clearable @change="handleFilter">
            <el-option label="标准" value="standard" />
            <el-option label="残疾人" value="disabled" />
            <el-option label="电动车" value="electric" />
            <el-option label="VIP" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleFilter">查询</el-button>
          <el-button @click="resetFilter">重置</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 车位列表 -->
    <el-card class="table-card">
      <template #header>
        <div class="card-header">
          <span>车位列表</span>
          <div class="header-actions">
            <el-button-group>
              <el-button 
                :type="viewMode === 'table' ? 'primary' : ''" 
                @click="viewMode = 'table'"
              >
                <el-icon><List /></el-icon>
                列表视图
              </el-button>
              <el-button 
                :type="viewMode === 'map' ? 'primary' : ''" 
                @click="viewMode = 'map'"
              >
                <el-icon><Location /></el-icon>
                地图视图
              </el-button>
            </el-button-group>
          </div>
        </div>
      </template>

      <!-- 表格视图 -->
      <el-table
        v-if="viewMode === 'table'"
        :data="parkingSpaces"
        v-loading="loading"
        @selection-change="handleSelectionChange"
        stripe
      >
        <el-table-column type="selection" width="55" />
        <el-table-column prop="spaceId" label="车位编号" width="120" />
        <el-table-column prop="lotId.name" label="停车场" width="150" />
        <el-table-column prop="floorId" label="楼层" width="80" />
        <el-table-column prop="area" label="区域" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="scope">
            <el-tag :type="getTypeTagType(scope.row.type)">
              {{ getTypeText(scope.row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="showEditDialog(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              type="warning" 
              @click="showStatusDialog(scope.row)"
            >
              状态
            </el-button>
            <el-button 
              size="small" 
              type="info" 
              @click="showHistoryDialog(scope.row)"
            >
              历史
            </el-button>
            <el-button 
              size="small" 
              type="danger" 
              @click="handleDelete(scope.row)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 地图视图 -->
      <div v-if="viewMode === 'map'" class="map-view">
        <div class="map-container">
          <div class="map-legend">
            <div class="legend-item">
              <div class="legend-color available"></div>
              <span>可用</span>
            </div>
            <div class="legend-item">
              <div class="legend-color occupied"></div>
              <span>占用</span>
            </div>
            <div class="legend-item">
              <div class="legend-color reserved"></div>
              <span>预订</span>
            </div>
            <div class="legend-item">
              <div class="legend-color maintenance"></div>
              <span>维护</span>
            </div>
          </div>
          <div class="map-grid">
            <div 
              v-for="space in parkingSpaces" 
              :key="space._id"
              class="parking-space"
              :class="space.status"
              :title="`${space.spaceId} - ${getStatusText(space.status)}`"
              @click="showSpaceDetails(space)"
            >
              {{ space.spaceId }}
            </div>
          </div>
        </div>
      </div>

      <!-- 分页 -->
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

    <!-- 添加/编辑对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle" 
      width="600px"
      @close="resetForm"
    >
      <el-form 
        :model="form" 
        :rules="formRules" 
        ref="formRef" 
        label-width="100px"
      >
        <el-form-item label="停车场" prop="lotId">
          <el-select v-model="form.lotId" placeholder="选择停车场" style="width: 100%">
            <el-option
              v-for="lot in parkingLots"
              :key="lot._id"
              :label="lot.name"
              :value="lot._id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车位编号" prop="spaceId">
          <el-input v-model="form.spaceId" placeholder="车位编号" />
        </el-form-item>
        <el-form-item label="楼层" prop="floorId">
          <el-input-number v-model="form.floorId" :min="1" :max="10" />
        </el-form-item>
        <el-form-item label="区域" prop="area">
          <el-input v-model="form.area" placeholder="区域" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-select v-model="form.type" placeholder="选择类型" style="width: 100%">
            <el-option label="标准" value="standard" />
            <el-option label="残疾人" value="disabled" />
            <el-option label="电动车" value="electric" />
            <el-option label="VIP" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="form.status" placeholder="选择状态" style="width: 100%">
            <el-option label="可用" value="available" />
            <el-option label="占用" value="occupied" />
            <el-option label="预订" value="reserved" />
            <el-option label="维护" value="maintenance" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 批量更新对话框 -->
    <el-dialog 
      v-model="batchUpdateDialogVisible" 
      title="批量更新车位" 
      width="500px"
    >
      <el-form :model="batchUpdateForm" label-width="100px">
        <el-form-item label="选中车位">
          <el-tag v-for="space in selectedSpaces" :key="space._id" style="margin-right: 5px;">
            {{ space.spaceId }}
          </el-tag>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="batchUpdateForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="可用" value="available" />
            <el-option label="占用" value="occupied" />
            <el-option label="预订" value="reserved" />
            <el-option label="维护" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="batchUpdateForm.type" placeholder="选择类型" style="width: 100%">
            <el-option label="不修改" value="" />
            <el-option label="标准" value="standard" />
            <el-option label="残疾人" value="disabled" />
            <el-option label="电动车" value="electric" />
            <el-option label="VIP" value="vip" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input 
            v-model="batchUpdateForm.changeReason" 
            type="textarea" 
            placeholder="请输入变更原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="batchUpdateDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleBatchUpdate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 状态变更对话框 -->
    <el-dialog 
      v-model="statusDialogVisible" 
      title="状态变更" 
      width="500px"
    >
      <el-form :model="statusForm" label-width="100px">
        <el-form-item label="车位编号">
          <span>{{ currentSpace?.spaceId }}</span>
        </el-form-item>
        <el-form-item label="当前状态">
          <el-tag :type="getStatusTagType(currentSpace?.status)">
            {{ getStatusText(currentSpace?.status) }}
          </el-tag>
        </el-form-item>
        <el-form-item label="新状态">
          <el-select v-model="statusForm.status" placeholder="选择状态" style="width: 100%">
            <el-option label="可用" value="available" />
            <el-option label="占用" value="occupied" />
            <el-option label="预订" value="reserved" />
            <el-option label="维护" value="maintenance" />
          </el-select>
        </el-form-item>
        <el-form-item label="变更原因">
          <el-input 
            v-model="statusForm.changeReason" 
            type="textarea" 
            placeholder="请输入变更原因"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="statusDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleStatusUpdate">确定</el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 操作历史对话框 -->
    <el-dialog 
      v-model="historyDialogVisible" 
      title="操作历史" 
      width="800px"
    >
      <el-table :data="statusHistory" v-loading="historyLoading">
        <el-table-column prop="changeTime" label="变更时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.changeTime) }}
          </template>
        </el-table-column>
        <el-table-column prop="previousStatus" label="原状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.previousStatus)">
              {{ getStatusText(scope.row.previousStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="newStatus" label="新状态" width="100">
          <template #default="scope">
            <el-tag :type="getStatusTagType(scope.row.newStatus)">
              {{ getStatusText(scope.row.newStatus) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="100">
          <template #default="scope">
            {{ getSourceText(scope.row.source) }}
          </template>
        </el-table-column>
        <el-table-column prop="operatorId.username" label="操作人" width="120" />
        <el-table-column prop="changeReason" label="原因" />
      </el-table>
      
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="historyPagination.currentPage"
          v-model:page-size="historyPagination.pageSize"
          layout="total, prev, pager, next"
          :total="historyPagination.total"
          @current-change="handleHistoryPageChange"
        />
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  Plus, Edit, Refresh, Grid, CircleCheck, CircleClose, 
  PieChart, List, Location 
} from '@element-plus/icons-vue'
import request from '@/utils/request'

export default {
  name: 'ParkingSpacesEnhanced',
  components: {
    Plus, Edit, Refresh, Grid, CircleCheck, CircleClose, PieChart, List, Location
  },
  setup() {
    // 数据状态
    const loading = ref(false)
    const historyLoading = ref(false)
    const parkingSpaces = ref([])
    const parkingLots = ref([])
    const selectedSpaces = ref([])
    const statusHistory = ref([])
    const currentSpace = ref(null)
    
    // 视图模式
    const viewMode = ref('table')
    
    // 统计数据
    const stats = reactive({
      totalSpaces: 0,
      availableSpaces: 0,
      occupiedSpaces: 0,
      occupancyRate: 0
    })
    
    // 分页
    const pagination = reactive({
      currentPage: 1,
      pageSize: 20,
      total: 0
    })
    
    const historyPagination = reactive({
      currentPage: 1,
      pageSize: 10,
      total: 0
    })
    
    // 筛选表单
    const filterForm = reactive({
      lotId: '',
      area: '',
      status: '',
      type: ''
    })
    
    // 表单
    const form = reactive({
      spaceId: '',
      lotId: '',
      floorId: 1,
      area: '',
      type: 'standard',
      status: 'available'
    })
    
    // 批量更新表单
    const batchUpdateForm = reactive({
      status: '',
      type: '',
      changeReason: ''
    })
    
    // 状态变更表单
    const statusForm = reactive({
      status: '',
      changeReason: ''
    })
    
    // 对话框状态
    const dialogVisible = ref(false)
    const batchUpdateDialogVisible = ref(false)
    const statusDialogVisible = ref(false)
    const historyDialogVisible = ref(false)
    const isEdit = ref(false)
    const formRef = ref(null)
    
    // 计算属性
    const dialogTitle = computed(() => {
      return isEdit.value ? '编辑车位' : '添加车位'
    })
    
    // 表单验证规则
    const formRules = {
      spaceId: [
        { required: true, message: '请输入车位编号', trigger: 'blur' }
      ],
      lotId: [
        { required: true, message: '请选择停车场', trigger: 'change' }
      ],
      floorId: [
        { required: true, message: '请输入楼层', trigger: 'blur' }
      ],
      type: [
        { required: true, message: '请选择类型', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }
    
    // 获取车位列表
    const fetchParkingSpaces = async () => {
      loading.value = true
      try {
        const params = {
          page: pagination.currentPage,
          limit: pagination.pageSize,
          ...filterForm
        }
        
        // 清除空值参数
        Object.keys(params).forEach(key => {
          if (params[key] === '') {
            delete params[key]
          }
        })
        
        const response = await request.get('/parking/spaces', { params })
        
        if (response.success) {
          parkingSpaces.value = response.data.spaces
          pagination.total = response.data.pagination.totalItems
        }
      } catch (error) {
        ElMessage.error('获取车位列表失败')
      } finally {
        loading.value = false
      }
    }
    
    // 获取停车场列表
    const fetchParkingLots = async () => {
      try {
        const response = await request.get('/parking/lots', {
          params: { limit: 100 }
        })
        
        if (response.success) {
          parkingLots.value = response.data.lots
        }
      } catch (error) {
        ElMessage.error('获取停车场列表失败')
      }
    }
    
    // 获取统计数据
    const fetchStats = async () => {
      try {
        const params = {}
        if (filterForm.lotId) {
          params.lotId = filterForm.lotId
        }
        
        const response = await request.get('/api/admin/parking-enhanced/statistics', { params })
        
        if (response.success) {
          const { overview } = response.data
          stats.totalSpaces = overview.totalSpaces
          stats.availableSpaces = overview.availableSpaces
          stats.occupiedSpaces = overview.occupiedSpaces
          stats.occupancyRate = overview.occupancyRate
        }
      } catch (error) {
        ElMessage.error('获取统计数据失败')
      }
    }
    
    // 获取状态历史
    const fetchStatusHistory = async (spaceId) => {
      historyLoading.value = true
      try {
        const params = {
          page: historyPagination.currentPage,
          limit: historyPagination.pageSize
        }
        
        const response = await request.get(`/api/admin/parking-enhanced/status-history?spaceId=${spaceId}`, { params })
        
        if (response.success) {
          statusHistory.value = response.data.statusHistory
          historyPagination.total = response.data.pagination.totalItems
        }
      } catch (error) {
        ElMessage.error('获取状态历史失败')
      } finally {
        historyLoading.value = false
      }
    }
    
    // 刷新数据
    const refreshData = () => {
      fetchParkingSpaces()
      fetchStats()
    }
    
    // 处理筛选
    const handleFilter = () => {
      pagination.currentPage = 1
      fetchParkingSpaces()
      fetchStats()
    }
    
    // 重置筛选
    const resetFilter = () => {
      Object.keys(filterForm).forEach(key => {
        filterForm[key] = ''
      })
      handleFilter()
    }
    
    // 处理分页大小变化
    const handleSizeChange = (size) => {
      pagination.pageSize = size
      fetchParkingSpaces()
    }
    
    // 处理当前页变化
    const handleCurrentChange = (page) => {
      pagination.currentPage = page
      fetchParkingSpaces()
    }
    
    // 处理历史分页
    const handleHistoryPageChange = (page) => {
      historyPagination.currentPage = page
      if (currentSpace.value) {
        fetchStatusHistory(currentSpace.value._id)
      }
    }
    
    // 处理选择变化
    const handleSelectionChange = (selection) => {
      selectedSpaces.value = selection
    }
    
    // 显示添加对话框
    const showAddDialog = () => {
      isEdit.value = false
      dialogVisible.value = true
    }
    
    // 显示编辑对话框
    const showEditDialog = (row) => {
      isEdit.value = true
      Object.keys(form).forEach(key => {
        if (key === 'lotId') {
          form[key] = row.lotId._id
        } else {
          form[key] = row[key]
        }
      })
      dialogVisible.value = true
    }
    
    // 显示批量更新对话框
    const showBatchUpdateDialog = () => {
      batchUpdateDialogVisible.value = true
    }
    
    // 显示状态对话框
    const showStatusDialog = (row) => {
      currentSpace.value = row
      statusForm.status = row.status
      statusForm.changeReason = ''
      statusDialogVisible.value = true
    }
    
    // 显示历史对话框
    const showHistoryDialog = (row) => {
      currentSpace.value = row
      historyPagination.currentPage = 1
      fetchStatusHistory(row._id)
      historyDialogVisible.value = true
    }
    
    // 显示车位详情
    const showSpaceDetails = (space) => {
      showStatusDialog(space)
    }
    
    // 重置表单
    const resetForm = () => {
      Object.keys(form).forEach(key => {
        if (typeof form[key] === 'string') {
          form[key] = ''
        } else if (typeof form[key] === 'number') {
          form[key] = key === 'floorId' ? 1 : 0
        }
      })
      form.type = 'standard'
      form.status = 'available'
      formRef.value?.clearValidate()
    }
    
    // 提交表单
    const handleSubmit = () => {
      formRef.value.validate(async (valid) => {
        if (valid) {
          try {
            let response
            
            if (isEdit.value) {
              // 编辑车位
              response = await request.put(`/parking/spaces/${currentSpace.value._id}`, form)
            } else {
              // 添加车位
              response = await request.post('/parking/spaces', form)
            }
            
            if (response.success) {
              ElMessage.success(isEdit.value ? '车位更新成功' : '车位添加成功')
              dialogVisible.value = false
              refreshData()
            }
          } catch (error) {
            ElMessage.error(isEdit.value ? '车位更新失败' : '车位添加失败')
          }
        }
      })
    }
    
    // 处理批量更新
    const handleBatchUpdate = async () => {
      if (!batchUpdateForm.status && !batchUpdateForm.type) {
        ElMessage.warning('请至少选择一个要更新的字段')
        return
      }
      
      try {
        const spaceIds = selectedSpaces.value.map(space => space._id)
        const updates = {}
        
        if (batchUpdateForm.status) {
          updates.status = batchUpdateForm.status
        }
        
        if (batchUpdateForm.type) {
          updates.type = batchUpdateForm.type
        }
        
        if (batchUpdateForm.changeReason) {
          updates.changeReason = batchUpdateForm.changeReason
        }
        
        const response = await request.put('/api/admin/parking-enhanced/spaces/batch', {
          spaceIds,
          updates,
          changeReason: batchUpdateForm.changeReason
        })
        
        if (response.success) {
          ElMessage.success(`成功更新 ${response.data.updatedCount} 个车位`)
          batchUpdateDialogVisible.value = false
          refreshData()
        }
      } catch (error) {
        ElMessage.error('批量更新失败')
      }
    }
    
    // 处理状态更新
    const handleStatusUpdate = async () => {
      if (!statusForm.status) {
        ElMessage.warning('请选择新状态')
        return
      }
      
      if (statusForm.status === currentSpace.value.status) {
        ElMessage.warning('状态未发生变化')
        return
      }
      
      try {
        const response = await request.put(`/api/admin/parking-enhanced/spaces/${currentSpace.value._id}/status`, {
          status: statusForm.status,
          changeReason: statusForm.changeReason
        })
        
        if (response.success) {
          ElMessage.success('状态更新成功')
          statusDialogVisible.value = false
          refreshData()
        }
      } catch (error) {
        ElMessage.error('状态更新失败')
      }
    }
    
    // 处理删除
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除车位 ${row.spaceId} 吗？`,
        '确认删除',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }
      ).then(async () => {
        try {
          const response = await request.delete(`/parking/spaces/${row._id}`)
          
          if (response.success) {
            ElMessage.success('车位删除成功')
            refreshData()
          }
        } catch (error) {
          ElMessage.error('车位删除失败')
        }
      }).catch(() => {
        // 用户取消删除
      })
    }
    
    // 获取状态标签类型
    const getStatusTagType = (status) => {
      const statusMap = {
        available: 'success',
        occupied: 'danger',
        reserved: 'warning',
        maintenance: 'info'
      }
      return statusMap[status] || ''
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        available: '可用',
        occupied: '占用',
        reserved: '预订',
        maintenance: '维护'
      }
      return statusMap[status] || status
    }
    
    // 获取类型标签类型
    const getTypeTagType = (type) => {
      const typeMap = {
        standard: '',
        disabled: 'warning',
        electric: 'success',
        vip: 'danger'
      }
      return typeMap[type] || ''
    }
    
    // 获取类型文本
    const getTypeText = (type) => {
      const typeMap = {
        standard: '标准',
        disabled: '残疾人',
        electric: '电动车',
        vip: 'VIP'
      }
      return typeMap[type] || type
    }
    
    // 获取来源文本
    const getSourceText = (source) => {
      const sourceMap = {
        manual: '手动',
        sensor: '传感器',
        system: '系统',
        sync: '同步'
      }
      return sourceMap[source] || source
    }
    
    // 格式化日期时间
    const formatDateTime = (dateTime) => {
      if (!dateTime) return ''
      const date = new Date(dateTime)
      return date.toLocaleString('zh-CN')
    }
    
    // 生命周期
    onMounted(() => {
      fetchParkingLots()
      fetchParkingSpaces()
      fetchStats()
    })
    
    return {
      // 数据
      loading,
      historyLoading,
      parkingSpaces,
      parkingLots,
      selectedSpaces,
      statusHistory,
      currentSpace,
      viewMode,
      stats,
      pagination,
      historyPagination,
      filterForm,
      form,
      batchUpdateForm,
      statusForm,
      dialogVisible,
      batchUpdateDialogVisible,
      statusDialogVisible,
      historyDialogVisible,
      isEdit,
      formRef,
      formRules,
      
      // 计算属性
      dialogTitle,
      
      // 方法
      fetchParkingSpaces,
      fetchParkingLots,
      fetchStats,
      fetchStatusHistory,
      refreshData,
      handleFilter,
      resetFilter,
      handleSizeChange,
      handleCurrentChange,
      handleHistoryPageChange,
      handleSelectionChange,
      showAddDialog,
      showEditDialog,
      showBatchUpdateDialog,
      showStatusDialog,
      showHistoryDialog,
      showSpaceDetails,
      resetForm,
      handleSubmit,
      handleBatchUpdate,
      handleStatusUpdate,
      handleDelete,
      getStatusTagType,
      getStatusText,
      getTypeTagType,
      getTypeText,
      getSourceText,
      formatDateTime
    }
  }
}
</script>

<style scoped>
.parking-spaces-enhanced {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.stats-cards {
  margin-bottom: 20px;
}

.stats-card {
  height: 100px;
}

.stats-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 24px;
  color: white;
}

.stats-icon.total {
  background-color: #409EFF;
}

.stats-icon.available {
  background-color: #67C23A;
}

.stats-icon.occupied {
  background-color: #F56C6C;
}

.stats-icon.rate {
  background-color: #E6A23C;
}

.stats-info {
  flex: 1;
}

.stats-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 5px;
}

.filter-card {
  margin-bottom: 20px;
}

.table-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.map-view {
  padding: 20px;
}

.map-container {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 20px;
}

.map-legend {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 5px;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.legend-color.available {
  background-color: #67C23A;
}

.legend-color.occupied {
  background-color: #F56C6C;
}

.legend-color.reserved {
  background-color: #E6A23C;
}

.legend-color.maintenance {
  background-color: #909399;
}

.map-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.parking-space {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.parking-space:hover {
  transform: scale(1.05);
}

.parking-space.available {
  background-color: #67C23A;
}

.parking-space.occupied {
  background-color: #F56C6C;
}

.parking-space.reserved {
  background-color: #E6A23C;
}

.parking-space.maintenance {
  background-color: #909399;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}
</style>