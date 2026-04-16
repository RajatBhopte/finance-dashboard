# User Management System (MERN)

This repository contains a role-based user management system built with MongoDB, Express, React, and Node.js. The app is aligned to the assessment scope: authentication, RBAC, user lifecycle management, audit visibility, and role-based UI for three roles.

## Roles

- ADMIN: full user management access.
- MANAGER: can list users and update non-admin users.
- USER: can manage own profile only.

## Features

- JWT authentication with access token and refresh token flow.
- Login using email or username (name field supported as username login key).
- Secure password hashing with bcrypt.
- Protected backend routes with role-based authorization.
- Admin user lifecycle actions:
  - list/search/filter users
  - create users (optional auto-generated password)
  - update users
  - assign roles
  - activate/deactivate users
    - permanently delete users
- Manager restrictions:
  - cannot view or update admin user records
  - cannot change roles or activation status
- User self-service:
  - view profile
  - update own name/password only
- Audit metadata:
  - createdAt, updatedAt
  - createdBy, updatedBy
  - audit details in user and profile views
- Frontend route and navigation guards by role.

## Tech Stack

- Frontend: React, Vite, Tailwind CSS
- Backend: Node.js, Express
- Database: MongoDB + Mongoose
- Auth: JWT + refresh tokens

## Project Structure

```text
finance-backend/
  server.js
  seed.js
  src/
    config/
      db.js
    controllers/
      authController.js
      dashboardController.js
      userController.js
    middleware/
      auth.js
      errorHandler.js
      rateLimiter.js
    models/
      User.js
    routes/
      auth.js
      dashboard.js
      users.js
    services/
      dashboardService.js

finance-frontend/
  src/
    api/
      axios.js
    components/
      ...
    context/
      AuthContext.jsx
      ThemeContext.jsx
    pages/
      Dashboard.jsx
      Login.jsx
      Profile.jsx
      Register.jsx
      Users.jsx
```

## Backend Setup

1. Install dependencies:

```bash
cd finance-backend
npm install
```

2. Create .env in finance-backend with at least:

```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/finance-dashboard
JWT_SECRET=replace_with_a_strong_secret
ACCESS_TOKEN_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=30d
# optional (falls back to JWT_SECRET if omitted)
REFRESH_TOKEN_SECRET=replace_with_refresh_secret
```

3. Run backend:

```bash
npm run dev
```

Backend base URL: http://localhost:5000

## Frontend Setup

1. Install dependencies:

```bash
cd finance-frontend
npm install
```

2. Optional environment file in finance-frontend:

```env
VITE_API_URL=http://localhost:5000
```

If VITE_API_URL is not set, frontend uses relative /api paths and works with the included Vite proxy.

3. Run frontend:

```bash
npm run dev
```

Frontend URL: http://localhost:5173

## Seed Data

From finance-backend:

```bash
npm run seed
```

Seeded users:

- admin@finance.com / admin123 / ADMIN
- manager@finance.com / manager123 / MANAGER
- user@finance.com / user123 / USER

## API Overview

### Health

- GET /api/health

### Auth

- POST /api/auth/register (public)
- POST /api/auth/login (public)
- POST /api/auth/refresh (public)
- POST /api/auth/logout (public, token or refresh token recommended)

### Users (protected)

- GET /api/users/me
- PATCH /api/users/me
- GET /api/users (ADMIN, MANAGER)
- POST /api/users (ADMIN)
- GET /api/users/:id (ADMIN, MANAGER)
- PATCH /api/users/:id (ADMIN, MANAGER)
- DELETE /api/users/:id (ADMIN) -> deactivates user
- DELETE /api/users/:id/hard (ADMIN) -> permanently deletes user
- PATCH /api/users/:id/role (ADMIN)
- PATCH /api/users/:id/status (ADMIN)

### Dashboard (protected)

- GET /api/dashboard/summary

## RBAC Rules Implemented

- Only ADMIN can create users, change roles, and change active status.
- MANAGER can view user list/details and update non-admin users.
- USER can access and update only own profile.
- Inactive users cannot authenticate.
- System prevents removing or deactivating the last active admin.

## Legacy Role Compatibility

On backend startup, one-time compatibility migration updates old role values in the users collection:

- ANALYST -> MANAGER
- VIEWER -> USER

## Build Validation

Frontend production build:

```bash
cd finance-frontend
npm run build
```

Backend syntax sanity checks:

```bash
cd finance-backend
node --check server.js
```

## Deployed URLs (Submission)

Update this section before final submission.

- Frontend URL: https://your-frontend-domain.example
- Backend API Base URL: https://your-backend-domain.example
- Health Check: https://your-backend-domain.example/api/health

Notes:

- Set `VITE_API_URL` on the frontend deployment to your backend API base URL.
- Ensure backend environment variables are set (`MONGODB_URI`, `JWT_SECRET`, and optional refresh token settings).
