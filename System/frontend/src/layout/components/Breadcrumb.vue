<template>
  <el-breadcrumb class="app-breadcrumb" separator="/">
    <transition-group name="breadcrumb">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="item.path">
        <span
          v-if="index === breadcrumbs.length - 1 || !item.redirect"
          class="no-redirect"
        >{{ item.meta?.title }}</span>
        <a v-else @click.prevent="handleLink(item)">{{ item.meta?.title }}</a>
      </el-breadcrumb-item>
    </transition-group>
  </el-breadcrumb>
</template>

<script setup>
import { ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const breadcrumbs = ref([])

// 获取面包屑导航
const getBreadcrumb = () => {
  let matched = route.matched.filter(item => item.meta && item.meta.title)
  
  // 如果第一个不是首页，则添加首页
  const first = matched[0]
  if (first && first.path !== '/dashboard') {
    matched = [
      { path: '/dashboard', meta: { title: '首页' } },
      ...matched
    ].filter(item => item.meta && item.meta.title)
  }
  
  breadcrumbs.value = matched
}

// 处理链接点击
const handleLink = (item) => {
  const { redirect, path } = item
  if (redirect) {
    router.push(redirect)
    return
  }
  router.push(path)
}

// 监听路由变化
watch(
  () => route.path,
  () => getBreadcrumb(),
  {
    immediate: true
  }
)
</script>

<style lang="scss" scoped>
.app-breadcrumb.el-breadcrumb {
  display: inline-block;
  font-size: 14px;
  line-height: 50px;
  margin-left: 8px;

  .no-redirect {
    color: #97a8be;
    cursor: text;
  }
}
</style>