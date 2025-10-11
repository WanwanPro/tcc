<template>
  <div class="user-list-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>用户列表</span>
          <el-button type="primary" @click="handleAdd">新增用户</el-button>
        </div>
      </template>
      
      <el-table :data="userList" style="width: 100%">
        <el-table-column prop="id" label="ID" width="180" />
        <el-table-column prop="username" label="用户名" width="180" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="role" label="角色" />
        <el-table-column prop="status" label="状态" />
        <el-table-column label="操作" width="180">
          <template #default="scope">
            <el-button size="small" @click="handleEdit(scope.row)">编辑</el-button>
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
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'UserList',
  setup() {
    const userList = ref([])
    const currentPage = ref(1)
    const pageSize = ref(10)
    const total = ref(0)
    
    // 模拟数据
    const mockData = [
      { id: 1, username: 'admin', email: 'admin@example.com', role: '管理员', status: '正常' },
      { id: 2, username: 'user1', email: 'user1@example.com', role: '普通用户', status: '正常' },
      { id: 3, username: 'user2', email: 'user2@example.com', role: '普通用户', status: '禁用' }
    ]
    
    const fetchUserList = () => {
      // 模拟API请求
      setTimeout(() => {
        userList.value = mockData
        total.value = mockData.length
      }, 500)
    }
    
    const handleAdd = () => {
      ElMessage.success('新增用户功能待实现')
    }
    
    const handleEdit = (row) => {
      ElMessage.info(`编辑用户: ${row.username}`)
    }
    
    const handleDelete = (row) => {
      ElMessageBox.confirm(
        `确定要删除用户 ${row.username} 吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        ElMessage.success('删除成功')
        fetchUserList()
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const handleSizeChange = (val) => {
      pageSize.value = val
      fetchUserList()
    }
    
    const handleCurrentChange = (val) => {
      currentPage.value = val
      fetchUserList()
    }
    
    onMounted(() => {
      fetchUserList()
    })
    
    return {
      userList,
      currentPage,
      pageSize,
      total,
      handleAdd,
      handleEdit,
      handleDelete,
      handleSizeChange,
      handleCurrentChange
    }
  }
}
</script>

<style scoped>
.user-list-container {
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