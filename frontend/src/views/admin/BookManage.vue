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
        <el-table-column label="封面" width="80">
          <template #default="{ row }">
            <img v-if="row.coverUrl" :src="row.coverUrl" style="width: 50px; height: 70px; object-fit: cover; border-radius: 4px;" />
            <div v-else style="width: 50px; height: 70px; background: #f0f0f0; border-radius: 4px; display: flex; align-items: center; justify-content: center; font-size: 20px;">📖</div>
          </template>
        </el-table-column>
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
      width="550px"
    >
      <el-form :model="form" label-width="80px">
        <el-row :gutter="20">
          <el-col :span="10">
            <!-- 封面预览 + 点击上传 -->
            <div class="cover-preview" @click="triggerUpload">
              <img v-if="form.coverUrl" :src="form.coverUrl" />
              <div v-else class="cover-placeholder">
                <span>+</span>
                <p>点击上传封面</p>
              </div>
            </div>
            <input type="file" ref="fileInput" accept="image/*" style="display:none" @change="handleFileSelect" />
          </el-col>
          <el-col :span="14">
            <el-form-item label="书名">
              <el-input v-model="form.title" />
            </el-form-item>
            <el-form-item label="作者">
              <el-input v-model="form.author" />
            </el-form-item>
            <el-form-item label="分类">
              <el-select v-model="form.category" style="width: 100%">
                <el-option label="计算机" value="计算机" />
                <el-option label="文学" value="文学" />
                <el-option label="科幻" value="科幻" />
                <el-option label="历史" value="历史" />
                <el-option label="哲学" value="哲学" />
                <el-option label="心理" value="心理" />
                <el-option label="社科" value="社科" />
                <el-option label="艺术" value="艺术" />
                <el-option label="自然科学" value="自然科学" />
                <el-option label="经济" value="经济" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>
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
const fileInput = ref(null)
const uploading = ref(false)
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

const previewCover = () => {
  // 封面URL变更时自动更新预览（双向绑定已实现）
}

const triggerUpload = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  // 图片大小限制 5MB
  if (file.size > 5 * 1024 * 1024) {
    ElMessage.warning('图片不能超过5MB')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('cover', file)
    const res = await axios.post('http://localhost:3000/api/upload/cover', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
    form.value.coverUrl = res.data.url
    ElMessage.success('封面上传成功')
  } catch (error) {
    ElMessage.error('封面上传失败')
  } finally {
    uploading.value = false
    // 清空input，允许重复选择同一文件
    fileInput.value.value = ''
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
.cover-preview {
  width: 150px;
  height: 200px;
  border: 2px dashed #d9d9d9;
  border-radius: 8px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.3s;
}
.cover-preview:hover {
  border-color: #409eff;
}
.cover-preview img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.cover-placeholder {
  text-align: center;
  color: #999;
}
.cover-placeholder span {
  font-size: 36px;
  line-height: 1;
}
.cover-placeholder p {
  margin: 8px 0 0;
  font-size: 12px;
}
</style>
