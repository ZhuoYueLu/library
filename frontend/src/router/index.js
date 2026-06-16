/**
 * Vue Router 路由配置
 *
 * 路由结构：
 * /login                 - 登录/注册页面（公共）
 * /student/books         - 图书列表
 * /student/books/:id     - 图书详情
 * /student/my-borrows    - 我的借阅
 * /student/ai-assistant  - AI 智能找书
 * /admin/dashboard       - 数据概览
 * /admin/books           - 图书管理
 * /admin/students        - 学生管理
 * /admin/borrows         - 借阅管理
 *
 * 路由守卫：
 * - 未登录时自动跳转到 /login
 * - 已登录访问 /login 时自动跳转到对应首页
 * - 角色权限验证：学生不能访问 /admin/*，管理员不能访问 /student/*
 */

import {createRouter, createWebHistory} from 'vue-router'

import BookManage from '../views/admin/BookManage.vue'
import BorrowManage from '../views/admin/BorrowManage.vue'
import Dashboard from '../views/admin/Dashboard.vue'
import AdminLayout from '../views/admin/Layout.vue'
import StudentManage from '../views/admin/StudentManage.vue'
import Login from '../views/Login.vue'
import AIAssistant from '../views/student/AIAssistant.vue'
import BookDetail from '../views/student/BookDetail.vue'
import BookList from '../views/student/BookList.vue'
import StudentLayout from '../views/student/Layout.vue'
import MyBorrows from '../views/student/MyBorrows.vue'

const routes =
    [
      {path: '/login', component: Login}, {
        path: '/student',
        component: StudentLayout,
        redirect: '/student/books',
        children: [
          {path: 'books', component: BookList},
          {path: 'books/:id', component: BookDetail},
          {path: 'my-borrows', component: MyBorrows},
          {path: 'ai-assistant', component: AIAssistant}
        ]
      },
      {
        path: '/admin',
        component: AdminLayout,
        redirect: '/admin/dashboard',
        children: [
          {path: 'dashboard', component: Dashboard},
          {path: 'books', component: BookManage},
          {path: 'students', component: StudentManage},
          {path: 'borrows', component: BorrowManage}
        ]
      }
    ]

    const router = createRouter({history: createWebHistory(), routes})

router.beforeEach((to, from, next) => {
  const userInfo = localStorage.getItem('userInfo')
  if (to.path !== '/login' && !userInfo) {
    next('/login')
    return
  }
  if (to.path === '/login' && userInfo) {
    const {role} = JSON.parse(userInfo)
    next(role === 'admin' ? '/admin/dashboard' : '/student/books')
    return
  }
  if (userInfo) {
    const {role} = JSON.parse(userInfo)
    if (to.path.startsWith('/student') && role !== 'student') {
      next('/admin/dashboard')
      return
    }
    if (to.path.startsWith('/admin') && role !== 'admin') {
      next('/student/books')
      return
    }
  }
  next()
})

export default router
