const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json({limit: '10mb'}));

// 配置文件上传
const coverStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '..', 'uploads', 'covers');
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null,
       `cover_${Date.now()}_${Math.random().toString(36).slice(2, 8)}${ext}`);
  }
});
const uploadCover = multer({
  storage: coverStorage,
  limits: {fileSize: 5 * 1024 * 1024},
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) return cb(null, true);
    cb(new Error('仅支持 jpg/png/gif/webp 格式'));
  }
});

// 静态文件服务 - 访问上传的封面
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// 封面图片上传接口
app.post('/api/upload/cover', uploadCover.single('cover'), (req, res) => {
  if (!req.file) return res.status(400).json({code: 0, msg: '请选择图片'});
  const url = `http://localhost:${PORT}/uploads/covers/${req.file.filename}`;
  res.json({code: 1, url, msg: '上传成功'});
});

app.get('/api/books', (req, res) => {
  const {keyword, category} = req.query;
  let query = 'SELECT * FROM books WHERE 1=1';
  const params = [];

  if (keyword) {
    query += ' AND (title LIKE ? OR author LIKE ?)';
    params.push(`%${keyword}%`, `%${keyword}%`);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json(rows);
  });
});

app.get('/api/books/:id', (req, res) => {
  db.get('SELECT * FROM books WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    if (!row) {
      res.status(404).json({error: 'Book not found'});
      return;
    }
    res.json(row);
  });
});

app.get('/api/books/:id/comments', (req, res) => {
  const query = `
    SELECT c.*, s.name as studentName 
    FROM comments c 
    JOIN students s ON c.studentId = s.id 
    WHERE c.bookId = ? 
    ORDER BY c.createdAt DESC
  `;
  db.all(query, [req.params.id], (err, rows) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json(rows);
  });
});

app.post('/api/books/:id/comments', (req, res) => {
  const {id: bookId} = req.params;
  const {studentId, content, rating} = req.body;
  const query =
      'INSERT INTO comments (bookId, studentId, content, rating) VALUES (?, ?, ?, ?)';
  db.run(query, [bookId, studentId, content, rating], function(err) {
    if (err) {
      console.error('Error inserting comment:', err);
      res.status(500).json({error: err.message});
      return;
    }
    res.json({id: this.lastID, message: 'Comment added successfully'});
  });
});

app.post('/api/students/login', (req, res) => {
  const {studentId, password} = req.body;
  db.get(
      'SELECT * FROM students WHERE studentId = ? AND password = ?',
      [studentId, password], (err, row) => {
        if (err) {
          res.status(500).json({error: err.message});
          return;
        }
        if (!row) {
          res.status(401).json({error: 'Invalid credentials'});
          return;
        }
        res.json({success: true, student: row});
      });
});

app.post('/api/admins/login', (req, res) => {
  const {username, password} = req.body;
  db.get(
      'SELECT * FROM admins WHERE username = ? AND password = ?',
      [username, password], (err, row) => {
        if (err) {
          res.status(500).json({error: err.message});
          return;
        }
        if (!row) {
          res.status(401).json({error: 'Invalid credentials'});
          return;
        }
        res.json({success: true, admin: row});
      });
});

// 注册接口
app.post('/api/register', (req, res) => {
  const {studentId, name, email, phone, password} = req.body;

  // 前端验证
  if (!studentId || !/^\d+$/.test(studentId)) {
    res.status(400).json({error: '学号只能是数字'});
    return;
  }

  if (phone && !/^\d+$/.test(phone)) {
    res.status(400).json({error: '电话只能是数字'});
    return;
  }

  if (password && /[\u4e00-\u9fa5]/.test(password)) {
    res.status(400).json({error: '密码不能包含中文'});
    return;
  }

  if (email && /[\u4e00-\u9fa5]/.test(email)) {
    res.status(400).json({error: '邮箱不能包含中文'});
    return;
  }

  // 检查学号是否已存在
  db.get(
      'SELECT id FROM students WHERE studentId = ?', [studentId],
      (err, existing) => {
        if (err) {
          res.status(500).json({error: err.message});
          return;
        }
        if (existing) {
          res.status(400).json({error: '该学号已注册，请直接登录'});
          return;
        }

        // 插入新学生
        db.run(
            'INSERT INTO students (studentId, name, email, phone, password) VALUES (?, ?, ?, ?, ?)',
            [studentId, name, email || '', phone || '', password || '123456'],
            function(err) {
              if (err) {
                res.status(500).json({error: err.message});
                return;
              }
              res.json({success: true, message: '注册成功'});
            });
      });
});

