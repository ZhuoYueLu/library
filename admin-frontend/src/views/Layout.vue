<template>
  <div class="layout">
    <el-container>
      <el-header class="header">
        <div class="logo">📚 图书馆管理系统</div>
        <div class="user-info">
          <span>管理员，{{ admin.name }}</span>
          <el-button type="text" @click="handleLogout">退出</el-button>
        </div>
      </el-header>
      <el-container>
        <el-aside width="200px">
          <el-menu
            :default-active="activeMenu"
            router
            background-color="#545c64"
            text-color="#fff"
            active-text-color="#ffd04b"
          >
            <el-menu-item index="/dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据概览</span>
            </el-menu-item>
            <el-menu-item index="/books">
              <el-icon><Reading /></el-icon>
              <span>图书管理</span>
            </el-menu-item>
            <el-menu-item index="/students">
              <el-icon><User /></el-icon>
              <span>学生管理</span>
            </el-menu-item>
            <el-menu-item index="/borrows">
              <el-icon><Tickets /></el-icon>
              <span>借阅管理</span>
            </el-menu-item>
          </el-menu>
        </el-aside>
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { DataAnalysis, Reading, User, Tickets } from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const admin = ref(JSON.parse(localStorage.getItem('admin') || '{}'))

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  localStorage.removeItem('admin')
  router.push('/login')
}
</script>

<style scoped>
.layout {
  height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #409eff;
  color: white;
  padding: 0 20px;
}

.logo {
  font-size: 24px;
  font-weight: bold;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.user-info button {
  color: white;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
}
</style>
