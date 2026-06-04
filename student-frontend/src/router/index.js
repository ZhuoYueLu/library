import { createRouter, createWebHistory } from 'vue-router'
import Login from '../views/Login.vue'
import Layout from '../views/Layout.vue'
import BookList from '../views/BookList.vue'
import BookDetail from '../views/BookDetail.vue'
import MyBorrows from '../views/MyBorrows.vue'

const routes = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: Layout,
    redirect: '/books',
    children: [
      { path: 'books', component: BookList },
      { path: 'books/:id', component: BookDetail },
      { path: 'my-borrows', component: MyBorrows }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const student = localStorage.getItem('student')
  if (to.path !== '/login' && !student) {
    next('/login')
  } else {
    next()
  }
})

export default router
