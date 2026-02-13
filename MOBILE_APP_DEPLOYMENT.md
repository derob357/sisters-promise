# Mobile App Architecture & Deployment Manual

**Document Version:** 2.0  
**Last Updated:** January 19, 2026  
**Current Build Version:** v009.6  
**Project:** Sister's Promise Mobile App (React Native)  
**Author:** Development Team

---

## Executive Summary

This comprehensive manual documents the Sister's Promise React Native mobile application architecture, deployment procedures, and current implementation status.

**Current Build Status (v009.6):**
- ✅ 11 fully functional mobile screens
- ✅ Complete authentication & role-based access
- ✅ E-commerce flow (products → cart → checkout)
- ✅ Admin dashboard with order management
- ✅ Error boundary with detailed logging
- ✅ Custom Sister's Promise app icon
- ✅ iOS simulator support (iPhone & iPad)
- ✅ Multi-screen layout optimization

---

## System Architecture

### Component Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER                                 │
│                  (React Native Mobile)                          │
│                                                                 │
│  • iOS/Android App (0.72.13)                                   │
│  • React Navigation                                             │
│  • AsyncStorage (Local Cache)                                  │
│  • Context API (State Management)                              │
│  • Axios (HTTP Client)                                         │
└────────────────────┬────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │  HTTPS (Port 443)      │
         │  JWT Authentication    │
         │  Content-Type: JSON    │
         │                        │
┌────────▼──────────────────────────────────────────────────────┐
│                    API LAYER                                   │
│                 (Express.js Backend)                           │
│                                                                 │
│  • Node.js Runtime (18.x)                                      │
│  • Express 4.x Framework                                       │
│  • CORS Enabled                                                │
│  • JWT Middleware                                              │
│  • Error Handling                                              │
│  • Request Logging                                             │
│  • Rate Limiting                                               │
└────────────────────┬────────────────────────────────────────────┘
                     │
         ┌───────────┴───────────┐
         │  MongoDB Protocol      │
         │  Connection URI        │
         │  Aggregation Pipeline  │
         │                        │
┌────────▼──────────────────────────────────────────────────────┐
│                 DATA LAYER                                     │
│              (MongoDB Atlas Cloud)                             │
│                                                                 │
│  • Managed MongoDB Service                                     │
│  • Automated Backups                                           │
│  • Replica Sets                                                │
│  • Network Isolation                                           │
│  • User Authentication                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Flow Sequence

```
User Action                   Mobile App                Backend                 Database
─────────────────────────────────────────────────────────────────────────────────────

Login
  │
  ├─ Enter email/password
  │  └─ authService.login()
  │     └─ POST /api/users/login
  │        └─────────────────────── POST /api/users/login ──────────────────────┐
  │                                 Validate email format                         │
  │                                 Query: User.findOne({email})                 │
  │                                 Compare password hash ◄────────────────────┐ │
  │                                 Generate JWT token                         │ │
  │        ◄────────────────────── {token, user} ────────────────────────────┘ │
  │                                                                              │
  ├─ Store token in AsyncStorage                                               │
  ├─ Update AuthContext                                              User ◄──────┘
  └─ Navigate to Home Screen


Browse Products
  │
  ├─ ProductsScreen mounted
  │  └─ productService.getProducts()
  │     └─ GET /api/products?category=soap
  │        └────────────────── GET /api/products?category=soap ─────────────────┐
  │                            Parse query params                                │
  │                            Query: Product.find({category: 'soap'})           │
  │        ◄────────────────── [{product1}, {product2}, ...] ──────────────────┐ │
  │                                                                        Product◄─┘
  └─ Render ProductCard components


Checkout
  │
  ├─ CheckoutScreen
  │  ├─ Get cart from AsyncStorage
  │  ├─ Fill shipping form
  │  └─ handleCheckout()
  │     └─ POST /api/orders {items[], shipping}
  │        └────────────── POST /api/orders (with JWT token) ───────────────────┐
  │                        Authenticate token                                    │
  │                        Validate order data                                   │
  │                        Create ManualOrder                                    │
  │        ◄────────────── {orderId} ──────────────────────────────────────────┐ │
  │                                                                    ManualOrder◄─┘
  └─ Navigate to OrderConfirmationScreen
```

---

## Directory Structure

### Backend Organization

