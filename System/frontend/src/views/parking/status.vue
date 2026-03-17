<template>
  <div class="parking-status">
    <el-card class="main-card" shadow="hover">
      <template #header>
        <div class="card-header">
          <span>实时车位状态</span>
          <el-button type="primary" @click="refreshData" :loading="loading" round>
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <div class="status-overview">
        <div class="status-item total">
          <div class="status-value">{{ statusData.total }}</div>
          <div class="status-label">总车位数</div>
        </div>
        <div class="status-item occupied">
          <div class="status-value">{{ statusData.occupied }}</div>
          <div class="status-label">已占用</div>
        </div>
        <div class="status-item available">
          <div class="status-value">{{ statusData.available }}</div>
          <div class="status-label">空闲</div>
        </div>
        <div class="status-item rate">
          <div class="status-value">{{ statusData.occupancyRate }}%</div>
          <div class="status-label">占用率</div>
        </div>
      </div>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="区域">
            <el-select v-model="filterForm.area" placeholder="请选择区域" clearable>
              <el-option
                v-for="area in areaOptions"
                :key="area.value"
                :label="area.label"
                :value="area.value"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="车位类型">
            <el-select v-model="filterForm.type" placeholder="请选择车位类型" clearable>
              <el-option label="普通车位" value="normal" />
              <el-option label="充电车位" value="charging" />
              <el-option label="无障碍车位" value="accessible" />
              <el-option label="VIP车位" value="vip" />
            </el-select>
          </el-form-item>
          <el-form-item label="状态">
            <el-select v-model="filterForm.status" placeholder="请选择状态" clearable>
              <el-option label="空闲" value="available" />
              <el-option label="已占用" value="occupied" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleFilter" round>查询</el-button>
            <el-button @click="resetFilter" round>重置</el-button>
          </el-form-item>
        </el-form>
      </div>
      
      <div class="parking-map">
        <div class="map-container">
          <div class="area-section" v-for="area in parkingAreas" :key="safeGet(area, 'id', '')">
            <h3>{{ safeGet(area, 'name', '未知区域') }}</h3>
            <div class="parking-grid">
              <div 
                v-for="space in safeGet(area, 'spaces', [])" 
                :key="safeGet(space, 'id', '')"
                :class="['parking-space', safeGet(space, 'status', ''), { 'selected': selectedSpace === safeGet(space, 'id', '') }]"
                @click="selectSpace(space)"
                @dblclick="toggleSpaceStatus(space)"
                :title="`${formatDisplaySpaceNumber(safeGet(space, 'number', ''))} - ${getStatusText(safeGet(space, 'status', ''))} (双击切换状态)`"
              >
                {{ formatDisplaySpaceNumber(safeGet(space, 'number', '')) }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-details" v-if="selectedSpaceInfo">
        <el-card shadow="hover">
          <template #header>
            <span>车位详情 - {{ formatDisplaySpaceNumber(safeGet(selectedSpaceInfo, 'number', '')) }}</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="车位编号">{{ formatDisplaySpaceNumber(safeGet(selectedSpaceInfo, 'number', '')) }}</el-descriptions-item>
            <el-descriptions-item label="所在区域">{{ safeGet(selectedSpaceInfo, 'area', '') }}</el-descriptions-item>
            <el-descriptions-item label="车位类型">{{ safeGet(selectedSpaceInfo, 'type', '') }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(safeGet(selectedSpaceInfo, 'status', ''))">{{ getStatusText(safeGet(selectedSpaceInfo, 'status', '')) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车牌号" v-if="selectedSpaceInfo?.plateNumber">{{ selectedSpaceInfo.plateNumber }}</el-descriptions-item>
            <el-descriptions-item label="入场时间" v-if="selectedSpaceInfo?.entryTime">{{ selectedSpaceInfo.entryTime }}</el-descriptions-item>
            <el-descriptions-item label="预计费用" v-if="selectedSpaceInfo?.estimatedFee">{{ selectedSpaceInfo.estimatedFee }}元</el-descriptions-item>
            <el-descriptions-item label="停车时长" v-if="selectedSpaceInfo?.duration">{{ selectedSpaceInfo.duration }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, computed, onMounted, onActivated, onDeactivated, onBeforeUnmount } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import { safeGet, safeParseNumber } from '@/utils/safeAccess'

export default {
  name: 'ParkingStatus',
  components: {
    Refresh
  },
  setup() {
    const loading = ref(false)
    const selectedSpace = ref(null)
    const selectedSpaceInfo = ref(null)
    const eventSource = ref(null)
    const autoRefreshTimer = ref(null)
    const queuedRefreshTimer = ref(null)

    const AUTO_REFRESH_INTERVAL = 15000
    
    const filterForm = reactive({
      area: '',
      type: '',
      status: ''
    })
    
    const appliedFilters = reactive({
      area: '',
      type: '',
      status: ''
    })

    const allParkingAreas = ref([])

    const normalizeAreaValue = (value) => {
      const rawValue = String(value || '').trim()
      if (!rawValue) return ''

      const matched = rawValue.match(/[A-Za-z]/)
      return matched ? matched[0].toUpperCase() : rawValue.toUpperCase()
    }

    const normalizeStatus = (status) => {
      const rawStatus = String(status || '').trim().toLowerCase()
      const statusMap = {
        available: 'available',
        idle: 'available',
        free: 'available',
        empty: 'available',
        '空闲': 'available',
        occupied: 'occupied',
        busy: 'occupied',
        used: 'occupied',
        '已占用': 'occupied',
        '占用': 'occupied',
        reserved: 'reserved',
        booking: 'reserved',
        '预留': 'reserved',
        maintenance: 'maintenance',
        out_of_order: 'maintenance',
        '维修中': 'maintenance',
        '故障': 'maintenance'
      }

      return statusMap[rawStatus] || 'available'
    }

    const normalizeSpaceType = (type) => {
      const rawType = String(type || '').trim().toLowerCase()
      const typeMap = {
        normal: 'normal',
        '普通车位': 'normal',
        charging: 'charging',
        '充电车位': 'charging',
        accessible: 'accessible',
        '无障碍车位': 'accessible',
        vip: 'vip',
        'vip车位': 'vip'
      }

      return typeMap[rawType] || 'normal'
    }

    const formatDisplaySpaceNumber = (spaceNumber) => {
      const rawValue = String(spaceNumber || '').trim()
      if (!rawValue) return ''

      return rawValue.replace(/^TCC\d+-/i, '')
    }

    const areaOptions = computed(() => (
      allParkingAreas.value
        .map(area => ({
          label: safeGet(area, 'name', ''),
          value: safeGet(area, 'id', '')
        }))
        .filter(area => area.label && area.value)
    ))

    const parkingAreas = computed(() => (
      allParkingAreas.value
        .map(area => {
          const spaces = safeGet(area, 'spaces', []).filter(space => {
            if (appliedFilters.area && safeGet(area, 'id', '') !== appliedFilters.area) {
              return false
            }

            if (appliedFilters.type && safeGet(space, 'type', '') !== appliedFilters.type) {
              return false
            }

            if (appliedFilters.status && safeGet(space, 'status', '') !== appliedFilters.status) {
              return false
            }

            return true
          })

          return {
            ...area,
            spaces
          }
        })
        .filter(area => safeGet(area, 'spaces', []).length > 0)
    ))

    const statusData = computed(() => {
      let total = 0
      let occupied = 0
      let available = 0
      let reserved = 0
      let maintenance = 0

      allParkingAreas.value.forEach(area => {
        const spaces = safeGet(area, 'spaces', [])
        spaces.forEach(space => {
          total++
          if (safeGet(space, 'status') === 'occupied') occupied++
          else if (safeGet(space, 'status') === 'available') available++
          else if (safeGet(space, 'status') === 'reserved') reserved++
          else if (safeGet(space, 'status') === 'maintenance') maintenance++
        })
      })

      return {
        total,
        occupied,
        available,
        reserved,
        maintenance,
        occupancyRate: total > 0 ? Math.round((occupied / total) * 100) : 0
      }
    })

    const queueRefresh = () => {
      if (queuedRefreshTimer.value) {
        clearTimeout(queuedRefreshTimer.value)
      }

      queuedRefreshTimer.value = setTimeout(() => {
        queuedRefreshTimer.value = null
        refreshData()
      }, 400)
    }
    
    // 选择车位
    const selectSpace = (space) => {
      if (!space) return;
      selectedSpace.value = safeGet(space, 'id', '')
      selectedSpaceInfo.value = space
    }
    
    // 切换车位状态
    const toggleSpaceStatus = async (space) => {
      if (!space) return;
      
      try {
        // 确定新状态
        const currentStatus = safeGet(space, 'status', '')
        let newStatus = 'available'
        
        if (currentStatus === 'available') {
          newStatus = 'occupied'
        } else if (currentStatus === 'occupied') {
          newStatus = 'available'
        }
        
        // 调用API更新状态
        const response = await request.put(`/admin/parking/spaces/${safeGet(space, 'id', '')}`, {
          status: newStatus
        })
        
        if (safeGet(response, 'success')) {
          // 更新本地状态
          space.status = newStatus
          
          // 如果是占用状态，添加模拟车牌号和入场时间
          if (newStatus === 'occupied') {
            space.plateNumber = '京A' + Math.floor(Math.random() * 10000).toString().padStart(4, '0')
            space.entryTime = new Date().toLocaleString()
            space.estimatedFee = '0.00'
            space.duration = '0分钟'
          } else {
            // 如果是空闲状态，清除相关信息
            space.plateNumber = null
            space.entryTime = null
            space.estimatedFee = null
            space.duration = null
          }
          
          ElMessage.success(`车位状态已更新为${getStatusText(newStatus)}`)
        } else {
          ElMessage.error(safeGet(response, 'message', '更新车位状态失败'))
        }
      } catch (error) {
        console.error('切换车位状态错误:', error)
        ElMessage.error('切换车位状态失败')
      }
    }
    
    // 刷新数据
    const refreshData = async () => {
      if (loading.value) {
        return
      }

      loading.value = true
      try {
        // 获取所有停车场数据（添加时间戳防止缓存）
        const response = await request.get('/admin/parking/spaces?limit=1000&_t=' + Date.now())
        
        console.log('[车位状态] 原始API响应:', response)
        
        if (safeGet(response, 'success')) {
          // API返回格式：{ success: true, data: { spaces: [...], pagination: {...} } }
          // 或者：{ success: true, data: { items: [...], ... } }
          // 兼容多种格式
          let spaces = []
          
          // 优先使用 data.spaces
          if (response.data && response.data.spaces && Array.isArray(response.data.spaces)) {
            spaces = response.data.spaces
          } 
          // 其次使用 data.items
          else if (response.data && response.data.items && Array.isArray(response.data.items)) {
            spaces = response.data.items
          }
          // 最后尝试用safeGet
          else {
            const spacesFromSafeGet = safeGet(response, 'data.spaces', [])
            const itemsFromSafeGet = safeGet(response, 'data.items', [])
            spaces = Array.isArray(spacesFromSafeGet) && spacesFromSafeGet.length > 0 
              ? spacesFromSafeGet 
              : (Array.isArray(itemsFromSafeGet) && itemsFromSafeGet.length > 0 ? itemsFromSafeGet : [])
          }
          
          const total = response.data?.pagination?.total || response.data?.total || spaces.length
          
          console.log('[车位状态] API返回数据:', {
            success: safeGet(response, 'success'),
            total: total,
            spacesCount: spaces.length,
            firstSpace: spaces[0],
            dataKeys: response.data ? Object.keys(response.data) : [],
            hasSpaces: !!(response.data && response.data.spaces),
            hasItems: !!(response.data && response.data.items),
            spacesType: Array.isArray(spaces) ? 'array' : typeof spaces,
            spacesLength: spaces.length
          })
          
          if (spaces.length === 0) {
            console.warn('[车位状态] 警告：未找到车位数据！', {
              responseData: response.data,
              responseKeys: response ? Object.keys(response) : []
            })
          }
          
          // 按区域分组车位（支持所有区域）
          const areas = {}
          
          // 处理车位数据
          spaces.forEach(space => {
            // 提取区域信息，从spaceId或area字段
            let areaId = 'A' // 默认区域
            if (safeGet(space, 'area')) {
              // 处理"A区"、"B区"、"C区"这样的格式
              areaId = normalizeAreaValue(safeGet(space, 'area', '')) || areaId
            } else if (safeGet(space, 'spaceId')) {
              // 从spaceId中提取区域信息
              const spaceIdStr = safeGet(space, 'spaceId', '').toString()
              // 如果spaceId是数字，根据数字范围判断区域（兼容旧数据）
              const spaceNum = parseInt(spaceIdStr.replace(/\D/g, ''))
              if (!isNaN(spaceNum) && spaceNum > 0) {
                // 根据坐标或编号分配区域
                const y = safeGet(space, 'position.y', 0) || safeGet(space, 'coordinates.y', 0)
                if (y < 400) {
                  areaId = 'A'
                } else if (y < 700) {
                  areaId = 'B'
                } else {
                  areaId = 'C'
                }
              } else {
                // 如果spaceId包含字母，取第一个字母
                const firstChar = spaceIdStr.substring(0, 1).toUpperCase()
                if (/^[A-Z]$/.test(firstChar)) {
                  areaId = firstChar
                }
              }
            }
            
            // 动态创建区域（支持所有区域）
            if (!areas[areaId]) {
              areas[areaId] = { 
                id: areaId, 
                name: `${areaId}区`, 
                spaces: [] 
              }
            }
            
            // 转换状态
            const status = safeGet(space, 'isOccupied')
              ? 'occupied'
              : normalizeStatus(safeGet(space, 'status', ''))
            
            // 转换车位类型
            const type = normalizeSpaceType(safeGet(space, 'type', ''))
            
            // 提取车位编号
            let spaceNumber = safeGet(space, 'spaceId', safeGet(space, 'spaceNumber', `${areaId}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`))
            
            // 创建车位对象
            const parkingSpace = {
              id: safeGet(space, '_id', safeGet(space, 'id', '')),
              number: spaceNumber,
              area: safeGet(areas[areaId], 'name', '未知区域'),
              status: status,
              type: type,
              plateNumber: status === 'occupied' ? '京A' + Math.floor(Math.random() * 10000).toString().padStart(4, '0') : null,
              entryTime: status === 'occupied' ? `${Math.floor(Math.random() * 5) + 1}小时${Math.floor(Math.random() * 60)}分钟前` : null,
              estimatedFee: status === 'occupied' ? (Math.random() * 50 + 5).toFixed(2) : null,
              duration: status === 'occupied' ? `${Math.floor(Math.random() * 5) + 1}小时${Math.floor(Math.random() * 60)}分钟` : null
            }
            
            areas[areaId].spaces.push(parkingSpace)
          })
          
          // 打印调试信息
          console.log('区域统计:', Object.keys(areas).map(areaId => ({
            area: areaId,
            count: areas[areaId].spaces.length
          })))
          
          // 更新停车区域数据（按区域ID排序）
          allParkingAreas.value = Object.values(areas).sort((a, b) => {
            return a.id.localeCompare(b.id)
          })
          
          // 对每个区域的车位按spaceId进行排序
          allParkingAreas.value.forEach(area => {
            if (safeGet(area, 'spaces') && Array.isArray(area.spaces)) {
              area.spaces.sort((a, b) => {
                // 提取数字部分进行比较
                const numA = safeParseNumber(safeGet(a, 'number', '').replace(/\D/g, ''), 0)
                const numB = safeParseNumber(safeGet(b, 'number', '').replace(/\D/g, ''), 0)
                return numA - numB
              })
            }
          })
          
          console.log('总车位:', statusData.value.total)
        } else {
          ElMessage.error(safeGet(response, 'message', '获取车位数据失败'))
        }
      } catch (error) {
        console.error('刷新数据错误:', error)
        ElMessage.error(safeGet(error, 'response.data.message', '刷新数据错误'))
      } finally {
        loading.value = false
      }
    }
    
    // 筛选
    const handleFilter = () => {
      appliedFilters.area = filterForm.area
      appliedFilters.type = filterForm.type
      appliedFilters.status = filterForm.status
    }
    
    // 重置筛选
    const resetFilter = () => {
      filterForm.area = ''
      filterForm.type = ''
      filterForm.status = ''
      appliedFilters.area = ''
      appliedFilters.type = ''
      appliedFilters.status = ''
    }

    const disconnectParkingEventStream = () => {
      if (eventSource.value) {
        eventSource.value.close()
        eventSource.value = null
      }
    }

    const connectParkingEventStream = () => {
      disconnectParkingEventStream()

      const token = localStorage.getItem('token')
      if (!token || typeof EventSource === 'undefined') {
        return
      }

      const streamUrl = `/api/admin/events/parking-spaces?token=${encodeURIComponent(token)}`
      const source = new EventSource(streamUrl)

      source.addEventListener('parking-space-changed', () => {
        queueRefresh()
      })

      source.onerror = () => {
        disconnectParkingEventStream()
      }

      eventSource.value = source
    }

    const startAutoRefresh = () => {
      stopAutoRefresh()
      connectParkingEventStream()
      autoRefreshTimer.value = setInterval(() => {
        refreshData()
      }, AUTO_REFRESH_INTERVAL)
    }

    const stopAutoRefresh = () => {
      if (autoRefreshTimer.value) {
        clearInterval(autoRefreshTimer.value)
        autoRefreshTimer.value = null
      }

      if (queuedRefreshTimer.value) {
        clearTimeout(queuedRefreshTimer.value)
        queuedRefreshTimer.value = null
      }

      disconnectParkingEventStream()
    }
    
    // 获取状态类型
    const getStatusType = (status) => {
      const statusMap = {
        'available': 'success',
        'occupied': 'danger',
        'reserved': 'warning',
        'maintenance': 'info'
      }
      return statusMap[status] || 'info'
    }
    
    // 获取状态文本
    const getStatusText = (status) => {
      const statusMap = {
        'available': '空闲',
        'occupied': '已占用',
        'reserved': '预留',
        'maintenance': '维修中'
      }
      return statusMap[status] || '未知'
    }
    
    onMounted(() => {
      // 直接从API获取真实数据
      refreshData()
      startAutoRefresh()
    })
    
    // 添加activated钩子，确保在路由切换时组件能够正确更新
    onActivated(() => {
      refreshData()
      startAutoRefresh()
    })

    onDeactivated(() => {
      stopAutoRefresh()
    })

    onBeforeUnmount(() => {
      stopAutoRefresh()
    })
    
    return {
      loading,
      selectedSpace,
      selectedSpaceInfo,
      statusData,
      filterForm,
      areaOptions,
      parkingAreas,
      formatDisplaySpaceNumber,
      selectSpace,
      toggleSpaceStatus,
      refreshData,
      handleFilter,
      resetFilter,
      getStatusType,
      getStatusText
    }
  }
}
</script>

<style scoped>
.parking-status {
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
  animation: fadeIn 0.8s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

.main-card {
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  border: none;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
  position: relative;
}

.main-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  opacity: 0;
  transition: opacity 0.6s;
  pointer-events: none;
  z-index: 1;
}

.main-card:hover::before {
  animation: shine 0.8s ease-in-out;
}

.main-card:hover {
  transform: translateY(-8px) rotateX(2deg);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.main-card :deep(.el-card__header) {
  padding: 0;
  border: none;
  background: transparent;
}

.main-card :deep(.el-card__body) {
  padding: 0;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(90deg, #409EFF, #36D1DC);
  color: white;
  font-size: 20px;
  font-weight: 600;
  border-radius: 16px 16px 0 0;
}

.card-header span {
  font-size: 20px;
  font-weight: 600;
  color: white;
}

.status-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  padding: 24px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  margin: 20px 24px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.status-item {
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  transform-style: preserve-3d;
  perspective: 1000px;
  margin-bottom: 0;
}

.status-item::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409EFF, #36D1DC);
}

.status-item::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(45deg) translate(-50%, -50%);
  transition: all 0.6s;
  opacity: 0;
}

.status-item:hover::after {
  animation: shine 0.5s ease-in-out;
}

.status-item:hover {
  transform: translateY(-8px) rotateX(5deg);
  box-shadow: 0 15px 30px rgba(0, 0, 0, 0.15);
}

.status-item.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.status-item.occupied {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
}

.status-item.available {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
  color: white;
}

.status-item.rate {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
}

.status-value {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 8px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.status-label {
  font-size: 16px;
  opacity: 0.9;
  font-weight: 500;
}

.filter-container {
  padding: 0 24px 24px;
  margin-top: 10px;
}

.filter-form {
  background: white;
  padding: 20px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 15px;
  align-items: center;
}

.filter-form :deep(.el-form-item) {
  margin-bottom: 0;
}

.filter-form :deep(.el-select) {
  width: 140px;
}

.parking-map {
  padding: 0 24px 24px;
  margin-top: 20px;
}

.map-container {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  overflow-x: auto;
  width: 100%;
  max-width: 100%;
}

.area-section {
  margin-bottom: 30px;
  width: 100%;
}

.area-section h3 {
  margin-bottom: 15px;
  font-size: 18px;
  color: #303133;
  font-weight: 600;
  position: relative;
  padding-left: 15px;
}

.area-section h3::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 20px;
  background: linear-gradient(135deg, #409EFF, #36D1DC);
  border-radius: 3px;
}

.parking-grid {
  display: grid;
  grid-template-columns: repeat(15, 1fr);
  grid-auto-rows: minmax(40px, auto);
  gap: 12px;
  padding: 15px;
  background: linear-gradient(145deg, #f8f9fa, #e9ecef);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
  overflow: hidden;
}

.parking-space {
  width: 100%;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transform-style: preserve-3d;
  perspective: 1000px;
}

.parking-space::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, rgba(255, 255, 255, 0) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.parking-space::after {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.1) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  transform: rotate(45deg) translate(-50%, -50%);
  transition: all 0.6s;
  opacity: 0;
}

.parking-space:hover::before {
  opacity: 1;
}

.parking-space:hover::after {
  animation: shine 0.5s ease-in-out;
}

@keyframes shine {
  0% {
    transform: rotate(45deg) translate(-200%, -200%);
    opacity: 0;
  }
  50% {
    opacity: 1;
  }
  100% {
    transform: rotate(45deg) translate(200%, 200%);
    opacity: 0;
  }
}

.parking-space:hover {
  transform: translateY(-5px) scale(1.05) rotateX(5deg);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

.parking-space.available {
  background: linear-gradient(135deg, #67C23A, #85CE61);
  color: white;
}

.parking-space.occupied {
  background: linear-gradient(135deg, #F56C6C, #F78989);
  color: white;
}

.parking-space.reserved {
  background: linear-gradient(135deg, #E6A23C, #EEBE77);
  color: white;
}

.parking-space.maintenance {
  background: linear-gradient(135deg, #909399, #B1B3B8);
  color: white;
}

.parking-space.selected {
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.5);
  transform: translateY(-3px) scale(1.05);
}

.space-details {
  padding: 0 24px 24px;
  margin-top: 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.space-details :deep(.el-card) {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  border: none;
  transition: all 0.3s ease;
  transform-style: preserve-3d;
  perspective: 1000px;
  position: relative;
}

.space-details :deep(.el-card)::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    to bottom right,
    rgba(255, 255, 255, 0) 0%,
    rgba(255, 255, 255, 0.05) 50%,
    rgba(255, 255, 255, 0) 100%
  );
  opacity: 0;
  transition: opacity 0.6s;
  pointer-events: none;
  z-index: 1;
}

.space-details :deep(.el-card):hover::before {
  animation: shine 0.8s ease-in-out;
}

.space-details :deep(.el-card):hover {
  transform: translateY(-5px) rotateX(2deg);
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

.space-details :deep(.el-card__header) {
  background: linear-gradient(90deg, #409EFF, #36D1DC);
  color: white;
  font-weight: 600;
  font-size: 18px;
  padding: 16px 20px;
}

.space-details :deep(.el-card__body) {
  padding: 0;
}

.space-details :deep(.el-descriptions) {
  padding: 20px;
}

.space-details :deep(.el-descriptions__body) {
  background: #fafbfc;
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .parking-status {
    padding: 16px;
  }
  
  .status-overview {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .parking-grid {
    grid-template-columns: repeat(12, 1fr);
  }
}

@media (max-width: 992px) {
  .parking-grid {
    grid-template-columns: repeat(10, 1fr);
  }
  
  .status-overview {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .parking-status {
    padding: 12px;
  }
  
  .status-overview {
    grid-template-columns: 1fr;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
    text-align: center;
  }
  
  .filter-form {
    flex-direction: column;
    align-items: stretch;
  }
  
  .parking-grid {
    grid-template-columns: repeat(8, 1fr);
    gap: 8px;
  }
  
  .parking-space {
    font-size: 10px;
    height: 35px;
  }
}

@media (max-width: 576px) {
  .parking-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 6px;
  }
  
  .parking-space {
    font-size: 10px;
    height: 30px;
  }
  
  .status-value {
    font-size: 24px;
  }
  
  .status-label {
    font-size: 14px;
  }
}

/* 滚动条美化 */
.parking-grid::-webkit-scrollbar {
  width: 8px;
}

.parking-grid::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.parking-grid::-webkit-scrollbar-thumb {
  background: linear-gradient(135deg, #409EFF, #36D1DC);
  border-radius: 4px;
}

.parking-grid::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(135deg, #36D1DC, #409EFF);
}

.map-container::-webkit-scrollbar {
  height: 8px;
}

.map-container::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.map-container::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.map-container::-webkit-scrollbar-thumb:hover {
  background: #a8a8a8;
}

/* 动画效果 */
.parking-space {
  animation: fadeInUp 0.5s ease-out forwards;
  opacity: 0;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 为每个车位添加不同的动画延迟，创建波浪效果 */
.parking-space:nth-child(1) { animation-delay: 0.05s; }
.parking-space:nth-child(2) { animation-delay: 0.1s; }
.parking-space:nth-child(3) { animation-delay: 0.15s; }
.parking-space:nth-child(4) { animation-delay: 0.2s; }
.parking-space:nth-child(5) { animation-delay: 0.25s; }
.parking-space:nth-child(n+6) { animation-delay: 0.3s; }
</style>