// 统一登录接口
app.post('/api/login', (req, res) => {
  const {account, password} = req.body;

  // 后端验证
  if (!account || /[\u4e00-\u9fa5]/.test(account)) {
    res.status(400).json({error: '账号不能包含中文'});
    return;
  }

  if (!password || /[\u4e00-\u9fa5]/.test(password)) {
    res.status(400).json({error: '密码不能包含中文'});
    return;
  }

  // 先尝试管理员登录
  db.get(
      'SELECT * FROM admins WHERE username = ? AND password = ?',
      [account, password], (err, admin) => {
        if (admin) {
          res.json({success: true, role: 'admin', user: admin});
          return;
        }

        // 再尝试学生登录
        db.get(
            'SELECT * FROM students WHERE studentId = ? AND password = ?',
            [account, password], (err, student) => {
              if (err) {
                res.status(500).json({error: err.message});
                return;
              }
              if (!student) {
                res.status(401).json({error: '账号或密码错误'});
                return;
              }
              res.json({success: true, role: 'student', user: student});
            });
      });
});

app.get('/api/students/:studentId/borrow-records', (req, res) => {
  const query = `
    SELECT br.*, b.title, b.author 
    FROM borrow_records br 
    JOIN books b ON br.bookId = b.id 
    WHERE br.studentId = ? 
    ORDER BY br.borrowDate DESC
  `;
  db.all(query, [req.params.studentId], (err, rows) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json(rows);
  });
});

app.post('/api/borrow', (req, res) => {
  const {studentId, bookId} = req.body;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, book) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    if (!book || book.availableCopies <= 0) {
      res.status(400).json({error: 'Book not available'});
      return;
    }

    db.run(
        'INSERT INTO borrow_records (studentId, bookId, dueDate) VALUES (?, ?, ?)',
        [studentId, bookId, dueDate.toISOString()], function(err) {
          if (err) {
            res.status(500).json({error: err.message});
            return;
          }
          db.run(
              'UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?',
              [bookId], (err) => {
                if (err) {
                  res.status(500).json({error: err.message});
                  return;
                }
                res.json(
                    {success: true, message: 'Book borrowed successfully'});
              });
        });
  });
});

app.post('/api/return', (req, res) => {
  const {recordId} = req.body;

  db.get('SELECT * FROM borrow_records WHERE id = ?', [recordId], (err, record) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    if (!record || record.status !== 'borrowed') {
      res.status(400).json({error: 'Invalid record'});
      return;
    }

    db.run(
        'UPDATE borrow_records SET status = "returned", returnDate = CURRENT_TIMESTAMP WHERE id = ?',
        [recordId], (err) => {
          if (err) {
            res.status(500).json({error: err.message});
            return;
          }
          db.run(
              'UPDATE books SET availableCopies = availableCopies + 1 WHERE id = ?',
              [record.bookId], (err) => {
                if (err) {
                  res.status(500).json({error: err.message});
                  return;
                }
                res.json(
                    {success: true, message: 'Book returned successfully'});
              });
        });
  });
});

app.get('/api/admin/books', (req, res) => {
  db.all('SELECT * FROM books ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json(rows);
  });
});

app.post('/api/admin/books', (req, res) => {
  const {isbn, title, author, category, description, coverUrl, totalCopies} =
      req.body;
  const query =
      'INSERT INTO books (isbn, title, author, category, description, coverUrl, totalCopies, availableCopies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.run(
      query,
      [
        isbn, title, author, category, description, coverUrl, totalCopies,
        totalCopies
      ],
      function(err) {
        if (err) {
          res.status(500).json({error: err.message});
          return;
        }
        res.json({id: this.lastID, message: 'Book added successfully'});
      });
});

app.put('/api/admin/books/:id', (req, res) => {
  const {id} = req.params;
  const {isbn, title, author, category, description, coverUrl, totalCopies} =
      req.body;
  const query =
      'UPDATE books SET isbn = ?, title = ?, author = ?, category = ?, description = ?, coverUrl = ?, totalCopies = ? WHERE id = ?';
  db.run(
      query,
      [isbn, title, author, category, description, coverUrl, totalCopies, id],
      (err) => {
        if (err) {
          res.status(500).json({error: err.message});
          return;
        }
        res.json({message: 'Book updated successfully'});
      });
});