```
/Users/drob/Documents/SistersPromise/          # Project root
├── server.js                                  # Entry point (3247 lines)
├── package.json                               # Dependencies
├── credentials.json                           # MongoDB credentials
├── .env                                       # Environment variables
├── .gitignore                                 # Git ignore rules
├── README.md                                  # Project documentation
├── SECURITY.md                                # Security guidelines
├── DEPLOYMENT_CHECKLIST.md                    # Pre-deployment checklist
├── API_DATA_AUDIT_REPORT.md                   # Issue audit report
├── API_FIXES_SUMMARY.md                       # Applied fixes documentation
├── MOBILE_APP_TEMPLATE.md                     # Complete development guide
├── QUICK_REFERENCE.md                         # API endpoint reference
├── QUICK_START_GUIDE.sh                       # Quick start instructions
├── launch-all.sh                              # Launch all services script
├── kill-all.sh                                # Kill all services script
├── build.js                                   # Build script
├── gulpfile.js                                # Gulp tasks
├── webpack.config.js                          # Webpack config (if used)
├── logs/                                      # Script logs directory
│   ├── backend_YYYYMMDD_HHMMSS.log           # Backend logs
│   ├── metro_YYYYMMDD_HHMMSS.log             # Metro logs
│   └── ios_YYYYMMDD_HHMMSS.log               # iOS build logs
├── assets/                                    # Static files
│   ├── css/
│   ├── js/
│   ├── img/
│   └── scss/
├── docs/                                      # Documentation
├── pages/                                     # HTML pages
└── sections/                                  # Page sections
```

### Frontend Organization

```
/Users/drob/Documents/SistersPromise/SistersPromiseMobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js                     # Home/landing screen
│   │   ├── LoginScreen.js                    # User authentication
│   │   ├── RegisterScreen.js                 # User registration
│   │   ├── ProductsScreen.js                 # Product listing
│   │   ├── ProductDetailScreen.js            # Single product detail
│   │   ├── CartScreen.js                     # Shopping cart view
│   │   ├── CheckoutScreen.js                 # Order creation
│   │   ├── OrderConfirmationScreen.js        # Order success
│   │   ├── OrderHistoryScreen.js             # Previous orders
│   │   └── ProfileScreen.js                  # User profile/settings
│   ├── components/
│   │   ├── ProductCard.js                    # Reusable product card
│   │   ├── CartItem.js                       # Cart item component
│   │   ├── Header.js                         # Navigation header
│   │   ├── Footer.js                         # App footer
│   │   ├── Loading.js                        # Loading spinner
│   │   ├── ErrorBoundary.js                  # Error handling
│   │   └── Modal.js                          # Reusable modal
│   ├── services/
│   │   ├── api.js                            # Axios instance config
│   │   ├── authService.js                    # Authentication calls
│   │   ├── productService.js                 # Product API calls
│   │   ├── cartService.js                    # Cart state (AsyncStorage)
│   │   ├── userService.js                    # User profile calls
│   │   ├── orderService.js                   # Order API calls
│   │   └── analyticsService.js               # Event tracking
│   ├── context/
│   │   ├── AuthContext.js                    # Auth state provider
│   │   ├── CartContext.js                    # Cart state provider
│   │   ├── UserContext.js                    # User state provider
│   │   └── AppContext.js                     # App-wide state
│   ├── utils/
│   │   ├── validators.js                     # Form validation rules
│   │   ├── formatters.js                     # Data formatting
│   │   ├── constants.js                      # App constants
│   │   └── helpers.js                        # Utility functions
│   ├── App.js                                # Root component
│   ├── index.js                              # Entry point
│   └── config.js                             # App configuration
├── package.json                              # Dependencies
├── app.json                                  # React Native config
├── metro.config.js                           # Metro bundler config
├── android/                                  # Android native code
├── ios/                                      # iOS native code
├── .env                                      # Environment variables
├── .env.production                           # Production env
└── logs/                                     # Application logs
```

---

## API Endpoints Reference

### Authentication Endpoints

| Endpoint | Method | Auth | Parameters | Response |
|----------|--------|------|-----------|----------|
| `/api/users/register` | POST | ✗ | email, password, firstName | {token, user} |
| `/api/users/login` | POST | ✗ | email, password | {token, user} |
| `/api/users/profile` | GET | ✓ | - | {user} |
| `/api/users/change-password` | PUT | ✓ | currentPassword, newPassword | {success} |

### Product Endpoints

| Endpoint | Method | Auth | Parameters | Response |
|----------|--------|------|-----------|----------|
| `/api/products` | GET | ✗ | category?, limit?, page? | {items[], pagination} |
| `/api/products/:id` | GET | ✗ | - | {product} |
| `/api/products/search` | GET | ✗ | q, category? | {items[]} |
| `/api/products/categories` | GET | ✗ | - | {categories[]} |

