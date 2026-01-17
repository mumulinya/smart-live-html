import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// Legacy styles
import './assets/css/element.css'
import './assets/css/index.css'
import './assets/css/main.css'

const app = createApp(App)

app.use(router)
app.use(ElementPlus)

import Vant from 'vant';
import 'vant/lib/index.css';
app.use(Vant);

// Make global utilities available if needed, or import them in components
import { fileURL } from './utils/request'
app.config.globalProperties.$fileURL = fileURL

app.mount('#app')