app.delete('/api/admin/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json({message: 'Book deleted successfully'});
  });
});

app.get('/api/admin/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json(rows);
  });
});

app.post('/api/admin/students', (req, res) => {
  const {studentId, name, email, phone} = req.body;
  const query =
      'INSERT INTO students (studentId, name, email, phone) VALUES (?, ?, ?, ?)';
  db.run(query, [studentId, name, email, phone], function(err) {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json({id: this.lastID, message: 'Student added successfully'});
  });
});

app.get('/api/admin/borrow-records', (req, res) => {
  const query = `
    SELECT br.*, b.title, b.author, s.name as studentName, s.studentId 
    FROM borrow_records br 
    JOIN books b ON br.bookId = b.id 
    JOIN students s ON br.studentId = s.id 
    ORDER BY br.borrowDate DESC
  `;
  db.all(query, [], (err, rows) => {
    if (err) {
      res.status(500).json({error: err.message});
      return;
    }
    res.json(rows);
  });
});

app.get('/api/admin/stats', (req, res) => {
  const stats = {};

  db.get('SELECT COUNT(*) as count FROM books', (err, row) => {
    stats.totalBooks = row.count;

    db.get('SELECT COUNT(*) as count FROM students', (err, row) => {
      stats.totalStudents = row.count;

      db.get(
          'SELECT COUNT(*) as count FROM borrow_records WHERE status = "borrowed"',
          (err, row) => {
            stats.borrowedBooks = row.count;

            res.json(stats);
          });
    });
  });
});

// ==================== AI 智能搜索与推荐 ====================

// 智能关键词提取
function extractKeywords(text) {
  const keywords =
      text.toLowerCase().split(/[\s,，、.。\s]+/).filter(k => k.length > 0);
  return [...new Set(keywords)];
}

// 计算文本匹配得分
function calculateScore(query, fields) {
  let score = 0;
  const queryLower = query.toLowerCase();
  const queryWords = extractKeywords(query);

  fields.forEach(field => {
    const fieldLower = (field || '').toLowerCase();
    if (fieldLower === queryLower) score += 10;
    if (fieldLower.includes(queryLower)) score += 5;
    queryWords.forEach(word => {
      if (fieldLower.includes(word)) {
        score += 2;
        if (fieldLower.startsWith(word)) score += 1;
      }
    });
  });
  return score;
}

// 热门推荐
app.get('/api/ai/hot', (req, res) => {
  const query = `
    SELECT b.*, COUNT(br.id) as borrowCount,
           COALESCE(AVG(c.rating), 0) as avgRating
    FROM books b
    LEFT JOIN borrow_records br ON b.id = br.bookId
    LEFT JOIN comments c ON b.id = c.bookId
    GROUP BY b.id
    ORDER BY borrowCount DESC, avgRating DESC
    LIMIT 6
  `;
  db.all(query, [], (err, rows) => {
    if (err) return res.status(500).json({error: err.message});
    res.json(rows);
  });
});

// AI 智能找书
app.post('/api/ai/search', (req, res) => {
  const {query} = req.body;
  if (!query || query.trim().length === 0) {
    return res.status(400).json({error: '请输入你的需求描述'});
  }

  db.all('SELECT * FROM books', [], (err, books) => {
    if (err) return res.status(500).json({error: err.message});

    const queryLower = query.toLowerCase();
    const results = books.map(book => {
      const score = calculateScore(queryLower, [
        book.title, book.author, book.category, book.description, book.isbn
      ]);

      // 意图分析
      let bonusScore = 0;
      const intent = analyzeIntent(queryLower);
      if (intent.category && book.category === intent.category) bonusScore += 3;
      if (intent.level === 'beginner' &&
          (book.title.includes('入门') || book.title.includes('基础') ||
           book.title.includes('教程')))
        bonusScore += 2;
      if (intent.level === 'advanced' &&
          (book.title.includes('高级') || book.title.includes('深入')))
        bonusScore += 2;

      return {
        ...book,
        score: score + bonusScore,
        matchReason: generateMatchReason(book, queryLower)
      };
    });

    const matched = results.filter(b => b.score > 0)
                        .sort((a, b) => b.score - a.score)
                        .slice(0, 8);

    res.json({
      matches: matched,
      total: matched.length,
      suggestion: generateSuggestion(queryLower)
    });
  });
});

