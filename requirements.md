## 💼 Project: Expense Tracker (Exercise 4)

### 🧩 Functional Requirements

Implement a full-stack expense tracker with the following REST API endpoints:

#### 🔐 Auth APIs (Login/Register)
- `POST /auth/register`: Register a new user
- `POST /auth/login`: Login a user and return a JWT token

#### 💸 Expense APIs
- `POST /expenses`: Create a new expense
- `GET /expenses`: Retrieve all expenses for the logged-in user
- `PUT /expenses/:id`: Update a specific expense
- `DELETE /expenses/:id`: Delete a specific expense
- `GET /expenses/analytics`: Return analytics like total spend, category-wise breakdown, etc.

---

### 🧾 Data Model

Use the following schema for expenses (stored in SQLite):

```ts
type Expense = {
  id: string;            // UUID
  user_id: string;       // Foreign key to user
  amount: number;
  category: string;
  description: string;
  date: string;          // YYYY-MM-DD
  created_at: string;    // ISO timestamp
};
```

---

### 🔧 Backend Stack

- **Language**: TypeScript (Node.js)
- **Framework**: Express
- **Validation**: [Zod](https://github.com/colinhacks/zod)
- **Auth**: JWT (jsonwebtokens)
- **Database**: SQLite3 (use `better-sqlite3` or `sqlite` module)
- **ORM/Query**: You can use raw queries or lightweight ORMs like `drizzle` if preferred

#### Backend Requirements

- Middleware to validate JWT and extract user context
- Zod schemas to validate incoming request bodies
- Expense routes as described above
- SQLite database setup and migration scripts
- Proper HTTP status codes and error handling

---

### 🎨 Frontend Stack

- **Language**: TypeScript
- **Framework**: React
- **UI Library**: Chakra UI
- **Theme Support**: Dark mode + Light mode toggle using Chakra's `useColorMode()`
- **State Management**: React Context or Redux (Context is fine for this project)
- **Routing**: React Router

#### Frontend Requirements

- Register/Login page (connect to backend using fetch/axios)
- Expense Dashboard
  - List all expenses
  - Filter by category/date (optional)
  - Add, Edit, Delete expense
- Analytics Page
  - Total spent
  - Breakdown by category (use a chart library like `recharts` or Chakra components)
- UI should be responsive and switchable between light and dark mode

---

### 🧪 Suggested File Structure

#### Backend (Express)
```
/backend
  /routes
    auth.ts
    expenses.ts
  /middleware
    authMiddleware.ts
  /schemas
    expenseSchema.ts
    userSchema.ts
  /db
    init.ts
  server.ts
```

#### Frontend (React + Chakra UI)
```
/frontend
  /pages
    Login.tsx
    Register.tsx
    Dashboard.tsx
    Analytics.tsx
  /components
    ExpenseForm.tsx
    ExpenseList.tsx
    NavBar.tsx
  /contexts
    AuthContext.tsx
  /utils
    api.ts
    theme.ts
  App.tsx
  main.tsx
```

---

| Feature                | Description                                                 |
| ---------------------- | ----------------------------------------------------------- |
| ✅ Working Auth         | JWT-based login & register                                  |
| ✅ CRUD Operations      | Create, read, update, delete expenses                       |
| ✅ Two Working Charts   | At least 2 visual charts (e.g., total by category and time) |
| ✅ Data Filtering       | Filter expenses by date or category                         |
| ✅ Responsive Design    | UI should work on mobile & desktop                          |
| ✅ Authorization Checks | Only logged-in users can access their own expenses          |

