import 'dotenv/config';
import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_in_production';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12');
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'expenses.db');

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

app.use(cors());
app.use(express.json());

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'public')));
}

let db: Database<sqlite3.Database, sqlite3.Statement>;
const initDatabase = async () => {
  try {
    db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    
    console.log('Database connected successfully');

    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS expenses (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        description TEXT,
        date TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(user_id) REFERENCES users(id)
      );
    `);
    
    console.log('Database tables initialized');
  } catch (error) {
    console.error('Database initialization failed:', error);
    process.exit(1);
  }
};


const expenseSchema = z.object({
  user_id: z.string(),
  amount: z.number(),
  category: z.string(),
  description: z.string().optional(),
  date: z.string()
});

// Extend Request interface to include user
interface AuthenticatedRequest extends Request {
  user: { user_id: string };
}

// Error handling middleware
const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error:', err.message);
  console.error('Stack:', err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ error: 'Validation failed', details: err.message });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

// Middleware to verify JWT
const authenticate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    const decoded = jwt.verify(token, SECRET) as { user_id: string };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Auth Routes
app.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password } = registerSchema.parse(req.body);
    
    const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }
    
    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    const id = uuidv4();
    const created_at = new Date().toISOString();
    
    await db.run('INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, ?)', 
      [id, email, hashed, created_at]);
    
    res.status(201).json({ 
      message: 'User created successfully',
      user: { id, email, created_at }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign({ user_id: user.id }, SECRET, { expiresIn: '24h' });
    
    res.json({ 
      message: 'Login successful',
      token,
      user: { id: user.id, email: user.email }
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Expenses Routes (authenticated)
app.post('/expenses', authenticate, async (req: Request, res: Response) => {
  try {
    const authReq = req as AuthenticatedRequest;
    const parsed = expenseSchema.parse({ ...req.body, user_id: authReq.user.user_id });
    const id = uuidv4();
    const created_at = new Date().toISOString();
    
    await db.run(
      'INSERT INTO expenses (id, user_id, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, parsed.user_id, parsed.amount, parsed.category, parsed.description || '', parsed.date, created_at]
    );
    
    const newExpense = { ...parsed, id, created_at };
    res.status(201).json({ 
      message: 'Expense created successfully',
      expense: newExpense
    });
  } catch (error: any) {
    if (error.name === 'ZodError') {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create expense error:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

app.get('/expenses', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const expenses = await db.all('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [authReq.user.user_id]);
  res.json(expenses);
});

app.put('/expenses/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const expense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, authReq.user.user_id]);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });

  const { amount, category, description, date } = req.body;
  await db.run(
    'UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
    [amount || expense.amount, category || expense.category, description ?? expense.description, date || expense.date, id, authReq.user.user_id]
  );
  res.json({ ...expense, amount, category, description, date });
});

app.delete('/expenses/:id', authenticate, async (req: Request, res: Response) => {
  const { id } = req.params;
  const authReq = req as AuthenticatedRequest;
  const expense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, authReq.user.user_id]);
  if (!expense) return res.status(404).json({ error: 'Expense not found' });
  await db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, authReq.user.user_id]);
  res.status(204).send();
});

app.get('/expenses/analytics', authenticate, async (req: Request, res: Response) => {
  const authReq = req as AuthenticatedRequest;
  const user_id = authReq.user.user_id;
  const total = await db.get('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [user_id]);
  const categoryBreakdown = await db.all(
    'SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC',
    [user_id]
  );
  const monthlySpending = await db.all(
    `SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 6`,
    [user_id]
  );
  const recentExpenses = await db.all('SELECT * FROM expenses WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [user_id]);

  res.json({
    total: total.total || 0,
    categoryBreakdown,
    monthlySpending: monthlySpending.reverse(),
    recentExpenses
  });
});

// Apply error handling middleware
app.use(errorHandler);

// Serve React app for all non-API routes in production
if (process.env.NODE_ENV === 'production') {
  app.get('*', (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
} else {
  // 404 handler for development
  app.all('*', (req: Request, res: Response) => {
    res.status(404).json({ error: 'Route not found' });
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  if (db) {
    await db.close();
  }
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  if (db) {
    await db.close();
  }
  process.exit(0);
});

initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

export default app;
