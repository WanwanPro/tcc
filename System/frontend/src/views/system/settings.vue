<template>
  <div class="system-settings-container">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>系统设置</span>
          <el-button type="primary" @click="handleSave">保存设置</el-button>
        </div>
      </template>
      
      <el-tabs v-model="activeTab">
        <el-tab-pane label="基础设置" name="basic">
          <el-form :model="basicSettings" label-width="120px">
            <el-form-item label="系统名称">
              <el-input v-model="basicSettings.systemName" placeholder="请输入系统名称"></el-input>
            </el-form-item>
            <el-form-item label="系统版本">
              <el-input v-model="basicSettings.systemVersion" placeholder="请输入系统版本"></el-input>
            </el-form-item>
            <el-form-item label="公司名称">
              <el-input v-model="basicSettings.companyName" placeholder="请输入公司名称"></el-input>
            </el-form-item>
            <el-form-item label="联系电话">
              <el-input v-model="basicSettings.contactPhone" placeholder="请输入联系电话"></el-input>
            </el-form-item>
            <el-form-item label="联系邮箱">
              <el-input v-model="basicSettings.contactEmail" placeholder="请输入联系邮箱"></el-input>
            </el-form-item>
            <el-form-item label="系统Logo">
              <el-upload
                class="logo-uploader"
                action="#"
                :show-file-list="false"
                :auto-upload="false"
                :on-change="handleLogoChange"
              >
                <img v-if="basicSettings.logoUrl" :src="basicSettings.logoUrl" class="logo" />
                <el-icon v-else class="logo-uploader-icon"><Plus /></el-icon>
              </el-upload>
            </el-form-item>
            <el-form-item label="系统主题">
              <el-radio-group v-model="basicSettings.theme">
                <el-radio label="default">默认主题</el-radio>
                <el-radio label="dark">深色主题</el-radio>
                <el-radio label="blue">蓝色主题</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="语言设置">
              <el-select v-model="basicSettings.language" placeholder="请选择语言">
                <el-option label="简体中文" value="zh-CN" />
                <el-option label="English" value="en-US" />
              </el-select>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="停车设置" name="parking">
          <el-form :model="parkingSettings" label-width="120px">
            <el-form-item label="免费停车时长">
              <el-input-number v-model="parkingSettings.freeDuration" :min="0" :max="60" />
              <span style="margin-left: 10px;">分钟</span>
            </el-form-item>
            <el-form-item label="最长停车时间">
              <el-input-number v-model="parkingSettings.maxDuration" :min="1" :max="24" />
              <span style="margin-left: 10px;">小时</span>
            </el-form-item>
            <el-form-item label="超时费用率">
              <el-input-number v-model="parkingSettings.overtimeRate" :min="1" :max="10" :precision="1" />
              <span style="margin-left: 10px;">倍</span>
            </el-form-item>
            <el-form-item label="自动释放车位">
              <el-switch v-model="parkingSettings.autoRelease" />
            </el-form-item>
            <el-form-item label="自动释放时间">
              <el-input-number v-model="parkingSettings.autoReleaseTime" :min="1" :max="60" />
              <span style="margin-left: 10px;">分钟</span>
            </el-form-item>
            <el-form-item label="启用预约功能">
              <el-switch v-model="parkingSettings.enableReservation" />
            </el-form-item>
            <el-form-item label="预约提前时间">
              <el-input-number v-model="parkingSettings.reservationAdvanceTime" :min="1" :max="24" />
              <span style="margin-left: 10px;">小时</span>
            </el-form-item>
            <el-form-item label="预约保留时间">
              <el-input-number v-model="parkingSettings.reservationHoldTime" :min="5" :max="60" />
              <span style="margin-left: 10px;">分钟</span>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="支付设置" name="payment">
          <el-form :model="paymentSettings" label-width="120px">
            <el-form-item label="支付方式">
              <el-checkbox-group v-model="paymentSettings.paymentMethods">
                <el-checkbox label="cash">现金支付</el-checkbox>
                <el-checkbox label="alipay">支付宝</el-checkbox>
                <el-checkbox label="wechat">微信支付</el-checkbox>
                <el-checkbox label="card">银行卡</el-checkbox>
                <el-checkbox label="monthly">月卡支付</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
            <el-form-item label="支付宝配置">
              <el-input v-model="paymentSettings.alipayAppId" placeholder="支付宝应用ID">
                <template #prepend>应用ID</template>
              </el-input>
              <el-input v-model="paymentSettings.alipayPrivateKey" placeholder="支付宝私钥" style="margin-top: 10px;">
                <template #prepend>私钥</template>
              </el-input>
            </el-form-item>
            <el-form-item label="微信支付配置">
              <el-input v-model="paymentSettings.wechatAppId" placeholder="微信应用ID">
                <template #prepend>应用ID</template>
              </el-input>
              <el-input v-model="paymentSettings.wechatMchId" placeholder="微信商户号" style="margin-top: 10px;">
                <template #prepend>商户号</template>
              </el-input>
              <el-input v-model="paymentSettings.wechatApiKey" placeholder="微信API密钥" style="margin-top: 10px;">
                <template #prepend>API密钥</template>
              </el-input>
            </el-form-item>
            <el-form-item label="自动打印发票">
              <el-switch v-model="paymentSettings.autoPrintInvoice" />
            </el-form-item>
            <el-form-item label="发票抬头">
              <el-input v-model="paymentSettings.invoiceTitle" placeholder="请输入发票抬头"></el-input>
            </el-form-item>
            <el-form-item label="税号">
              <el-input v-model="paymentSettings.taxNumber" placeholder="请输入税号"></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="通知设置" name="notification">
          <el-form :model="notificationSettings" label-width="120px">
            <el-form-item label="短信通知">
              <el-switch v-model="notificationSettings.smsEnabled" />
            </el-form-item>
            <el-form-item label="短信服务商">
              <el-select v-model="notificationSettings.smsProvider" placeholder="请选择短信服务商">
                <el-option label="阿里云短信" value="aliyun" />
                <el-option label="腾讯云短信" value="tencent" />
                <el-option label="华为云短信" value="huawei" />
              </el-select>
            </el-form-item>
            <el-form-item label="短信签名">
              <el-input v-model="notificationSettings.smsSignature" placeholder="请输入短信签名"></el-input>
            </el-form-item>
            <el-form-item label="邮件通知">
              <el-switch v-model="notificationSettings.emailEnabled" />
            </el-form-item>
            <el-form-item label="SMTP服务器">
              <el-input v-model="notificationSettings.smtpServer" placeholder="请输入SMTP服务器地址"></el-input>
            </el-form-item>
            <el-form-item label="SMTP端口">
              <el-input-number v-model="notificationSettings.smtpPort" :min="1" :max="65535" />
            </el-form-item>
            <el-form-item label="邮箱账号">
              <el-input v-model="notificationSettings.emailAccount" placeholder="请输入邮箱账号"></el-input>
            </el-form-item>
            <el-form-item label="邮箱密码">
              <el-input v-model="notificationSettings.emailPassword" type="password" placeholder="请输入邮箱密码"></el-input>
            </el-form-item>
            <el-form-item label="通知场景">
              <el-checkbox-group v-model="notificationSettings.notificationScenes">
                <el-checkbox label="entry">车辆入场</el-checkbox>
                <el-checkbox label="exit">车辆出场</el-checkbox>
                <el-checkbox label="overtime">超时停车</el-checkbox>
                <el-checkbox label="reservation">预约提醒</el-checkbox>
                <el-checkbox label="payment">支付成功</el-checkbox>
              </el-checkbox-group>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="安全设置" name="security">
          <el-form :model="securitySettings" label-width="120px">
            <el-form-item label="密码复杂度">
              <el-radio-group v-model="securitySettings.passwordComplexity">
                <el-radio label="low">低（至少6位）</el-radio>
                <el-radio label="medium">中（字母+数字，至少8位）</el-radio>
                <el-radio label="high">高（大小写字母+数字+特殊字符，至少10位）</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="密码有效期">
              <el-input-number v-model="securitySettings.passwordExpiry" :min="0" :max="365" />
              <span style="margin-left: 10px;">天（0表示永不过期）</span>
            </el-form-item>
            <el-form-item label="登录失败锁定">
              <el-switch v-model="securitySettings.loginLockEnabled" />
            </el-form-item>
            <el-form-item label="最大失败次数">
              <el-input-number v-model="securitySettings.maxFailedAttempts" :min="3" :max="10" />
            </el-form-item>
            <el-form-item label="锁定时间">
              <el-input-number v-model="securitySettings.lockDuration" :min="5" :max="60" />
              <span style="margin-left: 10px;">分钟</span>
            </el-form-item>
            <el-form-item label="会话超时时间">
              <el-input-number v-model="securitySettings.sessionTimeout" :min="10" :max="480" />
              <span style="margin-left: 10px;">分钟</span>
            </el-form-item>
            <el-form-item label="启用双因素认证">
              <el-switch v-model="securitySettings.twoFactorEnabled" />
            </el-form-item>
            <el-form-item label="IP白名单">
              <el-input
                v-model="securitySettings.ipWhitelist"
                type="textarea"
                :rows="3"
                placeholder="请输入IP地址，每行一个"
              ></el-input>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'

