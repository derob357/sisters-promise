---
name: refactor-routes
description: Plan and execute splitting server.js into modular route files
user-invocable: true
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, AskUserQuestion
---

# Refactor Routes — Split server.js Into Route Modules

Plan and execute refactoring the monolithic `server.js` (~3800 lines) into modular Express Router files. This reduces token usage for AI-assisted development and improves maintainability.

**IMPORTANT**: Enter plan mode first. Do NOT make any code changes until the user approves the plan.

## Phase 1: Analysis (Plan Mode)

Read `server.js` and map every route group with their exact line numbers:

| Route Group | Prefix | Proposed File |
|------------|--------|---------------|
| Product routes | `/api/products/*` | `routes/products.js` |
| Auth/User routes | `/api/users/*` | `routes/users.js` |
| Admin routes | `/api/admin/*` | `routes/admin.js` |
| Rewards routes | `/api/rewards/*` | `routes/rewards.js` |
| Square/Checkout | `/api/square/*`, `/api/checkout`, `/api/create-checkout` | `routes/checkout.js` |
| Chat routes | `/api/chat/*` | `routes/chat.js` |
| Email routes | `/api/email/*` | `routes/email.js` |
| Analytics routes | `/api/analytics/*` | `routes/analytics.js` |
| Contact route | `/api/contact` | `routes/contact.js` |

For each group, document:
- Exact line range in server.js
- Dependencies (models, services, middleware used)
- Shared utilities needed (`asyncHandler`, `sanitizeInput`, rate limiters)

## Phase 2: Architecture Plan

Propose the following structure:

```
routes/
  products.js    — Product catalog CRUD
  users.js       — Auth, registration, profile, password
  admin.js       — Admin/owner management endpoints
  rewards.js     — Rewards program endpoints
  checkout.js    — Square payments, checkout flows
  chat.js        — WebSocket chat routes
  email.js       — Email subscription, campaigns
  analytics.js   — GA4 event tracking
  contact.js     — Contact form submission
```

**Keep in server.js**:
- All `require` statements for middleware packages
- Helmet, CORS, rate limiter, body parser setup
- MongoDB connection
- Static file serving
- WebSocket server setup
- `asyncHandler` wrapper (or move to `utils/asyncHandler.js`)
- `sanitizeInput` function (or move to `utils/sanitize.js`)
- Route mounting: `app.use('/api/products', productsRouter)`
- Server startup (`app.listen`)

**Each route file pattern**:
```javascript
const express = require('express');
const router = express.Router();
// Import models, services, middleware as needed

// Routes defined on router (paths relative to mount point)
// e.g., router.get('/', ...) maps to /api/products/

module.exports = router;
```

## Phase 3: Implementation (After Approval)

1. Create `routes/` directory
2. Extract each route group into its own file
3. Update `server.js` to mount routers
4. Run `npm test` — all 63 tests must pass
5. Run `npm start` to verify server starts without errors

## Constraints

- Do NOT change any API behavior — same routes, same responses
- Do NOT change the test files
- Preserve all middleware ordering (rate limiters, auth checks)
- Keep the CORS, Helmet, and security middleware in server.js
- Shared utilities can go in a `utils/` directory if needed
