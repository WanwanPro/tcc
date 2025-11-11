<template>
  <div class="parking-records-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>停车记录管理</span>
          <div>
            <el-button type="primary" @click="handleAdd"><el-icon><Plus /></el-icon> 新增记录</el-button>
            <el-button type="success" @click="handleExport"><el-icon><Download /></el-icon> 导出记录</el-button>
          </div>
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
            <el-button type="primary" @click="handleFilter"><el-icon><Search /></el-icon> 查询</el-button>
            <el-button @click="resetFilter"><el-icon><Refresh /></el-icon> 重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <el-table :data="parkingRecords" style="width: 100%">
        <el-table-column prop="id" label="记录ID" width="100" />
        <el-table-column prop="plateNumber" label="车牌号" width="120">
          <template #default="scope">
            {{ safeGet(scope.row, 'plateNumber', '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="carType" label="车辆类型" width="100">
          <template #default="scope">
            <el-tag :type="safeGet(scope.row, 'carType') === '临时车' ? 'primary' : 'success'">
              {{ safeGet(scope.row, 'carType', '-') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="parkingSpace" label="车位号" width="100">
          <template #default="scope">
            {{ safeGet(scope.row, 'parkingSpace', '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="entryTime" label="入场时间" width="180">
          <template #default="scope">
            {{ safeGet(scope.row, 'entryTime', '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="exitTime" label="出场时间" width="180">
          <template #default="scope">
            {{ safeGet(scope.row, 'exitTime', '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="duration" label="停车时长" width="120">
          <template #default="scope">
            {{ safeGet(scope.row, 'duration', '-') }}
          </template>
        </el-table-column>
        <el-table-column prop="fee" label="费用" width="100">
          <template #default="scope">
            ¥{{ safeGet(scope.row, 'fee', '0.00') }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="safeGet(scope.row, 'status') === '已完成' ? 'success' : 'warning'">
              {{ safeGet(scope.row, 'status', '-') }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="scope">
            <el-button size="small" @click="handleView(scope.row)"><el-icon><View /></el-icon> 查看详情</el-button>
            <el-button size="small" type="primary" @click="handleEdit(scope.row)"><el-icon><Edit /></el-icon> 编辑</el-button>
            <el-button 
              v-if="safeGet(scope.row, 'status') === '停车中'" 
              size="small" 
              type="success" 
              @click="handleCheckout(scope.row)"
            >
              <el-icon><Money /></el-icon> 结算
            </el-button>
            <el-button size="small" type="danger" @click="handleDelete(scope.row)"><el-icon><Delete /></el-icon> 删除</el-button>
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
    
    <!-- 新增/编辑停车记录对话框 -->
    <el-dialog
      v-model="formDialogVisible"
      :title="isEdit ? '编辑停车记录' : '新增停车记录'"
      width="600px"
    >
      <el-form :model="recordForm" :rules="formRules" ref="recordFormRef" label-width="100px">
        <el-form-item label="车牌号" prop="plateNumber">
          <el-input v-model="recordForm.plateNumber" placeholder="请输入车牌号" />
        </el-form-item>
        <el-form-item label="车辆类型" prop="carType">
          <el-select v-model="recordForm.carType" placeholder="请选择车辆类型">
            <el-option label="临时车" value="临时车" />
            <el-option label="月租车" value="月租车" />
            <el-option label="年租车" value="年租车" />
            <el-option label="VIP车" value="VIP车" />
          </el-select>
        </el-form-item>
        <el-form-item label="车位号" prop="parkingSpace">
          <el-input v-model="recordForm.parkingSpace" placeholder="请输入车位号" />
        </el-form-item>
        <el-form-item label="入场时间" prop="entryTime">
          <el-date-picker
            v-model="recordForm.entryTime"
            type="datetime"
            placeholder="选择入场时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="出场时间" prop="exitTime">
          <el-date-picker
            v-model="recordForm.exitTime"
            type="datetime"
            placeholder="选择出场时间"
            format="YYYY-MM-DD HH:mm:ss"
            value-format="YYYY-MM-DD HH:mm:ss"
          />
        </el-form-item>
        <el-form-item label="停车时长" prop="duration">
          <el-input v-model="recordForm.duration" placeholder="请输入停车时长" />
        </el-form-item>
        <el-form-item label="费用" prop="fee">
          <el-input-number v-model="recordForm.fee" :precision="2" :step="0.1" :min="0" />
        </el-form-item>
        <el-form-item label="支付方式" prop="paymentMethod">
          <el-select v-model="recordForm.paymentMethod" placeholder="请选择支付方式">
            <el-option label="现金" value="现金" />
            <el-option label="支付宝" value="支付宝" />
            <el-option label="微信支付" value="微信支付" />
            <el-option label="银行卡" value="银行卡" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-select v-model="recordForm.status" placeholder="请选择状态">
            <el-option label="停车中" value="停车中" />
            <el-option label="已完成" value="已完成" />
            <el-option label="已取消" value="已取消" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="remark">
          <el-input v-model="recordForm.remark" type="textarea" placeholder="请输入备注" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="formDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">保存</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 停车记录详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="停车记录详情"
      width="600px"
    >
      <el-descriptions :column="2" border>
        <el-descriptions-item label="记录ID">{{ safeGet(currentRecord, 'id', '-') }}</el-descriptions-item>
        <el-descriptions-item label="车牌号">{{ safeGet(currentRecord, 'plateNumber', '-') }}</el-descriptions-item>
        <el-descriptions-item label="车辆类型">
          <el-tag :type="safeGet(currentRecord, 'carType') === '临时车' ? 'primary' : 'success'">
            {{ safeGet(currentRecord, 'carType', '-') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="车位号">{{ safeGet(currentRecord, 'parkingSpace', '-') }}</el-descriptions-item>
        <el-descriptions-item label="入场时间">{{ safeGet(currentRecord, 'entryTime', '-') }}</el-descriptions-item>
        <el-descriptions-item label="出场时间">{{ safeGet(currentRecord, 'exitTime', '-') }}</el-descriptions-item>
        <el-descriptions-item label="停车时长">{{ safeGet(currentRecord, 'duration', '-') }}</el-descriptions-item>
        <el-descriptions-item label="费用">¥{{ safeGet(currentRecord, 'fee', '0.00') }}</el-descriptions-item>
        <el-descriptions-item label="支付方式">{{ safeGet(currentRecord, 'paymentMethod', '-') }}</el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="safeGet(currentRecord, 'status') === '已完成' ? 'success' : 'warning'">
            {{ safeGet(currentRecord, 'status', '-') }}
          </el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="备注" :span="2">{{ safeGet(currentRecord, 'remark', '-') }}</el-descriptions-item>
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
          <el-input :value="safeGet(checkoutForm, 'plateNumber', '')" disabled />
        </el-form-item>
        <el-form-item label="车位号">
          <el-input :value="safeGet(checkoutForm, 'parkingSpace', '')" disabled />
        </el-form-item>
        <el-form-item label="入场时间">
          <el-input :value="safeGet(checkoutForm, 'entryTime', '-')" disabled />
        </el-form-item>
        <el-form-item label="停车时长">
          <el-input :value="safeGet(checkoutForm, 'duration', '')" disabled />
        </el-form-item>
        <el-form-item label="应付金额">
          <el-input :value="safeGet(checkoutForm, 'fee', '')" disabled />
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
import { ref, onMounted, onActivated } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { 
  getParkingRecords, 
  getParkingRecordById, 
  createParkingRecord, 
  updateParkingRecord, 
  deleteParkingRecord,
  checkoutParkingRecord,
  exportParkingRecords
} from '@/api/records'
import { safeGet, safeGetArray, safeFormatDate, safeParseNumber } from '@/utils/safeAccess'
import { 
  Search, 
  Download, 
  Refresh, 
  View,
  Plus,
  Edit,
  Delete,
  Money
} from '@element-plus/icons-vue'

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
    
    // 新增/编辑表单控制
    const formDialogVisible = ref(false)
    const isEdit = ref(false)
    const recordFormRef = ref(null)
    const recordForm = ref({
      id: null,
      plateNumber: '',
      carType: '临时车',
      parkingSpace: '',
      entryTime: '',
      exitTime: '',
      duration: '',
      fee: 0,
      paymentMethod: '现金',
      status: '停车中',
      remark: ''
    })

    // 表单验证规则
    const formRules = {
      plateNumber: [
        { required: true, message: '请输入车牌号', trigger: 'blur' },
        { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-HJ-NP-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$/, message: '请输入正确的车牌号', trigger: 'blur' }
      ],
      carType: [
        { required: true, message: '请选择车辆类型', trigger: 'change' }
      ],
      parkingSpace: [
        { required: true, message: '请输入车位号', trigger: 'blur' }
      ],
      entryTime: [
        { required: true, message: '请选择入场时间', trigger: 'change' }
      ],
      status: [
        { required: true, message: '请选择状态', trigger: 'change' }
      ]
    }
    
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
    
    const fetchParkingRecords = async () => {
      try {
        const params = {
          page: currentPage.value,
          limit: pageSize.value,
          status: filterForm.value.status || 'all',
          vehicleNumber: filterForm.value.plateNumber || '',
          startDate: filterForm.value.dateRange && filterForm.value.dateRange[0] ? filterForm.value.dateRange[0] : '',
          endDate: filterForm.value.dateRange && filterForm.value.dateRange[1] ? filterForm.value.dateRange[1] : ''
        }
        
        const response = await getParkingRecords(params)
        
        if (response.success) {
          parkingRecords.value = response.data.records.map(record => ({
            id: record._id,
            transactionId: record.transactionId,
            plateNumber: record.vehicleNumber,
            carType: record.carType || '临时车',
            parkingSpace: record.spaceId ? record.spaceId.spaceId : '-',
            parkingLot: record.lotId ? record.lotId.name : '-',
            entryTime: safeFormatDate(record.entryTime),
            exitTime: record.exitTime ? safeFormatDate(record.exitTime) : '-',
            duration: record.duration ? `${Math.floor(record.duration / 60)}小时${record.duration % 60}分钟` : '-',
            fee: record.amount ? record.amount.toFixed(2) : '0.00',
            paymentMethod: record.paymentMethod || '-',
            status: record.paymentStatus === 'paid' ? '已完成' : (record.exitTime ? '已完成' : '停车中'),
            paymentStatus: record.paymentStatus || 'pending',
            userId: record.userId ? record.userId._id : '',
            userName: record.userId ? record.userId.username : '-',
            userPhone: record.userId ? record.userId.phone : '-',
            notes: record.notes || '-'
          }))
          total.value = response.data.pagination.total
        } else {
          ElMessage.error(response.message || '获取停车记录失败')
        }
      } catch (error) {
        console.error('获取停车记录失败:', error)
        ElMessage.error('获取停车记录失败')
        
        // 如果API调用失败，使用模拟数据
        parkingRecords.value = mockData
        total.value = mockData.length
      }
    }
    
    const handleView = async (row) => {
      if (!row) {
        ElMessage.error('无效的记录数据')
        return
      }
      
      try {
        const response = await getParkingRecordById(row.id)
        
        if (response.success) {
          const record = response.data
          currentRecord.value = {
            id: record._id,
            transactionId: record.transactionId,
            plateNumber: record.vehicleNumber,
            carType: record.carType || '临时车',
            parkingSpace: record.spaceId ? record.spaceId.spaceId : '-',
            parkingLot: record.lotId ? record.lotId.name : '-',
            entryTime: safeFormatDate(record.entryTime),
            exitTime: record.exitTime ? safeFormatDate(record.exitTime) : '-',
            duration: record.duration ? `${Math.floor(record.duration / 60)}小时${record.duration % 60}分钟` : '-',
            fee: record.amount ? record.amount.toFixed(2) : '0.00',
            paymentMethod: record.paymentMethod || '-',
            status: record.paymentStatus === 'paid' ? '已完成' : (record.exitTime ? '已完成' : '停车中'),
            paymentStatus: record.paymentStatus || 'pending',
            userId: record.userId ? record.userId._id : '',
            userName: record.userId ? record.userId.username : '-',
            userPhone: record.userId ? record.userId.phone : '-',
            notes: record.notes || '-'
          }
          detailDialogVisible.value = true
        } else {
          ElMessage.error(response.message || '获取记录详情失败')
        }
      } catch (error) {
        console.error('获取记录详情失败:', error)
        ElMessage.error('获取记录详情失败')
        
        // 如果API调用失败，使用本地数据
        currentRecord.value = { ...row }
        detailDialogVisible.value = true
      }
    }
    
    // 新增记录
    const handleAdd = () => {
      isEdit.value = false
      recordForm.value = {
        id: null,
        plateNumber: '',
        carType: '临时车',
        parkingSpace: '',
        entryTime: '',
        exitTime: '',
        duration: '',
        fee: 0,
        paymentMethod: '现金',
        status: '停车中',
        remark: ''
      }
      formDialogVisible.value = true
    }
    
    // 编辑记录
    const handleEdit = (row) => {
      isEdit.value = true
      recordForm.value = { ...row }
      formDialogVisible.value = true
    }
    
    // 删除记录
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除车牌号为 ${row.plateNumber} 的停车记录吗？`,
        '提示',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      )
        .then(async () => {
          try {
            const response = await deleteParkingRecord(row.id)
            
            if (response.success) {
              ElMessage({
                type: 'success',
                message: '删除成功',
              })
              fetchParkingRecords()
            } else {
              ElMessage.error(response.message || '删除失败')
            }
          } catch (error) {
            console.error('删除记录失败:', error)
            ElMessage.error('删除失败')
          }
        })
        .catch(() => {
          ElMessage({
            type: 'info',
            message: '已取消删除',
          })
        })
    }
    
    // 保存记录
    const handleSave = async () => {
      try {
        const valid = await recordFormRef.value.validate()
        
        if (!valid) {
          return
        }
        
        // 准备提交数据
        const submitData = {
          vehicleNumber: recordForm.value.plateNumber,
          carType: recordForm.value.carType,
          lotId: recordForm.value.lotId || '', // 需要从停车场选择中获取
          spaceId: recordForm.value.spaceId || '', // 需要从停车位选择中获取
          userId: recordForm.value.userId || '', // 需要从用户选择中获取
          entryTime: recordForm.value.entryTime,
          exitTime: recordForm.value.exitTime,
          paymentMethod: recordForm.value.paymentMethod,
          amount: recordForm.value.fee,
          notes: recordForm.value.remark
        }
        
        // 计算停车时长和费用
        if (recordForm.value.entryTime && recordForm.value.exitTime) {
          const entry = new Date(recordForm.value.entryTime)
          const exit = new Date(recordForm.value.exitTime)
          const duration = Math.floor((exit - entry) / (1000 * 60)) // 分钟
          submitData.duration = duration
        }
        
        let response
        if (isEdit.value) {
          response = await updateParkingRecord(recordForm.value.id, submitData)
        } else {
          response = await createParkingRecord(submitData)
        }
        
        if (response.success) {
          ElMessage({
            type: 'success',
            message: isEdit.value ? '更新成功' : '新增成功',
          })
          formDialogVisible.value = false
          fetchParkingRecords()
        } else {
          ElMessage.error(response.message || (isEdit.value ? '更新失败' : '新增失败'))
        }
      } catch (error) {
        console.error('保存记录失败:', error)
        ElMessage.error('保存失败')
      }
    }
    
    const handleCheckout = (row) => {
      if (!row) {
        ElMessage.error('无效的记录数据')
        return
      }
      checkoutForm.value = {
        id: safeGet(row, 'id', null),
        plateNumber: safeGet(row, 'plateNumber', ''),
        parkingSpace: safeGet(row, 'parkingSpace', ''),
        entryTime: safeGet(row, 'entryTime', ''),
        duration: safeGet(row, 'duration', ''),
        fee: safeGet(row, 'fee', ''),
        paymentMethod: ''
      }
      checkoutDialogVisible.value = true
    }
    
    const handleConfirmCheckout = async () => {
      if (!safeGet(checkoutForm.value, 'paymentMethod')) {
        ElMessage.error('请选择支付方式')
        return
      }
      
      try {
        const response = await checkoutParkingRecord(checkoutForm.value.id, {
          paymentMethod: checkoutForm.value.paymentMethod
        })
        
        if (response.success) {
          ElMessage.success('结算成功')
          checkoutDialogVisible.value = false
          fetchParkingRecords()
        } else {
          ElMessage.error(response.message || '结算失败')
        }
      } catch (error) {
        console.error('结算失败:', error)
        ElMessage.error('结算失败')
      }
    }
    
    const handleExport = async () => {
      try {
        // 构建导出参数
        const exportParams = {
          page: 1,
          pageSize: 10000, // 导出所有记录
          plateNumber: filterForm.value.plateNumber || '',
          area: filterForm.value.area || '',
          dateRange: filterForm.value.dateRange || []
        }
        
        const response = await exportParkingRecords(exportParams)
        
        if (response.success) {
          // 创建下载链接
          const url = window.URL.createObjectURL(new Blob([response.data]))
          const link = document.createElement('a')
          link.href = url
          link.setAttribute('download', `停车记录_${new Date().toLocaleDateString()}.xlsx`)
          document.body.appendChild(link)
          link.click()
          link.remove()
          window.URL.revokeObjectURL(url)
          
          ElMessage.success('导出成功')
        } else {
          ElMessage.error(response.message || '导出失败')
        }
      } catch (error) {
        console.error('导出失败:', error)
        ElMessage.error('导出失败')
      }
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
    
    // 获取停车统计数据
    const fetchParkingStats = async () => {
      try {
        const response = await getParkingStats()
        
        if (response.success) {
          // 更新统计数据
          stats.value = {
            totalSpaces: response.data.totalSpaces || 0,
            occupiedSpaces: response.data.occupiedSpaces || 0,
            availableSpaces: response.data.availableSpaces || 0,
            occupancyRate: response.data.occupancyRate || 0,
            todayRevenue: response.data.todayRevenue || 0,
            todayVehicles: response.data.todayVehicles || 0
          }
        } else {
          console.error('获取统计数据失败:', response.message)
          // 使用默认统计数据
          stats.value = {
            totalSpaces: 500,
            occupiedSpaces: 320,
            availableSpaces: 180,
            occupancyRate: 64,
            todayRevenue: 6400,
            todayVehicles: 85
          }
        }
      } catch (error) {
        console.error('获取统计数据失败:', error)
        // 使用默认统计数据
        stats.value = {
          totalSpaces: 500,
          occupiedSpaces: 320,
          availableSpaces: 180,
          occupancyRate: 64,
          todayRevenue: 6400,
          todayVehicles: 85
        }
      }
    }
    
    onMounted(() => {
      fetchParkingRecords()
      fetchParkingStats()
    })
    
    // 添加activated钩子，确保在路由切换时组件能够正确更新
    onActivated(() => {
      fetchParkingRecords()
      fetchParkingStats()
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
      formDialogVisible,
      isEdit,
      recordFormRef,
      recordForm,
      formRules,
      safeGet,
      handleView,
      handleAdd,
      handleEdit,
      handleDelete,
      handleSave,
      handleCheckout,
      handleConfirmCheckout,
      handleExport,
      handleFilter,
      resetFilter,
      handleSizeChange,
      handleCurrentChange,
      Search,
      Download,
      Refresh,
      View,
      Plus,
      Edit,
      Delete,
      Money
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