"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const zod_1 = require("zod");
const uuid_1 = require("uuid");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3001;
const SECRET = process.env.JWT_SECRET || 'your_jwt_secret_change_in_production';
const SALT_ROUNDS = parseInt(process.env.SALT_ROUNDS || '12');
const DB_PATH = process.env.DB_PATH || path_1.default.join(__dirname, 'expenses.db');
// Validation schemas
const registerSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(6)
});
const loginSchema = zod_1.z.object({
    email: zod_1.z.string().email(),
    password: zod_1.z.string().min(1)
});
app.use((0, cors_1.default)());
app.use(express_1.default.json());
let db;
const initDatabase = async () => {
    try {
        db = await (0, sqlite_1.open)({
            filename: DB_PATH,
            driver: sqlite3_1.default.Database
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
    }
    catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};
const expenseSchema = zod_1.z.object({
    user_id: zod_1.z.string(),
    amount: zod_1.z.number(),
    category: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    date: zod_1.z.string()
});
// Error handling middleware
const errorHandler = (err, req, res, next) => {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
    if (err.name === 'ValidationError') {
        return res.status(400).json({ error: 'Validation failed', details: err.message });
    }
    res.status(500).json({ error: 'Internal server error' });
};
// Middleware to verify JWT
const authenticate = async (req, res, next) => {
    var _a;
    try {
        const token = (_a = req.headers.authorization) === null || _a === void 0 ? void 0 : _a.split(' ')[1];
        if (!token) {
            return res.status(401).json({ error: 'Access token required' });
        }
        const decoded = jsonwebtoken_1.default.verify(token, SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        console.error('Authentication error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};
// Auth Routes
app.post('/register', async (req, res) => {
    try {
        const { email, password } = registerSchema.parse(req.body);
        const existingUser = await db.get('SELECT id FROM users WHERE email = ?', [email]);
        if (existingUser) {
            return res.status(409).json({ error: 'User already exists' });
        }
        const hashed = await bcrypt_1.default.hash(password, SALT_ROUNDS);
        const id = (0, uuid_1.v4)();
        const created_at = new Date().toISOString();
        await db.run('INSERT INTO users (id, email, password, created_at) VALUES (?, ?, ?, ?)', [id, email, hashed, created_at]);
        res.status(201).json({
            message: 'User created successfully',
            user: { id, email, created_at }
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});
app.post('/login', async (req, res) => {
    try {
        const { email, password } = loginSchema.parse(req.body);
        const user = await db.get('SELECT * FROM users WHERE email = ?', [email]);
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const match = await bcrypt_1.default.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        const token = jsonwebtoken_1.default.sign({ user_id: user.id }, SECRET, { expiresIn: '24h' });
        res.json({
            message: 'Login successful',
            token,
            user: { id: user.id, email: user.email }
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});
// Expenses Routes (authenticated)
app.post('/expenses', authenticate, async (req, res) => {
    try {
        const authReq = req;
        const parsed = expenseSchema.parse({ ...req.body, user_id: authReq.user.user_id });
        const id = (0, uuid_1.v4)();
        const created_at = new Date().toISOString();
        await db.run('INSERT INTO expenses (id, user_id, amount, category, description, date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)', [id, parsed.user_id, parsed.amount, parsed.category, parsed.description || '', parsed.date, created_at]);
        const newExpense = { ...parsed, id, created_at };
        res.status(201).json({
            message: 'Expense created successfully',
            expense: newExpense
        });
    }
    catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ error: 'Invalid input', details: error.errors });
        }
        console.error('Create expense error:', error);
        res.status(500).json({ error: 'Failed to create expense' });
    }
});
app.get('/expenses', authenticate, async (req, res) => {
    const authReq = req;
    const expenses = await db.all('SELECT * FROM expenses WHERE user_id = ? ORDER BY date DESC', [authReq.user.user_id]);
    res.json(expenses);
});
app.put('/expenses/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const authReq = req;
    const expense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, authReq.user.user_id]);
    if (!expense)
        return res.status(404).json({ error: 'Expense not found' });
    const { amount, category, description, date } = req.body;
    await db.run('UPDATE expenses SET amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ?', [amount || expense.amount, category || expense.category, description !== null && description !== void 0 ? description : expense.description, date || expense.date, id, authReq.user.user_id]);
    res.json({ ...expense, amount, category, description, date });
});
app.delete('/expenses/:id', authenticate, async (req, res) => {
    const { id } = req.params;
    const authReq = req;
    const expense = await db.get('SELECT * FROM expenses WHERE id = ? AND user_id = ?', [id, authReq.user.user_id]);
    if (!expense)
        return res.status(404).json({ error: 'Expense not found' });
    await db.run('DELETE FROM expenses WHERE id = ? AND user_id = ?', [id, authReq.user.user_id]);
    res.status(204).send();
});
app.get('/expenses/analytics', authenticate, async (req, res) => {
    const authReq = req;
    const user_id = authReq.user.user_id;
    const total = await db.get('SELECT SUM(amount) as total FROM expenses WHERE user_id = ?', [user_id]);
    const categoryBreakdown = await db.all('SELECT category, SUM(amount) as total, COUNT(*) as count FROM expenses WHERE user_id = ? GROUP BY category ORDER BY total DESC', [user_id]);
    const monthlySpending = await db.all(`SELECT strftime('%Y-%m', date) as month, SUM(amount) as total FROM expenses WHERE user_id = ? GROUP BY month ORDER BY month DESC LIMIT 6`, [user_id]);
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
// 404 handler
app.all('*', (req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
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
exports.default = app;