function analyzeIntent(text) {
  const intent = {};
  const categoryMap = {
    '计算机|编程|代码|软件|程序|前端|后端|开发|技术|IT|网站|算法': '计算机',
    '小说|文学|散文|诗歌|名著|鲁迅|老舍|巴金|余华|路遥': '文学',
    '科幻|未来|宇宙|外星|三体|科幻世界|流浪地球': '科幻',
    '历史|古代|近代|王朝|史记|明朝|清朝|历史书': '历史',
    '哲学|哲学家|思想|道家|儒家|苏菲|道德经': '哲学',
    '心理|心理学|自卑|乌合之众|性格|情绪': '心理',
    '社科|社会|资本论|乡土|政治|经济学': '社科',
    '艺术|美术|美学|绘画|音乐|设计': '艺术',
    '科学|自然|物理|生物|化学|天文|进化|时间简史|物种': '自然科学',
    '经济|赚钱|理财|投资|股票|财务|国富论': '经济'
  };
  for (const [pattern, category] of Object.entries(categoryMap)) {
    if (new RegExp(pattern, 'i').test(text)) {
      intent.category = category;
      break;
    }
  }
  if (/入门|基础|初级|新手|初学者|教程/.test(text))
    intent.level = 'beginner';
  if (/高级|进阶|深入|精通|高手/.test(text))
    intent.level = 'advanced';
  return intent;
}

function generateMatchReason(book, query) {
  if (book.title.toLowerCase().includes(query))
    return `书名"${book.title}"完全匹配`;
  if (book.author && book.author.toLowerCase().includes(query))
    return `作者"${book.author}"匹配`;
  if (book.category && book.category.toLowerCase().includes(query))
    return `属于"${book.category}"分类`;
  if (book.description && book.description.toLowerCase().includes(query))
    return '描述内容相关';
  return '综合匹配';
}

