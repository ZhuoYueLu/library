<template>
  <div class="layout">
    <el-container>
      <el-header class="header">
        <div class="logo">📚 图书馆管理系统 - 管理端</div>
        <div class="user-info">
          <span>管理员，{{ user.name }}</span>
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
            <el-menu-item index="/admin/dashboard">
              <el-icon><DataAnalysis /></el-icon>
              <span>数据概览</span>
            </el-menu-item>
            <el-menu-item index="/admin/books">
              <el-icon><Reading /></el-icon>
              <span>图书管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/students">
              <el-icon><User /></el-icon>
              <span>学生管理</span>
            </el-menu-item>
            <el-menu-item index="/admin/borrows">
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
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const user = computed(() => userInfo.value.user)

const activeMenu = computed(() => route.path)

const handleLogout = () => {
  localStorage.removeItem('userInfo')
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
