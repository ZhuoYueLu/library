/**
 * 集中式 API 模块
 * 
 * 所有前端页面通过此模块调用后端接口。
 * 开发环境通过 Vite proxy 转发请求，生产环境可修改 BASE_URL 指向实际后端地址。
 * 
 * 使用方式：
 *   import api from '../api'
 *   const res = await api.get('/api/books')
 *   const res = await api.post('/api/login', { studentId, password })
 */

import axios from 'axios'

// 开发环境 proxy 已配置，直接使用相对路径
// 生产环境部署时修改此地址
const BASE_URL = ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000
})

// 请求拦截器：自动注入 Token
api.interceptors.request.use(config => {
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    const { token } = JSON.parse(userInfo)
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// 响应拦截器：统一错误处理
api.interceptors.response.use(
  response => response,
  error => {
    console.error('API 请求失败:', error.message)
    return Promise.reject(error)
  }
)

export default api
