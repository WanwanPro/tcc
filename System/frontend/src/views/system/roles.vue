<template>
  <div class="role-management">
    <el-card class="box-card">
      <div slot="header" class="clearfix">
        <span>角色管理</span>
        <el-button
          style="float: right; padding: 3px 0"
          type="text"
          @click="handleAdd"
        >添加角色</el-button>
      </div>

      <!-- 角色列表 -->
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
        <el-table-column label="角色名称" min-width="120px">
          <template slot-scope="{row}">
            <span>{{ row.name }}</span>
          </template>
        </el-table-column>
        <el-table-column label="角色描述" min-width="200px">
          <template slot-scope="{row}">
            <span>{{ row.description }}</span>
          </template>
        </el-table-column>
        <el-table-column label="权限" min-width="300px">
          <template slot-scope="{row}">
            <el-tag
              v-for="permission in row.permissions"
              :key="permission"
              size="small"
              style="margin-right: 5px; margin-bottom: 5px;"
            >{{ getPermissionName(permission) }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160px">
          <template slot-scope="{row}">
            <span>{{ row.createdAt | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
          </template>
        </el-table-column>
        <el-table-column label="操作" align="center" width="230" class-name="small-padding fixed-width">
          <template slot-scope="{row}">
            <el-button type="primary" size="mini" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button size="mini" type="danger" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 添加/编辑角色对话框 -->
    <el-dialog :title="dialogTitle" :visible.sync="dialogFormVisible">
      <el-form
        ref="dataForm"
        :rules="rules"
        :model="temp"
        label-position="left"
        label-width="100px"
        style="width: 400px; margin-left:50px;"
      >
        <el-form-item label="角色名称" prop="name">
          <el-input v-model="temp.name" />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input v-model="temp.description" type="textarea" />
        </el-form-item>
        <el-form-item label="权限" prop="permissions">
          <el-checkbox-group v-model="temp.permissions">
            <el-checkbox
              v-for="permission in allPermissions"
              :key="permission.value"
              :label="permission.value"
            >{{ permission.label }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="dialogFormVisible = false">取消</el-button>
        <el-button type="primary" @click="dialogStatus === 'create' ? createData() : updateData()">确认</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { getRolesList, createRole, updateRole, deleteRole } from '@/api/user'
import { parseTime } from '@/utils'

export default {
  name: 'RoleManagement',
  filters: {
    parseTime
  },
  data() {
    return {
      list: null,
      listLoading: true,
      temp: {
        id: undefined,
        name: '',
        description: '',
        permissions: []
      },
      dialogFormVisible: false,
      dialogStatus: '',
      dialogTitle: '',
      rules: {
        name: [{ required: true, message: '角色名称不能为空', trigger: 'blur' }],
        description: [{ required: true, message: '角色描述不能为空', trigger: 'blur' }],
        permissions: [{ type: 'array', required: true, message: '请至少选择一个权限', trigger: 'change' }]
      },
      allPermissions: [
        { value: 'user:view', label: '查看用户' },
        { value: 'user:create', label: '创建用户' },
        { value: 'user:edit', label: '编辑用户' },
        { value: 'user:delete', label: '删除用户' },
        { value: 'role:view', label: '查看角色' },
        { value: 'role:create', label: '创建角色' },
        { value: 'role:edit', label: '编辑角色' },
        { value: 'role:delete', label: '删除角色' },
        { value: 'system:view', label: '查看系统设置' },
        { value: 'system:edit', label: '编辑系统设置' },
        { value: 'parking:view', label: '查看停车场' },
        { value: 'parking:edit', label: '编辑停车场' },
        { value: 'parking:delete', label: '删除停车场' },
        { value: 'order:view', label: '查看订单' },
        { value: 'order:edit', label: '编辑订单' },
        { value: 'order:refund', label: '退款操作' },
        { value: 'finance:view', label: '查看财务数据' },
        { value: 'finance:export', label: '导出财务数据' },
        { value: 'statistics:view', label: '查看统计数据' }
      ]
    }
  },
  created() {
    this.getList()
  },
  methods: {
    getList() {
      this.listLoading = true
      getRolesList().then(response => {
        this.list = response.data
        this.listLoading = false
      })
    },
    handleAdd() {
      this.resetTemp()
      this.dialogStatus = 'create'
      this.dialogTitle = '添加角色'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleEdit(row) {
      this.temp = Object.assign({}, row) // copy obj
      this.dialogStatus = 'update'
      this.dialogTitle = '编辑角色'
      this.dialogFormVisible = true
      this.$nextTick(() => {
        this.$refs['dataForm'].clearValidate()
      })
    },
    handleDelete(row) {
      this.$confirm('此操作将永久删除该角色, 是否继续?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        deleteRole(row.id).then(() => {
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
    createData() {
      this.$refs['dataForm'].validate((valid) => {
        if (valid) {
          const tempData = Object.assign({}, this.temp)
          createRole(tempData).then(() => {
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
          updateRole(tempData.id, tempData).then(() => {
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
    getPermissionName(value) {
      const permission = this.allPermissions.find(p => p.value === value)
      return permission ? permission.label : value
    },
    resetTemp() {
      this.temp = {
        id: undefined,
        name: '',
        description: '',
        permissions: []
      }
    }
  }
}
</script>

<style scoped>
</style>