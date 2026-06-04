<template>
  <div class="book-manage">
    <el-card>
      <template #header>
        <div class="card-header">
          <span>图书管理</span>
          <el-button type="primary" @click="openDialog()">添加图书</el-button>
        </div>
      </template>

      <el-table :data="books" style="width: 100%">
        <el-table-column prop="title" label="书名" />
        <el-table-column prop="author" label="作者" />
        <el-table-column prop="category" label="分类" />
        <el-table-column label="库存">
          <template #default="{ row }">
            {{ row.availableCopies }}/{{ row.totalCopies }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openDialog(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑图书' : '添加图书'"
      width="500px"
    >
      <el-form :model="form" label-width="80px">
        <el-form-item label="书名">
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="作者">
          <el-input v-model="form.author" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category">
            <el-option label="计算机" value="计算机" />
            <el-option label="文学" value="文学" />
            <el-option label="科幻" value="科幻" />
          </el-select>
        </el-form-item>
        <el-form-item label="ISBN">
          <el-input v-model="form.isbn" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="总数">
          <el-input-number v-model="form.totalCopies" :min="1" />
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
import { ElMessage, ElMessageBox } from 'element-plus'
import axios from 'axios'

const books = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = ref({
  id: null,
  isbn: '',
  title: '',
  author: '',
  category: '',
  description: '',
  coverUrl: '',
  totalCopies: 1
})

const fetchBooks = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/admin/books')
    books.value = res.data
  } catch (error) {
    console.error('获取图书列表失败', error)
  }
}

const openDialog = (book = null) => {
  isEdit.value = !!book
  if (book) {
    form.value = { ...book }
  } else {
    form.value = {
      id: null,
      isbn: '',
      title: '',
      author: '',
      category: '',
      description: '',
      coverUrl: '',
      totalCopies: 1
    }
  }
  dialogVisible.value = true
}

const handleSubmit = async () => {
  try {
    if (isEdit.value) {
      await axios.put(`http://localhost:3000/api/admin/books/${form.value.id}`, form.value)
      ElMessage.success('编辑成功')
    } else {
      await axios.post('http://localhost:3000/api/admin/books', form.value)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    fetchBooks()
  } catch (error) {
    ElMessage.error('操作失败')
  }
}

const handleDelete = async (book) => {
  try {
    await ElMessageBox.confirm('确认删除此图书？', '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await axios.delete(`http://localhost:3000/api/admin/books/${book.id}`)
    ElMessage.success('删除成功')
    fetchBooks()
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchBooks()
})
</script>

<style scoped>
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