### Order Endpoints

| Endpoint | Method | Auth | Parameters | Response |
|----------|--------|------|-----------|----------|
| `/api/orders` | POST | ✓ | items[], shipping data | {orderId} |
| `/api/orders` | GET | ✓ | - | {orders[]} |
| `/api/orders/:id` | GET | ✓ | - | {order} |
| `/api/admin/orders` | GET | ✓ (admin) | - | {orders[]} |
| `/api/admin/orders/:id` | PUT | ✓ (admin) | status, updates | {order} |

### Admin Endpoints

| Endpoint | Method | Auth | Parameters | Response |
|----------|--------|------|-----------|----------|
| `/api/admin/users` | GET | ✓ (admin) | - | {users[]} |
| `/api/admin/products` | POST | ✓ (admin) | name, price, ... | {product} |
| `/api/admin/products/:id` | PUT | ✓ (admin) | updates | {product} |
| `/api/admin/campaigns` | GET | ✓ (admin) | - | {campaigns[]} |

---

## Launch & Deployment

### Quick Start

**Option 1: Fully Automated**
```bash
cd /Users/drob/Documents/SistersPromise
./launch-all.sh
```

**Option 2: Custom Selection**
```bash
./launch-all.sh --backend-only      # Only backend server
./launch-all.sh --metro-only        # Only Metro bundler
./launch-all.sh --ios-only          # Only iOS simulator
./launch-all.sh --debug             # Verbose logging
```

### Service Startup Sequence

```
1. Requirement Check (5s)
   ├─ Node.js version
   ├─ npm packages
   ├─ Watchman (macOS)
   ├─ Xcode tools
   └─ Dependencies installation if needed

2. Port Cleanup (2s)
   └─ Kill existing processes on 443

3. Backend Server Start (8s)
   ├─ npm start (server.js)
   ├─ Wait for MongoDB connection
   ├─ Wait for port 443 response
   └─ Log to: logs/backend_TIMESTAMP.log

4. Metro Bundler Start (8s)
   ├─ npm start -- --reset-cache
   ├─ Clear Metro cache
   ├─ Bundle JavaScript
   └─ Log to: logs/metro_TIMESTAMP.log

5. iOS Simulator Launch (10s)
   ├─ Boot simulator if needed
   ├─ npm run ios
   ├─ Build and deploy app
   └─ Log to: logs/ios_TIMESTAMP.log

Total Time: ~2-3 minutes (depends on cache state)
```

### Service Health Checks

**Backend Health:**
```bash
curl -k https://localhost:443/api/health
# Expected: 200 OK with {status: "running"}
```

**Database Connection:**
```bash
# Check in backend logs
tail logs/backend_*.log | grep -i "mongodb"
# Expected: "MongoDB connected successfully"
```

**Metro Status:**
```bash
# Monitor bundler output
tail -f logs/metro_*.log
# Expected: "Builds the JavaScript bundle..."
```

**iOS Simulator:**
```bash
# Check if app loaded
xcrun simctl list devices | grep "Booted"
```

---

## Common Deployment Issues & Fixes

### Issue 1: Port 443 Already in Use

**Error:** `Error: listen EADDRINUSE: address already in use :::443`

**Solution:**
```bash
# Auto-handled by launcher, but manual fix:
lsof -ti:443 | xargs kill -9
sleep 2
npm start
```

### Issue 2: Metro Bundler Crash

**Error:** `Cannot find module` or `Metro bundler crashed`

**Solution:**
```bash
# Clear cache
cd SistersPromiseMobile
rm -rf node_modules/.cache
npm start -- --reset-cache

# Or completely reinstall
rm -rf node_modules package-lock.json
npm install
npm start
```

### Issue 3: Watchman File Watching Issues

**Error:** `Watchman: unable to establish connection`

**Solution:**
```bash
# macOS only
brew reinstall watchman

# Or bypass watchman
export METRO_SKIP_WATCHMAN=1
npm start
```

### Issue 4: Certificate Issues

**Error:** `CERTIFICATE_VERIFY_FAILED` or SSL errors

**Solution:**
```javascript
// In api.js (axios config)
// For development with self-signed certificates:
const axios = require('axios');

const api = axios.create({
  baseURL: 'https://localhost:443',
  httpsAgent: new (require('https').Agent)({
    rejectUnauthorized: false  // DEV ONLY!
  })
});
```

### Issue 5: Database Connection Timeout

