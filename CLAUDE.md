# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Sisters Promise is a natural skincare e-commerce platform with a web storefront and a React Native mobile app. The web app is a server-rendered Express.js application serving static HTML pages with Bootstrap 5 styling (Material Kit 2 theme). Payments are processed through Square. The mobile app lives in the `SistersPromiseMobile/` git submodule.

## Common Commands

```bash
# Start the backend server (serves both API and static frontend)
npm start

# Development mode (server + auto-open browser + SCSS watch)
npm run dev

# Compile SCSS to CSS
gulp compile-scss

# Production build (outputs to dist/)
npm run build

# Mobile app (from SistersPromiseMobile/)
cd SistersPromiseMobile && npm start      # Metro bundler
cd SistersPromiseMobile && npm run ios    # iOS simulator
cd SistersPromiseMobile && npm run android # Android emulator
cd SistersPromiseMobile && npm test       # Jest tests
cd SistersPromiseMobile && npm test -- path/to/test  # Single test
```

There is no test suite for the web backend (`npm test` is a no-op stub).

## Architecture

### Web Backend (`server.js`)

A single Express server file (~2000+ lines) containing all API routes, middleware setup, and static file serving. Key patterns:

- **Environment loading**: `.env` for dev, `.env.production` for production (loaded before any requires)
- **Database**: MongoDB via Mongoose (`config/database.js`). Falls back to file-based storage if MongoDB is unavailable.
- **Authentication**: JWT tokens via `middleware/auth.js`. Three access tiers: `authenticate` (any logged-in user), `adminOrOwner`, `ownerOnly`.
- **Roles**: owner > admin > subscriber > standard
- **Payments**: Square SDK for checkout processing
- **Email**: Nodemailer (SMTP/SendGrid) via `services/EmailService.js`
- **Security**: Helmet, CORS, rate limiting, mongo-sanitize, body size limits
- **WebSockets**: `ws` library for real-time chat

### API Route Organization (all in `server.js`)

| Prefix | Auth | Purpose |
|--------|------|---------|
| `GET /api/products` | None | Product catalog |
| `POST /api/checkout` | None | Square payment processing |
| `POST /api/contact` | None | Contact form (rate limited: 5/hr) |
| `POST /api/email/subscribe` | None | Email list signup |
| `/api/auth/*` | JWT | User auth, profile, password |
| `/api/chat/*` | JWT | Real-time chat rooms/messages |
| `/api/admin/*` | Admin/Owner | User management, orders, campaigns |
| `/api/analytics/*` | None | GA4 event tracking |

### Data Layer (`models/`)

Mongoose schemas: `Product`, `User`, `EmailSubscriber`, `ManualOrder`, `ChatRoom`, `ChatMessage`, `Rewards`, `MutedUser`, `Report`

### Services (`services/`)

- `EmailService.js` - SMTP/SendGrid email sending, templates, campaigns
- `UserService.js` - User CRUD, default user initialization
- `AnalyticsService.js` - GA4 server-side tracking
- `ChatService.js` - Chat room and message management

### Frontend (Web)

Static HTML pages with Bootstrap 5 + Material Kit 2. No frontend framework or bundler.

- `index.html` - Homepage
- `pages/*.html` - Shop, product detail, about, contact, ingredients
- `assets/scss/` - SASS source (compiled via Gulp to `assets/css/`)
- `assets/js/` - Client-side JavaScript
- `sections/` - Reusable HTML section components

### Mobile App (`SistersPromiseMobile/`)

React Native + TypeScript. See `SistersPromiseMobile/CLAUDE.md` for detailed mobile-specific guidance. Key points:
- Context API for state (AuthContext, CartContext)
- React Navigation with auth-conditional routing
- All API calls through `src/services/api.js` (Axios with JWT interceptor)

## Environment Setup

Copy `.env.example` to `.env`. Critical variables:
- `MONGODB_URI` - MongoDB connection string (local or Atlas)
- `SQUARE_*` - Payment processing (use sandbox for dev)
- `JWT_SECRET` - Auth token signing
- `SMTP_*` / `EMAIL_PROVIDER` - Email delivery
- `RECAPTCHA_ENTERPRISE_KEY` / `GOOGLE_CLOUD_PROJECT_ID` - Bot protection

For HTTPS locally, run `node generate-certs.js` to create self-signed certs.

## Deployment

Configured for multiple platforms:
- **Vercel** (`vercel.json`) - Serverless; routes `/api/*` to server.js, serves static files
- **Render** (`render.yaml`) - Free tier Node.js service
- **Genezio** (`genezio.yaml`) - Serverless backend (us-east-1)
