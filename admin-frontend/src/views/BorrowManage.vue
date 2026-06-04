<template>
  <div class="borrow-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>借阅管理</span>
        </div>
      </template>

      <el-table :data="borrowRecords" style="width: 100%">
        <el-table-column prop="title" label="书名" />
        <el-table-column prop="studentName" label="学生姓名" />
        <el-table-column prop="studentId" label="学号" />
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
    </el-card>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const borrowRecords = ref([])

const fetchBorrowRecords = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/admin/borrow-records')
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

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
