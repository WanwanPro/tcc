<template>
  <div class="map-config-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>地图配置管理</span>
          <el-button type="primary" @click="handleSave">保存配置</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础配置" name="basic">
          <el-form :model="basicConfig" label-width="120px">
            <el-form-item label="地图类型">
              <el-radio-group v-model="basicConfig.mapType">
                <el-radio label="normal">标准地图</el-radio>
                <el-radio label="satellite">卫星地图</el-radio>
                <el-radio label="hybrid">混合地图</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="默认中心点">
              <div class="coordinate-input">
                <el-input v-model="basicConfig.center.lat" placeholder="纬度" style="width: 200px;">
                  <template #prepend>纬度</template>
                </el-input>
                <el-input v-model="basicConfig.center.lng" placeholder="经度" style="width: 200px; margin-left: 10px;">
                  <template #prepend>经度</template>
                </el-input>
              </div>
            </el-form-item>
            <el-form-item label="默认缩放级别">
              <el-slider v-model="basicConfig.zoom" :min="1" :max="20" show-input />
            </el-form-item>
            <el-form-item label="最小缩放级别">
              <el-slider v-model="basicConfig.minZoom" :min="1" :max="20" show-input />
            </el-form-item>
            <el-form-item label="最大缩放级别">
              <el-slider v-model="basicConfig.maxZoom" :min="1" :max="20" show-input />
            </el-form-item>
            <el-form-item label="启用路况信息">
              <el-switch v-model="basicConfig.traffic" />
            </el-form-item>
            <el-form-item label="启用3D建筑">
              <el-switch v-model="basicConfig.buildings3d" />
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="区域配置" name="areas">
          <div class="area-list">
            <div v-for="(area, index) in areaConfig" :key="index" class="area-item">
              <el-card>
                <template #header>
                  <div class="area-header">
                    <span>{{ area.name }}</span>
                    <div>
                      <el-button size="small" @click="editArea(index)">编辑</el-button>
                      <el-button size="small" type="danger" @click="deleteArea(index)">删除</el-button>
                    </div>
                  </div>
                </template>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="区域名称">{{ area.name }}</el-descriptions-item>
                  <el-descriptions-item label="区域颜色">
                    <span :style="{ display: 'inline-block', width: '20px', height: '20px', backgroundColor: area.color, verticalAlign: 'middle' }"></span>
                    {{ area.color }}
                  </el-descriptions-item>
                  <el-descriptions-item label="车位数量">{{ area.parkingCount }}</el-descriptions-item>
                  <el-descriptions-item label="区域类型">{{ area.type }}</el-descriptions-item>
                  <el-descriptions-item label="区域坐标" :span="2">
                    {{ area.coordinates.join(', ') }}
                  </el-descriptions-item>
                </el-descriptions>
              </el-card>
            </div>
          </div>
          <div class="area-actions">
            <el-button type="primary" @click="addArea">添加区域</el-button>
          </div>
        </el-tab-pane>
        
        <el-tab-pane label="车位配置" name="parking">
          <div class="parking-list">
            <div v-for="(parking, index) in parkingConfig" :key="index" class="parking-item">
              <el-card>
                <template #header>
                  <div class="parking-header">
                    <span>{{ parking.area }}-{{ parking.number }}</span>
                    <div>
                      <el-button size="small" @click="editParking(index)">编辑</el-button>
                      <el-button size="small" type="danger" @click="deleteParking(index)">删除</el-button>
                    </div>
                  </div>
                </template>
                <el-descriptions :column="2" border>
                  <el-descriptions-item label="车位ID">{{ parking.id }}</el-descriptions-item>
                  <el-descriptions-item label="所属区域">{{ parking.area }}</el-descriptions-item>
                  <el-descriptions-item label="车位号">{{ parking.number }}</el-descriptions-item>
                  <el-descriptions-item label="车位类型">{{ parking.type }}</el-descriptions-item>
                  <el-descriptions-item label="车位坐标" :span="2">
                    纬度: {{ parking.position.lat }}, 经度: {{ parking.position.lng }}
                  </el-descriptions-item>
                  <el-descriptions-item label="图标样式">
                    <el-tag :type="getIconType(parking.icon)">{{ parking.icon }}</el-tag>
                  </el-descriptions-item>
                  <el-descriptions-item label="图标大小">{{ parking.iconSize }}</el-descriptions-item>
                </el-descriptions>
              </el-card>
            </div>
          </div>
          <div class="parking-actions">
            <el-button type="primary" @click="addParking">添加车位</el-button>
            <el-button @click="batchImportParking">批量导入</el-button>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
    
    <!-- 区域编辑对话框 -->
    <el-dialog
      v-model="areaDialogVisible"
      :title="areaDialogTitle"
      width="600px"
    >
      <el-form :model="areaForm" label-width="120px">
        <el-form-item label="区域名称">
          <el-input v-model="areaForm.name" placeholder="请输入区域名称"></el-input>
        </el-form-item>
        <el-form-item label="区域颜色">
          <el-color-picker v-model="areaForm.color" />
        </el-form-item>
        <el-form-item label="车位数量">
          <el-input-number v-model="areaForm.parkingCount" :min="0" />
        </el-form-item>
        <el-form-item label="区域类型">
          <el-select v-model="areaForm.type" placeholder="请选择区域类型">
            <el-option label="普通区域" value="普通区域" />
            <el-option label="VIP区域" value="VIP区域" />
            <el-option label="临时区域" value="临时区域" />
            <el-option label="充电区域" value="充电区域" />
          </el-select>
        </el-form-item>
        <el-form-item label="区域坐标">
          <el-input
            v-model="areaForm.coordinatesText"
            type="textarea"
            :rows="3"
            placeholder="请输入区域坐标，格式: 纬度1,经度1 纬度2,经度2 ..."
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="areaDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleAreaSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 车位编辑对话框 -->
    <el-dialog
      v-model="parkingDialogVisible"
      :title="parkingDialogTitle"
      width="600px"
    >
      <el-form :model="parkingForm" label-width="120px">
        <el-form-item label="车位ID">
          <el-input v-model="parkingForm.id" placeholder="请输入车位ID"></el-input>
        </el-form-item>
        <el-form-item label="所属区域">
          <el-select v-model="parkingForm.area" placeholder="请选择所属区域">
            <el-option
              v-for="area in areaConfig"
              :key="area.name"
              :label="area.name"
              :value="area.name"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="车位号">
          <el-input v-model="parkingForm.number" placeholder="请输入车位号"></el-input>
        </el-form-item>
        <el-form-item label="车位类型">
          <el-select v-model="parkingForm.type" placeholder="请选择车位类型">
            <el-option label="普通车位" value="普通车位" />
            <el-option label="VIP车位" value="VIP车位" />
            <el-option label="充电车位" value="充电车位" />
            <el-option label="无障碍车位" value="无障碍车位" />
          </el-select>
        </el-form-item>
        <el-form-item label="车位坐标">
          <div class="coordinate-input">
            <el-input v-model="parkingForm.position.lat" placeholder="纬度" style="width: 200px;">
              <template #prepend>纬度</template>
            </el-input>
            <el-input v-model="parkingForm.position.lng" placeholder="经度" style="width: 200px; margin-left: 10px;">
              <template #prepend>经度</template>
            </el-input>
          </div>
        </el-form-item>
        <el-form-item label="图标样式">
          <el-select v-model="parkingForm.icon" placeholder="请选择图标样式">
            <el-option label="空闲" value="空闲" />
            <el-option label="占用" value="占用" />
            <el-option label="维修中" value="维修中" />
            <el-option label="预约" value="预约" />
          </el-select>
        </el-form-item>
        <el-form-item label="图标大小">
          <el-input-number v-model="parkingForm.iconSize" :min="10" :max="50" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="parkingDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleParkingSubmit">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

