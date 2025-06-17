import axios from 'axios';

const API_BASE_URL = 'http://192.168.76.9:3001';

export interface User {
  id: string;
  email: string;
  created_at?: string;
}

export interface Expense {
  id: string;
  user_id: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at: string;
}

export interface Analytics {
  total: number;
  categoryBreakdown: Array<{
    category: string;
    total: number;
    count: number;
  }>;
  monthlySpending: Array<{
    month: string;
    total: number;
  }>;
  recentExpenses: Expense[];
}

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  register: async (email: string, password: string) => {
    const response = await api.post('/register', { email, password });
    return response.data;
  },

  login: async (email: string, password: string) => {
    const response = await api.post('/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('token');
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
};

export const expenseAPI = {
  getAll: async (): Promise<Expense[]> => {
    const response = await api.get('/expenses');
    return response.data;
  },

  create: async (expense: Omit<Expense, 'id' | 'user_id' | 'created_at'>) => {
    const response = await api.post('/expenses', expense);
    return response.data;
  },

  update: async (id: string, expense: Partial<Omit<Expense, 'id' | 'user_id' | 'created_at'>>) => {
    const response = await api.put(`/expenses/${id}`, expense);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/expenses/${id}`);
  },

  getAnalytics: async (): Promise<Analytics> => {
    const response = await api.get('/expenses/analytics');
    return response.data;
  },
};