# Sisters Promise - Startup Guide

**Current Build Version:** v009.6 (Updated January 19, 2026)

## Quick Start (All-in-One)

```bash
# Terminal 1: Backend Server
cd /Users/drob/Documents/SistersPromise
npm start

# Terminal 2: Metro Bundler (new terminal)
cd /Users/drob/Documents/SistersPromise/SistersPromiseMobile
npm start -- --reset-cache

# Terminal 3: Deploy to Simulator (after Metro is ready)
cd /Users/drob/Documents/SistersPromise/SistersPromiseMobile
npx react-native run-ios --simulator="iPhone 16 Pro"

# Optional: Deploy to iPad Simulator
npx react-native run-ios --simulator="iPad Pro (11-inch) (4th generation)"
```

## System Architecture

### Backend Server
- **Location**: `/Users/drob/Documents/SistersPromise`
- **Port**: 443 (HTTPS/TLS)
- **Environment**: Production (uses `.env.production`)
- **Database**: MongoDB Atlas
  - URI: `mongodb+srv://derob357:***REMOVED***@cluster0sp.ysdiayg.mongodb.net/sisterspromise`
  - Database: `sisterspromise`
  - Collections: Products (5 Etsy items), Users, Orders

### Mobile App
- **Location**: `/Users/drob/Documents/SistersPromise/SistersPromiseMobile`
- **Framework**: React Native 0.72.13
- **React**: 18.2.0
- **iOS Target**: 16.0 minimum
- **Metro Bundler**: Port 8081
- **Current Simulators Running**: 
  - iPhone 16 Pro (iOS 18.6) with app deployed
  - iPad Pro 11-inch (4th generation) with app deployed
- **App Bundle ID**: `com.sisterspromise.app`
- **App Icon**: Sisters Promise logo (all sizes)

## Key Versions (DO NOT CHANGE)
- React Native: **0.72.13** (downgraded from 0.83.1 due to incompatibility)
- React: **18.2.0** (downgraded from 19.2.0)
- react-native-screens: **4.15.4** (compatible with RN 0.72.13)
- iOS Deployment Target: **16.0** (required by react-native-screens)

## API Endpoints

### Authentication
- `POST /users/register` - Create new user account
- `POST /users/login` - User login
- `GET /users/profile` - Get logged-in user profile
- `POST /users/change-password` - Change password

### Products
- `GET /api/products` - Get all products
- `GET /api/products/:id` - Get single product
- `GET /api/products/categories` - Get product categories
- `GET /api/products/search?q=query` - Search products

### Orders
- `POST /api/orders` - Create order
- `POST /api/checkout` - Process payment (Square)

### Analytics
- `POST /api/analytics/event` - Track event
- `POST /api/analytics/signup` - Track signup
- `POST /api/analytics/purchase` - Track purchase
- `POST /api/analytics/product` - Track product interaction
- `POST /api/analytics/email-subscription` - Track email subscription
- `POST /api/analytics/form` - Track form submission

## Test Credentials

```
Admin Account:
  Email: admin@sisterspromise.com
  Password: admin123

Customer Account:
  Email: customer@example.com
  Password: customer123

Test User (Created in this session):
  Email: testuser@example.com
  Password: Test@1234
```

## Troubleshooting

### Metro bundler port already in use
```bash
lsof -i :8081 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Backend server port already in use
```bash
lsof -i :443 | grep -v COMMAND | awk '{print $2}' | xargs kill -9
```

### Kill all processes
```bash
pkill -9 node
pkill -9 npm
```

### Check what's running
```bash
ps aux | grep -E "node|npm" | grep -v grep
```

## Recent Fixes Applied

1. **Icon Import Fix** (Commit 767f068)
   - Changed from `@expo/vector-icons` to `react-native-vector-icons`
   - Updated AppNavigator.js

2. **Backend API Expansion** (Commit 442bcf2)
   - Added user authentication endpoints
   - Added product search & categories
   - Added orders endpoint
   - Added analytics tracking endpoints

3. **React Native Downgrade** (Commit 24fab66)
   - Downgraded React Native from 0.83.1 to 0.72.13
   - Downgraded React from 19.2.0 to 18.2.0
   - Fixed react-native-screens to 4.15.4
   - Set iOS deployment target to 16.0
   - Resolved Metro bundler module resolution issues

## Next Steps

- Fix user login authentication (password comparison issue)
- Connect mobile app UI to backend APIs
- Add user session management
- Implement product list display in mobile app
- Add shopping cart functionality
- Test payment processing with Square API
