<template>
  <div class="student-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>学生管理</span>
          <el-button type="primary" @click="openDialog()">添加学生</el-button>
        </div>
      </template>

      <el-table :data="students" style="width: 100%">
        <el-table-column prop="studentId" label="学号" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column prop="phone" label="电话" />
      </el-table>
    </el-card>

    <el-dialog v-model="dialogVisible" title="添加学生" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="学号">
          <el-input v-model="form.studentId" />
        </el-form-item>
        <el-form-item label="姓名">
          <el-input v-model="form.name" />
        </el-form-item>
        <el-form-item label="邮箱">
          <el-input v-model="form.email" />
        </el-form-item>
        <el-form-item label="电话">
          <el-input v-model="form.phone" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const students = ref([])
const dialogVisible = ref(false)
const form = ref({
  studentId: '',
  name: '',
  email: '',
  phone: ''
})

const fetchStudents = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/admin/students')
    students.value = res.data
  } catch (error) {
    console.error('获取学生列表失败', error)
  }
}

const openDialog = () => {
  form.value = { studentId: '', name: '', email: '', phone: '' }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    await axios.post('http://localhost:3000/api/admin/students', form.value)
    ElMessage.success('添加成功')
    dialogVisible.value = false
    fetchStudents()
  } catch (error) {
    ElMessage.error('添加失败')
  }
}

onMounted(() => {
  fetchStudents()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
