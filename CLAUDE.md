# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Required: Read All Context Files on Start

**Before doing any work, read all project .md files to understand the full context.** These are grouped by topic:

### Core Documentation
- `README.md` — Project overview
- `INSTALLATION.md` — Setup instructions
- `STARTUP_GUIDE.md` — Getting started
- `QUICK_REFERENCE.md` — Quick reference
- `DOCUMENTATION_INDEX.md` — Index of all docs
- `CHANGELOG.md` — Change history
- `LICENSE.md`, `SECURITY.md`, `ISSUE_TEMPLATE.md`

### Architecture & API
- `API_ENDPOINTS.md` — Full API route documentation
- `COMPLETE_API_ENDPOINT_AUDIT.md` — API audit findings
- `API_DATA_AUDIT_REPORT.md`, `API_FIXES_SUMMARY.md`, `API_KEY_DEPENDENCIES.md`
- `BACKEND_SETUP.md` — Backend configuration
- `ENVIRONMENT_VARIABLES.md` — Env var reference
- `HTTPS_SECURITY.md` — HTTPS/TLS setup

### Features
- `CHAT_SYSTEM.md`, `CHAT_SYSTEM_SUMMARY.md` — Chat system docs
- `ADMIN_ORDER_MANAGEMENT.md` — Order management
- `EMAIL_SYSTEM_README.md`, `EMAIL_QUICK_START.md`, `EMAIL_API_REFERENCE.md`, `EMAIL_MARKETING_GUIDE.md`, `EMAIL_SETUP_CHECKLIST.md`, `EMAIL_IMPLEMENTATION_SUMMARY.md`
- `ANALYTICS_SETUP.md` — GA4 analytics
- `SQUARE_INTEGRATION_SETUP.md` — Square payments
- `ETSY_INTEGRATION_SETUP.md` — Etsy integration
- `PRODUCT_INVENTORY.md` — Product catalog
- `GOOGLE_ADS_CAMPAIGNS.md` — Ad campaigns
- `docs/MODERATION_SYSTEM.md`, `docs/MODERATION_API.md`, `docs/MODERATION_QUICK_REFERENCE.md`

### Testing
- `TEST_QUICK_REFERENCE.md` — Test execution guide (backend: 63 tests, mobile: 233 tests)
- `COMPREHENSIVE_TEST_PLAN.md` — Full test plan
- `TEST_EXECUTION_SUMMARY.md` — Test results
- `SistersPromiseMobile/TESTING.md` — Mobile testing guide

### Deployment & DevOps
- `RENDER_DEPLOYMENT.md` — Render deployment
- `MOBILE_APP_DEPLOYMENT.md` — Mobile app deployment
- `GITHUB_ACTIONS_GUIDE.md`, `GITHUB_SYNC_SUMMARY.md`
- `BUILD_STATUS.md` — Build status
- `APP_PUBLISHING_MONETIZATION.md` — App store publishing

### Mobile App
- `SistersPromiseMobile/CLAUDE.md` — Mobile-specific guidance
- `SistersPromiseMobile/README.md`, `SistersPromiseMobile/PROJECT_STATUS.md`
- `SistersPromiseMobile/BUNDLE_ID_CONFIG.md`, `SistersPromiseMobile/CODE_SIGNING_SETUP.md`
- `SistersPromiseMobile/DEPLOYMENT_READY_REPORT.md`, `SistersPromiseMobile/GITHUB_SECRETS_SETUP.md`
- `SistersPromiseMobile/ICON_FONTS_SETUP.md`, `SistersPromiseMobile/IOS_ENCRYPTION_COMPLIANCE.md`
- `SistersPromiseMobile/SAFE_AREA_FIX.md`, `SistersPromiseMobile/SECURITY_COMPLIANCE.md`

### Reports & Analysis
- `SECURITY_AUDIT_REPORT.md`, `SECURITY_COMPLETION_REPORT.md`
- `COMPATIBILITY_CHECK_REPORT.md`, `ERROR_HANDLING_FIXES.md`
- `ANDROID_ERROR_HANDLING_ANALYSIS.md`, `IOS_APP_TEST_REPORT.md`
- `IMAGE_FIX_REPORT.md`, `ICON_FIX_GUIDE.md`
- `REWARDS_API_TEST_REPORT.md`
- `DELIVERY_SUMMARY.md`, `PHASE_9_COMPLETION.md`, `PHASE_9_SUMMARY.md`
- `ConnectionsSetupFiles/UpdatedImageTables/*.md`
- `files/CODE_ANALYSIS_REPORT.md`, `files/QUICK_FIXES.md`, `files/GITHUB_ACTIONS_SETUP.md`

---

## Claude Code Tooling

### Custom Slash Commands

| Command | Purpose |
|---------|---------|
| `/deploy` | Run tests (backend + mobile), commit, push submodule + parent |
| `/add-to-all-pages` | Bulk-inject HTML snippets across all 12 site pages with correct relative paths |
| `/check-nav` | Audit navbar consistency (menu order, active states, auth-nav-item, hrefs) |
| `/refactor-routes` | Plan server.js split into route modules (enters plan mode first) |

Skills are defined in `.claude/skills/*/SKILL.md`.

### Hooks (`.claude/settings.json`)

- **Post-Edit (HTML)**: Warns if an edited HTML file has a navbar but is missing `id="auth-nav-item"`
- **Post-Bash (git commit)**: Reminds about unpushed SistersPromiseMobile submodule commits

Hook scripts live in `.claude/hooks/`.

### MCP Servers (`.mcp.json`)

