# Quick Test Execution Guide

## Running Tests - Fast Reference

### Backend API Tests

```bash
# All backend tests
npm test

# Watch mode (re-run on changes)
npm test -- --watch

# With coverage report
npm test -- --coverage

# Specific test file
npm test cartService.test.js

# Verbose output
npm test -- --verbose

# Update snapshots
npm test -- --updateSnapshot
```

### Regression Test Suite

```bash
# Full regression suite
npm run test:regression

# Auth & Security tests
npm run test:regression -- --category auth

# Order tests
npm run test:regression -- --category orders

# Rewards system tests
npm run test:regression -- --category rewards

# With coverage
npm run test:regression -- --coverage

# For CI/CD
npm run test:regression -- --ci --json --coverage
```

### Mobile App Tests

```bash
# All mobile tests
cd SistersPromiseMobile
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# E2E tests (Detox)
npm run test:detox

# Specific component
npm test HomeScreen
```

### API Endpoint Health Check

```bash
# Quick endpoint check (requires running server)
node endpoint_status_check.js

# Comprehensive rewards test
node test_rewards_endpoints.js

# All endpoint test
node test_all_endpoints_fast.js
```

---

## Test Files Overview

### Backend Tests
- `test-error-handling.js` - Error handling verification
- `test_rewards_endpoints.js` - Rewards system testing
- `test_all_endpoints.js` - Comprehensive endpoint testing
- `test_all_endpoints_fast.js` - Quick endpoint status check
- `endpoint_status_check.js` - Health check utility

### Mobile Tests
- `SistersPromiseMobile/src/__tests__/api.test.js` - API service tests
- `SistersPromiseMobile/src/__tests__/cartService.test.js` - Cart functionality
- `SistersPromiseMobile/TESTING.md` - Mobile testing guide

---

## Test Coverage Goals

| Component | Target | Current | Status |
|-----------|--------|---------|--------|
| Backend API | 80% | 70% | 🟡 In Progress |
| Mobile Services | 70% | 45% | 🟡 In Progress |
| Mobile Components | 60% | 30% | 🟡 In Progress |
| Database Layer | 75% | 60% | 🟡 In Progress |
| Authentication | 90% | 85% | 🟢 Good |
| Rewards System | 85% | 90% | 🟢 Good |

---

## Pre-Release Checklist

Before deploying to production:

```
Backend:
☐ npm test passes (100%)
☐ npm run test:regression passes (100%)
☐ Code coverage ≥80%
☐ node endpoint_status_check.js passes
☐ Performance benchmarks met
☐ Security tests passing
☐ No console errors/warnings

Mobile:
☐ npm test passes (100%)
☐ npm run test:detox passes
☐ All critical user flows tested
☐ Performance acceptable
☐ No memory leaks
☐ App builds successfully

System:
☐ E2E tests passing
☐ No critical bugs
☐ Security audit passed
☐ Documentation updated
☐ Deployment procedure verified
```

---

## Performance Benchmarks

### API Response Times
```
✓ GET /api/products - < 500ms
✓ GET /api/rewards/offers - < 300ms
✓ POST /api/checkout - < 1000ms
✓ GET /api/admin/stats - < 500ms
✓ POST /api/orders - < 800ms
```

### Mobile Performance
```
✓ App launch - < 3 seconds
✓ Screen transition - < 500ms
✓ List scroll - 60fps
✓ Memory usage - < 200MB
✓ Battery drain - minimal
```

---

## CI/CD Integration

Tests run automatically on:
- ✓ Every commit to main
- ✓ Every pull request
- ✓ Nightly full regression
- ✓ Before production deploy

Status: See GitHub Actions workflow

---

## Known Test Gaps

Still need to implement:
- [ ] Payment processing tests (Square integration)
- [ ] Email campaign tests
- [ ] Chat system tests
- [ ] Admin dashboard tests
- [ ] Moderation workflow tests
- [ ] Analytics aggregation tests
- [ ] Performance load tests
- [ ] Security penetration tests

---

## Getting Help

### Test Debugging
```bash
# Run with more verbose output
npm test -- --verbose

# Run single test in isolation
npm test -- --testNamePattern="should add item to cart"

# Debug test file
node --inspect-brk node_modules/.bin/jest --runInBand cartService.test.js
```

### Common Issues

**Issue:** Tests timing out
```
Solution: Increase timeout
jest.setTimeout(10000); // 10 seconds
```

**Issue:** Async test not working
```
Solution: Return promise or use async/await
it('should fetch data', async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

**Issue:** Mock not working
```
Solution: Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

---

## Contact & Escalation

- Test Framework Issues: Check Jest docs
- Mobile Testing: See TESTING.md
- Backend Testing: Check test files
- CI/CD Pipeline: Review GitHub Actions