export default {
  name: 'MapConfig',
  setup() {
    const activeTab = ref('basic')
    const basicConfig = ref({
      mapType: 'normal',
      center: {
        lat: '39.9042',
        lng: '116.4074'
      },
      zoom: 15,
      minZoom: 5,
      maxZoom: 18,
      traffic: true,
      buildings3d: false
    })
    const areaConfig = ref([])
    const parkingConfig = ref([])
    const areaDialogVisible = ref(false)
    const areaDialogTitle = ref('添加区域')
    const parkingDialogVisible = ref(false)
    const parkingDialogTitle = ref('添加车位')
    const areaForm = ref({
      name: '',
      color: '#409EFF',
      parkingCount: 0,
      type: '普通区域',
      coordinatesText: '',
      coordinates: []
    })
    const parkingForm = ref({
      id: '',
      area: '',
      number: '',
      type: '普通车位',
      position: {
        lat: '',
        lng: ''
      },
      icon: '空闲',
      iconSize: 25
    })
    
    // 模拟数据
    const mockAreaData = [
      {
        name: 'A区',
        color: '#409EFF',
        parkingCount: 50,
        type: '普通区域',
        coordinates: [
          { lat: '39.9042', lng: '116.4074' },
          { lat: '39.9052', lng: '116.4084' },
          { lat: '39.9042', lng: '116.4094' },
          { lat: '39.9032', lng: '116.4084' }
        ]
      },
      {
        name: 'B区',
        color: '#67C23A',
        parkingCount: 30,
        type: 'VIP区域',
        coordinates: [
          { lat: '39.9022', lng: '116.4064' },
          { lat: '39.9032', lng: '116.4074' },
          { lat: '39.9022', lng: '116.4084' },
          { lat: '39.9012', lng: '116.4074' }
        ]
      }
    ]
    
    const mockParkingData = [
      {
        id: 'A001',
        area: 'A区',
        number: 'A001',
        type: '普通车位',
        position: {
          lat: '39.9042',
          lng: '116.4074'
        },
        icon: '空闲',
        iconSize: 25
      },
      {
        id: 'A002',
        area: 'A区',
        number: 'A002',
        type: '普通车位',
        position: {
          lat: '39.9045',
          lng: '116.4077'
        },
        icon: '占用',
        iconSize: 25
      },
      {
        id: 'B001',
        area: 'B区',
        number: 'B001',
        type: 'VIP车位',
        position: {
          lat: '39.9022',
          lng: '116.4064'
        },
        icon: '空闲',
        iconSize: 25
      }
    ]
    
    const fetchConfig = () => {
      // 模拟API请求
      setTimeout(() => {
        areaConfig.value = mockAreaData
        parkingConfig.value = mockParkingData
      }, 500)
    }
    
    const getIconType = (icon) => {
      switch (icon) {
        case '空闲': return 'success'
        case '占用': return 'danger'
        case '维修中': return 'warning'
        case '预约': return 'info'
        default: return ''
      }
    }
    
    const handleSave = () => {
      // 模拟保存
      setTimeout(() => {
        ElMessage.success('配置保存成功')
      }, 500)
    }
    
    const addArea = () => {
      areaDialogTitle.value = '添加区域'
      areaForm.value = {
        name: '',
        color: '#409EFF',
        parkingCount: 0,
        type: '普通区域',
        coordinatesText: '',
        coordinates: []
      }
      areaDialogVisible.value = true
    }
    
    const editArea = (index) => {
      areaDialogTitle.value = '编辑区域'
      const area = areaConfig.value[index]
      areaForm.value = {
        ...area,
        coordinatesText: area.coordinates.map(coord => `${coord.lat},${coord.lng}`).join(' ')
      }
      areaDialogVisible.value = true
    }
    
    const deleteArea = (index) => {
      const area = areaConfig.value[index]
      ElMessageBox.confirm(
        `确定要删除区域 "${area.name}" 吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        areaConfig.value.splice(index, 1)
        ElMessage.success('删除成功')
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const handleAreaSubmit = () => {
      if (!areaForm.value.name || !areaForm.value.coordinatesText) {
        ElMessage.error('请填写完整信息')
        return
      }
      
      // 解析坐标
      const coordinates = areaForm.value.coordinatesText.split(' ').map(coord => {
        const [lat, lng] = coord.split(',')
        return { lat, lng }
      })
      
      areaForm.value.coordinates = coordinates
      
      // 模拟提交
      setTimeout(() => {
        ElMessage.success(areaDialogTitle.value === '添加区域' ? '添加成功' : '更新成功')
        areaDialogVisible.value = false
        fetchConfig()
      }, 500)
    }
    
    const addParking = () => {
      parkingDialogTitle.value = '添加车位'
      parkingForm.value = {
        id: '',
        area: '',
        number: '',
        type: '普通车位',
        position: {
          lat: '',
          lng: ''
        },
        icon: '空闲',
        iconSize: 25
      }
      parkingDialogVisible.value = true
    }
    
    const editParking = (index) => {
      parkingDialogTitle.value = '编辑车位'
      parkingForm.value = { ...parkingConfig.value[index] }
      parkingDialogVisible.value = true
    }
    
    const deleteParking = (index) => {
      const parking = parkingConfig.value[index]
      ElMessageBox.confirm(
        `确定要删除车位 "${parking.area}-${parking.number}" 吗?`,
        '警告',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
        }
      ).then(() => {
        parkingConfig.value.splice(index, 1)
        ElMessage.success('删除成功')
      }).catch(() => {
        ElMessage.info('已取消删除')
      })
    }
    
    const handleParkingSubmit = () => {
      if (!parkingForm.value.id || !parkingForm.value.area || !parkingForm.value.number) {
        ElMessage.error('请填写完整信息')
        return
      }
      
      // 模拟提交
      setTimeout(() => {
        ElMessage.success(parkingDialogTitle.value === '添加车位' ? '添加成功' : '更新成功')
        parkingDialogVisible.value = false
        fetchConfig()
      }, 500)
    }
    
    const batchImportParking = () => {
      ElMessage.success('批量导入功能待实现')
    }
    
    onMounted(() => {
      fetchConfig()
    })
    
    return {
      activeTab,
      basicConfig,
      areaConfig,
      parkingConfig,
      areaDialogVisible,
      areaDialogTitle,
      parkingDialogVisible,
      parkingDialogTitle,
      areaForm,
      parkingForm,
      getIconType,
      handleSave,
      addArea,
      editArea,
      deleteArea,
      handleAreaSubmit,
      addParking,
      editParking,
      deleteParking,
      handleParkingSubmit,
      batchImportParking
    }
  }
}
</script>

<style scoped>
.map-config-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.coordinate-input {
  display: flex;
  align-items: center;
}

.area-list, .parking-list {
  margin-bottom: 20px;
}

.area-item, .parking-item {
  margin-bottom: 20px;
}

.area-header, .parking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.area-actions, .parking-actions {
  margin-top: 20px;
  text-align: center;
}
</style>