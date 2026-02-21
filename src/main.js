import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { ElLoading, ElMessage, ElMessageBox, ElNotification } from 'element-plus'
import 'element-plus/es/components/loading/style/css'
import 'element-plus/es/components/message/style/css'
import 'element-plus/es/components/message-box/style/css'
import 'element-plus/es/components/notification/style/css'
import 'vant/es/dialog/style'
import 'vant/es/toast/style'

// Legacy styles
import './assets/css/element-icons-legacy.css'
import './assets/css/index.css'
import './assets/css/main.css'

const app = createApp(App)

app.use(router)

// Make global utilities available if needed, or import them in components
import { fileURL } from './utils/request'
app.config.globalProperties.$fileURL = fileURL
app.config.globalProperties.$message = ElMessage
app.config.globalProperties.$notify = ElNotification
app.config.globalProperties.$msgbox = ElMessageBox
app.config.globalProperties.$alert = ElMessageBox.alert
app.config.globalProperties.$confirm = ElMessageBox.confirm
app.config.globalProperties.$prompt = ElMessageBox.prompt
app.config.globalProperties.$loading = ElLoading.service

app.mount('#app')

