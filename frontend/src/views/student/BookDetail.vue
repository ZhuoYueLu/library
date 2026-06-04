<template>
  <div class="book-detail">
    <el-button @click="$router.back()" style="margin-bottom: 20px">
      <el-icon><ArrowLeft /></el-icon>
      返回
    </el-button>

    <el-card v-if="book">
      <el-row :gutter="30">
        <el-col :span="6">
          <div class="book-cover">
            <img :src="book.coverUrl" :alt="book.title" />
          </div>
        </el-col>
        <el-col :span="18">
          <h2>{{ book.title }}</h2>
          <p style="color: #666; margin: 10px 0">作者：{{ book.author }}</p>
          <el-tag style="margin-right: 10px">{{ book.category }}</el-tag>
          <el-tag :type="book.availableCopies > 0 ? 'success' : 'danger'">
            {{ book.availableCopies > 0 ? `可借 ${book.availableCopies}/${book.totalCopies}` : '已借完' }}
          </el-tag>
          <p style="margin-top: 20px; line-height: 1.8">{{ book.description }}</p>
          <div style="margin-top: 30px">
            <el-button
              type="primary"
              size="large"
              :disabled="book.availableCopies <= 0"
              @click="handleBorrow"
            >
              借阅此书
            </el-button>
          </div>
        </el-col>
      </el-row>
    </el-card>

    <el-card style="margin-top: 20px">
      <template #header>
        <div class="card-header">
          <span>💬 读者评论</span>
        </div>
      </template>

      <el-form :model="commentForm" style="margin-bottom: 30px">
        <el-form-item label="评分">
          <el-rate v-model="commentForm.rating" />
        </el-form-item>
        <el-form-item label="评论">
          <el-input
            v-model="commentForm.content"
            type="textarea"
            :rows="3"
            placeholder="写下你的评论..."
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="submitComment">发表评论</el-button>
        </el-form-item>
      </el-form>

      <el-divider />

      <div v-if="comments.length === 0" style="text-align: center; color: #999; padding: 40px">
        暂无评论，快来抢沙发吧！
      </div>

      <div v-for="comment in comments" :key="comment.id" class="comment-item">
        <div class="comment-header">
          <span class="comment-author">{{ comment.studentName }}</span>
          <el-rate disabled :model-value="comment.rating" size="small" style="margin-left: 10px" />
          <span class="comment-time">{{ formatDate(comment.createdAt) }}</span>
        </div>
        <div class="comment-content">{{ comment.content }}</div>
      </div>
    </el-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowLeft } from '@element-plus/icons-vue'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const book = ref(null)
const comments = ref([])
const userInfo = ref(JSON.parse(localStorage.getItem('userInfo') || '{}'))
const user = computed(() => userInfo.value.user)
const commentForm = ref({
  content: '',
  rating: 5
})

const fetchBook = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/api/books/${route.params.id}`)
    book.value = res.data
  } catch (error) {
    ElMessage.error('获取图书信息失败')
  }
}

const fetchComments = async () => {
  try {
    const res = await axios.get(`http://localhost:3000/api/books/${route.params.id}/comments`)
    comments.value = res.data
  } catch (error) {
    console.error('获取评论失败', error)
  }
}

const handleBorrow = async () => {
  try {
    await axios.post('http://localhost:3000/api/borrow', {
      studentId: user.value.id,
      bookId: book.value.id
    })
    ElMessage.success('借阅成功！')
    fetchBook()
  } catch (error) {
    ElMessage.error(error.response?.data?.error || '借阅失败')
  }
}

const submitComment = async () => {
  if (!commentForm.value.content.trim()) {
    ElMessage.warning('请输入评论内容')
    return
  }
  try {
    await axios.post(`http://localhost:3000/api/books/${route.params.id}/comments`, {
      studentId: user.value.id,
      content: commentForm.value.content,
      rating: commentForm.value.rating
    })
    ElMessage.success('评论发表成功！')
    commentForm.value.content = ''
    commentForm.value.rating = 5
    fetchComments()
  } catch (error) {
    ElMessage.error('发表评论失败')
  }
}

const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchBook()
  fetchComments()
})
</script>

<style scoped>
.book-cover {
  width: 100%;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;
}

.book-cover img {
  width: 100%;
  display: block;
}

.comment-item {
  padding: 20px 0;
  border-bottom: 1px solid #eee;
}

.comment-item:last-child {
  border-bottom: none;
}

.comment-header {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.comment-author {
  font-weight: bold;
  color: #409eff;
}

.comment-time {
  margin-left: auto;
  color: #999;
  font-size: 12px;
}

.comment-content {
  color: #333;
  line-height: 1.6;
}
</style>
