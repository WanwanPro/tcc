<template>
  <div class="user-management">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>用户管理</span>
        <el-button
          style="float: right; padding: 3px 0"
          type="text"
          @click="handleAdd"
        >添加用户</el-button>
      </div>

      <!-- 搜索栏 -->
      <div class="filter-container">
        <el-input
          v-model="listQuery.keyword"
          placeholder="用户名/邮箱/手机号"
          style="width: 200px;"
          class="filter-item"
          @keyup.enter.native="handleFilter"
        />
        <el-select
          v-model="listQuery.role"
          placeholder="角色"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option
            v-for="item in roleOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
        <el-select
          v-model="listQuery.status"
          placeholder="状态"
          clearable
          style="width: 120px"
          class="filter-item"
        >
          <el-option label="启用" value="active" />
          <el-option label="禁用" value="inactive" />
          <el-option label="锁定" value="locked" />
        </el-select>
        <el-button
          v-waves
          class="filter-item"
          type="primary"
          icon="el-icon-search"
          @click="handleFilter"
        >搜索</el-button>
      </div>

      <!-- 用户列表 -->
      <el-table
        v-loading="listLoading"
        :data="list"
        border
        fit
        highlight-current-row
        style="width: 100%;"
      >
        <el-table-column
          label="ID"
          prop="id"
          sortable="custom"
          align="center"
          width="65"
        />
        <el-table-column label="用户名" min-width="120px">
          <template slot-scope="{row}">
            <span>{{ row.username }}</span>
          </template>
        </el-table-column>
        <el-table-column label="邮箱" min-width="150px">
          <template slot-scope="{row}">
            <span>{{ row.email }}</span>
          </template>
        </el-table-column>
        <el-table-column label="手机号" width="120px">
          <template slot-scope="{row}">
            <span>{{ row.phone || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色" width="120px">
          <template slot-scope="{row}">
            <el-tag
              v-for="role in row.roles"
              :key="role"
              size="small"
              style="margin-right: 5px;"
            >{{ role }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" class-name="status-col" width="100">
          <template slot-scope="{row}">
            <el-tag :type="row.status | statusFilter">
              {{ row.status === 'active' ? '启用' : row.status === 'inactive' ? '禁用' : '锁定' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="160px">
          <template slot-scope="{row}">
            <span>{{ row.lastLoginTime | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
          <template slot-scope="{row}">
            <el-button type="primary" size="mini" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button v-if="row.status === 'active'" size="mini" type="warning" @click="handleModifyStatus(row, 'inactive')">
              禁用
            </el-button>
            <el-button v-else size="mini" @click="handleModifyStatus(row, 'active')">
              启用
            </el-button>
            <el-button size="mini" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <pagination
        v-show="total>0"
        :total="total"
        :page.sync="listQuery.page"
        :limit.sync="listQuery.limit"
        @pagination="getList"
      />
    </el-card>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="temp.username" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="temp.email" />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="temp.phone" />
        </el-form-item>
        <el-form-item v-if="dialogStatus === 'create'" label="密码" prop="password">
          <el-input v-model="temp.password" type="password" />
        </el-form-item>
        <el-form-item label="角色" prop="roles">
          <el-select v-model="temp.roles" multiple placeholder="请选择角色">
            <el-option
              v-for="item in allRoles"
              :key="item._id"
              :label="item.name"
              :value="item.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="temp.status" class="filter-item" placeholder="请选择">
            <el-option label="启用" value="active" />
            <el-option label="禁用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">确认</el-button>
      </div>
    </el-dialog>

    <!-- 重置密码对话框 -->
    <el-dialog title="重置密码" :visible.sync="resetPasswordVisible">
      <el-form
        ref="resetPasswordForm"
        :rules="resetPasswordRules"
        :model="resetPasswordForm"
        label-position="left"
        label-width="100px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="新密码" prop="password">
          <el-input v-model="resetPasswordForm.password" type="password" />
        </el-form-item>
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input v-model="resetPasswordForm.confirmPassword" type="password" />
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="resetPasswordVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmResetPassword">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getUserList, createUser, updateUser, deleteUser, resetUserPassword, updateUserStatus } from '@/api/user'
import { getRolesList } from '@/api/user'
import waves from '@/directive/waves' // waves directive
import { parseTime } from '@/utils'
import Pagination from '@/components/Pagination' // secondary package based on el-pagination

export default {
  name: 'UserManagement',
  components: { Pagination },
  directives: { waves },
  filters: {
    statusFilter(status) {
      const statusMap = {
        active: 'success',
        inactive: 'info',
        locked: 'danger'
      }
      return statusMap[status]
    },
    parseTime
  },
  data() {
    return {
      list: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        limit: 20,
        keyword: undefined,
        role: undefined,
        status: undefined
      },
      roleOptions: [],
      allRoles: [],
      temp: {
        id: undefined,
        username: '',
        email: '',
        phone: '',
        password: '',
        roles: [],
        status: 'active'
      },
      dialogFormVisible: false,
      dialogStatus: '',
      dialogTitle: '',
      rules: {
        username: [{ required: true, message: '用户名不能为空', trigger: 'blur' }],
        email: [
          { required: true, message: '邮箱不能为空', trigger: 'blur' },
          { type: 'email', message: '请输入正确的邮箱地址', trigger: ['blur', 'change'] }
        ],
        password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
        roles: [{ required: true, message: '请至少选择一个角色', trigger: 'change' }]
      },
      resetPasswordVisible: false,
      resetPasswordForm: {
        userId: undefined,
        password: '',
        confirmPassword: ''
      },
      resetPasswordRules: {
        password: [
          { required: true, message: '新密码不能为空', trigger: 'blur' },
          { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
        ],
        confirmPassword: [
          { required: true, message: '确认密码不能为空', trigger: 'blur' },
          { validator: this.validateConfirmPassword, trigger: 'blur' }
        ]
      }
    }
  },
  created() {
    this.getList()
    this.getRoles()
  },
  methods: {
    getList() {
      this.listLoading = true
      getUserList(this.listQuery).then(response => {
        this.list = response.data.items
        this.total = response.data.total
        this.listLoading = false
      })
    },
    getRoles() {
      getRolesList().then(response => {
        this.allRoles = response.data
        this.roleOptions = this.allRoles.map(role => ({
          value: role.name,
          label: role.name
        }))
      })
    },
    handleFilter() {
      this.listQuery.page = 1
      this.getList()
    },
    handleAdd() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogTitle = '添加用户'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleEdit(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogTitle = '编辑用户'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleDelete(row) {
      this.$confirm('此操作将永久删除该用户, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteUser(row.id).then(() => {
          this.$notify({
            title: '成功',
            message: '删除成功',
            type: 'success',
            duration: 2000
          })
          const index = this.list.findIndex(v => v.id === row.id)
          this.list.splice(index, 1)
        })
      })
    },
    handleModifyStatus(row, status) {
      const statusText = status === 'active' ? '启用' : '禁用'
      updateUserStatus(row.id, { status }).then(() => {
        this.$message({
          message: `${statusText}成功`,
          type: 'success'
        })
        row.status = status
      })
    },
    handleResetPassword(row) {
      this.resetPasswordForm.userId = row.id
      this.resetPasswordForm.password = ''
      this.resetPasswordForm.confirmPassword = ''
      this.resetPasswordVisible = true
      this.$nextTick(() => {
        this.$refs['resetPasswordForm'].clearValidate()
      })
    },
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          createUser(tempData).then(() => {
            this.list.unshift(tempData)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '创建成功',
              type: 'success',
              duration: 2000
            })
            this.getList()
          })
        }
      })
    },
    updateData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          updateUser(tempData.id, tempData).then(() => {
            const index = this.list.findIndex(v => v.id === tempData.id)
            this.list.splice(index, 1, tempData)
            this.dialogFormVisible = false
            this.$notify({
              title: '成功',
              message: '更新成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    confirmResetPassword() {
      this.$refs['resetPasswordForm'].validate((valid) => {
        if (valid) {
          resetUserPassword(this.resetPasswordForm.userId, {
            password: this.resetPasswordForm.password
          }).then(() => {
            this.resetPasswordVisible = false
            this.$notify({
              title: '成功',
              message: '密码重置成功',
              type: 'success',
              duration: 2000
            })
          })
        }
      })
    },
    validateConfirmPassword(rule, value, callback) {
      if (value !== this.resetPasswordForm.password) {
        callback(new Error('两次输入的密码不一致'))
      } else {
        callback()
      }
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        username: '',
        email: '',
        phone: '',
        password: '',
        roles: [],
        status: 'active'
      }
    }
  }
}
</script>

<style scoped>
.filter-container {
  padding-bottom: 10px;
}
.filter-container .filter-item {
  display: inline-block;
  vertical-align: middle;
  margin-bottom: 10px;
  margin-right: 10px;
}
</style>