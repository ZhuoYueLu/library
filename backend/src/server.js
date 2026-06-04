const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

app.get('/api/books', (req, res) => {
  const { keyword, category } = req.query;
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
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.get('/api/books/:id', (req, res) => {
  db.get('SELECT * FROM books WHERE id = ?', [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(404).json({ error: 'Book not found' });
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
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/books/:id/comments', (req, res) => {
  const { id: bookId } = req.params;
  const { studentId, content, rating } = req.body;
  const query = 'INSERT INTO comments (bookId, studentId, content, rating) VALUES (?, ?, ?, ?)';
  db.run(query, [bookId, studentId, content, rating], function(err) {
    if (err) {
      console.error('Error inserting comment:', err);
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Comment added successfully' });
  });
});

app.post('/api/students/login', (req, res) => {
  const { studentId, password } = req.body;
  db.get('SELECT * FROM students WHERE studentId = ? AND password = ?', [studentId, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    res.json({ success: true, student: row });
  });
});

app.post('/api/admins/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!row) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }
    res.json({ success: true, admin: row });
  });
});

// 注册接口
app.post('/api/register', (req, res) => {
  const { studentId, name, email, phone, password } = req.body;
  
  // 前端验证
  if (!studentId || !/^\d+$/.test(studentId)) {
    res.status(400).json({ error: '学号只能是数字' });
    return;
  }
  
  if (phone && !/^\d+$/.test(phone)) {
    res.status(400).json({ error: '电话只能是数字' });
    return;
  }
  
  if (password && /[\u4e00-\u9fa5]/.test(password)) {
    res.status(400).json({ error: '密码不能包含中文' });
    return;
  }
  
  if (email && /[\u4e00-\u9fa5]/.test(email)) {
    res.status(400).json({ error: '邮箱不能包含中文' });
    return;
  }
  
  // 检查学号是否已存在
  db.get('SELECT id FROM students WHERE studentId = ?', [studentId], (err, existing) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (existing) {
      res.status(400).json({ error: '该学号已注册，请直接登录' });
      return;
    }
    
    // 插入新学生
    db.run('INSERT INTO students (studentId, name, email, phone, password) VALUES (?, ?, ?, ?, ?)', 
      [studentId, name, email || '', phone || '', password || '123456'], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true, message: '注册成功' });
      });
  });
});

// 统一登录接口
app.post('/api/login', (req, res) => {
  const { account, password } = req.body;
  
  // 后端验证
  if (!account || /[\u4e00-\u9fa5]/.test(account)) {
    res.status(400).json({ error: '账号不能包含中文' });
    return;
  }
  
  if (!password || /[\u4e00-\u9fa5]/.test(password)) {
    res.status(400).json({ error: '密码不能包含中文' });
    return;
  }
  
  // 先尝试管理员登录
  db.get('SELECT * FROM admins WHERE username = ? AND password = ?', [account, password], (err, admin) => {
    if (admin) {
      res.json({ success: true, role: 'admin', user: admin });
      return;
    }
    
    // 再尝试学生登录
    db.get('SELECT * FROM students WHERE studentId = ? AND password = ?', [account, password], (err, student) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      if (!student) {
        res.status(401).json({ error: '账号或密码错误' });
        return;
      }
      res.json({ success: true, role: 'student', user: student });
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
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/borrow', (req, res) => {
  const { studentId, bookId } = req.body;
  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 30);

  db.get('SELECT * FROM books WHERE id = ?', [bookId], (err, book) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!book || book.availableCopies <= 0) {
      res.status(400).json({ error: 'Book not available' });
      return;
    }

    db.run('INSERT INTO borrow_records (studentId, bookId, dueDate) VALUES (?, ?, ?)', 
      [studentId, bookId, dueDate.toISOString()], function(err) {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        db.run('UPDATE books SET availableCopies = availableCopies - 1 WHERE id = ?', [bookId], (err) => {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.json({ success: true, message: 'Book borrowed successfully' });
        });
      });
  });
});

app.post('/api/return', (req, res) => {
  const { recordId } = req.body;
  
  db.get('SELECT * FROM borrow_records WHERE id = ?', [recordId], (err, record) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!record || record.status !== 'borrowed') {
      res.status(400).json({ error: 'Invalid record' });
      return;
    }

    db.run('UPDATE borrow_records SET status = "returned", returnDate = CURRENT_TIMESTAMP WHERE id = ?', [recordId], (err) => {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      db.run('UPDATE books SET availableCopies = availableCopies + 1 WHERE id = ?', [record.bookId], (err) => {
        if (err) {
          res.status(500).json({ error: err.message });
          return;
        }
        res.json({ success: true, message: 'Book returned successfully' });
      });
    });
  });
});

app.get('/api/admin/books', (req, res) => {
  db.all('SELECT * FROM books ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/admin/books', (req, res) => {
  const { isbn, title, author, category, description, coverUrl, totalCopies } = req.body;
  const query = 'INSERT INTO books (isbn, title, author, category, description, coverUrl, totalCopies, availableCopies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
  db.run(query, [isbn, title, author, category, description, coverUrl, totalCopies, totalCopies], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Book added successfully' });
  });
});

app.put('/api/admin/books/:id', (req, res) => {
  const { id } = req.params;
  const { isbn, title, author, category, description, coverUrl, totalCopies } = req.body;
  const query = 'UPDATE books SET isbn = ?, title = ?, author = ?, category = ?, description = ?, coverUrl = ?, totalCopies = ? WHERE id = ?';
  db.run(query, [isbn, title, author, category, description, coverUrl, totalCopies, id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Book updated successfully' });
  });
});

app.delete('/api/admin/books/:id', (req, res) => {
  db.run('DELETE FROM books WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ message: 'Book deleted successfully' });
  });
});

app.get('/api/admin/students', (req, res) => {
  db.all('SELECT * FROM students ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(rows);
  });
});

app.post('/api/admin/students', (req, res) => {
  const { studentId, name, email, phone } = req.body;
  const query = 'INSERT INTO students (studentId, name, email, phone) VALUES (?, ?, ?, ?)';
  db.run(query, [studentId, name, email, phone], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ id: this.lastID, message: 'Student added successfully' });
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
      res.status(500).json({ error: err.message });
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
      
      db.get('SELECT COUNT(*) as count FROM borrow_records WHERE status = "borrowed"', (err, row) => {
        stats.borrowedBooks = row.count;
        
        res.json(stats);
      });
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
