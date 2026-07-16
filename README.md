# 🔥 FundBlaze — Crowdfunding Platform

![Node](https://img.shields.io/badge/Node.js-18+-green)
![React](https://img.shields.io/badge/React-18+-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![License](https://img.shields.io/badge/License-MIT-yellow)
![CI](https://img.shields.io/github/actions/workflow/status/ishendrarai/FundBlaze/ci.yml?branch=main&label=CI)

> **Overview**
> A full-stack MERN crowdfunding platform with campaigns, donations, notifications, and a creator dashboard. FundBlaze empowers creators to raise funds securely with an easy-to-use interface.

> 📸 **Screenshots:** Add a `screenshots/` directory with `dashboard.png` and `campaign.png` or an animated GIF `demo.gif` to showcase the UI.

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

### 1. Clone the project

```bash
git clone https://github.com/ishendrarai/FundBlaze.git
cd FundBlaze
```

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

| Method | Path | Description | Auth Required |
|--------|------|-------------|---------------|
| POST | /api/v1/auth/signup | Register | No |
| POST | /api/v1/auth/login | Login | No |
| POST | /api/v1/auth/logout | Logout | Yes |
| POST | /api/v1/auth/refresh | Refresh token | Yes (Refresh) |
| GET | /api/v1/auth/me | Current user | Yes |
| GET | /api/v1/campaigns | List campaigns | No |
| GET | /api/v1/campaigns/trending | Trending | No |
| GET | /api/v1/campaigns/my | My campaigns | Yes |
| GET | /api/v1/campaigns/:slug | Campaign detail | No |
| POST | /api/v1/campaigns | Create campaign | Yes |
| PUT | /api/v1/campaigns/:id | Update campaign | Yes |
| DELETE | /api/v1/campaigns/:id | Delete campaign | Yes |
| POST | /api/v1/donations | Create donation | Yes |
| GET | /api/v1/donations/my | My donations | Yes |
| GET | /api/v1/donations/:campaignId | Campaign donors | No |
| GET | /api/v1/users/me/stats | Dashboard stats | Yes |
| PUT | /api/v1/users/me | Update profile | Yes |
| GET | /api/v1/users/:id | Public profile | No |
| GET | /api/v1/notifications | Notifications | Yes |
| PUT | /api/v1/notifications/:id/read | Mark read | Yes |
| PUT | /api/v1/notifications/read-all | Mark all read | Yes |

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

## Architecture Overview

FundBlaze follows a standard MERN stack architecture:
- **Frontend (Client):** React application built with Vite, styled with TailwindCSS. Manages state via Zustand and TanStack Query.
- **Backend (API):** Express.js REST API providing stateless authentication via JWTs.
- **Database:** MongoDB for flexible schema design, managed via Mongoose ODM.
- **Payments (Optional):** Integration points for Razorpay and Stripe to handle real monetary transactions securely.

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

---

## Payment Gateway Setup

To enable real payments, you can configure either Razorpay or Stripe:
1. **Razorpay:** Obtain your `Key ID` and `Key Secret` from the Razorpay Dashboard. Set up a webhook pointing to your server's `/api/v1/webhooks/razorpay` endpoint and set the `RAZORPAY_WEBHOOK_SECRET`.
2. **Stripe:** Obtain your `Secret Key` from the Stripe Dashboard. Set up a webhook pointing to `/api/v1/webhooks/stripe` and set the `STRIPE_WEBHOOK_SECRET`.

Leave these environment variables blank to fallback to a manual/simulated payment mode for testing.

---

## Contributing

We welcome contributions!
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

---

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
