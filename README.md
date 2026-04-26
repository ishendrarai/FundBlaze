# 🔥 FundBlaze — Crowdfunding Platform

A full-stack MERN crowdfunding platform with campaigns, donations, notifications, and a creator dashboard.

---

## Stack

| Layer      | Technology                                   |
|------------|----------------------------------------------|
| Frontend   | React 18 + TypeScript, Vite, TailwindCSS     |
| State      | Zustand + TanStack Query v5                  |
| Forms      | React Hook Form + Zod validation             |
| Backend    | Node.js + Express.js                         |
| Database   | MongoDB + Mongoose                           |
| Auth       | JWT access tokens + HTTP-only refresh tokens |
| Payments   | Razorpay (optional), Stripe (optional)       |

---

## Prerequisites

- Node.js ≥ 18
- MongoDB (local `mongodb://127.0.0.1:27017` or Atlas)

---

## Installation & Running

### 1. Clone / extract the project

### 2. Backend setup

```bash
cd backend
npm install
# Copy and edit environment variables:
cp .env.example .env   # or edit .env directly
npm run dev            # starts on http://localhost:5000
```

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev            # starts on http://localhost:5173
```

### 4. (Optional) Seed the database with sample data

```bash
cd backend
npm run seed
```

---

## Environment Variables

### Backend (`backend/.env`)

```
PORT=5000
NODE_ENV=development

# MongoDB
MONGO_URI=mongodb://127.0.0.1:27017/fundblaze

# JWT — CHANGE THESE IN PRODUCTION
JWT_ACCESS_SECRET=fundblaze_access_secret_CHANGE_ME
JWT_REFRESH_SECRET=fundblaze_refresh_secret_CHANGE_ME
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# CORS
CLIENT_URL=http://localhost:5173

# Razorpay (optional — leave blank to use manual payment mode)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=

# Stripe (optional)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
```

### Frontend (`frontend/.env`)

```
VITE_API_URL=http://localhost:5000/api/v1
VITE_ENABLE_MSW=false
```

---

## Features

| Feature | Status |
|---------|--------|
| User signup / login / logout | ✅ |
| JWT auth with auto-refresh | ✅ |
| Create campaigns (multi-step) | ✅ |
| Browse & search campaigns | ✅ |
| Campaign detail with donors | ✅ |
| Donate to campaigns | ✅ |
| Creator dashboard with real stats | ✅ |
| My campaigns management | ✅ |
| My donations history | ✅ |
| Notifications | ✅ |
| Public profile page (real API) | ✅ |
| Profile settings save | ✅ |
| Export donations CSV | ✅ |
| Razorpay payment gateway | ✅ (optional) |
| Stripe webhook | ✅ (optional) |
| Campaign trending score | ✅ |

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | /api/v1/auth/signup | Register |
| POST | /api/v1/auth/login | Login |
| POST | /api/v1/auth/logout | Logout |
| POST | /api/v1/auth/refresh | Refresh token |
| GET | /api/v1/auth/me | Current user |
| GET | /api/v1/campaigns | List campaigns |
| GET | /api/v1/campaigns/trending | Trending |
| GET | /api/v1/campaigns/my | My campaigns |
| GET | /api/v1/campaigns/:slug | Campaign detail |
| POST | /api/v1/campaigns | Create campaign |
| PUT | /api/v1/campaigns/:id | Update campaign |
| DELETE | /api/v1/campaigns/:id | Delete campaign |
| POST | /api/v1/donations | Create donation |
| GET | /api/v1/donations/my | My donations |
| GET | /api/v1/donations/:campaignId | Campaign donors |
| GET | /api/v1/users/me/stats | Dashboard stats |
| PUT | /api/v1/users/me | Update profile |
| GET | /api/v1/users/:id | Public profile |
| GET | /api/v1/notifications | Notifications |
| PUT | /api/v1/notifications/:id/read | Mark read |
| PUT | /api/v1/notifications/read-all | Mark all read |

---

## Test Accounts (after seeding)

After running `npm run seed` in the backend:

| Role | Email | Password |
|------|-------|----------|
| Creator | creator@fundblaze.com | password123 |
| Donor | donor@fundblaze.com | password123 |
| Admin | admin@fundblaze.com | password123 |

> Check `backend/database/seed.js` for the exact seeded accounts.

---

## Project Structure

```
fundblaze/
├── backend/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── models/          # Mongoose schemas
│   ├── routes/          # Express routers
│   ├── middlewares/     # Auth, validation, errors
│   ├── utils/           # JWT helpers, response utils
│   ├── database/        # DB connection + seed
│   ├── .env             # Environment config
│   └── server.js        # Entry point
└── frontend/
    └── src/
        ├── components/  # Reusable UI components
        ├── pages/       # Route-level page components
        ├── hooks/       # Custom React hooks
        ├── services/    # API service layer
        ├── store/       # Zustand global state
        ├── types/       # TypeScript interfaces
        ├── utils/       # Formatters, helpers
        └── router/      # React Router config
```
