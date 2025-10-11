<template>
  <div class="parking-records-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>停车记录管理</span>
          <el-button type="primary" @click="handleExport">导出记录</el-button>
        </div>
      </template>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="demo-form-inline">
          <el-form-item label="车牌号">
            <el-input v-model="filterForm.plateNumber" placeholder="请输入车牌号" clearable />
          </el-form-item>
          <el-form-item label="停车区域">
            <el-select v-model="filterForm.area" placeholder="请选择区域" clearable>
              <el-option label="A区" value="A" />
              <el-option label="B区" value="B" />
              <el-option label="C区" value="C" />
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
      
      <el-table :data="parkingRecords" style="width: 100%">
        <el-table-column prop="id" label="记录ID" width="100" />
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column prop="carType" label="车辆类型" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.carType === '临时车' ? 'primary' : 'success'">
              {{ scope.row.carType }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parkingSpace" label="车位号" width="100" />
        <el-table-column prop="entryTime" label="入场时间" width="180" />
        <el-table-column prop="exitTime" label="出场时间" width="180">
          <template #default="scope">
            {{ scope.row.exitTime || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="停车时长" width="120" />
        <el-table-column prop="fee" label="费用" width="100">
          <template #default="scope">
            ¥{{ scope.row.fee }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '已完成' ? 'success' : 'warning'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)">查看详情</el-button>
            <el-button 
              v-if="scope.row.status === '停车中'" 
              size="small" 
              type="primary" 
              @click="handleCheckout(scope.row)"
            >
              结算
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
    
    <!-- 停车记录详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="停车记录详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="记录ID">{{ currentRecord.id }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ currentRecord.plateNumber }}</el-descriptions-item>
        <el-descriptions-item label="车辆类型">
          <el-tag :type="currentRecord.carType === '临时车' ? 'primary' : 'success'">
            {{ currentRecord.carType }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车位号">{{ currentRecord.parkingSpace }}</el-descriptions-item>
        <el-descriptions-item label="入场时间">{{ currentRecord.entryTime }}</el-descriptions-item>
        <el-descriptions-item label="出场时间">{{ currentRecord.exitTime || '-' }}</el-descriptions-item>
        <el-descriptions-item label="停车时长">{{ currentRecord.duration }}</el-descriptions-item>
        <el-descriptions-item label="费用">¥{{ currentRecord.fee }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ currentRecord.paymentMethod || '-' }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="currentRecord.status === '已完成' ? 'success' : 'warning'">
            {{ currentRecord.status }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ currentRecord.remark || '-' }}</el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="detailDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 结算对话框 -->
    <el-dialog
      v-model="checkoutDialogVisible"
      title="停车结算"
      width="500px"
    >
      <el-form :model="checkoutForm" label-width="100px">
        <el-form-item label="车牌号">
          <el-input v-model="checkoutForm.plateNumber" disabled />
        </el-form-item>
        <el-form-item label="车位号">
          <el-input v-model="checkoutForm.parkingSpace" disabled />
        </el-form-item>
        <el-form-item label="入场时间">
          <el-input v-model="checkoutForm.entryTime" disabled />
        </el-form-item>
        <el-form-item label="停车时长">
          <el-input v-model="checkoutForm.duration" disabled />
        </el-form-item>
        <el-form-item label="应付金额">
          <el-input v-model="checkoutForm.fee" disabled />
        </el-form-item>
        <el-form-item label="支付方式">
          <el-select v-model="checkoutForm.paymentMethod" placeholder="请选择支付方式">
            <el-option label="现金" value="现金" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="微信支付" value="微信支付" />
            <el-option label="银行卡" value="银行卡" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="checkoutDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleConfirmCheckout">确认结算</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'ParkingRecords',
  setup() {
    const parkingRecords = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const detailDialogVisible = ref(false)
    const checkoutDialogVisible = ref(false)
    const filterForm = ref({
      plateNumber: '',
      area: '',
      dateRange: []
    })
    const currentRecord = ref({})
    const checkoutForm = ref({
      id: null,
      plateNumber: '',
      parkingSpace: '',
      entryTime: '',
      duration: '',
      fee: '',
      paymentMethod: ''
    })
    
    // 模拟数据
    const mockData = [
      { 
        id: 1, 
        plateNumber: '京A12345', 
        carType: '临时车', 
        parkingSpace: 'A001', 
        entryTime: '2023-06-01 08:30:00', 
        exitTime: '2023-06-01 10:45:00', 
        duration: '2小时15分', 
        fee: '15.00', 
        status: '已完成',
        paymentMethod: '支付宝',
        remark: '无'
      },
      { 
        id: 2, 
        plateNumber: '沪B67890', 
        carType: '月租车', 
        parkingSpace: 'B002', 
        entryTime: '2023-06-01 09:15:00', 
        exitTime: null, 
        duration: '3小时30分', 
        fee: '0.00', 
        status: '停车中',
        paymentMethod: null,
        remark: '月卡用户'
      },
      { 
        id: 3, 
        plateNumber: '粤C11111', 
        carType: '临时车', 
        parkingSpace: 'C003', 
        entryTime: '2023-06-01 07:45:00', 
        exitTime: '2023-06-01 08:30:00', 
        duration: '45分钟', 
        fee: '5.00', 
        status: '已完成',
        paymentMethod: '微信支付',
        remark: '无'
      }
    ]
    
    const fetchParkingRecords = () => {
      // 模拟API请求
      setTimeout(() => {
        parkingRecords.value = mockData
        total.value = mockData.length
      }, 500)
    }
    
    const handleView = (row) => {
      currentRecord.value = { ...row }
      detailDialogVisible.value = true
    }
    
    const handleCheckout = (row) => {
      checkoutForm.value = {
        id: row.id,
        plateNumber: row.plateNumber,
        parkingSpace: row.parkingSpace,
        entryTime: row.entryTime,
        duration: row.duration,
        fee: row.fee,
        paymentMethod: ''
      }
      checkoutDialogVisible.value = true
    }
    
    const handleConfirmCheckout = () => {
      if (!checkoutForm.value.paymentMethod) {
        ElMessage.error('请选择支付方式')
        return
      }
      
      // 模拟结算
      setTimeout(() => {
        ElMessage.success('结算成功')
        checkoutDialogVisible.value = false
        fetchParkingRecords()
      }, 500)
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
        plateNumber: '',
        area: '',
        dateRange: []
      }
      fetchParkingRecords()
    }
    
    const handleSizeChange = (val) => {
      pageSize.value = val
      fetchParkingRecords()
    }
    
    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchParkingRecords()
    }
    
    onMounted(() => {
      fetchParkingRecords()
    })
    
    return {
      parkingRecords,
      currentPage,
      pageSize,
      total,
      detailDialogVisible,
      checkoutDialogVisible,
      filterForm,
      currentRecord,
      checkoutForm,
      handleView,
      handleCheckout,
      handleConfirmCheckout,
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
.parking-records-container {
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