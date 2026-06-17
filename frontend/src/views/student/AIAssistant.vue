<template>
  <div class="ai-assistant">
    <el-row :gutter="20">
      <!-- 热门推荐 -->
      <el-col :span="24" style="margin-bottom: 20px">
        <el-card v-if="!showResults">
          <template #header>
            <div class="card-header">
              <span>🔥 热门推荐</span>
            </div>
          </template>
          <el-row :gutter="20">
            <el-col v-for="book in hotBooks" :key="book.id" :xs="12" :sm="8" :md="6">
              <el-card class="hot-book" shadow="hover" @click="$router.push(`/student/books/${book.id}`)" style="cursor: pointer; margin-bottom: 15px">
                <div class="hot-book-info">
                  <h4>{{ book.title }}</h4>
                  <p class="hot-author">{{ book.author }}</p>
                  <div class="hot-stats">
                    <el-tag size="small" type="warning">借阅 {{ book.borrowCount }} 次</el-tag>
                    <el-rate disabled :model-value="book.avgRating" size="small" style="margin-top: 8px" />
                  </div>
                </div>
              </el-card>
            </el-col>
          </el-row>
        </el-card>
      </el-col>

      <!-- AI 搜索区域 -->
      <el-col :span="24">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>🤖 AI 智能找书</span>
              <el-tag type="success" size="small">智能匹配</el-tag>
            </div>
          </template>

          <div class="chat-box">
            <!-- 欢迎消息 -->
            <div v-if="messages.length === 0" class="welcome-msg">
              <div class="ai-icon">🤖</div>
              <h3>你好！我是 AI 图书助手</h3>
              <p>你可以告诉我你想看什么样的书，比如：</p>
              <div class="examples">
                <el-tag closable @close="quickQuery('我想看计算机入门的书')" style="margin: 5px; cursor: pointer" @click="quickQuery('我想看计算机入门的书')">
                  💻 计算机入门的书
                </el-tag>
                <el-tag closable @close="quickQuery('有什么好看的科幻小说')" style="margin: 5px; cursor: pointer" @click="quickQuery('有什么好看的科幻小说')">
                  🚀 好看的科幻小说
                </el-tag>
                <el-tag closable @close="quickQuery('推荐文学名著')" style="margin: 5px; cursor: pointer" @click="quickQuery('推荐文学名著')">
                  📖 推荐文学名著
                </el-tag>
              </div>
            </div>

            <!-- 对话消息 -->
            <div v-for="(msg, index) in messages" :key="index" class="message" :class="msg.role">
              <div class="msg-avatar">{{ msg.role === 'user' ? '👤' : '🤖' }}</div>
              <div class="msg-content">
                <div v-if="msg.text" class="msg-text">{{ msg.text }}</div>
                
                <!-- AI 推荐结果 -->
                <div v-if="msg.books && msg.books.length > 0" class="msg-books">
                  <div v-for="book in msg.books" :key="book.id" class="book-result" @click="$router.push(`/student/books/${book.id}`)">
                    <div class="book-info">
                      <h4>{{ book.title }}</h4>
                      <p class="book-author">{{ book.author }}</p>
                      <el-tag size="small" :type="book.availableCopies > 0 ? 'success' : 'danger'" style="margin-right: 8px">
                        {{ book.availableCopies > 0 ? '可借' : '已借完' }}
                      </el-tag>
                      <el-tag size="small">{{ book.category }}</el-tag>
                      <p class="match-reason">💡 {{ book.matchReason }}</p>
                    </div>
                  </div>
                </div>
                
                <!-- AI 建议 -->
                <div v-if="msg.suggestion" class="msg-suggestion">
                  💡 {{ msg.suggestion }}
                </div>
              </div>
            </div>

            <!-- 加载动画 -->
            <div v-if="loading" class="message ai">
              <div class="msg-avatar">🤖</div>
              <div class="msg-content">
                <div class="thinking">
                  <span class="dot">.</span><span class="dot">.</span><span class="dot">.</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 输入框 -->
          <div class="input-area">
            <el-input
              v-model="query"
              placeholder="描述你想找的书，比如：我想看一本计算机入门的书..."
              size="large"
              @keyup.enter="handleSearch"
              :disabled="loading"
            >
              <template #append>
                <el-button type="primary" @click="handleSearch" :loading="loading" :disabled="!query.trim()">
                  搜索
                </el-button>
              </template>
            </el-input>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../api'

