import vue from '@vitejs/plugin-vue'
import {defineConfig} from 'vite'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 5173,
    // API 代理：将前端的 /api 请求转发到后端（解决跨域问题）
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      },
      '/uploads': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
})