**Error:** `MongoDB connection timeout` or `No servers found`

**Solution:**
1. Check MongoDB Atlas connection string in .env
2. Verify IP whitelist: MongoDB Atlas → Network Access
3. Test connection:
   ```bash
   mongosh "mongodb+srv://username:password@cluster.mongodb.net/database"
   ```

---

## Environment Configuration

### Backend (.env)

```env
# Server Configuration
NODE_ENV=development
PORT=443
HTTPS_KEY=./path/to/key.pem
HTTPS_CERT=./path/to/cert.pem

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbname
DB_NAME=sisters_promise

# Authentication
JWT_SECRET=your-secure-random-secret-here-min-32-chars
JWT_EXPIRATION=24h

# CORS
ALLOWED_ORIGINS=http://localhost:8081,https://yourdomain.com

# Logging
LOG_LEVEL=debug
LOG_FILE=./logs/app.log

# Third-party Services
STRIPE_KEY=sk_test_...
SENDGRID_KEY=SG...

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Frontend (.env)

```env
# API Configuration
API_URL=https://localhost:443
API_TIMEOUT=10000
DEBUG=true

# App Configuration
APP_NAME=Sister's Promise
APP_VERSION=1.0.0
BUNDLE_ID=com.sisterspromise.mobile

# Feature Flags
ENABLE_ANALYTICS=true
ENABLE_CRASH_REPORTING=false
```

---

## Performance Optimization

### Backend Optimization

1. **Database Indexes**
   ```javascript
   userSchema.index({ email: 1 });
   productSchema.index({ category: 1 });
   orderSchema.index({ userId: 1, createdAt: -1 });
   ```

2. **Caching Strategy**
   ```javascript
   const NodeCache = require('node-cache');
   const cache = new NodeCache({ stdTTL: 600 });
   
   // Cache product lists
   const products = cache.get('products') || 
                   await Product.find();
   ```

3. **Response Compression**
   ```javascript
   const compression = require('compression');
   app.use(compression());
   ```

4. **Database Connection Pooling**
   ```javascript
   mongoose.connect(uri, {
     maxPoolSize: 10,
     minPoolSize: 5
   });
   ```

### Frontend Optimization

1. **Image Optimization**
   - Use thumbnail URLs for lists
   - Load full-res images on detail screen
   - Implement progressive image loading

2. **Request Batching**
   - Combine multiple requests
   - Use GraphQL for flexible queries
   - Implement request debouncing

3. **State Management**
   - Use useMemo for expensive computations
   - Implement lazy loading for screens
   - Use React.memo for expensive components

4. **Bundle Size**
   - Remove unused dependencies
   - Use code splitting
   - Enable tree-shaking in bundler

---

## Security Implementation

### Backend Security Layers

```javascript
// 1. Input Validation
const { body, validationResult } = require('express-validator');

app.post('/api/orders', [
  body('email').isEmail().normalizeEmail(),
  body('items').isArray({ min: 1 }),
  body('total').isFloat({ min: 0 })
], orderController.create);

// 2. Authentication
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// 3. Authorization
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin only' });
  }
  next();
};

// 4. Rate Limiting
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// 5. CORS
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true
}));
```

### Frontend Security

```javascript
// 1. Secure Token Storage (iOS/Android)
import * as SecureStore from 'expo-secure-store';

// Store token securely
await SecureStore.setItemAsync('authToken', token);

// 2. SSL Pinning
import RNSSLPinning from 'rn-ssl-pinning';

const certificates = ['sha256/ABC123...'];
await RNSSLPinning.getCert(url, certificates);

// 3. Input Sanitization
const sanitize = (input) => {
  return input
    .replace(/[<>]/g, '')
    .trim()
    .substring(0, 100);
};
```

---

## Monitoring & Logging

### Backend Logging

```javascript
// Winston logger setup
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Usage
logger.info('Order created', { orderId, userId });
logger.error('Database error', { error });
```

### Frontend Logging

```javascript
// Analytics tracking
const trackEvent = async (eventName, properties = {}) => {
  try {
    await analyticsService.logEvent({
      event: eventName,
      properties: {
        ...properties,
        timestamp: new Date().toISOString(),
        userId: user?.id
      }
    });
  } catch (err) {
    console.error('Analytics error:', err);
  }
};

