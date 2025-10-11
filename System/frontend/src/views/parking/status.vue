<template>
  <div class="parking-status">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>实时车位状态</span>
          <el-button type="primary" @click="refreshData" :loading="loading">
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
        </div>
      </template>
      
      <div class="status-overview">
        <el-row :gutter="20">
          <el-col :span="6">
            <div class="status-item total">
              <div class="status-value">{{ statusData.total }}</div>
              <div class="status-label">总车位数</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="status-item occupied">
              <div class="status-value">{{ statusData.occupied }}</div>
              <div class="status-label">已占用</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="status-item available">
              <div class="status-value">{{ statusData.available }}</div>
              <div class="status-label">空闲</div>
            </div>
          </el-col>
          <el-col :span="6">
            <div class="status-item rate">
              <div class="status-value">{{ statusData.occupancyRate }}%</div>
              <div class="status-label">占用率</div>
            </div>
          </el-col>
        </el-row>
      </div>
      
      <div class="filter-container">
        <el-form :inline="true" :model="filterForm" class="filter-form">
          <el-form-item label="区域">
            <el-select v-model="filterForm.area" placeholder="请选择区域" clearable>
              <el-option label="A区" value="A" />
              <el-option label="B区" value="B" />
              <el-option label="C区" value="C" />
              <el-option label="D区" value="D" />
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
            <el-button type="primary" @click="handleFilter">查询</el-button>
            <el-button @click="resetFilter">重置</el-button>
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
              >
                {{ space.number }}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="space-details" v-if="selectedSpaceInfo">
        <el-card>
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
      },
      {
        id: 'C',
        name: 'C区',
        spaces: []
      },
      {
        id: 'D',
        name: 'D区',
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
        const spaceCount = 50 // 每个区域50个车位
        
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
    const refreshData = () => {
      loading.value = true
      setTimeout(() => {
        generateParkingSpaces()
        updateStatusData()
        loading.value = false
      }, 1000)
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
      generateParkingSpaces()
      updateStatusData()
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
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.status-overview {
  margin-bottom: 20px;
}

.status-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
}

.status-item.total {
  background-color: #909399;
}

.status-item.occupied {
  background-color: #F56C6C;
}

.status-item.available {
  background-color: #67C23A;
}

.status-item.rate {
  background-color: #409EFF;
}

.status-value {
  font-size: 28px;
  font-weight: bold;
  margin-bottom: 8px;
}

.status-label {
  font-size: 14px;
}

.filter-container {
  margin-bottom: 20px;
}

.parking-map {
  margin-bottom: 20px;
}

.map-container {
  border: 1px solid #EBEEF5;
  border-radius: 4px;
  padding: 20px;
  background-color: #F5F7FA;
}

.area-section {
  margin-bottom: 30px;
}

.area-section h3 {
  margin-bottom: 15px;
  color: #303133;
}

.parking-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 10px;
}

.parking-space {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.parking-space.available {
  background-color: #67C23A;
  color: white;
}

.parking-space.occupied {
  background-color: #F56C6C;
  color: white;
}

.parking-space.reserved {
  background-color: #E6A23C;
  color: white;
}

.parking-space.maintenance {
  background-color: #909399;
  color: white;
}

.parking-space:hover {
  transform: scale(1.1);
}

.parking-space.selected {
  box-shadow: 0 0 10px 2px #409EFF;
}

.space-details {
  margin-top: 20px;
}
</style>