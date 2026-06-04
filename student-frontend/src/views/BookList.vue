<template>
  <div class="book-list">
    <el-card>
      <div class="search-bar">
        <el-input
          v-model="keyword"
          placeholder="搜索书名或作者"
          style="width: 300px"
          clearable
          @clear="searchBooks"
        >
          <template #append>
            <el-button @click="searchBooks">搜索</el-button>
          </template>
        </el-input>
        <el-select v-model="category" placeholder="分类" clearable style="width: 150px; margin-left: 20px" @change="searchBooks">
          <el-option label="计算机" value="计算机" />
          <el-option label="文学" value="文学" />
          <el-option label="科幻" value="科幻" />
        </el-select>
      </div>
    </el-card>

    <el-row :gutter="20" style="margin-top: 20px">
      <el-col v-for="book in books" :key="book.id" :xs="24" :sm="12" :md="8" :lg="6">
        <el-card class="book-card" shadow="hover" @click="$router.push(`/student/books/${book.id}`)" style="cursor: pointer">
          <div class="book-cover">
            <img :src="book.coverUrl" :alt="book.title" />
          </div>
          <div class="book-info">
            <h3 class="book-title">{{ book.title }}</h3>
            <p class="book-author">{{ book.author }}</p>
            <el-tag :type="book.availableCopies > 0 ? 'success' : 'danger'" size="small">
              {{ book.availableCopies > 0 ? `可借 ${book.availableCopies}` : '已借完' }}
            </el-tag>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import axios from 'axios'

const keyword = ref('')
const category = ref('')
const books = ref([])

const searchBooks = async () => {
  try {
    const res = await axios.get('http://localhost:3000/api/books', {
      params: {
        keyword: keyword.value,
        category: category.value
      }
    })
    books.value = res.data
  } catch (error) {
    console.error('获取图书列表失败', error)
  }
}

onMounted(() => {
  searchBooks()
})
</script>

<style scoped>
.search-bar {
  display: flex;
  align-items: center;
}

.book-card {
  margin-bottom: 20px;
}

.book-cover {
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f5f5;
  border-radius: 4px;
  overflow: hidden;
}

.book-cover img {
  height: 100%;
  object-fit: cover;
}

.book-info {
  margin-top: 15px;
}

.book-title {
  font-size: 16px;
  margin: 0 0 8px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.book-author {
  color: #666;
  font-size: 14px;
  margin: 0 0 10px 0;
}
</style>
