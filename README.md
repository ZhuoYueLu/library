# 📚 图书馆管理系统

一个基于 Vue 3 + Node.js + SQLite 的现代化图书馆管理系统，包含学生端和管理员端双系统。

## ✨ 功能特点

### 学生端
- 🔍 **图书检索** - 支持书名、作者搜索和分类筛选
- 📖 **图书借阅** - 一键借阅心仪图书
- 📋 **借阅记录** - 查看个人借阅历史和归还状态
- 💬 **评论评分** - 对借阅的图书发表评论和评分

### 管理员端
- 📊 **数据概览** - 实时统计图书、学生、借阅数据
- 📚 **图书管理** - 增删改查图书信息
- 👥 **学生管理** - 管理学生账号
- 📋 **借阅管理** - 查看和管理所有借阅记录

### 公共功能
- 🔐 **统一登录** - 学生和管理员共用一个登录入口
- 📝 **用户注册** - 学生可自助注册账号
- ✅ **输入验证** - 学号/电话仅允许数字，密码/邮箱禁止中文
- 👁️ **密码可见** - 支持密码显示/隐藏切换

## 🛠️ 技术栈

| 分类 | 技术 | 版本 |
|------|------|------|
| 前端框架 | Vue | 3.x |
| UI 组件 | Element Plus | 2.x |
| 路由管理 | Vue Router | 4.x |
| 后端框架 | Express | 4.x |
| 数据库 | SQLite | 3.x |
| 构建工具 | Vite | 5.x |

## 📁 项目结构

```
library-management/
├── backend/              # 后端服务
│   ├── src/
│   │   ├── server.js     # 主服务入口
│   │   └── db.js         # 数据库配置
│   ├── package.json
│   └── library.db        # SQLite 数据库文件
├── frontend/             # 统一前端
│   ├── src/
│   │   ├── views/        # 页面组件
│   │   │   ├── Login.vue         # 登录/注册页
│   │   │   ├── student/          # 学生端页面
│   │   │   │   ├── Layout.vue
│   │   │   │   ├── BookList.vue
│   │   │   │   ├── BookDetail.vue
│   │   │   │   └── MyBorrows.vue
│   │   │   └── admin/            # 管理员端页面
│   │   │       ├── Layout.vue
│   │   │       ├── Dashboard.vue
│   │   │       ├── BookManage.vue
│   │   │       ├── StudentManage.vue
│   │   │       └── BorrowManage.vue
│   │   ├── router/       # 路由配置
│   │   ├── App.vue       # 根组件
│   │   └── main.js       # 入口文件
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
└── README.md
```

## 🚀 快速开始

### 环境要求
- Node.js >= 18.0.0
- npm >= 9.0.0

### 安装与运行

```bash
# 1. 进入项目目录
cd library-management

# 2. 安装后端依赖并启动
cd backend
npm install
node src/server.js

# 3. 新开终端，安装前端依赖并启动
cd ../frontend
npm install
npm run dev
```

### 访问地址

| 服务 | 地址 |
|------|------|
| 前端页面 | http://localhost:5173 |
| 后端 API | http://localhost:3000 |

## 🔑 测试账号

### 学生账号
| 学号 | 密码 | 姓名 |
|------|------|------|
| 2024001 | 123456 | 张三 |
| 2024002 | 123456 | 李四 |

### 管理员账号
| 账号 | 密码 | 姓名 |
|------|------|------|
| admin | admin123 | 系统管理员 |

## 🔌 API 接口

### 认证接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/login | 用户登录 |
| POST | /api/register | 用户注册 |

### 图书接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/books | 获取图书列表 |
| GET | /api/books/:id | 获取图书详情 |
| POST | /api/books/:id/comments | 添加评论 |
| GET | /api/books/:id/comments | 获取评论列表 |

### 借阅接口
| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/borrow | 借阅图书 |
| POST | /api/return | 归还图书 |
| GET | /api/students/:id/borrow-records | 获取借阅记录 |

### 管理员接口
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/admin/stats | 获取统计数据 |
| GET/POST/PUT/DELETE | /api/admin/books | 图书管理 |
| GET/POST | /api/admin/students | 学生管理 |
| GET | /api/admin/borrow-records | 借阅记录管理 |

## 📝 使用说明

1. **登录系统**
   - 打开 http://localhost:5173
   - 选择登录或注册标签页
   - 输入账号密码进行登录

2. **学生使用**
   - 登录后自动进入学生端
   - 浏览图书、借阅、查看借阅记录
   - 对图书发表评论和评分

3. **管理员使用**
   - 使用管理员账号登录
   - 登录后自动进入管理端
   - 管理图书、学生和借阅记录

## 📄 License

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

*项目已包含示例数据，启动即可直接体验完整功能。*