function generateSuggestion(query) {
  if (/编程|代码|计算机/.test(query))
    return '建议从《JavaScript高级程序设计》或《算法导论》开始，打好基础最重要！';
  if (/小说|文学/.test(query))
    return '经典文学永不过时，推荐《活着》《平凡的世界》《红楼梦》等，都是必读之作！';
  if (/科幻|未来|宇宙/.test(query))
    return '科幻迷必读《三体》系列和《银河帝国》，带你领略宇宙的宏大与神秘！';
  if (/历史/.test(query))
    return '读史使人明智，《人类简史》《万历十五年》都是非常好的选择！';
  if (/哲学/.test(query))
    return '哲学入门推荐《苏菲的世界》，用小说的方式了解哲学史，轻松有趣！';
  if (/心理/.test(query))
    return '了解心理学不仅能认识自己，也能理解他人，推荐《乌合之众》《自卑与超越》！';
  if (/艺术/.test(query))
    return '《艺术的故事》是全世界最受欢迎的艺术入门书，不容错过！';
  if (/科学|自然/.test(query))
    return '《时间简史》带你探索宇宙的奥秘，霍金的经典科普之作！';
  if (/经济|赚钱|理财/.test(query))
    return '《穷爸爸富爸爸》改变你的金钱观，理财入门首选！';
  return '以上是为你推荐的相关书籍，希望有你喜欢的！';
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// 补充更多图书数据
function seedMoreBooks() {
  const extraBooks = [
    // ======== 科幻 ========
    {
      isbn: '9787111666666',
      title: '银河帝国：基地',
      author: '阿西莫夫',
      category: '科幻',
      description: '科幻史上最经典的系列之一，讲述银河帝国的兴衰',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=science%20fiction%20galaxy%20empire%20book%20cover&image_size=square',
      totalCopies: 5,
      availableCopies: 5
    },
    {
      isbn: '9787111777777',
      title: '沙丘',
      author: '弗兰克·赫伯特',
      category: '科幻',
      description: '科幻文学史上的里程碑，沙漠星球的史诗传奇',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dune%20desert%20planet%20book%20cover&image_size=square',
      totalCopies: 4,
      availableCopies: 4
    },
    {
      isbn: '9787111888888',
      title: '三体II：黑暗森林',
      author: '刘慈欣',
      category: '科幻',
      description: '三体系列第二部，黑暗森林法则的终极展现',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=dark%20forest%20science%20fiction%20book%20cover&image_size=square',
      totalCopies: 8,
      availableCopies: 8
    },
    {
      isbn: '9787111999999',
      title: '三体III：死神永生',
      author: '刘慈欣',
      category: '科幻',
      description: '三体系列最终章，宇宙的终极命运',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=death%27s%20end%20science%20fiction%20book%20cover&image_size=square',
      totalCopies: 7,
      availableCopies: 7
    },
    {
      isbn: '9787200000010',
      title: '流浪地球',
      author: '刘慈欣',
      category: '科幻',
      description: '太阳即将毁灭，人类带着地球逃离太阳系',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wandering%20earth%20science%20fiction%20book%20cover&image_size=square',
      totalCopies: 6,
      availableCopies: 6
    },
    {
      isbn: '9787200000011',
      title: '海底两万里',
      author: '儒勒·凡尔纳',
      category: '科幻',
      description: '科幻小说之父经典之作，海底冒险之旅',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=20000%20leagues%20under%20the%20sea%20book%20cover&image_size=square',
      totalCopies: 4,
      availableCopies: 4
    },
    // ======== 文学 ========
    {
      isbn: '9787200000001',
      title: '活着',
      author: '余华',
      category: '文学',
      description: '中国当代文学经典，讲述一个普通人的一生',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20literature%20classic%20book%20cover&image_size=square',
      totalCopies: 6,
      availableCopies: 6
    },
    {
      isbn: '9787200000002',
      title: '百年孤独',
      author: '加西亚·马尔克斯',
      category: '文学',
      description: '魔幻现实主义经典之作，家族兴衰的史诗',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=one%20hundred%20years%20of%20solitude%20book%20cover&image_size=square',
      totalCopies: 5,
      availableCopies: 5
    },
    {
      isbn: '9787200000012',
      title: '围城',
      author: '钱钟书',
      category: '文学',
      description: '中国现代文学经典，幽默讽刺的知识分子群像',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=fortress%20besieged%20chinese%20literature%20book%20cover&image_size=square',
      totalCopies: 5,
      availableCopies: 5
    },
    {
      isbn: '9787200000013',
      title: '平凡的世界',
      author: '路遥',
      category: '文学',
      description: '中国当代文学经典，普通人在大时代中的奋斗',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ordinary%20world%20chinese%20literature%20book%20cover&image_size=square',
      totalCopies: 7,
      availableCopies: 7
    },
    {
      isbn: '9787200000014',
      title: '白鹿原',
      author: '陈忠实',
      category: '文学',
      description: '渭河平原五十年变迁的雄奇史诗',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=white%20deer%20plain%20book%20cover&image_size=square',
      totalCopies: 4,
      availableCopies: 4
    },
    // ======== 历史 ========
    {
      isbn: '9787200000015',
      title: '人类简史',
      author: '尤瓦尔·赫拉利',
      category: '历史',
      description: '从动物到上帝，人类历史的宏大叙事',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sapiens%20human%20history%20book%20cover&image_size=square',
      totalCopies: 8,
      availableCopies: 8
    },
    {
      isbn: '9787200000016',
      title: '万历十五年',
      author: '黄仁宇',
      category: '历史',
      description: '以万历十五年为切面，剖析明朝政治社会',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ming%20dynasty%20history%20book%20cover&image_size=square',
      totalCopies: 5,
      availableCopies: 5
    },
    {
      isbn: '9787200000017',
      title: '明朝那些事儿',
      author: '当年明月',
      category: '历史',
      description: '幽默风趣的明朝历史通俗读物',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=ming%20dynasty%20popular%20history%20book%20cover&image_size=square',
      totalCopies: 10,
      availableCopies: 10
    },
    {
      isbn: '9787200000018',
      title: '史记',
      author: '司马迁',
      category: '历史',
      description: '中国第一部纪传体通史，史学经典',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=shiji%20chinese%20history%20classic%20book%20cover&image_size=square',
      totalCopies: 4,
      availableCopies: 4
    },
    // ======== 哲学 ========
    {
      isbn: '9787200000019',
      title: '苏菲的世界',
      author: '乔斯坦·贾德',
      category: '哲学',
      description: '哲学入门经典，以小说形式讲述西方哲学史',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=sophie%27s%20world%20philosophy%20book%20cover&image_size=square',
      totalCopies: 6,
      availableCopies: 6
    },
    {
      isbn: '9787200000020',
      title: '道德经',
      author: '老子',
      category: '哲学',
      description: '中国哲学经典，道家思想之源',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=tao%20te%20ching%20philosophy%20book%20cover&image_size=square',
      totalCopies: 5,
      availableCopies: 5
    },
    {
      isbn: '9787200000021',
      title: '中国哲学简史',
      author: '冯友兰',
      category: '哲学',
      description: '中国哲学入门必读，深入浅出',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20philosophy%20history%20book%20cover&image_size=square',
      totalCopies: 4,
      availableCopies: 4
    },
    // ======== 心理 ========
    {
      isbn: '9787200000022',
      title: '乌合之众',
      author: '古斯塔夫·勒庞',
      category: '心理',
      description: '群体心理学经典，解析大众心理',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=crowd%20psychology%20book%20cover&image_size=square',
      totalCopies: 6,
      availableCopies: 6
    },
    {
      isbn: '9787200000023',
      title: '自卑与超越',
      author: '阿德勒',
      category: '心理',
      description: '个体心理学经典，超越自卑实现自我',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=adler%20psychology%20self%20help%20book%20cover&image_size=square',
      totalCopies: 5,
      availableCopies: 5
    },
    // ======== 社科 ========
    {
      isbn: '9787200000024',
      title: '资本论',
      author: '马克思',
      category: '社科',
      description: '马克思主义经典著作，政治经济学巨著',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=das%20kapital%20marx%20book%20cover&image_size=square',
      totalCopies: 3,
      availableCopies: 3
    },
    {
      isbn: '9787200000025',
      title: '乡土中国',
      author: '费孝通',
      category: '社科',
      description: '中国社会学经典，解读中国乡土社会结构',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rural%20china%20sociology%20book%20cover&image_size=square',
      totalCopies: 5,
      availableCopies: 5
    },
    // ======== 艺术 ========
    {
      isbn: '9787200000026',
      title: '艺术的故事',
      author: '贡布里希',
      category: '艺术',
      description: '全球最受欢迎的艺术史入门读物',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=story%20of%20art%20book%20cover&image_size=square',
      totalCopies: 4,
      availableCopies: 4
    },
    {
      isbn: '9787200000027',
      title: '美的历程',
      author: '李泽厚',
      category: '艺术',
      description: '中国美学经典，探寻中国审美精神',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20aesthetics%20book%20cover&image_size=square',
      totalCopies: 3,
      availableCopies: 3
    },
    // ======== 自然科学 ========
    {
      isbn: '9787200000028',
      title: '时间简史',
      author: '霍金',
      category: '自然科学',
      description: '探索宇宙奥秘的科普经典',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=brief%20history%20of%20time%20book%20cover&image_size=square',
      totalCopies: 6,
      availableCopies: 6
    },
    {
      isbn: '9787200000029',
      title: '物种起源',
      author: '达尔文',
      category: '自然科学',
      description: '进化论的奠基之作，改变人类认知',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=origin%20of%20species%20book%20cover&image_size=square',
      totalCopies: 3,
      availableCopies: 3
    },
    // ======== 经济 ========
    {
      isbn: '9787200000030',
      title: '国富论',
      author: '亚当·斯密',
      category: '经济',
      description: '现代经济学奠基之作',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=wealth%20of%20nations%20economics%20book%20cover&image_size=square',
      totalCopies: 3,
      availableCopies: 3
    },
    {
      isbn: '9787200000031',
      title: '穷爸爸富爸爸',
      author: '罗伯特·清崎',
      category: '经济',
      description: '畅销全球的理财入门书，改变金钱观',
      coverUrl:
          'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=rich%20dad%20poor%20dad%20finance%20book%20cover&image_size=square',
      totalCopies: 7,
      availableCopies: 7
    },
  ];

  extraBooks.forEach(book => {
    db.run(
        `INSERT INTO books (isbn, title, author, category, description, coverUrl, totalCopies, availableCopies)
      SELECT ?, ?, ?, ?, ?, ?, ?, ?
      WHERE NOT EXISTS (SELECT 1 FROM books WHERE isbn = ?)`,
        [
          book.isbn, book.title, book.author, book.category, book.description,
          book.coverUrl, book.totalCopies, book.availableCopies, book.isbn
        ],
        (err) => {
          if (err) console.error('Error seeding book:', err.message);
        });
  });
  console.log('Extra books seeded');
}

seedMoreBooks();
