# Finance Dashboard Backend

A role-based finance dashboard backend built with Node.js, Express, Prisma, and PostgreSQL. The API supports authentication, user management, transaction management, dashboard analytics, soft delete, pagination, search, and rate limiting.

## Tech Stack

| Layer | Technology |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 7 |
| Auth | JWT |
| Password Hashing | bcryptjs |
| Rate Limiting | express-rate-limit |
| Environment Variables | dotenv |

## Project Structure

```text
finance-backend/
|-- prisma/
|   `-- schema.prisma
|-- src/
|   |-- config/
|   |   `-- db.js
|   |-- controllers/
|   |   |-- authController.js
|   |   |-- dashboardController.js
|   |   |-- transactionController.js
|   |   `-- userController.js
|   |-- middleware/
|   |   |-- auth.js
|   |   |-- errorHandler.js
|   |   `-- rateLimiter.js
|   |-- routes/
|   |   |-- auth.js
|   |   |-- dashboard.js
|   |   |-- transactions.js
|   |   `-- users.js
|   `-- services/
|       `-- dashboardService.js
|-- .env.example
|-- package.json
|-- prisma.config.ts
|-- seed.js
`-- server.js
```

## Features

- JWT-based authentication with role-aware authorization
- Role model: `VIEWER`, `ANALYST`, `ADMIN`
- Admin-only user management
- Admin-only transaction create/update/delete
- Transaction filters by type, category, date range
- Transaction pagination and search
- Soft delete for transactions
- Dashboard summary, category totals, monthly trends, and recent activity
- Rate limiting for auth routes and the wider API

## Setup

### 1. Install dependencies

From the backend folder:

```bash
cd finance-backend
npm install
```

### 2. Configure environment variables

Create `.env` in `finance-backend/`:

```env
DATABASE_URL="postgresql://username:password@host/database?sslmode=require"
DIRECT_URL="postgresql://username:password@host/database?sslmode=require"
JWT_SECRET="your_super_secret_key"
PORT=5000
```

Notes:
- `DATABASE_URL` is used by the running app.
- `DIRECT_URL` is optional here and can point to the same database. Prisma config falls back to `DATABASE_URL` if `DIRECT_URL` is not set.

### 3. Push schema and generate Prisma client

```bash
npm run prisma:push
npm run prisma:generate
```

### 4. Seed demo data

```bash
npm run seed
```

This creates demo users:

| Email | Password | Role |
|---|---|---|
| admin@finance.com | admin123 | ADMIN |
| analyst@finance.com | analyst123 | ANALYST |
| viewer@finance.com | viewer123 | VIEWER |

### 5. Start the server

```bash
npm run dev
```

Production:

```bash
npm start
```

Base URL:

```text
http://localhost:5000
```

## Prisma Notes

This project uses Prisma 7's adapter-based setup:

- Prisma schema lives in `finance-backend/prisma/schema.prisma`
- Prisma config lives in `finance-backend/prisma.config.ts`
- Prisma client runtime uses `@prisma/adapter-pg`

Useful commands:

```bash
npm run prisma:push
npm run prisma:generate
npm run prisma:studio
```

## Roles and Permissions

| Feature | Viewer | Analyst | Admin |
|---|:---:|:---:|:---:|
| Register / Login | Yes | Yes | Yes |
| View transactions | Yes | Yes | Yes |
| Filter/search/paginate transactions | Yes | Yes | Yes |
| View single transaction | Yes | Yes | Yes |
| Create transaction | No | No | Yes |
| Update transaction | No | No | Yes |
| Delete transaction | No | No | Yes |
| Dashboard summary | Yes | Yes | Yes |
| Category totals | Yes | Yes | Yes |
| Monthly trends | No | Yes | Yes |
| Recent activity | No | Yes | Yes |
| View users | No | No | Yes |
| Change user role | No | No | Yes |
| Activate / deactivate user | No | No | Yes |

## Authentication

Protected routes require:

```http
Authorization: Bearer <jwt_token>
```

The `protect` middleware verifies the token and attaches the authenticated user to `req.user`. The `authorize(...)` middleware restricts access by role.

## API Endpoints

### Auth

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | Create a new account | Public |
| POST | `/api/auth/login` | Login and receive a token | Public |
| GET | `/api/auth/logout` | Stateless logout message | Public |

