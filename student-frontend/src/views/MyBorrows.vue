<template>
  <div class="my-borrows">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>我的借阅记录</span>
        </div>
      </template>

      <el-table :data="borrowRecords" style="width: 100%">
        <el-table-column prop="title" label="书名" />
        <el-table-column prop="author" label="作者" />
        <el-table-column prop="borrowDate" label="借阅日期">
          <template #default="{ row }">
            {{ formatDate(row.borrowDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="应还日期">
          <template #default="{ row }">
            {{ formatDate(row.dueDate) }}
          </template>
        </el-table-column>
        <el-table-column prop="returnDate" label="归还日期">
          <template #default="{ row }">
            {{ row.returnDate ? formatDate(row.returnDate) : '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="row.status === 'borrowed' ? 'warning' : 'success'">
              {{ row.status === 'borrowed' ? '借阅中' : '已归还' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'borrowed'"
              type="primary"
              size="small"
              @click="handleReturn(row)"
            >
              归还
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="borrowRecords.length === 0" description="暂无借阅记录" />
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const student = ref(JSON.parse(localStorage.getItem('student') || '{}'))
const borrowRecords = ref([])

const fetchBorrowRecords = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/api/students/${student.value.id}/borrow-records`)
    borrowRecords.value = res.data
  } catch (error) {
    console.error('获取借阅记录失败', error)
  }
}

const handleReturn = async (record) => {
  try {
    await ElMessageBox.confirm('确认归还此书？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.post('http://localhost:3000/api/return', {
      recordId: record.id
    })
    ElMessage.success('归还成功！')
    fetchBorrowRecords()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('归还失败')
    }
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('zh-CN')
}

onMounted(() => {
  fetchBorrowRecords()
})
</script>
