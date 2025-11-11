<template>
  <div v-if="hasError" class="error-boundary">
    <el-result
      icon="error"
      title="页面出错了"
      :sub-title="errorMessage"
    >
      <template #extra>
        <el-button type="primary" @click="handleReload">重新加载</el-button>
        <el-button @click="handleBack">返回上一页</el-button>
      </template>
    </el-result>
  </div>
  <slot v-else></slot>
</template>

<script>
import { ref, onErrorCaptured } from 'vue'
import { useRouter } from 'vue-router'

export default {
  name: 'ErrorBoundary',
  setup() {
    const hasError = ref(false)
    const errorMessage = ref('')
    const router = useRouter()
    
    onErrorCaptured((error) => {
      console.error('捕获到错误:', error)
      hasError.value = true
      errorMessage.value = error.message || '未知错误'
      
      // 上报错误到监控系统（如果需要）
      // reportError(error)
      
      // 返回false阻止错误继续向上传播
      return false
    })
    
    const handleReload = () => {
      hasError.value = false
      errorMessage.value = ''
      // 重新加载当前页面
      window.location.reload()
    }
    
    const handleBack = () => {
      hasError.value = false
      errorMessage.value = ''
      // 返回上一页
      router.go(-1)
    }
    
    return {
      hasError,
      errorMessage,
      handleReload,
      handleBack
    }
  }
}
</script>

<style scoped>
.error-boundary {
  padding: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
}
</style>