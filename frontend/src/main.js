/**
 * 前端应用入口
 *
 * 功能：创建 Vue 3 应用实例，注册 Element Plus 组件库，
 *       挂载 Vue Router，渲染根组件到 #app 容器。
 */

import 'element-plus/dist/index.css'

import ElementPlus from 'element-plus'
import {createApp} from 'vue'

import App from './App.vue'
import router from './router'

const app = createApp(App)
app.use(ElementPlus)
app.use(router)
app.mount('#app')