const query = ref('')
const loading = ref(false)
const messages = ref([])
const hotBooks = ref([])
const showResults = ref(false)

const fetchHotBooks = async () => {
  try {
    const res = await api.get('/api/ai/hot')
    hotBooks.value = res.data
  } catch (error) {
    console.error('获取热门书籍失败', error)
  }
}

const handleSearch = async () => {
  if (!query.value.trim()) return
  
  const userQuery = query.value.trim()
  messages.value.push({ role: 'user', text: userQuery })
  query.value = ''
  showResults.value = true
  loading.value = true

  try {
    const res = await api.post('/api/ai/search', { query: userQuery })
    const { matches, total, suggestion } = res.data
    
    if (total === 0) {
      messages.value.push({ 
        role: 'ai', 
        text: '😅 暂时没有找到匹配的书籍，试试换个描述方式？比如换个关键词或分类。',
        books: [],
        suggestion: ''
      })
    } else {
      messages.value.push({ 
        role: 'ai', 
        text: `找到了 ${total} 本相关书籍，来看看吧！`,
        books: matches,
        suggestion
      })
    }
  } catch (error) {
    ElMessage.error('搜索失败，请稍后重试')
    messages.value.push({ 
      role: 'ai', 
      text: '😅 搜索出错了，请稍后再试。',
      books: [],
      suggestion: ''
    })
  } finally {
    loading.value = false
  }
}

const quickQuery = (text) => {
  query.value = text
  handleSearch()
}

onMounted(() => {
  fetchHotBooks()
})
</script>

<style scoped>
.ai-assistant {
  max-width: 900px;
  margin: 0 auto;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hot-book {
  text-align: center;
}

.hot-book-info h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.hot-author {
  color: #999;
  font-size: 12px;
  margin: 0 0 10px 0;
}

.hot-stats {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chat-box {
  height: 450px;
  overflow-y: auto;
  padding: 10px;
  background: #f8f9fa;
  border-radius: 8px;
  margin-bottom: 15px;
}

.welcome-msg {
  text-align: center;
  padding: 40px 20px;
}

.welcome-msg .ai-icon {
  font-size: 48px;
  margin-bottom: 15px;
}

.welcome-msg h3 {
  margin: 0 0 15px 0;
  color: #333;
}

.welcome-msg p {
  color: #666;
  margin-bottom: 15px;
}

.examples {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
}

.message {
  display: flex;
  margin-bottom: 20px;
}

.message.user {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  background: #e9ecef;
  flex-shrink: 0;
}

.message.user .msg-avatar {
  background: #409eff;
}

.msg-content {
  max-width: 80%;
  margin: 0 12px;
}

.message.user .msg-content {
  text-align: right;
}

.msg-text {
  background: white;
  padding: 10px 15px;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  display: inline-block;
}

.message.user .msg-text {
  background: #409eff;
  color: white;
}

.msg-books {
  margin-top: 10px;
}

.book-result {
  background: white;
  padding: 12px;
  border-radius: 8px;
  margin-bottom: 8px;
  cursor: pointer;
  transition: all 0.2s;
  border: 1px solid #eee;
}

.book-result:hover {
  border-color: #409eff;
  transform: translateX(5px);
}

.book-info h4 {
  margin: 0 0 5px 0;
  font-size: 15px;
  color: #333;
}

.book-author {
  color: #999;
  font-size: 13px;
  margin: 0 0 8px 0;
}

.match-reason {
  color: #67c23a;
  font-size: 12px;
  margin: 8px 0 0 0;
}

.msg-suggestion {
  margin-top: 10px;
  background: #ecf5ff;
  padding: 10px 15px;
  border-radius: 8px;
  color: #409eff;
  font-size: 14px;
}

.thinking {
  background: white;
  padding: 15px 25px;
  border-radius: 12px;
  display: inline-block;
}

.dot {
  font-size: 24px;
  font-weight: bold;
  animation: blink 1.4s infinite;
  color: #409eff;
}

.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }

@keyframes blink {
  0%, 20% { opacity: 0; }
  50% { opacity: 1; }
  100% { opacity: 0; }
}

.input-area {
  padding-top: 10px;
}
</style>