export default {
  name: 'SystemSettings',
  components: {
    Plus
  },
  setup() {
    const activeTab = ref('basic')
    const basicSettings = ref({
      systemName: '智慧停车场管理系统',
      systemVersion: '1.0.0',
      companyName: '智慧科技有限公司',
      contactPhone: '400-888-8888',
      contactEmail: 'support@example.com',
      logoUrl: '',
      theme: 'default',
      language: 'zh-CN'
    })
    const parkingSettings = ref({
      freeDuration: 15,
      maxDuration: 24,
      overtimeRate: 1.5,
      autoRelease: true,
      autoReleaseTime: 5,
      enableReservation: true,
      reservationAdvanceTime: 2,
      reservationHoldTime: 15
    })
    const paymentSettings = ref({
      paymentMethods: ['cash', 'alipay', 'wechat'],
      alipayAppId: '',
      alipayPrivateKey: '',
      wechatAppId: '',
      wechatMchId: '',
      wechatApiKey: '',
      autoPrintInvoice: false,
      invoiceTitle: '',
      taxNumber: ''
    })
    const notificationSettings = ref({
      smsEnabled: false,
      smsProvider: 'aliyun',
      smsSignature: '',
      emailEnabled: false,
      smtpServer: '',
      smtpPort: 587,
      emailAccount: '',
      emailPassword: '',
      notificationScenes: ['entry', 'exit', 'overtime']
    })
    const securitySettings = ref({
      passwordComplexity: 'medium',
      passwordExpiry: 90,
      loginLockEnabled: true,
      maxFailedAttempts: 5,
      lockDuration: 30,
      sessionTimeout: 120,
      twoFactorEnabled: false,
      ipWhitelist: ''
    })
    
    const fetchSettings = () => {
      // 模拟API请求
      setTimeout(() => {
        // 这里可以从API获取设置数据
      }, 500)
    }
    
    const handleLogoChange = (file) => {
      // 模拟上传Logo
      const reader = new FileReader()
      reader.onload = (e) => {
        basicSettings.value.logoUrl = e.target.result
      }
      reader.readAsDataURL(file.raw)
    }
    
    const handleSave = () => {
      // 模拟保存设置
      setTimeout(() => {
        ElMessage.success('设置保存成功')
      }, 500)
    }
    
    onMounted(() => {
      fetchSettings()
    })
    
    return {
      activeTab,
      basicSettings,
      parkingSettings,
      paymentSettings,
      notificationSettings,
      securitySettings,
      handleLogoChange,
      handleSave
    }
  }
}
</script>

<style scoped>
.system-settings-container {
  padding: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo-uploader .logo {
  width: 100px;
  height: 100px;
  display: block;
}

.logo-uploader .el-upload {
  border: 1px dashed var(--el-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--el-transition-duration-fast);
}

.logo-uploader .el-upload:hover {
  border-color: var(--el-color-primary);
}

.el-icon.logo-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 100px;
  height: 100px;
  text-align: center;
  line-height: 100px;
}
</style>