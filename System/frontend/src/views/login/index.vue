<template>
  <div class="login-container">
    <el-form
      ref="loginFormRef"
      :model="loginForm"
      :rules="loginRules"
      class="login-form"
      autocomplete="on"
      label-position="left"
    >
      <div class="title-container">
        <h3 class="title">智能停车场后台管理系统</h3>
      </div>

      <el-form-item prop="username">
        <el-input
          ref="usernameRef"
          v-model="loginForm.username"
          placeholder="用户名"
          name="username"
          type="text"
          tabindex="1"
          autocomplete="on"
          prefix-icon="User"
        />
      </el-form-item>

      <el-form-item prop="password">
        <el-input
          ref="passwordRef"
          v-model="loginForm.password"
          :type="passwordVisible ? 'text' : 'password'"
          placeholder="密码"
          name="password"
          tabindex="2"
          autocomplete="on"
          prefix-icon="Lock"
          @keyup.enter="handleLogin"
        >
          <template #suffix>
            <el-icon class="cursor-pointer" @click="passwordVisible = !passwordVisible">
              <View v-if="passwordVisible" />
              <Hide v-else />
            </el-icon>
          </template>
        </el-input>
      </el-form-item>

      <el-button
        :loading="loading"
        type="primary"
        style="width:100%;margin-bottom:30px;"
        @click.prevent="handleLogin"
      >
        登录
      </el-button>
    </el-form>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const loginFormRef = ref(null)
const usernameRef = ref(null)
const passwordRef = ref(null)

const loginForm = reactive({
  username: 'admin',
  password: 'admin123'
})

const loginRules = reactive({
  username: [{ required: true, trigger: 'blur', message: '请输入用户名' }],
  password: [{ required: true, trigger: 'blur', message: '请输入密码' }]
})

const passwordVisible = ref(false)
const loading = ref(false)

const handleLogin = () => {
  loginFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        // 先清除可能存在的旧token
        localStorage.removeItem('token')
        
        // 执行登录
        const loginResponse = await userStore.login(loginForm)
        
        // 如果登录响应中已包含用户信息，直接使用，无需再次请求
        if (loginResponse.data && loginResponse.data.user) {
          const userData = loginResponse.data.user
          userStore.name = userData.name || ''
          userStore.avatar = userData.avatar || ''
          userStore.roles = [userData.role] || []
          userStore.permissions = userData.permissions || []
          
          ElMessage.success('登录成功')
          
          // 获取重定向地址，默认跳转到仪表盘
          const redirect = route.query.redirect || '/dashboard'
          router.push(redirect)
        } else {
          // 否则，单独获取用户信息
          ElMessage.success('登录成功')
          
          try {
            // 获取用户信息
            await userStore.getInfo()
            
            // 获取重定向地址，默认跳转到仪表盘
            const redirect = route.query.redirect || '/dashboard'
            router.push(redirect)
          } catch (infoError) {
            console.error('获取用户信息失败:', infoError)
            ElMessage.error('获取用户信息失败，请重新登录')
            // 清除token并重新显示登录表单
            userStore.resetState()
          }
        }
      } catch (error) {
        console.error('登录失败:', error)
        // 显示更具体的错误信息
        const errorMessage = error.response?.data?.message || error.message || '登录失败，请检查用户名和密码'
        ElMessage.error(errorMessage)
      } finally {
        loading.value = false
      }
    }
  })
}

onMounted(() => {
  if (loginForm.username === '') {
    usernameRef.value.focus()
  } else if (loginForm.password === '') {
    passwordRef.value.focus()
  }
})
</script>

<style lang="scss" scoped>
.login-container {
  min-height: 100vh;
  width: 100%;
  background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;

  .login-form {
    width: 420px;
    max-width: 100%;
    padding: 35px;
    margin: 0 20px;
    overflow: hidden;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);

    .title-container {
      position: relative;

      .title {
        font-size: 26px;
        color: #333;
        margin: 0 auto 40px auto;
        text-align: center;
        font-weight: bold;
      }
    }

    .cursor-pointer {
      cursor: pointer;
    }
  }
}
</style>