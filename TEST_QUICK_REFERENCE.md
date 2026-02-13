# Quick Test Execution Guide

## Running Tests - Fast Reference

### Backend Tests (Jest)

```bash
# All backend tests
npm test

# Verbose output
npm run test:verbose

# With coverage report
npm run test:coverage

# Specific test file
npx jest tests/middleware/auth.test.js

# Watch mode (re-run on changes)
npx jest --watch

# Run by name pattern
npx jest --testNamePattern="should lock account"
```

### Mobile App Tests (Jest)

```bash
cd SistersPromiseMobile

# All mobile tests
npm test

# Verbose output
npm test -- --verbose

# With coverage
npm test -- --coverage

# Specific test file
npm test -- src/__tests__/cartService.test.js

# Watch mode
npm test -- --watch
```

### Manual API Health Checks

```bash
# These require a running server (npm start)
node endpoint_status_check.js
node test_all_endpoints_fast.js
node test_rewards_endpoints.js
```

---

## Test Suites Overview

### Backend Tests (`tests/`)

| File | Tests | Coverage |
|------|-------|----------|
| `tests/middleware/auth.test.js` | 13 | authenticate, authorize, requirePermission, generateToken |
| `tests/services/UserService.test.js` | 20 | CRUD, auth flows, account lockout, role management |
| `tests/services/EmailService.test.js` | 14 | Templates, welcome emails, newsletters, order confirmation |
| `tests/services/AnalyticsService.test.js` | 9 | GA4 tracking, event sending, hashing, client IDs |
| `tests/utils/sanitizeInput.test.js` | 8 | XSS prevention, truncation, edge cases |
| **Total** | **63** | |

### Mobile Tests (`SistersPromiseMobile/src/__tests__/`)

| File | Tests | Coverage |
|------|-------|----------|
| `api.test.js` | 5 | Request/response interceptors, auth headers |
| `authService.test.js` | 19 | Login, register, profile, password, token management |
| `authContext.test.js` | 10 | Bootstrap, login/register/logout flows |
| `cartService.test.js` | 9 | Cart calculations and AsyncStorage operations |
| `cartServiceIntegration.test.js` | 22 | Full cart CRUD, image handling, error cases |
| `cartScreen.test.js` | 10 | Empty cart, calculations, checkout prep, quantity ops |
| `productService.test.js` | 22 | Multiple response formats, search, categories |
| `analyticsService.test.js` | 21 | Events, screen views, purchases, user properties |
| `rewardsService.test.js` | 19 | Rewards, BOGO offers, bundles, points, gift options |
| `imageUtil.test.js` | 30 | URL encoding, safe image sources, product image extraction |
| `theme.test.js` | 12 | Colors, typography, spacing, shadows |
| `homeScreen.test.js` | 18 | Categories, search, BOGO matching, featured bundles |
| `loginScreen.test.js` | 10 | Email/password validation, form validation |
| `navigation.test.js` | 15 | Auth navigator, tab structure, stack screens, root logic |
| `cartContext.test.js` | 11 | Load, add, remove, update, clear, calculations |
| **Total** | **233** | |

### Manual Test Scripts (root directory)

These are Node.js scripts that test against a running server — not part of the Jest suite:

- `endpoint_status_check.js` — Quick health check of API endpoints
- `test_all_endpoints_fast.js` — Comprehensive endpoint status check
- `test_rewards_endpoints.js` — Rewards system endpoint testing
- `test-error-handling.js` — Error handling verification

---

## Pre-Release Checklist

```
Backend:
☐ npm test passes (all 63 tests)
☐ npm run test:coverage meets targets
☐ node endpoint_status_check.js passes (requires running server)

Mobile:
☐ cd SistersPromiseMobile && npm test passes (all 233 tests)
☐ App builds successfully (iOS + Android)
☐ Manual testing of critical user flows

System:
☐ No critical bugs
☐ Documentation updated
```

---

## Known Test Gaps

Still need to implement:
- [ ] Payment processing tests (Square checkout/payment flows)
- [ ] Chat system tests (ChatService, WebSocket)
- [ ] Mongoose model tests (Product, EmailSubscriber, etc.)
- [ ] API route integration tests (server.js endpoints)
- [ ] Admin route tests
- [ ] Mobile E2E tests (Detox not yet configured)
- [ ] Performance / load testing

---

## Test Debugging Tips

```bash
# Run with more verbose output
npm run test:verbose

# Run single test in isolation
npx jest --testNamePattern="should add item to cart"

# Debug a test file
node --inspect-brk node_modules/.bin/jest --runInBand tests/middleware/auth.test.js
```

### Common Issues

**Tests timing out:** Increase timeout in jest.config.js (currently 10000ms) or per-test:
```js
jest.setTimeout(15000);
```

**Mock not resetting:** Ensure mocks are cleared:
```js
beforeEach(() => {
  jest.clearAllMocks();
});
```

**Module collision warning:** The `dist/` folder has a duplicate package.json. This is a harmless warning.