Example register body:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123"
}
```

Example login body:

```json
{
  "email": "admin@finance.com",
  "password": "admin123"
}
```

Example login response:

```json
{
  "success": true,
  "token": "jwt_here",
  "user": {
    "id": "uuid",
    "name": "Admin User",
    "email": "admin@finance.com",
    "role": "ADMIN",
    "isActive": true
  }
}
```

### Users

Admin only.

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/users` | List users |
| PATCH | `/api/users/:id/role` | Change user role |
| PATCH | `/api/users/:id/status` | Activate / deactivate user |

Supported query params for `GET /api/users`:

```text
?role=ADMIN
?isActive=true
?role=VIEWER&isActive=false
```

Example role update body:

```json
{
  "role": "ANALYST"
}
```

Example status update body:

```json
{
  "isActive": false
}
```

### Transactions

| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/transactions` | Create transaction | Admin |
| GET | `/api/transactions` | List transactions | All authenticated users |
| GET | `/api/transactions/:id` | Get one transaction | All authenticated users |
| PUT | `/api/transactions/:id` | Update transaction | Admin |
| DELETE | `/api/transactions/:id` | Soft delete transaction | Admin |

Example create body:

```json
{
  "amount": 5000,
  "type": "INCOME",
  "category": "Salary",
  "date": "2026-01-23",
  "notes": "Monthly salary"
}
```

Supported query params for `GET /api/transactions`:

```text
?type=INCOME
?category=Salary
?startDate=2026-01-01&endDate=2026-01-31
?search=salary
?page=1&limit=10
?type=EXPENSE&search=rent&page=2&limit=5
```

Example list response shape:

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
  "data": []
}
```

### Dashboard

| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/dashboard/summary` | Total income, expense, net balance | All authenticated users |
| GET | `/api/dashboard/category` | Category-wise totals | All authenticated users |
| GET | `/api/dashboard/trends` | Monthly trends | Analyst, Admin |
| GET | `/api/dashboard/recent` | Recent activity | Analyst, Admin |

Optional query param:

```text
/api/dashboard/recent?limit=5
```

Example summary response:

```json
{
  "success": true,
  "data": {
    "totalIncome": 64000,
    "totalExpense": 19500,
    "netBalance": 44500
  }
}
```

Example trends response:

```json
{
  "success": true,
  "data": [
    { "month": "2026-01", "income": 55000, "expense": 12000, "net": 43000 },
    { "month": "2026-02", "income": 9000, "expense": 3000, "net": 6000 }
  ]
}
```

## Data Model

### User

```text
id          String    UUID primary key
name        String
email       String    unique
password    String    bcrypt hash
role        Enum      VIEWER | ANALYST | ADMIN
isActive    Boolean   default true
createdAt   DateTime
```

### Transaction

```text
id          String    UUID primary key
amount      Decimal   Decimal(12, 2)
type        Enum      INCOME | EXPENSE
category    String
date        DateTime
notes       String?   optional
isDeleted   Boolean   default false
createdBy   String    foreign key -> User.id
createdAt   DateTime
```

## Validation and Error Handling

The API uses structured JSON responses and appropriate status codes.

Examples:

```json
{
  "success": false,
  "message": "Descriptive error message here"
}
```

Common status codes:

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Validation or bad request |
| 401 | Missing or invalid token |
| 403 | Forbidden by role |
| 404 | Resource not found |
| 429 | Too many requests |
| 500 | Internal server error |

## Optional Enhancements Implemented

- JWT authentication
- Soft delete for transactions
- Pagination on transaction listing
- Search on transaction listing
- Rate limiting

## Rate Limiting

The API includes:

- General API limiter: `200` requests per `15` minutes
- Auth limiter: `10` requests per `15` minutes on login/register

This helps protect against brute-force login attempts and noisy clients.

## Assumptions

1. New users register as `VIEWER` by default.
2. Only admins can manage users and modify transactions.
3. Inactive users cannot access protected routes.
4. Transactions are never permanently deleted through the API. They are soft-deleted with `isDeleted = true`.
5. Transaction filtering ignores soft-deleted rows automatically.
6. The system should never end up with zero active admins, so admin demotion/deactivation is guarded.

## What Could Be Added Next

- Postman collection export
- Swagger / OpenAPI documentation
- Unit and integration tests
- Refresh token flow
- CSV export
- More advanced search and sorting

## Database

The database is hosted on Neon PostgreSQL. Prisma handles schema management and database access, while the runtime Prisma client connects through the Postgres adapter.
