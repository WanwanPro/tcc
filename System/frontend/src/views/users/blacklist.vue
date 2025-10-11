<template>
  <div class="blacklist-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>黑名单管理</span>
          <el-button type="primary" @click="handleAdd">添加黑名单</el-button>
        </div>
      </template>
      
      <el-table :data="blacklistData" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="plateNumber" label="车牌号" width="120" />
        <el-table-column prop="reason" label="拉黑原因" />
        <el-table-column prop="createTime" label="拉黑时间" width="180" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="scope.row.status === '生效中' ? 'danger' : 'info'">
              {{ scope.row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
            <el-button 
              size="small" 
              :type="scope.row.status === '生效中' ? 'success' : 'warning'" 
              @click="handleChangeStatus(scope.row)"
            >
              {{ scope.row.status === '生效中' ? '解除' : '生效' }}
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
    
    <!-- 添加/编辑黑名单对话框 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="form" label-width="100px">
        <el-form-item label="车牌号">
          <el-input v-model="form.plateNumber" placeholder="请输入车牌号"></el-input>
        </el-form-item>
        <el-form-item label="拉黑原因">
          <el-input type="textarea" v-model="form.reason" placeholder="请输入拉黑原因"></el-input>
        </el-form-item>
        <el-form-item label="状态">
          <el-radio-group v-model="form.status">
            <el-radio label="生效中">生效中</el-radio>
            <el-radio label="已解除">已解除</el-radio>
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
  name: 'Blacklist',
  setup() {
    const blacklistData = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    const dialogVisible = ref(false)
    const dialogTitle = ref('添加黑名单')
    const form = ref({
      id: null,
      plateNumber: '',
      reason: '',
      status: '生效中'
    })
    
    // 模拟数据
    const mockData = [
      { id: 1, plateNumber: '京A12345', reason: '多次未支付停车费', createTime: '2023-10-01 10:30:00', status: '生效中' },
      { id: 2, plateNumber: '沪B67890', reason: '恶意占用他人车位', createTime: '2023-10-05 14:20:00', status: '生效中' },
      { id: 3, plateNumber: '粤C11111', reason: '违规停车', createTime: '2023-09-15 09:15:00', status: '已解除' }
    ]
    
    const fetchBlacklist = () => {
      // 模拟API请求
      setTimeout(() => {
        blacklistData.value = mockData
        total.value = mockData.length
      }, 500)
    }
    
    const handleAdd = () => {
      dialogTitle.value = '添加黑名单'
      form.value = {
        id: null,
        plateNumber: '',
        reason: '',
        status: '生效中'
      }
      dialogVisible.value = true
    }
    
    const handleEdit = (row) => {
      dialogTitle.value = '编辑黑名单'
      form.value = { ...row }
      dialogVisible.value = true
    }
    
    const handleChangeStatus = (row) => {
      const newStatus = row.status === '生效中' ? '已解除' : '生效中'
      const action = newStatus === '生效中' ? '生效' : '解除'
      
      ElMessageBox.confirm(
        `确定要${action}车牌号为 ${row.plateNumber} 的黑名单记录吗?`,
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
        `确定要删除车牌号为 ${row.plateNumber} 的黑名单记录吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        ElMessage.success('删除成功')
        fetchBlacklist()
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const handleSubmit = () => {
      if (!form.value.plateNumber || !form.value.reason) {
        ElMessage.error('请填写完整信息')
        return
      }
      
      // 模拟提交
      setTimeout(() => {
        ElMessage.success(dialogTitle.value === '添加黑名单' ? '添加成功' : '更新成功')
        dialogVisible.value = false
        fetchBlacklist()
      }, 500)
    }
    
    const handleSizeChange = (val) => {
      pageSize.value = val
      fetchBlacklist()
    }
    
    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchBlacklist()
    }
    
    onMounted(() => {
      fetchBlacklist()
    })
    
    return {
      blacklistData,
      currentPage,
      pageSize,
      total,
      dialogVisible,
      dialogTitle,
      form,
      handleAdd,
      handleEdit,
      handleChangeStatus,
      handleDelete,
      handleSubmit,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.blacklist-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  margin-top: 20px;
  display: flex;
  justify-content: center;
}
</style>