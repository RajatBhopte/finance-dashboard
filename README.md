# Finance Dashboard Backend

A role-based REST API backend for a finance dashboard system. It handles authentication, user management, financial transaction records, and dashboard analytics — with access control enforced at the middleware level based on user roles.

Built with **Node.js**, **Express**, **Prisma ORM**, and **PostgreSQL**.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Data Model](#data-model)
- [Roles and Permissions](#roles-and-permissions)
- [Local Setup](#local-setup)
- [API Reference](#api-reference)
  - [Auth](#auth)
  - [Users](#users)
  - [Transactions](#transactions)
  - [Dashboard](#dashboard)
- [Validation and Error Handling](#validation-and-error-handling)
- [Rate Limiting](#rate-limiting)
- [Assumptions](#assumptions)
- [What Could Be Added Next](#what-could-be-added-next)

---

## Overview

This backend serves a finance dashboard where users interact with financial records based on their assigned role. The system supports:

- User registration and login with JWT authentication
- Role-based access control (Viewer, Analyst, Admin)
- Full CRUD for financial transactions with soft delete
- Filtering, searching, and pagination on transaction listings
- Dashboard endpoints returning aggregated financial data: income/expense totals, net balance, category breakdowns, monthly trends, and recent activity

---

## Tech Stack

| Layer              | Technology                       |
|--------------------|----------------------------------|
| Runtime            | Node.js                          |
| Framework          | Express.js v5                    |
| Database           | PostgreSQL (hosted on Neon)      |
| ORM                | Prisma 7 (with `@prisma/adapter-pg`) |
| Authentication     | JWT (`jsonwebtoken`)             |
| Password Hashing   | `bcryptjs`                       |
| Rate Limiting      | `express-rate-limit`             |
| Environment Config | `dotenv`                         |

---

## Project Structure

```
finance-backend/
├── prisma/
│   └── schema.prisma          # Database schema (User, Transaction models + enums)
├── src/
│   ├── config/
│   │   └── db.js              # Prisma client singleton
│   ├── controllers/
│   │   ├── authController.js       # Register, login, logout
│   │   ├── userController.js       # List users, update role/status
│   │   ├── transactionController.js # CRUD + filtering + pagination
│   │   └── dashboardController.js  # Summary, category totals, trends, recent activity
│   ├── middleware/
│   │   ├── auth.js            # protect (JWT verify) + authorize (role guard)
│   │   ├── errorHandler.js    # Global error handler
│   │   └── rateLimiter.js     # API limiter + stricter auth limiter
│   ├── routes/
│   │   ├── auth.js            # /api/auth
│   │   ├── users.js           # /api/users
│   │   ├── transactions.js    # /api/transactions
│   │   └── dashboard.js       # /api/dashboard
│   └── services/
│       └── dashboardService.js # Aggregation logic for dashboard endpoints
├── .env.example               # Environment variable template
├── prisma.config.ts           # Prisma adapter configuration
├── seed.js                    # Demo data seeder (3 users + 5 transactions)
├── server.js                  # App entry point
└── package.json
```

**Architecture summary:**
- Routes handle HTTP method + path matching and apply middleware
- Controllers validate input, call the database or service, and return responses
- Services (dashboard only) contain aggregation logic separated from the controller
- Middleware handles cross-cutting concerns: auth, error formatting, rate limiting

---

## Data Model

### User

| Field       | Type      | Notes                              |
|-------------|-----------|------------------------------------|
| `id`        | UUID      | Primary key                        |
| `name`      | String    |                                    |
| `email`     | String    | Unique                             |
| `password`  | String    | bcrypt hash, never returned in API |
| `role`      | Enum      | `VIEWER` \| `ANALYST` \| `ADMIN`   |
| `isActive`  | Boolean   | Default `true`                     |
| `createdAt` | DateTime  |                                    |

### Transaction

| Field       | Type      | Notes                                  |
|-------------|-----------|----------------------------------------|
| `id`        | UUID      | Primary key                            |
| `amount`    | Decimal   | `Decimal(12, 2)` — supports large values |
| `type`      | Enum      | `INCOME` \| `EXPENSE`                  |
| `category`  | String    | e.g. Salary, Rent, Groceries           |
| `date`      | DateTime  | The recorded date of the transaction   |
| `notes`     | String?   | Optional description                   |
| `isDeleted` | Boolean   | Default `false` — soft delete flag     |
| `createdBy` | UUID (FK) | References `User.id`                   |
| `createdAt` | DateTime  | Server timestamp                       |

Indexed on: `createdBy`, `type`, `date`, `isDeleted` for query performance.

---

## Roles and Permissions

| Action                           | Viewer | Analyst | Admin |
|----------------------------------|:------:|:-------:|:-----:|
| Register / Login                 | ✅     | ✅      | ✅    |
| View transactions (list/single)  | ✅     | ✅      | ✅    |
| Filter / search / paginate       | ✅     | ✅      | ✅    |
| Create transaction               | ❌     | ❌      | ✅    |
| Update transaction               | ❌     | ❌      | ✅    |
| Delete transaction (soft)        | ❌     | ❌      | ✅    |
| Dashboard summary                | ✅     | ✅      | ✅    |
| Category totals                  | ✅     | ✅      | ✅    |
| Monthly trends                   | ❌     | ✅      | ✅    |
| Recent activity                  | ❌     | ✅      | ✅    |
| List users                       | ❌     | ❌      | ✅    |
| Change user role                 | ❌     | ❌      | ✅    |
| Activate / deactivate user       | ❌     | ❌      | ✅    |

---

## Local Setup

### Prerequisites

- Node.js v18+
- A PostgreSQL database (local or hosted — [Neon](https://neon.tech) recommended for free cloud Postgres)

---

### Step 1 — Clone the repo and install dependencies

```bash
git clone https://github.com/your-username/Finance-dashboard.git
cd Finance-dashboard/finance-backend
npm install
```

---

### Step 2 — Configure environment variables

Copy the example file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host/database?sslmode=require"
JWT_SECRET="your_super_secret_key_here"
PORT=5000
```

> `DIRECT_URL` is optional. If omitted, Prisma falls back to `DATABASE_URL` for migrations. Both can point to the same connection string.

---

### Step 3 — Push the schema to the database

```bash
npm run prisma:push
```

This creates the `User` and `Transaction` tables in your database.

Then generate the Prisma client:

```bash
npm run prisma:generate
```

---

### Step 4 — Seed demo data

```bash
npm run seed
```

This creates three demo users with sample transactions:

| Email                  | Password     | Role    |
|------------------------|--------------|---------|
| admin@finance.com      | admin123     | ADMIN   |
| analyst@finance.com    | analyst123   | ANALYST |
| viewer@finance.com     | viewer123    | VIEWER  |

---

### Step 5 — Start the development server

```bash
npm run dev
```

The API will be available at: `http://localhost:5000`

Health check: `GET http://localhost:5000/api/health`

For production:

```bash
npm start
```

---

### Available npm scripts

| Script                  | Description                             |
|-------------------------|-----------------------------------------|
| `npm run dev`           | Start server with nodemon (hot reload)  |
| `npm start`             | Start server (production)               |
| `npm run prisma:push`   | Push schema changes to the database     |
| `npm run prisma:generate` | Regenerate Prisma client              |
| `npm run prisma:studio` | Open Prisma Studio (visual DB browser)  |
| `npm run seed`          | Seed the database with demo data        |

---

## API Reference

All protected routes require a JWT token in the `Authorization` header:

```
Authorization: Bearer <your_token>
```

---

### Auth

Base path: `/api/auth`

#### `POST /api/auth/register`
Create a new user account. New users are assigned the `VIEWER` role by default.

**Access:** Public

**Request body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

**Response `201`:**
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "VIEWER",
    "isActive": true,
    "createdAt": "2026-01-01T00:00:00.000Z"
  }
}
```

---

#### `POST /api/auth/login`
Login with email and password. Returns a JWT token.

**Access:** Public

**Request body:**
```json
{
  "email": "admin@finance.com",
  "password": "admin123"
}
```

**Response `200`:**
```json
{
  "success": true,
  "token": "<jwt_token>",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@finance.com",
    "role": "ADMIN",
    "isActive": true
  }
}
```

---

#### `GET /api/auth/logout`
Stateless logout. The client is responsible for discarding the token.

**Access:** Public

**Response `200`:**
```json
{
  "success": true,
  "message": "Logged out successfully. Please clear your token on the client."
}
```

---

### Users

Base path: `/api/users`

**Access:** Admin only

#### `GET /api/users`
List all users. Supports optional filters.

**Query params:**

| Param      | Type    | Example          |
|------------|---------|------------------|
| `role`     | string  | `VIEWER`, `ANALYST`, `ADMIN` |
| `isActive` | boolean | `true`, `false`  |

**Response `200`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": "uuid",
      "name": "Admin User",
      "email": "admin@finance.com",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "_count": { "transactions": 2 }
    }
  ]
}
```

---

#### `PATCH /api/users/:id/role`
Change a user's role.

**Request body:**
```json
{
  "role": "ANALYST"
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User role updated successfully.",
  "data": { ... }
}
```

> Admins cannot change their own role. The system also prevents demoting the last active admin.

---

#### `PATCH /api/users/:id/status`
Activate or deactivate a user.

**Request body:**
```json
{
  "isActive": false
}
```

**Response `200`:**
```json
{
  "success": true,
  "message": "User deactivated successfully.",
  "data": { ... }
}
```

> Admins cannot deactivate themselves. Deactivating the last active admin is blocked.

---

### Transactions

Base path: `/api/transactions`

#### `POST /api/transactions`
Create a new transaction.

**Access:** Admin only

**Request body:**
```json
{
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2026-01-23",
  "notes": "Monthly salary"
}
```

| Field      | Required | Notes                        |
|------------|----------|------------------------------|
| `amount`   | Yes      | Positive number              |
| `type`     | Yes      | `INCOME` or `EXPENSE`        |
| `category` | Yes      | Non-empty string             |
| `date`     | Yes      | ISO date string              |
| `notes`    | No       | Optional description         |

**Response `201`:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "amount": "5000.00",
    "type": "INCOME",
    "category": "Salary",
    "date": "2026-01-23T00:00:00.000Z",
    "notes": "Monthly salary",
    "isDeleted": false,
    "createdBy": "uuid",
    "createdAt": "2026-01-23T10:00:00.000Z",
    "user": { "id": "uuid", "name": "Admin User", "email": "admin@finance.com" }
  }
}
```

---

#### `GET /api/transactions`
List all transactions. Supports filtering, searching, and pagination.

**Access:** All authenticated users

**Query params:**

| Param        | Type   | Description                           |
|--------------|--------|---------------------------------------|
| `type`       | string | Filter by `INCOME` or `EXPENSE`       |
| `category`   | string | Filter by category (case-insensitive) |
| `startDate`  | string | Filter from date (e.g. `2026-01-01`)  |
| `endDate`    | string | Filter to date (e.g. `2026-01-31`)    |
| `search`     | string | Search in category, notes, user name/email |
| `page`       | number | Page number (default: `1`)            |
| `limit`      | number | Results per page (default: `10`)      |

**Example:**
```
GET /api/transactions?type=EXPENSE&category=rent&page=1&limit=5
GET /api/transactions?search=salary&startDate=2026-01-01&endDate=2026-03-31
```

**Response `200`:**
```json
{
  "success": true,
  "count": 2,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 12,
    "totalPages": 2
  },
  "data": [ ... ]
}
```

---

#### `GET /api/transactions/:id`
Get a single transaction by ID.

**Access:** All authenticated users

**Response `200`:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### `PUT /api/transactions/:id`
Update a transaction. Only provided fields are updated (partial update supported).

**Access:** Admin only

**Request body (all fields optional):**
```json
{
  "amount": 6000,
  "category": "Bonus",
  "notes": "Q1 bonus"
}
```

**Response `200`:**
```json
{
  "success": true,
  "data": { ... }
}
```

---

#### `DELETE /api/transactions/:id`
Soft delete a transaction. Sets `isDeleted = true`. The record is not removed from the database.

**Access:** Admin only

**Response `200`:**
```json
{
  "success": true,
  "message": "Transaction deleted successfully."
}
```

---

### Dashboard

Base path: `/api/dashboard`

#### `GET /api/dashboard/summary`
Returns total income, total expenses, and net balance across all non-deleted transactions.

**Access:** All authenticated users

**Response `200`:**
```json
{
  "success": true,
  "data": {
    "totalIncome": 59000,
    "totalExpense": 19500,
    "netBalance": 39500
  }
}
```

---

#### `GET /api/dashboard/category`
Returns income, expense, and net totals grouped by category, sorted by net descending.

**Access:** All authenticated users

**Response `200`:**
```json
{
  "success": true,
  "count": 5,
  "data": [
    { "category": "Salary", "income": 50000, "expense": 0, "net": 50000 },
    { "category": "Freelance", "income": 9000, "expense": 0, "net": 9000 },
    { "category": "Groceries", "income": 0, "expense": 3000, "net": -3000 },
    { "category": "Transport", "income": 0, "expense": 4500, "net": -4500 },
    { "category": "Rent", "income": 0, "expense": 12000, "net": -12000 }
  ]
}
```

---

#### `GET /api/dashboard/trends`
Returns monthly income and expense totals, ordered from oldest to newest month.

**Access:** Analyst, Admin

**Response `200`:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    { "month": "2026-01", "income": 50000, "expense": 12000, "net": 38000 },
    { "month": "2026-02", "income": 9000, "expense": 3000, "net": 6000 },
    { "month": "2026-03", "income": 0, "expense": 4500, "net": -4500 }
  ]
}
```

---

#### `GET /api/dashboard/recent`
Returns the most recent transactions. Defaults to 10, configurable via `?limit=`.

**Access:** Analyst, Admin

**Query params:**

| Param   | Type   | Default | Description                        |
|---------|--------|---------|------------------------------------|
| `limit` | number | `10`    | Max number of recent entries       |

**Example:** `GET /api/dashboard/recent?limit=5`

**Response `200`:**
```json
{
  "success": true,
  "count": 5,
  "data": [ ... ]
}
```

---

## Validation and Error Handling

All responses use a consistent shape:

```json
{ "success": true, "data": { ... } }
{ "success": false, "message": "Descriptive error message." }
```

**HTTP status codes used:**

| Code | Meaning                          |
|------|----------------------------------|
| 200  | OK                               |
| 201  | Created                          |
| 400  | Validation error / bad request   |
| 401  | Missing or invalid token         |
| 403  | Forbidden (insufficient role)    |
| 404  | Resource not found               |
| 429  | Too many requests (rate limited) |
| 500  | Internal server error            |

Input validation is handled manually in each controller. Examples of what is validated:
- `amount` must be a positive finite number
- `type` must be exactly `INCOME` or `EXPENSE`
- Date strings are parsed and invalid values are rejected
- `startDate` cannot be later than `endDate`
- `page` and `limit` must be positive integers
- Boolean values (`isActive`) accept `true`/`false` as strings or booleans

---

## Rate Limiting

The API includes two rate limiters:

| Limiter        | Routes                           | Limit                     |
|----------------|----------------------------------|---------------------------|
| `apiLimiter`   | All `/api/*` routes              | 200 requests per 15 min   |
| `authLimiter`  | `/api/auth/register`, `/api/auth/login` | 10 requests per 15 min |

The stricter auth limiter protects against brute-force login attempts.

---

## Assumptions

1. New users register as `VIEWER` by default. Only an admin can elevate a user's role.
2. Only admins can create, update, or delete transactions.
3. Inactive users are denied access to all protected routes, even with a valid token.
4. Transactions are never permanently deleted through the API — soft delete via `isDeleted = true`.
5. All transaction queries automatically exclude soft-deleted records.
6. The system enforces at least one active admin at all times — admin demotion or deactivation is blocked if it would leave zero active admins.
7. The `authLimiter` and `apiLimiter` are separate to allow stricter protection on sensitive auth endpoints.

---

## What Could Be Added Next

- **Swagger / OpenAPI documentation** — interactive API docs
- **Postman collection** — for easy manual testing
- **Unit and integration tests** — with Jest or Vitest
- **Refresh token flow** — for long-lived sessions without long-expiry JWTs
- **CSV export** — for downloading transaction records
- **Weekly trends endpoint** — alongside the existing monthly view
- **`GET /api/users/:id`** — fetch a single user's profile
- **Sorting options** — on transaction listing (e.g. sort by amount or category)