| Server | Package | Purpose |
|--------|---------|---------|
| `filesystem` | `@modelcontextprotocol/server-filesystem` | Bulk file operations scoped to project directory |
| `mongodb` | `mongodb-mcp-server` | Read-only DB queries during development (uses `MONGODB_URI` from env) |

Note: `@modelcontextprotocol/server-git` does not exist. Git operations use the Bash tool.

### Site Pages (for /add-to-all-pages and /check-nav)

Root: `index.html` (paths: `./assets/`, `./pages/`)
Pages: `pages/shop.html`, `pages/ingredients.html`, `pages/about-us.html`, `pages/contact.html`, `pages/product-detail.html`, `pages/order-success.html`, `pages/product-seamoss-aloe.html`, `pages/privacy-policy.html`, `pages/terms-conditions.html`, `pages/rewards.html`, `pages/sign-in.html` (paths: `../assets/`, peer filenames)

---

## Active Todo List

> All entries include timestamps (date + time). Update timestamps when items are modified or completed.

### Critical

(none remaining)

### Medium

(none remaining)

### Low

(none remaining)

### Completed

- [x] `2026-03-05 00:00` Add web shopping cart — `assets/js/cart.js` (CartService + spAddToCart global), `pages/cart.html` (review + checkout page), cart icon in all 12 navbars, badge + toast UI. Buttons use `onclick="spAddToCart(this)"` (not event delegation). `?v=2` cache-buster on all cart.js/square-integration.js script tags. `variationId` threaded via `?vid=` URL param from shop/featured into product-detail. Cart cleared on order-success.html.
- [x] `2026-02-22 13:50` Rotate all exposed API keys (JWT, Square, SMTP, reCAPTCHA, default passwords) and scrub git history with BFG
- [x] `2026-02-22 13:50` Remove genezio.yaml (unused deployment platform)
- [x] `2026-02-19 00:00` Fix CORS — add PUT/DELETE to allowed methods (was blocking admin operations)

- [x] `2026-02-14 00:10` Add input validation library (joi) — schemas for auth, contact, checkout, blog; validate() middleware on 13 routes
- [x] `2026-02-14 00:10` Replace console.log with structured logging (winston) — ~110 replacements in server.js
- [x] `2026-02-14 00:10` Complete rewards feature (mobile) — RewardsDashboard already wired into HomeScreen
- [x] `2026-02-14 00:10` Run accessibility audit on HTML pages — skip nav, main landmark, aria-live, aria-current on all 14 pages
- [x] `2026-02-14 00:10` Add GitHub Actions CI — ESLint config + lint script; CI workflows already run `npm run lint --if-present`
- [x] `2026-02-14 00:10` Fix duplicate sendOrderConfirmation in EmailService.js — renamed second to sendOrderConfirmationDirect
- [x] `2026-02-14 00:10` Fix broken HTML in about-us.html — malformed footer tags, generic alt text, email input label
- [x] `2026-02-13 12:00` Remove hardcoded IP in AppDelegate.swift — commented out, requires manual config
- [x] `2026-02-13 12:00` Fix `genezio.yaml` — renamed from `material-kit` to `sisters-promise`
- [x] `2026-02-13 12:00` Create TermsOfService screen (mobile) — new screen + navigator wired up
- [x] `2026-02-13 12:00` Fix hardcoded API base URL (mobile) — now reads from env with fallback
- [x] `2026-02-13 12:00` Add database indexes on Product.category, Product.isActive
- [x] `2026-02-13 12:00` Fix `render.yaml` — SQUARE_ENVIRONMENT changed to production
- [x] `2026-02-13 12:00` Fix CLAUDE.md version info (corrected to RN 0.73.7, React 18.2.0)
- [x] `2026-02-13 12:00` Clean up unused test scripts in root directory
- [x] `2026-02-13 12:00` Remove unused `material-kit` dependency from package.json
- [x] `2025-02-12 15:45` Add backend test suite (Jest, 63 tests across 5 suites)
- [x] `2025-02-12 15:45` Expand mobile test suite (14 → 233 tests across 15 suites)
- [x] `2025-02-12 15:50` Rewrite TEST_QUICK_REFERENCE.md with accurate info
- [x] `2025-02-12 16:00` Update carousel 1 images to carousel001-005.png
- [x] `2025-02-12 16:05` Scale down hero banner 50% on mobile
- [x] `2025-02-12 16:10` Switch carousels to fade transition
- [x] `2025-02-12 16:15` Remove slides 6 and 7 from carousel 2
- [x] `2025-02-12 16:20` Add context file index and todo list to CLAUDE.md

---

## Security Notes

- **CORS**: Origin whitelist via `ALLOWED_ORIGINS` env var; methods GET/POST/PUT/DELETE/OPTIONS; credentials enabled
- **Auth**: JWT tokens via `middleware/auth.js` with three tiers (authenticate, adminOrOwner, ownerOnly)
- **Rate limiting**: General limiter + contact form specific (5/hr)
- **Input validation**: joi schemas on 13 routes
- **CRITICAL TODO**: Rotate all git-committed secrets (Square API keys, MongoDB URI, JWT secret, reCAPTCHA key, SMTP credentials) — see Active Todo List above

## Project Overview

Sister's Promise is a natural skincare e-commerce platform with a web storefront and a React Native mobile app. The web app is a server-rendered Express.js application serving static HTML pages with Bootstrap 5 styling (Material Kit 2 theme). Payments are processed through Square. The mobile app lives in the `SistersPromiseMobile/` git submodule.

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
cd SistersPromiseMobile && npm test       # Jest tests (233 tests)
cd SistersPromiseMobile && npm test -- path/to/test  # Single test

# Backend tests
npm test                    # Jest (63 tests)
npm run test:verbose        # With verbose output
npm run test:coverage       # With coverage report
```

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
