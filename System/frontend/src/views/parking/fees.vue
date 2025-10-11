<template>
  <div class="parking-fees-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>收费标准管理</span>
          <el-button type="primary" @click="handleAdd">新增标准</el-button>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="适用区域">
            <el-select v-model="filterForm.area" placeholder="请选择区域" clearable>
              <el-option label="全部区域" value="" />
              <el-option label="A区" value="A" />
              <el-option label="B区" value="B" />
              <el-option label="C区" value="C" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
              <el-option label="启用" value="启用" />
              <el-option label="禁用" value="禁用" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="feeStandards" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="name" label="标准名称" width="150" />
        <el-table-column prop="area" label="适用区域" width="100" />
        <el-table-column prop="carType" label="车辆类型" width="120">
          <template #default="scope">
            <el-tag :type="scope.row.carType === '临时车' ? 'primary' : 'success'">
              {{ scope.row.carType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="计费方式" width="150">
          <template #default="scope">
            {{ getBillingType(scope.row) }}
          </template>
        </el-table-column>
        <el-table-column label="费率详情" min-width="200">
          <template #default="scope">
            <div v-if="scope.row.billingType === '按时计费'">
              <div>首{{ scope.row.firstUnit }}: ¥{{ scope.row.firstFee }}</div>
              <div>后每{{ scope.row.laterUnit }}: ¥{{ scope.row.laterFee }}</div>
              <div>每日上限: ¥{{ scope.row.dailyCap || '无' }}</div>
            </div>
            <div v-else-if="scope.row.billingType === '按次计费'">
              <div>固定费用: ¥{{ scope.row.fixedFee }}</div>
            </div>
            <div v-else-if="scope.row.billingType === '分段计费'">
              <div v-for="(segment, index) in scope.row.segments" :key="index">
                {{ segment.timeRange }}: ¥{{ segment.fee }}
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '启用' ? 'success' : 'danger'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="effectiveTime" label="生效时间" width="180" />
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === '启用' ? 'warning' : 'success'" 
              @click="handleChangeStatus(scope.row)"
            >
              {{ scope.row.status === '启用' ? '禁用' : '启用' }}
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
    
    <!-- 添加/编辑收费标准对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="700px"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="标准名称">
          <el-input v-model="form.name" placeholder="请输入标准名称"></el-input>
        </el-form-item>
        <el-form-item label="适用区域">
          <el-select v-model="form.area" placeholder="请选择区域">
            <el-option label="全部区域" value="" />
            <el-option label="A区" value="A" />
            <el-option label="B区" value="B" />
            <el-option label="C区" value="C" />
          </el-select>
        </el-form-item>
        <el-form-item label="车辆类型">
          <el-radio-group v-model="form.carType">
            <el-radio label="临时车">临时车</el-radio>
            <el-radio label="月租车">月租车</el-radio>
            <el-radio label="年租车">年租车</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="计费方式">
          <el-radio-group v-model="form.billingType" @change="handleBillingTypeChange">
            <el-radio label="按时计费">按时计费</el-radio>
            <el-radio label="按次计费">按次计费</el-radio>
            <el-radio label="分段计费">分段计费</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <!-- 按时计费表单 -->
        <template v-if="form.billingType === '按时计费'">
          <el-form-item label="首段时长">
            <el-input v-model="form.firstUnit" placeholder="如: 小时、分钟">
              <template #append>时长</template>
            </el-input>
          </el-form-item>
          <el-form-item label="首段费用">
            <el-input v-model="form.firstFee" placeholder="请输入首段费用">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
          <el-form-item label="后续时长">
            <el-input v-model="form.laterUnit" placeholder="如: 小时、分钟">
              <template #append>时长</template>
            </el-input>
          </el-form-item>
          <el-form-item label="后续费用">
            <el-input v-model="form.laterFee" placeholder="请输入后续费用">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
          <el-form-item label="每日上限">
            <el-input v-model="form.dailyCap" placeholder="留空表示无上限">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </template>
        
        <!-- 按次计费表单 -->
        <template v-if="form.billingType === '按次计费'">
          <el-form-item label="固定费用">
            <el-input v-model="form.fixedFee" placeholder="请输入固定费用">
              <template #prepend>¥</template>
            </el-input>
          </el-form-item>
        </template>
        
        <!-- 分段计费表单 -->
        <template v-if="form.billingType === '分段计费'">
          <el-form-item label="时间段设置">
            <div v-for="(segment, index) in form.segments" :key="index" class="segment-item">
              <el-input v-model="segment.timeRange" placeholder="如: 8:00-18:00" style="width: 150px; margin-right: 10px;"></el-input>
              <el-input v-model="segment.fee" placeholder="费用" style="width: 100px; margin-right: 10px;">
                <template #prepend>¥</template>
              </el-input>
              <el-button type="danger" size="small" @click="removeSegment(index)">删除</el-button>
            </div>
            <el-button type="primary" size="small" @click="addSegment">添加时间段</el-button>
          </el-form-item>
        </template>
        
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="启用">启用</el-radio>
            <el-radio label="禁用">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="生效时间">
          <el-date-picker
            v-model="form.effectiveTime"
            type="datetime"
            placeholder="选择生效时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
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
  name: 'ParkingFees',
  setup() {
    const feeStandards = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const dialogVisible = ref(false)
    const dialogTitle = ref('新增收费标准')
    const filterForm = ref({
      area: '',
      status: ''
    })
    const form = ref({
      id: null,
      name: '',
      area: '',
      carType: '临时车',
      billingType: '按时计费',
      firstUnit: '小时',
      firstFee: '',
      laterUnit: '小时',
      laterFee: '',
      dailyCap: '',
      fixedFee: '',
      segments: [
        { timeRange: '', fee: '' }
      ],
      status: '启用',
      effectiveTime: ''
    })
    
    // 模拟数据
    const mockData = [
      {
        id: 1,
        name: '标准临时车计费',
        area: 'A',
        carType: '临时车',
        billingType: '按时计费',
        firstUnit: '小时',
        firstFee: '5',
        laterUnit: '小时',
        laterFee: '3',
        dailyCap: '30',
        status: '启用',
        effectiveTime: '2023-01-01 00:00:00'
      },
      {
        id: 2,
        name: 'VIP区域计费',
        area: 'B',
        carType: '临时车',
        billingType: '分段计费',
        segments: [
          { timeRange: '8:00-18:00', fee: '10' },
          { timeRange: '18:00-8:00', fee: '5' }
        ],
        status: '启用',
        effectiveTime: '2023-02-01 00:00:00'
      },
      {
        id: 3,
        name: '月卡费用',
        area: '',
        carType: '月租车',
        billingType: '按次计费',
        fixedFee: '300',
        status: '启用',
        effectiveTime: '2023-01-01 00:00:00'
      }
    ]
    
    const fetchFeeStandards = () => {
      // 模拟API请求
      setTimeout(() => {
        feeStandards.value = mockData
        total.value = mockData.length
      }, 500)
    }
    
    const getBillingType = (row) => {
      switch (row.billingType) {
        case '按时计费': return '按时计费'
        case '按次计费': return '按次计费'
        case '分段计费': return '分段计费'
        default: return '未知'
      }
    }
    
    const handleAdd = () => {
      dialogTitle.value = '新增收费标准'
      form.value = {
        id: null,
        name: '',
        area: '',
        carType: '临时车',
        billingType: '按时计费',
        firstUnit: '小时',
        firstFee: '',
        laterUnit: '小时',
        laterFee: '',
        dailyCap: '',
        fixedFee: '',
        segments: [
          { timeRange: '', fee: '' }
        ],
        status: '启用',
        effectiveTime: ''
      }
      dialogVisible.value = true
    }
    
    const handleEdit = (row) => {
      dialogTitle.value = '编辑收费标准'
      form.value = { ...row }
      if (!form.value.segments || form.value.segments.length === 0) {
        form.value.segments = [{ timeRange: '', fee: '' }]
      }
      dialogVisible.value = true
    }
    
    const handleChangeStatus = (row) => {
      const newStatus = row.status === '启用' ? '禁用' : '启用'
      const action = newStatus === '启用' ? '启用' : '禁用'
      
      ElMessageBox.confirm(
        `确定要${action}收费标准 "${row.name}" 吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        row.status = newStatus
        ElMessage.success(`${action}成功`)
      }).catch(() => {
        ElMessage.info(`已取消${action}`)
      })
    }
    
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除收费标准 "${row.name}" 吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        ElMessage.success('删除成功')
        fetchFeeStandards()
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const handleBillingTypeChange = () => {
      // 重置相关字段
      if (form.value.billingType === '按时计费') {
        form.value.firstUnit = '小时'
        form.value.firstFee = ''
        form.value.laterUnit = '小时'
        form.value.laterFee = ''
        form.value.dailyCap = ''
      } else if (form.value.billingType === '按次计费') {
        form.value.fixedFee = ''
      } else if (form.value.billingType === '分段计费') {
        form.value.segments = [{ timeRange: '', fee: '' }]
      }
    }
    
    const addSegment = () => {
      form.value.segments.push({ timeRange: '', fee: '' })
    }
    
    const removeSegment = (index) => {
      if (form.value.segments.length > 1) {
        form.value.segments.splice(index, 1)
      } else {
        ElMessage.warning('至少保留一个时间段')
      }
    }
    
    const handleSubmit = () => {
      if (!form.value.name) {
        ElMessage.error('请填写标准名称')
        return
      }
      
      // 验证不同计费方式的必填字段
      if (form.value.billingType === '按时计费') {
        if (!form.value.firstFee || !form.value.laterFee) {
          ElMessage.error('请填写完整的费用信息')
          return
        }
      } else if (form.value.billingType === '按次计费') {
        if (!form.value.fixedFee) {
          ElMessage.error('请填写固定费用')
          return
        }
      } else if (form.value.billingType === '分段计费') {
        const validSegments = form.value.segments.every(segment => segment.timeRange && segment.fee)
        if (!validSegments) {
          ElMessage.error('请填写完整的时间段信息')
          return
        }
      }
      
      // 模拟提交
      setTimeout(() => {
        ElMessage.success(dialogTitle.value === '新增收费标准' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        fetchFeeStandards()
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
      fetchFeeStandards()
    }
    
    const handleSizeChange = (val) => {
      pageSize.value = val
      fetchFeeStandards()
    }
    
    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchFeeStandards()
    }
    
    onMounted(() => {
      fetchFeeStandards()
    })
    
    return {
      feeStandards,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      dialogTitle,
      filterForm,
      form,
      getBillingType,
      handleAdd,
      handleEdit,
      handleChangeStatus,
      handleDelete,
      handleBillingTypeChange,
      addSegment,
      removeSegment,
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
.parking-fees-container {
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

.segment-item {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}
</style>