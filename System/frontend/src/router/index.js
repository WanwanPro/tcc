import { createRouter, createWebHistory } from 'vue-router'
import Layout from '@/layout/index.vue'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '系统仪表盘', icon: 'DataAnalysis' }
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
        name: 'UserList',
        component: () => import('@/views/users/list.vue'),
        meta: { title: '用户列表', icon: 'List' }
      },
      {
        path: 'analysis',
        name: 'UserAnalysis',
        component: () => import('@/views/users/analysis.vue'),
        meta: { title: '用户行为分析', icon: 'TrendCharts' }
      },
      {
        path: 'blacklist',
        name: 'Blacklist',
        component: () => import('@/views/users/blacklist.vue'),
        meta: { title: '黑名单管理', icon: 'CircleClose' }
      }
    ]
  },
  {
    path: '/parking',
    component: Layout,
    redirect: '/parking/spaces',
    meta: { title: '停车位管理', icon: 'Location' },
    children: [
      {
        path: 'spaces',
        name: 'ParkingSpaces',
        component: () => import('@/views/parking/spaces.vue'),
        meta: { title: '车位信息管理', icon: 'Grid' }
      },
      {
        path: 'status',
        name: 'ParkingStatus',
        component: () => import('@/views/parking/status.vue'),
        meta: { title: '车位状态管理', icon: 'Monitor' }
      },
      {
        path: 'statistics',
        name: 'ParkingStatistics',
        component: () => import('@/views/parking/statistics.vue'),
        meta: { title: '车位使用统计', icon: 'PieChart' }
      }
    ]
  },
  {
    path: '/map',
    component: Layout,
    redirect: '/map/editor',
    meta: { title: '地图配置管理', icon: 'Map' },
    children: [
      {
        path: 'editor',
        name: 'MapEditor',
        component: () => import('@/views/map/editor.vue'),
        meta: { title: '停车场地图编辑器', icon: 'Edit' }
      },
      {
        path: 'areas',
        name: 'MapAreas',
        component: () => import('@/views/map/areas.vue'),
        meta: { title: '车位区域划分', icon: 'Crop' }
      },
      {
        path: 'nodes',
        name: 'MapNodes',
        component: () => import('@/views/map/nodes.vue'),
        meta: { title: '导航节点管理', icon: 'Connection' }
      },
      {
        path: 'styles',
        name: 'MapStyles',
        component: () => import('@/views/map/styles.vue'),
        meta: { title: '地图样式配置', icon: 'Brush' }
      }
    ]
  },
  {
    path: '/navigation',
    component: Layout,
    redirect: '/navigation/algorithms',
    meta: { title: '路径规划管理', icon: 'Guide' },
    children: [
      {
        path: 'algorithms',
        name: 'NavigationAlgorithms',
        component: () => import('@/views/navigation/algorithms.vue'),
        meta: { title: '导航算法配置', icon: 'Setting' }
      },
      {
        path: 'rules',
        name: 'NavigationRules',
        component: () => import('@/views/navigation/rules.vue'),
        meta: { title: '路径规则设置', icon: 'List' }
      },
      {
        path: 'history',
        name: 'NavigationHistory',
        component: () => import('@/views/navigation/history.vue'),
        meta: { title: '路径历史记录', icon: 'Clock' }
      }
    ]
  },
  {
    path: '/simulation',
    component: Layout,
    redirect: '/simulation/spaces',
    meta: { title: '数据模拟后台', icon: 'DataBoard' },
    children: [
      {
        path: 'spaces',
        name: 'SimulationSpaces',
        component: () => import('@/views/simulation/spaces.vue'),
        meta: { title: '车位状态模拟', icon: 'Monitor' }
      },
      {
        path: 'users',
        name: 'SimulationUsers',
        component: () => import('@/views/simulation/users.vue'),
        meta: { title: '用户行为模拟', icon: 'User' }
      },
      {
        path: 'data',
        name: 'SimulationData',
        component: () => import('@/views/simulation/data.vue'),
        meta: { title: '模拟数据管理', icon: 'Document' }
      }
    ]
  },
  {
    path: '/finance',
    component: Layout,
    redirect: '/finance/pricing',
    meta: { title: '财务管理', icon: 'Money' },
    children: [
      {
        path: 'pricing',
        name: 'FinancePricing',
        component: () => import('@/views/finance/pricing.vue'),
        meta: { title: '收费标准配置', icon: 'Tickets' }
      },
      {
        path: 'revenue',
        name: 'FinanceRevenue',
        component: () => import('@/views/finance/revenue.vue'),
        meta: { title: '收入统计报表', icon: 'DataLine' }
      },
      {
        path: 'payments',
        name: 'FinancePayments',
        component: () => import('@/views/finance/payments.vue'),
        meta: { title: '支付记录管理', icon: 'CreditCard' }
      },
      {
        path: 'promotions',
        name: 'FinancePromotions',
        component: () => import('@/views/finance/promotions.vue'),
        meta: { title: '优惠活动管理', icon: 'Present' }
      }
    ]
  },
  {
    path: '/system',
    component: Layout,
    redirect: '/system/admins',
    meta: { title: '系统设置', icon: 'Tools' },
    children: [
      {
        path: 'admins',
        name: 'SystemAdmins',
        component: () => import('@/views/system/admins.vue'),
        meta: { title: '管理员账户管理', icon: 'UserFilled' }
      },
      {
        path: 'permissions',
        name: 'SystemPermissions',
        component: () => import('@/views/system/permissions.vue'),
        meta: { title: '权限配置', icon: 'Key' }
      },
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('@/views/system/settings.vue'),
        meta: { title: '系统参数设置', icon: 'Tools' }
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
        path: 'forecast',
        name: 'AnalyticsForecast',
        component: () => import('@/views/analytics/forecast.vue'),
        meta: { title: '流量预测', icon: 'TrendCharts' }
      },
      {
        path: 'reports',
        name: 'AnalyticsReports',
        component: () => import('@/views/analytics/reports.vue'),
        meta: { title: '自定义报表', icon: 'Document' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
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