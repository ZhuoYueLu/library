/**
 * 数据库初始化与连接管理模块
 *
 * 功能：
 * - 创建并连接 SQLite 数据库（文件自动创建）
 * - 初始化 5 张数据表（books, students, admins, borrow_records, comments）
 * - 插入示例种子数据（5本图书、1个管理员、2个学生）
 *
 * 表结构：
 * - books:        图书信息（书名、作者、分类、库存等）
 * - students:     学生信息（学号、姓名、密码等）
 * - admins:       管理员信息（用户名、密码等）
 * - borrow_records: 借阅记录（学生、图书、日期、状态）
 * - comments:     评论（图书、学生、内容、评分）
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../library.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err);
  } else {
    console.log('Connected to SQLite database');
    initTables();
  }
});

function initTables() {
  db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      isbn TEXT,
      title TEXT NOT NULL,
      author TEXT NOT NULL,
      category TEXT,
      description TEXT,
      coverUrl TEXT,
      totalCopies INTEGER DEFAULT 1,
      availableCopies INTEGER DEFAULT 1,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      password TEXT DEFAULT '123456',
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS admins (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS borrow_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      studentId INTEGER,
      bookId INTEGER,
      borrowDate DATETIME DEFAULT CURRENT_TIMESTAMP,
      dueDate DATETIME,
      returnDate DATETIME,
      status TEXT DEFAULT 'borrowed',
      FOREIGN KEY (studentId) REFERENCES students(id),
      FOREIGN KEY (bookId) REFERENCES books(id)
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      bookId INTEGER,
      studentId INTEGER,
      content TEXT NOT NULL,
      rating INTEGER,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bookId) REFERENCES books(id),
      FOREIGN KEY (studentId) REFERENCES students(id)
    )`);

    const insertSampleData = (insertFn) => {
      db.get('SELECT COUNT(*) as count FROM books', (err, row) => {
        if (row.count === 0) {
          insertFn();
        }
      });
    };

    insertSampleData(() => {
      const sampleBooks = [
        {
          isbn: '9787111111111',
          title: 'JavaScript高级程序设计',
          author: 'Nicholas C. Zakas',
          category: '计算机',
          description: 'JavaScript经典教程',
          coverUrl:
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=JavaScript%20programming%20book%20cover&image_size=square',
          totalCopies: 5,
          availableCopies: 5
        },
        {
          isbn: '9787111222222',
          title: '深入理解计算机系统',
          author: 'Bryant',
          category: '计算机',
          description: '计算机系统原理',
          coverUrl:
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=computer%20science%20book%20cover&image_size=square',
          totalCopies: 3,
          availableCopies: 3
        },
        {
          isbn: '9787111333333',
          title: '算法导论',
          author: 'Cormen',
          category: '计算机',
          description: '算法经典教材',
          coverUrl:
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=algorithm%20book%20cover&image_size=square',
          totalCopies: 4,
          availableCopies: 4
        },
        {
          isbn: '9787111444444',
          title: '红楼梦',
          author: '曹雪芹',
          category: '文学',
          description: '中国古典名著',
          coverUrl:
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=chinese%20classic%20literature%20book%20cover&image_size=square',
          totalCopies: 8,
          availableCopies: 8
        },
        {
          isbn: '9787111555555',
          title: '三体',
          author: '刘慈欣',
          category: '科幻',
          description: '科幻史诗巨作',
          coverUrl:
              'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=science%20fiction%20book%20cover&image_size=square',
          totalCopies: 10,
          availableCopies: 10
        }
      ];

      sampleBooks.forEach(book => {
        db.run(
            `INSERT INTO books (isbn, title, author, category, description, coverUrl, totalCopies, availableCopies) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              book.isbn, book.title, book.author, book.category,
              book.description, book.coverUrl, book.totalCopies,
              book.availableCopies
            ]);
      });

      db.run(
          `INSERT INTO admins (username, password, name) VALUES (?, ?, ?)`,
          ['admin', 'admin123', '系统管理员']);

      db.run(
          `INSERT INTO students (studentId, name, email, password) VALUES (?, ?, ?, ?)`,
          ['2024001', '张三', 'zhangsan@example.com', '123456']);
      db.run(
          `INSERT INTO students (studentId, name, email, password) VALUES (?, ?, ?, ?)`,
          ['2024002', '李四', 'lisi@example.com', '123456']);
    });
  });
}

module.exports = db;
