const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret-change-in-prod';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Auth middleware
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// ---------- AUTH ----------
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, username: user.username });
});

// ---------- PRODUCTS ----------
app.get('/api/products', auth, (req, res) => {
  const { category, status, search } = req.query;
  let query = 'SELECT * FROM products WHERE 1=1';
  const params = [];

  if (category && category !== 'All') {
    query += ' AND category = ?';
    params.push(category);
  }
  if (status && status !== 'All') {
    query += ' AND status = ?';
    params.push(status);
  }
  if (search) {
    query += ' AND (name LIKE ? OR sku LIKE ?)';
    params.push(`%${search}%`, `%${search}%`);
  }

  query += ' ORDER BY id DESC';
  const products = db.prepare(query).all(...params);
  res.json(products);
});

app.get('/api/products/categories', auth, (req, res) => {
  const categories = db.prepare('SELECT DISTINCT category FROM products ORDER BY category').all();
  res.json(categories.map(c => c.category));
});

app.post('/api/products', auth, (req, res) => {
  const { name, sku, price, quantity, threshold, category, supplier, location } = req.body;
  try {
    const result = db.prepare(
      'INSERT INTO products (name, sku, price, quantity, threshold, category, supplier, location) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
    ).run(name, sku, price, quantity || 0, threshold || 10, category || 'General', supplier || '', location || '');
    res.json({ id: result.lastInsertRowid, success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/products/:id', auth, (req, res) => {
  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// ---------- STOCK IN ----------
app.post('/api/stock/in', auth, (req, res) => {
  const { product_id, quantity } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });

  const txn = db.transaction(() => {
    db.prepare('UPDATE products SET quantity = quantity + ? WHERE id = ?').run(quantity, product_id);
    db.prepare('INSERT INTO stock_history (product_id, quantity, type) VALUES (?, ?, ?)').run(product_id, quantity, 'IN');
  });
  txn();
  res.json({ success: true });
});

// ---------- SALES (auto-deducts stock) ----------
app.post('/api/sales', auth, (req, res) => {
  const { product_id, quantity } = req.body;
  const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id);
  if (!product) return res.status(404).json({ error: 'Product not found' });
  if (product.quantity < quantity) {
    return res.status(400).json({ error: `Only ${product.quantity} in stock` });
  }

  const total = product.price * quantity;
  const txn = db.transaction(() => {
    db.prepare('INSERT INTO sales (product_id, quantity, total) VALUES (?, ?, ?)').run(product_id, quantity, total);
    db.prepare('UPDATE products SET quantity = quantity - ? WHERE id = ?').run(quantity, product_id);
    db.prepare('INSERT INTO stock_history (product_id, quantity, type) VALUES (?, ?, ?)').run(product_id, quantity, 'OUT');
  });
  txn();
  res.json({ success: true, total, productName: product.name });
});

app.get('/api/sales', auth, (req, res) => {
  const sales = db.prepare(`
    SELECT s.*, p.name as product_name, p.sku as product_sku
    FROM sales s 
    JOIN products p ON s.product_id = p.id 
    ORDER BY s.sold_at DESC LIMIT 100
  `).all();
  res.json(sales);
});

// ---------- DASHBOARD ----------
app.get('/api/dashboard', auth, (req, res) => {
  const totalProducts = db.prepare('SELECT COUNT(*) as c FROM products').get().c;
  const lowStock = db.prepare('SELECT * FROM products WHERE quantity < threshold ORDER BY quantity ASC').all();
  const totalSales = db.prepare('SELECT COALESCE(SUM(total), 0) as t FROM sales').get().t;
  const totalSalesCount = db.prepare('SELECT COUNT(*) as c FROM sales').get().c;
  const recentSales = db.prepare(`
    SELECT s.*, p.name as product_name, p.sku as product_sku
    FROM sales s JOIN products p ON s.product_id = p.id 
    ORDER BY s.sold_at DESC LIMIT 5
  `).all();

  // Category breakdown
  const categoryStats = db.prepare(`
    SELECT category, COUNT(*) as count, SUM(quantity) as totalStock
    FROM products GROUP BY category ORDER BY count DESC
  `).all();

  // Top selling products
  const topSelling = db.prepare(`
    SELECT p.name, p.sku, SUM(s.quantity) as totalSold, SUM(s.total) as totalRevenue
    FROM sales s JOIN products p ON s.product_id = p.id
    GROUP BY p.id ORDER BY totalRevenue DESC LIMIT 5
  `).all();

  res.json({ totalProducts, lowStock, totalSales, totalSalesCount, recentSales, categoryStats, topSelling });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});