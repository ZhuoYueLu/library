<template>
  <div class="login-container">
    <div class="login-box">
      <h2>📚 图书馆管理系统</h2>
      
      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" label-width="80px">
            <el-form-item label="账号">
              <el-input 
                v-model="loginForm.account" 
                placeholder="请输入学号或管理员账号" 
                @input="validateLoginAccount"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input 
                v-model="loginForm.password" 
                :type="passwordVisible ? 'text' : 'password'" 
                placeholder="请输入密码（不能包含中文）" 
                @input="validateLoginPassword"
                @keyup.enter="handleLogin"
                clearable
              >
                <template #suffix>
                  <span 
                    class="password-toggle" 
                    @click="togglePasswordVisible"
                  >
                    {{ passwordVisible ? '🙈' : '👁️' }}
                  </span>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleLogin" style="width: 100%">登录</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" label-width="80px">
            <el-form-item label="学号">
              <el-input 
                v-model="registerForm.studentId" 
                placeholder="请输入学号（仅数字）"
                @input="validateStudentId"
                maxlength="20"
              />
            </el-form-item>
            <el-form-item label="姓名">
              <el-input v-model="registerForm.name" placeholder="请输入姓名" />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input 
                v-model="registerForm.email" 
                placeholder="请输入邮箱" 
                @input="validateEmail"
              />
            </el-form-item>
            <el-form-item label="电话">
              <el-input 
                v-model="registerForm.phone" 
                placeholder="请输入电话（仅数字）" 
                @input="validatePhone"
                maxlength="11"
              />
            </el-form-item>
            <el-form-item label="密码">
              <el-input 
                v-model="registerForm.password" 
                :type="passwordVisible ? 'text' : 'password'" 
                placeholder="请设置密码（不能包含中文）" 
                @input="validatePassword"
                @keyup.enter="handleRegister"
                clearable
              >
                <template #suffix>
                  <span 
                    class="password-toggle" 
                    @click="togglePasswordVisible"
                  >
                    {{ passwordVisible ? '🙈' : '👁️' }}
                  </span>
                </template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="success" @click="handleRegister" style="width: 100%">注册</el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
      
      <p style="margin-top: 20px; color: #999; font-size: 12px;">
        测试账号：学生 2024001 / 123456 | 管理员 admin / admin123
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const router = useRouter()
const activeTab = ref('login')
const passwordVisible = ref(false)

const loginForm = ref({
  account: '',
  password: ''
})

const registerForm = ref({
  studentId: '',
  name: '',
  email: '',
  phone: '',
  password: ''
})

const togglePasswordVisible = () => {
  passwordVisible.value = !passwordVisible.value
}

const validateStudentId = (value) => {
  registerForm.value.studentId = value.replace(/[^\d]/g, '')
}

const validatePhone = (value) => {
  registerForm.value.phone = value.replace(/[^\d]/g, '')
}

const validatePassword = (value) => {
  registerForm.value.password = value.replace(/[\u4e00-\u9fa5]/g, '')
}

const validateEmail = (value) => {
  registerForm.value.email = value.replace(/[\u4e00-\u9fa5]/g, '')
}

const validateLoginAccount = (value) => {
  loginForm.value.account = value.replace(/[\u4e00-\u9fa5]/g, '')
}

const validateLoginPassword = (value) => {
  loginForm.value.password = value.replace(/[\u4e00-\u9fa5]/g, '')
}

const handleLogin = async () => {
  try {
    const res = await axios.post('http://localhost:3000/api/login', loginForm.value)
    const { role, user } = res.data
    localStorage.setItem('userInfo', JSON.stringify({ role, user }))
    ElMessage.success('登录成功！')
    if (role === 'admin') {
      router.push('/admin/dashboard')
    } else {
      router.push('/student/books')
    }
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '登录失败，请检查账号和密码')
  }
}

const handleRegister = async () => {
  if (!registerForm.value.studentId || !registerForm.value.name || !registerForm.value.password) {
    ElMessage.warning('请填写必填项（学号、姓名、密码）')
    return
  }
  try {
    await axios.post('http://localhost:3000/api/register', registerForm.value)
    ElMessage.success('注册成功！请登录')
    activeTab.value = 'login'
    loginForm.value.account = registerForm.value.studentId
    loginForm.value.password = registerForm.value.password
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '注册失败')
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.login-box {
  background: white;
  padding: 40px;
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  width: 400px;
}

.login-box h2 {
  text-align: center;
  margin-bottom: 30px;
  color: #333;
}

.password-toggle {
  cursor: pointer;
  user-select: none;
  font-size: 18px;
  transition: all 0.2s ease;
}

.password-toggle:hover {
  transform: scale(1.2);
}
</style>