// Usage
trackEvent('product_viewed', { productId, category });
trackEvent('checkout_completed', { total, itemCount });
```

---

## Troubleshooting Guide

### Frontend Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Blank screen on startup | React mounting error | Check logs, validate component structure |
| Images not loading | Wrong image path | Verify images array structure in service |
| Cart not persisting | AsyncStorage not working | Check AsyncStorage permissions |
| Login fails silently | Token storage issue | Verify AsyncStorage is initialized |
| Slow app performance | Large state updates | Use useMemo, React.memo |

### Backend Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| 500 Server Error | Unhandled exception | Check server logs, add error handler |
| 401 Unauthorized | Token invalid/expired | Verify JWT_SECRET, token format |
| 400 Bad Request | Invalid input | Check validation schema |
| Timeout on requests | Database slow/disconnected | Check MongoDB connection, optimize query |
| Memory leak | Not closing connections | Implement connection pooling |

### Integration Issues

| Problem | Cause | Solution |
|---------|-------|----------|
| Mobile can't reach backend | Wrong API URL | Verify API_URL in mobile .env |
| CORS errors | Backend not allowing origin | Update CORS config with mobile origin |
| Data format mismatch | Field naming inconsistency | Use data adapter/transformer |
| Payment processing fails | Stripe key issue | Verify Stripe credentials |

---

## Testing Strategy

### Unit Tests

```javascript
// Backend
describe('Product Controller', () => {
  it('should fetch products by category', async () => {
    const result = await getProducts({ category: 'soap' });
    expect(result).toHaveLength(10);
    expect(result[0].category).toBe('soap');
  });
});

// Frontend
describe('authService', () => {
  it('should store token after login', async () => {
    await login('test@example.com', 'password');
    const token = await AsyncStorage.getItem('authToken');
    expect(token).toBeDefined();
  });
});
```

### Integration Tests

```javascript
// Full flow test
describe('Checkout Flow', () => {
  it('should create order successfully', async () => {
    // Login
    const { token } = await authService.login(...);
    
    // Get products
    const products = await productService.getProducts();
    
    // Create order
    const order = await orderService.createOrder({
      items: products.slice(0, 2),
      shipping: {...}
    });
    
    expect(order.orderId).toBeDefined();
    expect(order.status).toBe('pending');
  });
});
```

### End-to-End Tests

```bash
# Automated mobile app testing
npm run test:e2e

# Manual testing checklist
- [ ] Login flow
- [ ] Browse products
- [ ] Add to cart
- [ ] Checkout process
- [ ] Order confirmation
- [ ] Profile management
```

---

## Documentation Reference

| Document | Purpose | Location |
|----------|---------|----------|
| Quick Start | Get running in minutes | QUICK_START_GUIDE.sh |
| API Reference | All endpoints & responses | API_DATA_AUDIT_REPORT.md |
| Development Template | Complete dev guide | MOBILE_APP_TEMPLATE.md |
| Fixes Applied | Issues & solutions | API_FIXES_SUMMARY.md |
| Quick Lookup | Fast endpoint reference | QUICK_REFERENCE.md |
| Deployment | Production deployment | DEPLOYMENT_CHECKLIST.md |
| This Document | Architecture & procedures | MOBILE_APP_DEPLOYMENT.md |

---

## Rollback Procedures

### Rollback Backend

```bash
# If new deployment breaks:

# 1. Stop current server
./kill-all.sh

# 2. Restore previous version
git revert HEAD

# 3. Reinstall dependencies (if changed)
npm install

# 4. Start server
npm start

# 5. Verify health
curl -k https://localhost:443/api/health
```

### Rollback Frontend

```bash
# In app store/beta tester distribution:

# 1. Pull previous version
git checkout <previous-commit>

# 2. Rebuild app
npm run build:ios

# 3. Test thoroughly before release

# 4. Submit to app store
```

---

## Maintenance Schedule

### Daily

- [ ] Monitor error logs
- [ ] Check system health
- [ ] Verify database backups

### Weekly

- [ ] Update dependencies (npm update)
- [ ] Review security logs
- [ ] Performance analysis

### Monthly

- [ ] Database optimization
- [ ] Security audit
- [ ] User feedback review
- [ ] Cache cleanup

### Quarterly

- [ ] Major version updates
- [ ] Feature releases
- [ ] Security patches
- [ ] Load testing

---

## Support & Contact

For issues or questions:

1. Check troubleshooting section above
2. Review documentation files
3. Check backend logs: `tail logs/backend_*.log`
4. Check Metro logs: `tail logs/metro_*.log`
5. Monitor MongoDB Atlas dashboard

---

**Document Version:** 1.0  
**Last Updated:** January 18, 2026  
**Next Review:** April 18, 2026
