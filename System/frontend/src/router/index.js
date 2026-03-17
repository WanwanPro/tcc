import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: Layout,
    meta: { title: '仪表盘', icon: 'DataBoard' },
    children: [
      {
        path: '',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'DataBoard' }
      }
    ]
  },
  {
    path: '/parking',
    name: 'Parking',
    component: Layout,
    redirect: '/parking/status',
    meta: { title: '停车管理', icon: 'Location' },
    children: [
      {
        path: 'status',
        name: 'ParkingStatus',
        component: () => import('@/views/parking/status.vue'),
        meta: { title: '车位状态', icon: 'Monitor' }
      },
      {
        path: 'fees',
        name: 'ParkingFees',
        component: () => import('@/views/parking/fees.vue'),
        meta: { title: '收费标准', icon: 'Money' }
      }
    ]
  },
  {
    path: '/users',
    component: Layout,
    redirect: '/users/list',
    meta: { title: '用户管理', icon: 'User' },
    children: [
      {
        path: 'list',
        name: 'UsersList',
        component: () => import('@/views/users/list.vue'),
        meta: { title: '用户列表', icon: 'User' }
      },
      {
        path: 'analysis',
        name: 'UsersAnalysis',
        component: () => import('@/views/users/analysis.vue'),
        meta: { title: '用户分析', icon: 'DataAnalysis' }
      },
      {
        path: 'blacklist',
        name: 'UsersBlacklist',
        component: () => import('@/views/users/blacklist.vue'),
        meta: { title: '黑名单', icon: 'CircleClose' }
      }
    ]
  },
  {
    path: '/map',
    component: Layout,
    redirect: '/map/config',
    meta: { title: '地图管理', icon: 'Location' },
    children: [
      {
        path: 'config',
        name: 'MapConfig',
        component: () => import('@/views/map/config.vue'),
        meta: { title: '地图配置', icon: 'Setting' }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/settings',
    meta: { title: '系统设置', icon: 'Tools' },
    children: [
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('@/views/system/settings.vue'),
        meta: { title: '系统设置', icon: 'Tools' }
      },
      {
        path: 'logs',
        name: 'SystemLogs',
        component: () => import('@/views/system/logs.vue'),
        meta: { title: '操作日志', icon: 'Document' }
      }
    ]
  },
  {
    path: '/analytics',
    component: Layout,
    redirect: '/analytics/users',
    meta: { title: '数据分析', icon: 'DataAnalysis' },
    children: [
      {
        path: 'users',
        name: 'AnalyticsUsers',
        component: () => import('@/views/analytics/users.vue'),
        meta: { title: '用户行为分析', icon: 'User' }
      },
      {
        path: 'parking',
        name: 'AnalyticsParking',
        component: () => import('@/views/analytics/parking.vue'),
        meta: { title: '车位使用统计', icon: 'Location' }
      },
      {
        path: 'reports',
        name: 'AnalyticsReports',
        component: () => import('@/views/analytics/reports.vue'),
        meta: { title: '自定义报表', icon: 'Document' }
      }
    ]
  },
  {
    path: '/finance',
    component: Layout,
    redirect: '/finance/overview',
    meta: { title: '财务管理', icon: 'Money' },
    children: [
      {
        path: 'overview',
        name: 'FinanceOverview',
        component: () => import('@/views/finance/pending.vue'),
        meta: { title: '财务概览', icon: 'Money' }
      },
      {
        path: 'income',
        name: 'FinanceIncome',
        component: () => import('@/views/finance/pending.vue'),
        meta: { title: '收入管理', icon: 'Money' }
      },
      {
        path: 'expenses',
        name: 'FinanceExpenses',
        component: () => import('@/views/finance/pending.vue'),
        meta: { title: '支出管理', icon: 'Money' }
      },
      {
        path: 'reports',
        name: 'FinanceReports',
        component: () => import('@/views/finance/pending.vue'),
        meta: { title: '财务报表', icon: 'Document' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    } else {
      return { top: 0 }
    }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = to.meta.title ? `${to.meta.title} - 智能停车场后台管理系统` : '智能停车场后台管理系统'
  
  // 简单的登录验证
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    next('/login')
  } else {
    next()
  }
})

export default router
