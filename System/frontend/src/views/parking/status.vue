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
              <el-option label="A区" value="A" />
              <el-option label="B区" value="B" />
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
              <el-option label="预留" value="reserved" />
              <el-option label="维修中" value="maintenance" />
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
          <div class="area-section" v-for="area in parkingAreas" :key="area.id">
            <h3>{{ area.name }}</h3>
            <div class="parking-grid">
              <div 
                v-for="space in area.spaces" 
                :key="space.id"
                :class="['parking-space', space.status, { 'selected': selectedSpace === space.id }]"
                @click="selectSpace(space)"
                :title="`${space.number} - ${getStatusText(space.status)}`"
              >
                {{ space.number }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-details" v-if="selectedSpaceInfo">
        <el-card shadow="hover">
          <template #header>
            <span>车位详情 - {{ selectedSpaceInfo.number }}</span>
          </template>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="车位编号">{{ selectedSpaceInfo.number }}</el-descriptions-item>
            <el-descriptions-item label="所在区域">{{ selectedSpaceInfo.area }}</el-descriptions-item>
            <el-descriptions-item label="车位类型">{{ selectedSpaceInfo.type }}</el-descriptions-item>
            <el-descriptions-item label="当前状态">
              <el-tag :type="getStatusType(selectedSpaceInfo.status)">{{ getStatusText(selectedSpaceInfo.status) }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="车牌号" v-if="selectedSpaceInfo.plateNumber">{{ selectedSpaceInfo.plateNumber }}</el-descriptions-item>
            <el-descriptions-item label="入场时间" v-if="selectedSpaceInfo.entryTime">{{ selectedSpaceInfo.entryTime }}</el-descriptions-item>
            <el-descriptions-item label="预计费用" v-if="selectedSpaceInfo.estimatedFee">{{ selectedSpaceInfo.estimatedFee }}元</el-descriptions-item>
            <el-descriptions-item label="停车时长" v-if="selectedSpaceInfo.duration">{{ selectedSpaceInfo.duration }}</el-descriptions-item>
          </el-descriptions>
        </el-card>
      </div>
    </el-card>
  </div>
</template>

<script>
import { ref, reactive, onMounted } from 'vue'
import { Refresh } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'

export default {
  name: 'ParkingStatus',
  components: {
    Refresh
  },
  setup() {
    const loading = ref(false)
    const selectedSpace = ref(null)
    const selectedSpaceInfo = ref(null)
    
    const statusData = ref({
      total: 200,
      occupied: 150,
      available: 45,
      reserved: 3,
      maintenance: 2,
      occupancyRate: 75
    })
    
    const filterForm = reactive({
      area: '',
      type: '',
      status: ''
    })
    
    const parkingAreas = ref([
      {
        id: 'A',
        name: 'A区',
        spaces: []
      },
      {
        id: 'B',
        name: 'B区',
        spaces: []
      }
    ])
    
    // 生成模拟车位数据
    const generateParkingSpaces = () => {
      const statuses = ['available', 'occupied', 'reserved', 'maintenance']
      const types = ['normal', 'charging', 'accessible', 'vip']
      const plateNumbers = ['京A12345', '京B67890', '京C11111', '京D22222', '京E33333', '京F44444', '京G55555', '京H66666']
      
      parkingAreas.value.forEach(area => {
        area.spaces = []
        // A区55个车位，B区105个车位
        const spaceCount = area.id === 'A' ? 55 : 105
        
        for (let i = 1; i <= spaceCount; i++) {
          const status = statuses[Math.floor(Math.random() * statuses.length)]
          const type = types[Math.floor(Math.random() * types.length)]
          const spaceNumber = `${area.id}${i.toString().padStart(3, '0')}`
          
          const space = {
            id: `${area.id}-${i}`,
            number: spaceNumber,
            area: area.name,
            status: status,
            type: type,
            plateNumber: status === 'occupied' ? plateNumbers[Math.floor(Math.random() * plateNumbers.length)] : null,
            entryTime: status === 'occupied' ? generateRandomTime() : null,
            estimatedFee: status === 'occupied' ? (Math.random() * 50 + 5).toFixed(2) : null,
            duration: status === 'occupied' ? generateRandomDuration() : null
          }
          
          area.spaces.push(space)
        }
        
        // 打印调试信息
        console.log(`${area.id}区车位数量:`, area.spaces.length)
      })
    }
    
    // 生成随机时间
    const generateRandomTime = () => {
      const hours = Math.floor(Math.random() * 5) + 1
      const minutes = Math.floor(Math.random() * 60)
      return `${hours}小时${minutes}分钟前`
    }
    
    // 生成随机停车时长
    const generateRandomDuration = () => {
      const hours = Math.floor(Math.random() * 5) + 1
      const minutes = Math.floor(Math.random() * 60)
      return `${hours}小时${minutes}分钟`
    }
    
    // 选择车位
    const selectSpace = (space) => {
      selectedSpace.value = space.id
      selectedSpaceInfo.value = space
    }
    
    // 刷新数据
    const refreshData = async () => {
      loading.value = true
      try {
        // 获取所有停车场数据
        const response = await request.get('/admin/parking/spaces?limit=1000')
        
        if (response.success) {
          const spaces = response.data.spaces
          
          // 按区域分组车位
          const areas = {
            'A': { id: 'A', name: 'A区', spaces: [] },
            'B': { id: 'B', name: 'B区', spaces: [] }
          }
          
          // 处理车位数据
          spaces.forEach(space => {
            // 提取区域信息，从spaceId或area字段
            let areaId = 'A' // 默认区域
            if (space.area) {
              // 处理"A区"、"B区"这样的格式
              const areaChar = space.area.substring(0, 1).toUpperCase()
              if (areaChar === 'A' || areaChar === 'B') {
                areaId = areaChar
              }
            } else if (space.spaceId) {
              // 从spaceId中提取区域信息
              const spaceIdStr = space.spaceId.toString()
              // 如果spaceId是数字，根据数字范围判断区域
              const spaceNum = parseInt(spaceIdStr)
              if (!isNaN(spaceNum)) {
                // 根据之前的导入数据，1-55是A区，56-113是B区
                if (spaceNum >= 56) {
                  areaId = 'B'
                } else {
                  areaId = 'A'
                }
              } else {
                // 如果spaceId包含字母，取第一个字母
                const firstChar = spaceIdStr.substring(0, 1).toUpperCase()
                if (firstChar === 'A' || firstChar === 'B') {
                  areaId = firstChar
                }
              }
            }
            
            // 只处理A区和B区的车位，忽略其他区域
            if (!areas[areaId]) {
              console.log(`跳过非A区和B区的车位: ${space.spaceId}, 区域: ${areaId}`)
              return // 跳过非A区和B区的车位
            }
            
            // 转换状态
            let status = 'available'
            if (space.status === 'occupied' || space.isOccupied) {
              status = 'occupied'
            }
            
            // 转换车位类型
            let type = 'normal'
            if (space.type === 'charging' || space.type === '充电车位') {
              type = 'charging'
            } else if (space.type === 'accessible' || space.type === '无障碍车位') {
              type = 'accessible'
            } else if (space.type === 'vip' || space.type === 'VIP车位') {
              type = 'vip'
            }
            
            // 提取车位编号
            let spaceNumber = space.spaceId || space.spaceNumber || `${areaId}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`
            
            // 创建车位对象
            const parkingSpace = {
              id: space._id || space.id,
              number: spaceNumber,
              area: areas[areaId].name,
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
          console.log('A区车位数量:', areas['A'].spaces.length)
          console.log('B区车位数量:', areas['B'].spaces.length)
          console.log('A区车位:', areas['A'].spaces.slice(0, 5))
          
          // 更新停车区域数据
          parkingAreas.value = Object.values(areas)
          
          // 对每个区域的车位按spaceId进行排序
          parkingAreas.value.forEach(area => {
            area.spaces.sort((a, b) => {
              // 提取数字部分进行比较
              const numA = parseInt(a.number.replace(/\D/g, ''))
              const numB = parseInt(b.number.replace(/\D/g, ''))
              return numA - numB
            })
          })
          
          // 更新统计数据
          updateStatusData()
        } else {
          ElMessage.error('获取车位数据失败')
        }
      } catch (error) {
        console.error('刷新数据错误:', error)
        ElMessage.error('刷新数据错误')
      } finally {
        loading.value = false
      }
    }
    
    // 更新状态数据
    const updateStatusData = () => {
      let total = 0
      let occupied = 0
      let available = 0
      let reserved = 0
      let maintenance = 0
      
      parkingAreas.value.forEach(area => {
        area.spaces.forEach(space => {
          total++
          if (space.status === 'occupied') occupied++
          else if (space.status === 'available') available++
          else if (space.status === 'reserved') reserved++
          else if (space.status === 'maintenance') maintenance++
        })
      })
      
      statusData.value = {
        total,
        occupied,
        available,
        reserved,
        maintenance,
        occupancyRate: Math.round((occupied / total) * 100)
      }
    }
    
    // 筛选
    const handleFilter = () => {
      // 这里应该根据筛选条件过滤车位
      console.log('筛选条件:', filterForm)
    }
    
    // 重置筛选
    const resetFilter = () => {
      filterForm.area = ''
      filterForm.type = ''
      filterForm.status = ''
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
      // 先生成模拟数据
      generateParkingSpaces()
      // 再尝试从API获取真实数据
      refreshData()
    })
    
    return {
      loading,
      selectedSpace,
      selectedSpaceInfo,
      statusData,
      filterForm,
      parkingAreas,
      selectSpace,
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