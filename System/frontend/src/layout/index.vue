<template>
  <div class="layout-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="200px" class="sidebar">
        <div class="logo-container">
          <h2>停车场管理系统</h2>
        </div>
        <el-menu
          :default-active="activeMenu"
          class="sidebar-menu"
          background-color="#304156"
          text-color="#bfcbd9"
          active-text-color="#409EFF"
          :collapse="isCollapse"
          :router="false"
        >
          <template v-for="route in menuRoutes" :key="route.path">
            <!-- 仪表盘特殊处理：直接显示为顶级菜单项 -->
            <el-menu-item v-if="route.name === 'Dashboard'" :index="route.path" @click="handleMenuClick(route.path)">
              <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
            
            <!-- 没有子菜单的其他路由 -->
            <el-menu-item v-else-if="!route.children || route.children.length === 0" :index="route.path" @click="handleMenuClick(route.path)">
              <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
              <template #title>{{ route.meta?.title }}</template>
            </el-menu-item>
            
            <!-- 有子菜单的其他路由 -->
            <el-sub-menu v-else :index="route.path">
              <template #title>
                <el-icon v-if="route.meta?.icon"><component :is="route.meta.icon" /></el-icon>
                <span>{{ route.meta?.title }}</span>
              </template>
              
              <el-menu-item
                v-for="child in route.children"
                :key="child.path"
                :index="child.path === '' ? route.path : route.path + '/' + child.path"
                @click="handleMenuClick(child.path === '' ? route.path : route.path + '/' + child.path)"
              >
                <el-icon v-if="child.meta?.icon"><component :is="child.meta.icon" /></el-icon>
                <template #title>{{ child.meta?.title }}</template>
              </el-menu-item>
            </el-sub-menu>
          </template>
        </el-menu>
      </el-aside>
      
      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航栏 -->
        <el-header class="header">
          <div class="header-left">
            <el-icon class="collapse-btn" @click="toggleSidebar">
              <Fold v-if="!isCollapse" />
              <Expand v-else />
            </el-icon>
            <breadcrumb />
          </div>
          
          <div class="header-right">
            <el-dropdown trigger="click" @command="handleCommand">
              <div class="avatar-container">
                <el-avatar :size="30" :src="userStore.avatar || ''">
                  {{ userStore.name?.charAt(0) || 'A' }}
                </el-avatar>
                <span class="username">{{ userStore.name || '管理员' }}</span>
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </div>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>
        
        <!-- 主体内容 -->
        <el-main class="main-content">
          <router-view v-slot="{ Component, route }">
            <transition name="fade-transform" mode="out-in">
              <keep-alive :include="['ParkingSpaces', 'ParkingStatus', 'ParkingRecords', 'ParkingFees', 'ParkingStatistics']">
                <component :is="Component" :key="route.path" v-if="Component" />
              </keep-alive>
            </transition>
          </router-view>
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage, ElMessageBox } from 'element-plus'
import Breadcrumb from './components/Breadcrumb.vue'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// 侧边栏折叠状态
const isCollapse = ref(false)

// 当前激活的菜单
const activeMenu = computed(() => {
  const { meta, path } = route
  if (meta.activeMenu) {
    return meta.activeMenu
  }
  return path
})

// 菜单路由
const menuRoutes = computed(() => {
  return router.options.routes.filter(route => 
    !route.meta?.hidden &&
    route.path !== '/login' &&
    route.meta?.title
  )
})

// 处理菜单点击
const handleMenuClick = (path) => {
  if (path.startsWith('/finance/')) {
    ElMessage.warning('财务管理功能待接入财务APi')
    return
  }

  if (route.path !== path) {
    router.push(path).catch(err => {
      console.error('路由跳转错误:', err)
    })
  }
}

// 监听路由变化，确保菜单状态正确
watch(
  () => route.path,
  (newPath) => {
    // 路由变化时，可以在这里添加额外的逻辑
    console.log('路由变化:', newPath)
  },
  { immediate: true }
)

// 切换侧边栏
const toggleSidebar = () => {
  isCollapse.value = !isCollapse.value
}

// 处理下拉菜单命令
const handleCommand = (command) => {
  switch (command) {
    case 'profile':
      // 跳转到个人中心
      router.push('/profile')
      break
    case 'logout':
      // 退出登录
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        userStore.logout().then(() => {
          router.push('/login')
        })
      }).catch(() => {})
      break
  }
}
</script>

<style lang="scss" scoped>
.layout-container {
  height: 100vh;
  
  .sidebar {
    background-color: #304156;
    transition: width 0.3s;
    padding: 0;
    --el-aside-padding: 0;
    
    .logo-container {
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #2b2f3a;
      
      h2 {
        color: #fff;
        font-size: 16px;
        margin: 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
    
    .sidebar-menu {
      border-right: none;
      height: calc(100vh - 50px);
      overflow-y: auto;
    }
  }
  
  .header {
    background-color: #fff;
    box-shadow: 0 1px 4px rgba(0, 21, 41, 0.08);
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    
    .header-left {
      display: flex;
      align-items: center;
      
      .collapse-btn {
        font-size: 20px;
        cursor: pointer;
        margin-right: 20px;
      }
    }
    
    .header-right {
      .avatar-container {
        display: flex;
        align-items: center;
        cursor: pointer;
        
        .username {
          margin: 0 8px;
        }
      }
    }
  }
  
  .main-content {
    background-color: #f0f2f5;
    padding: 20px;
    overflow-y: auto;
  }
}

// 路由过渡动画
.fade-transform-enter-active,
.fade-transform-leave-active {
  transition: all 0.3s;
}

.fade-transform-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.fade-transform-leave-to {
  opacity: 0;
  transform: translateX(30px);
}
</style>
