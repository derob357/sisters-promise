# Mobile App + Database Template: Complete Implementation Guide

**Last Updated:** January 2026  
**Template Version:** 1.0  
**For:** React Native + Express.js + MongoDB Integration

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Project Structure](#project-structure)
3. [Technology Stack](#technology-stack)
4. [API Design Patterns](#api-design-patterns)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Implementation Checklist](#implementation-checklist)
7. [Common Issues & Solutions](#common-issues--solutions)
8. [Deployment Strategy](#deployment-strategy)
9. [Performance & Scalability](#performance--scalability)
10. [Security Best Practices](#security-best-practices)

---

## Architecture Overview

### High-Level System Design

```
┌─────────────────────────────────────────────────────────────────┐
│                        iOS/Android App                          │
│                    (React Native 0.72+)                         │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  UI Components (Screens/Pages)                           │   │
│  │  - Navigation Stack (React Navigation)                   │   │
│  │  - State Management (AsyncStorage + Context)             │   │
│  │  - Forms & Input Validation                              │   │
│  └───────────────────────┬──────────────────────────────────┘   │
│                          │                                       │
│  ┌───────────────────────▼──────────────────────────────────┐   │
│  │  Service Layer                                           │   │
│  │  - authService.js (JWT tokens)                           │   │
│  │  - cartService.js (AsyncStorage)                         │   │
│  │  - productService.js (API calls)                         │   │
│  │  - userService.js (Profile management)                   │   │
│  └───────────────────────┬──────────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                    HTTPS/TLS │ (Port 443)
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                    Express.js API Server                         │
│                     (Node.js + HTTPS)                            │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Authentication Layer                                    │   │
│  │  - JWT token generation & validation                     │   │
│  │  - Bcrypt password hashing                               │   │
│  │  - Bearer token verification                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Route Handlers (/api/*)                                 │   │
│  │  - /api/users/* (auth, profile)                          │   │
│  │  - /api/products/* (catalog, search, filter)             │   │
│  │  - /api/orders (checkout, order history)                 │   │
│  │  - /api/admin/* (management)                             │   │
│  └──────────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Business Logic Layer                                    │   │
│  │  - Data validation & transformation                      │   │
│  │  - Business rule enforcement                             │   │
│  │  - Error handling & logging                              │   │
│  └───────────────────────┬──────────────────────────────────┘   │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                        MongoDB │ (Network)
                             │
┌────────────────────────────▼─────────────────────────────────────┐
│                     MongoDB Atlas (Cloud)                        │
│                                                                  │
│  Collections:                                                    │
│  - users (authentication, profiles)                             │
│  - products (catalog)                                           │
│  - orders (transactions)                                        │
│  - manualOrders (admin-created orders)                          │
│  - categories (product taxonomy)                                │
│  - reviews (user feedback)                                      │
│  - images (product media)                                       │
│  - analyticsEvents (tracking)                                   │
│  - chatRooms (messaging)                                        │
└────────────────────────────────────────────────────────────────┘
```

### Communication Flow

1. **User Authentication**
   - Mobile: Login form → authService.js → POST /api/users/login
   - Backend: Validates credentials → Generates JWT → Returns token + user data
   - Mobile: Stores token in AsyncStorage → Sets auth context

2. **Product Browsing**
   - Mobile: Component mount → productService.js → GET /api/products?category=X
   - Backend: Queries MongoDB → Filters results → Returns product array
   - Mobile: Displays products → Renders images from array

3. **Shopping Cart**
   - Mobile: Add to cart → cartService.js → Updates AsyncStorage
   - Backend: No real-time sync (optimization)
   - Mobile: On checkout → CheckoutScreen → POST /api/orders with cart items

4. **Order Placement**
   - Mobile: User fills shipping form → Submits with items array
   - Backend: Authenticates token → Validates order → Saves to MongoDB
   - Backend: Returns orderId → Mobile navigates to confirmation

---

## Project Structure

### Backend (Express.js)

```
/Users/drob/Documents/SistersPromise/
├── server.js                    # Main Express application
├── package.json                 # Dependencies & scripts
├── credentials.json             # MongoDB Atlas credentials
├── .env                         # Environment variables (DB_URI, JWT_SECRET)
├── middleware/
│   ├── authenticate.js          # JWT token verification
│   ├── errorHandler.js          # Error handling
│   └── logger.js                # Request logging
├── models/
│   ├── User.js                  # User schema
│   ├── Product.js               # Product schema
│   ├── Order.js                 # Order schema
│   ├── ManualOrder.js           # Admin order schema
│   └── Category.js              # Category schema
├── routes/
│   ├── auth.js                  # Authentication endpoints
│   ├── products.js              # Product endpoints
│   ├── orders.js                # Order endpoints
│   ├── admin.js                 # Admin endpoints
│   └── chat.js                  # Messaging endpoints
├── controllers/
│   ├── userController.js        # User logic
│   ├── productController.js     # Product logic
│   └── orderController.js       # Order logic
└── utils/
    ├── validators.js            # Input validation
    ├── response.js              # Standardized responses
    └── constants.js             # App constants
```

### Mobile (React Native)

```
/Users/drob/Documents/SistersPromise/SistersPromiseMobile/
├── src/
│   ├── screens/
│   │   ├── HomeScreen.js
│   │   ├── LoginScreen.js
│   │   ├── ProductsScreen.js
│   │   ├── ProductDetailScreen.js
│   │   ├── CartScreen.js
│   │   ├── CheckoutScreen.js
│   │   ├── OrderConfirmationScreen.js
│   │   └── ProfileScreen.js
│   ├── components/
│   │   ├── ProductCard.js
│   │   ├── CartItem.js
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   └── Loading.js
│   ├── services/
│   │   ├── authService.js       # Authentication API calls
│   │   ├── productService.js    # Product API calls
│   │   ├── cartService.js       # Cart state (AsyncStorage)
│   │   ├── userService.js       # User profile API calls
│   │   └── analyticsService.js  # Event tracking
│   ├── context/
│   │   ├── AuthContext.js       # Global auth state
│   │   ├── CartContext.js       # Global cart state
│   │   └── UserContext.js       # Global user state
│   ├── utils/
│   │   ├── api.js               # Axios instance & config
│   │   ├── validators.js        # Form validation
│   │   └── constants.js         # App constants
│   ├── App.js                   # Root component
│   └── index.js                 # Entry point
├── package.json
├── app.json
└── android/ios folders          # Native platform code
```

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Node.js | 18.x+ | Runtime environment |
| Express.js | 4.x | HTTP server framework |
| MongoDB | 5.x+ | Database (Atlas cloud) |
| Mongoose | 7.x | ODM/Schema management |
| jsonwebtoken | 9.x | JWT generation/validation |
| bcryptjs | 2.4.x | Password hashing |
| cors | 2.8.x | Cross-origin requests |
| dotenv | 16.x | Environment variables |
| axios | 1.x | HTTP client (external APIs) |

### Frontend (Mobile)

| Technology | Version | Purpose |
|-----------|---------|---------|
| React Native | 0.72.x | Mobile framework |
| React | 18.x | UI library |
| React Navigation | 7.x | Navigation |
| Axios | 1.x | HTTP client |
| AsyncStorage | 2.x | Local data persistence |
| JWT decode | 3.x | Token parsing |

### Development Tools

| Tool | Purpose |
|------|---------|
| npm | Package manager |
| Metro Bundler | React Native JS bundler |
| Xcode | iOS development |
| Android Studio | Android development |
| Watchman | File watching (macOS) |
| MongoDB Atlas | Cloud database |

---

## API Design Patterns

### 1. Endpoint Naming Convention

```
/api/[resource]/[action]

Examples:
GET    /api/users/profile           (Get user profile)
POST   /api/users/register          (Register new user)
POST   /api/users/login             (User login)
PUT    /api/users/change-password   (Update password)

GET    /api/products                (List products)
GET    /api/products/:id            (Get single product)
GET    /api/products?category=X     (Filter by category)

POST   /api/orders                  (Create order)
GET    /api/orders                  (Get user orders)
GET    /api/admin/orders            (Get all orders)
```

### 2. Request/Response Format

**Standard Request Headers:**
```javascript
{
  'Content-Type': 'application/json',
  'Authorization': 'Bearer {JWT_TOKEN}',  // For protected routes
  'User-Agent': 'SistersPromise/1.0'
}
```

**Standard Response Format:**
```javascript
{
  success: true,
  message: "Operation successful",
  data: { /* resource data */ },
  timestamp: "2026-01-18T10:30:00Z",
  errors: null
}
```

**Error Response Format:**
```javascript
{
  success: false,
  message: "Descriptive error message",
  data: null,
  timestamp: "2026-01-18T10:30:00Z",
  errors: [
    {
      field: "email",
      code: "INVALID_EMAIL",
      message: "Email format is invalid"
    }
  ]
}
```

### 3. Authentication Pattern

**Login Flow:**
```
1. POST /api/users/login { email, password }
2. Backend: Hash password check → Generate JWT
3. Response: { token, user: { id, email, firstName, ... } }
4. Mobile: Store token in AsyncStorage
5. Subsequent requests: Include "Authorization: Bearer {token}"
```

**Token Validation:**
```javascript
// Backend middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({...});
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({...});
  }
};
```

### 4. Data Validation

**Backend Validation:**
```javascript
// Before database operation
const validateOrder = (data) => {
  const errors = [];
  
  if (!data.items?.length) errors.push('Cart is empty');
  if (!data.email?.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) 
    errors.push('Invalid email');
  if (!data.firstName?.trim()) errors.push('First name required');
  
  return errors.length ? { valid: false, errors } : { valid: true };
};
```

**Frontend Validation:**
```javascript
// Before API call
const validateCheckoutForm = (form) => {
  const errors = {};
  
  if (!form.email) errors.email = "Email is required";
  if (!form.phone?.match(/^\d{10}$/)) errors.phone = "Invalid phone";
  
  return Object.keys(errors).length ? errors : null;
};
```

### 5. Pagination Pattern

```javascript
// Query: GET /api/products?page=2&limit=10&sort=name&order=asc
// Response:
{
  success: true,
  data: {
    items: [...],
    pagination: {
      page: 2,
      limit: 10,
      total: 150,
      totalPages: 15,
      hasNext: true,
      hasPrev: true
    }
  }
}
```

---

## Data Flow Architecture

### 1. Authentication Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Mobile App (React Native)                  │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ LoginScreen                                            │ │
│  │ - Collects: email, password                            │ │
│  │ - Calls: authService.login(email, password)            │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                       │
│  ┌────────────────────▼───────────────────────────────────┐ │
│  │ authService.js                                         │ │
│  │ - POST /api/users/login { email, password }            │ │
│  │ - Response: { token, user }                            │ │
│  │ - Calls: AsyncStorage.setItem('authToken', token)     │ │
│  │ - Updates: AuthContext.setUser(user)                   │ │
│  └────────────────────┬───────────────────────────────────┘ │
│                       │                                       │
└───────────────────────┼───────────────────────────────────────┘
                        │
        ┌───────────────▼────────────────┐
        │  Express.js Backend            │
        │                                │
        │  POST /api/users/login         │
        │  1. Validate email format      │
        │  2. Find user in MongoDB       │
        │  3. Compare password hash      │
        │  4. Generate JWT token         │
        │  5. Return user + token        │
        │                                │
        └────────────────────────────────┘
```

### 2. Product Fetch Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                  Mobile App                                  │
│                                                              │
│  ProductsScreen                                             │
│  ├─ useEffect(() => {                                       │
│  │   productService.getProducts({ category: 'soap' })       │
│  │ })                                                        │
│  │                                                           │
│  └─ Response: [                                             │
│     {                                                        │
│       id: "507f1f77bcf86cd799439011",                       │
│       name: "Sea Moss Soap",                                │
│       price: 12.99,                                         │
│       images: [                                             │
│         {                                                    │
│           url: "https://cdn.../main.jpg",                   │
│           thumbnailUrl: "https://cdn.../thumb.jpg"          │
│         }                                                    │
│       ],                                                     │
│       category: "soap",                                     │
│       description: "..."                                    │
│     },                                                       │
│     ...                                                      │
│   ]                                                          │
│                                                              │
│  Render: <ProductCard product={p} key={p.id} />             │
└─────────────────────────────────────────────────────────────┘

┌────────────────────────────────────────────────────────────┐
│ GET /api/products?category=soap                            │
│                                                             │
│ Backend:                                                    │
│ 1. Parse query: { category: 'soap' }                       │
│ 2. Query MongoDB: db.products.find({ category: 'soap' })   │
│ 3. Transform: Add computed fields                          │
│ 4. Return 10-50 items                                      │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

### 3. Order Checkout Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│                  Mobile App                                  │
│                                                              │
│  CheckoutScreen                                             │
│  - Gets cart from AsyncStorage via cartService.getCart()   │
│  - Form inputs:                                             │
│    • firstName, lastName, email                            │
│    • phone, address, city, state, zip                      │
│                                                              │
│  On Submit:                                                 │
│  └─ POST /api/orders {                                      │
│       items: [{productId, quantity, price}],                │
│       firstName, lastName, email,                           │
│       phone, address, city, state, zip,                     │
│       total: 49.99                                          │
│     }                                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Express.js Backend                                           │
│                                                              │
│ POST /api/orders (with authenticate middleware)             │
│ 1. Verify JWT token                                         │
│ 2. Validate order data                                      │
│ 3. Create ManualOrder document:                             │
│    {                                                         │
│      _id: ObjectId,                                         │
│      creatorId: user._id,                                   │
│      products: [{productId, quantity}],                     │
│      shippingAddress: {                                     │
│        firstName, lastName, email,                          │
│        phone, address, city, state, zip                     │
│      },                                                      │
│      total: 49.99,                                          │
│      status: "pending",                                     │
│      createdAt: ISODate(),                                  │
│      paymentMethod: "online"                                │
│    }                                                         │
│ 4. Save to MongoDB.manualOrders                             │
│ 5. Return { orderId: "..." }                                │
│                                                              │
└──────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────┐
│ Mobile App - Confirmation                                    │
│                                                              │
│ Response: { orderId: "507f1f77bcf86cd799439012" }            │
│ └─ Navigate to OrderConfirmationScreen                      │
│    └─ Display: "Order #507... placed successfully!"         │
│    └─ Clear cart: AsyncStorage.removeItem('cart')          │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

Use this checklist when building a new mobile app project.

### Phase 1: Project Setup

- [ ] Initialize Node.js backend
  - [ ] `npm init` and configure package.json
  - [ ] Install Express, MongoDB, JWT, CORS
  - [ ] Create .env file with database URI, JWT secret
  - [ ] Set up HTTPS with SSL certificates
  
- [ ] Initialize React Native project
  - [ ] `npx react-native init MyApp`
  - [ ] Install Navigation, AsyncStorage, Axios
  - [ ] Set up .env or .env.production for API endpoint
  - [ ] Configure metro.config.js if needed

- [ ] Set up MongoDB Atlas
  - [ ] Create cluster
  - [ ] Create database
  - [ ] Add IP whitelist
  - [ ] Get connection URI
  - [ ] Store securely (credentials.json or .env)

### Phase 2: Backend Core Structure

- [ ] Authentication
  - [ ] Create User model/schema
  - [ ] Implement JWT generation logic
  - [ ] Add password hashing (bcrypt)
  - [ ] Create `/api/users/register` endpoint
  - [ ] Create `/api/users/login` endpoint
  - [ ] Add authenticate middleware for protected routes

- [ ] API Standardization
  - [ ] Create response wrapper utility
  - [ ] Add global error handling middleware
  - [ ] Implement request logging
  - [ ] Add input validation middleware
  - [ ] Document all endpoint patterns

- [ ] Core Endpoints
  - [ ] `/api/users/profile` - Get user data
  - [ ] `/api/users/change-password` - Update password
  - [ ] `/api/products` - List products (with filtering)
  - [ ] `/api/products/:id` - Get single product
  - [ ] `/api/orders` - Create order (protected)
  - [ ] `/api/orders` - Get user orders (protected)

### Phase 3: Frontend Core Structure

- [ ] Project Setup
  - [ ] Create services folder
  - [ ] Create screens/components folders
  - [ ] Set up React Navigation
  - [ ] Create auth context/state
  - [ ] Create cart context/state

- [ ] Authentication Service
  - [ ] Implement authService.js
  - [ ] Create login/register/logout methods
  - [ ] Handle token storage in AsyncStorage
  - [ ] Implement automatic token refresh
  - [ ] Create authenticated axios instance

- [ ] Core Screens
  - [ ] LoginScreen with form validation
  - [ ] ProductsScreen with list display
  - [ ] ProductDetailScreen
  - [ ] CartScreen with item management
  - [ ] CheckoutScreen with form
  - [ ] OrderConfirmationScreen

### Phase 4: Data Integration

- [ ] Service Layer
  - [ ] Create productService.js
  - [ ] Create cartService.js (AsyncStorage)
  - [ ] Create userService.js
  - [ ] Create orderService.js
  - [ ] Handle both old and new response formats

- [ ] Error Handling
  - [ ] Implement error boundaries (React)
  - [ ] Create error toast notifications
  - [ ] Handle network timeouts
  - [ ] Log errors to backend

- [ ] Testing Data Flow
  - [ ] Test login flow
  - [ ] Test product loading
  - [ ] Test cart operations
  - [ ] Test checkout submission
  - [ ] Verify order in MongoDB

### Phase 5: Refinement

- [ ] Performance
  - [ ] Implement pagination
  - [ ] Add image lazy loading
  - [ ] Cache API responses
  - [ ] Reduce API calls

- [ ] UI/UX
  - [ ] Add loading states
  - [ ] Add error messages
  - [ ] Add success confirmations
  - [ ] Test on multiple screen sizes

- [ ] Security
  - [ ] Validate all inputs
  - [ ] Implement CORS properly
  - [ ] Add rate limiting
  - [ ] Secure sensitive data

- [ ] Documentation
  - [ ] Document API endpoints
  - [ ] Create deployment guide
  - [ ] Document environment setup
  - [ ] Create troubleshooting guide

---

## Common Issues & Solutions

### 1. CORS Errors

**Symptom:** `Access to XMLHttpRequest blocked by CORS policy`

**Root Cause:** Backend not allowing requests from mobile app origin

**Solution:**
```javascript
// server.js
const cors = require('cors');

app.use(cors({
  origin: ['http://localhost:8081', 'https://yourdomain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 2. Authentication Token Invalid After Refresh

**Symptom:** Token works initially, fails after app restart

**Root Cause:** Token not stored persistently or corrupted

**Solution:**
```javascript
// authService.js
export const getStoredToken = async () => {
  try {
    const token = await AsyncStorage.getItem('authToken');
    if (token && !isTokenExpired(token)) {
      return token;
    } else {
      await AsyncStorage.removeItem('authToken');
      return null;
    }
  } catch (err) {
    console.error('Token retrieval failed:', err);
    return null;
  }
};

const isTokenExpired = (token) => {
  const decoded = jwtDecode(token);
  return decoded.exp < Date.now() / 1000;
};
```

### 3. Product Images Not Loading

**Symptom:** Images array from backend but mobile shows undefined

**Root Cause:** Mismatch between image field names

**Solution:**
```javascript
// cartService.js
const extractImageUrl = (product) => {
  // Try images array first
  if (product.images?.length > 0) {
    return product.images[0].url || product.images[0].thumbnailUrl;
  }
  // Fall back to legacy field
  return product.imageUrl || 'default-image-url';
};
```

### 4. Order Creation Returns 400 Error

**Symptom:** POST /api/orders returns validation error

**Root Cause:** Field name mismatch (e.g., shippingInfo nesting)

**Solution:**
```javascript
// CheckoutScreen.js - Send flat structure
const orderData = {
  items: cart,
  firstName: form.fullName.split(' ')[0],
  lastName: form.fullName.split(' ')[1],
  email: form.email,
  phone: form.phone,
  address: form.address,
  city: form.city,
  state: form.state,
  zip: form.zip,
  total: calculateTotal(cart)
};
```

### 5. Metro Bundler Crashes

**Symptom:** Metro crashes with "Cannot find module" error

**Root Cause:** Corrupted cache or missing dependencies

**Solution:**
```bash
# Kill Metro
pkill -f "react-native.*start"

# Clean cache
cd SistersPromiseMobile
rm -rf node_modules/.cache
npm start -- --reset-cache
```

### 6. Backend Connection Timeout

**Symptom:** Mobile app shows "Network request failed"

**Root Cause:** Backend not reachable or HTTPS certificate issue

**Solution:**
```javascript
// On macOS simulator
// Use localhost:443 for simulator
// Use actual IP for Android/real device

// In axios config:
const API_BASE_URL = __DEV__
  ? 'https://localhost:443'  // Simulator
  : 'https://api.yourdomain.com';  // Production

// Handle self-signed certificates in dev:
const instance = axios.create({
  baseURL: API_BASE_URL,
  validateStatus: () => true  // Don't reject any status
});
```

### 7. Password Hash Mismatch During Login

**Symptom:** Correct password rejected

**Root Cause:** Hash algorithm mismatch or rounds changed

**Solution:**
```javascript
// server.js - Ensure consistent hashing
const bcrypt = require('bcryptjs');

// During registration
const hashedPassword = await bcrypt.hash(password, 10);

// During login
const passwordMatch = await bcrypt.compare(password, user.passwordHash);
if (!passwordMatch) {
  return res.status(401).json({
    success: false,
    message: "Invalid credentials"
  });
}
```

### 8. Duplicate Records in MongoDB

**Symptom:** Same order created multiple times

**Root Cause:** Race condition from multiple requests or missing unique index

**Solution:**
```javascript
// Models
// Add unique index to prevent duplicates
userSchema.index({ email: 1 }, { unique: true });
orderSchema.index({ referenceId: 1 }, { unique: true });

// In endpoint
const existingOrder = await Order.findOne({ referenceId });
if (existingOrder) {
  return res.json({ success: true, data: existingOrder });
}
// Create new order...
```

### 9. JWT Token Expiration Breaks App

**Symptom:** App works for a while, then suddenly unauthorized

**Root Cause:** Token expired, no refresh mechanism

**Solution:**
```javascript
// authService.js - Implement refresh token logic
export const loginUser = async (email, password) => {
  const response = await api.post('/users/login', { email, password });
  
  // Store both token and refresh token
  await AsyncStorage.setItem('authToken', response.data.data.token);
  await AsyncStorage.setItem('refreshToken', response.data.data.refreshToken);
  
  return response.data.data;
};

// In axios interceptor
api.interceptors.response.use(
  response => response,
  async error => {
    if (error.response?.status === 401) {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const newToken = await api.post('/users/refresh', { refreshToken });
          await AsyncStorage.setItem('authToken', newToken.data.data.token);
          return api(error.config);
        } catch (err) {
          // Refresh failed, logout user
          await logout();
        }
      }
    }
    return Promise.reject(error);
  }
);
```

### 10. Memory Leak in Cart (AsyncStorage Grows)

**Symptom:** App slows down after many shopping sessions

**Root Cause:** Old cart data not cleared

**Solution:**
```javascript
// cartService.js
export const clearCart = async () => {
  try {
    await AsyncStorage.removeItem('sisters_promise_cart');
    return true;
  } catch (error) {
    console.error('Failed to clear cart:', error);
    return false;
  }
};

// On successful order
await clearCart();
```

---

## Deployment Strategy

### Pre-Deployment Checklist

- [ ] **Backend:**
  - [ ] Update .env with production database URI
  - [ ] Set JWT_SECRET to strong random value
  - [ ] Enable HTTPS with valid SSL certificate
  - [ ] Set NODE_ENV=production
  - [ ] Enable request logging
  - [ ] Set up database backups
  - [ ] Test all endpoints with production database
  - [ ] Enable CORS for production domain only
  - [ ] Set up error monitoring (Sentry, etc.)

- [ ] **Mobile:**
  - [ ] Update API endpoint to production URL
  - [ ] Remove debug logs and console statements
  - [ ] Test on physical device (not just simulator)
  - [ ] Verify all images load correctly
  - [ ] Test checkout flow end-to-end
  - [ ] Verify token refresh works
  - [ ] Build for release: `npm run build:ios`
  - [ ] Archive and sign for App Store

### Backend Deployment (Node.js/Express)

**Option 1: Traditional VPS (AWS EC2, DigitalOcean)**
```bash
# On server
git clone <repo>
cd SistersPromise
npm install --production
npm start
```

**Option 2: Platform as a Service (Heroku, Render)**
```yaml
# render.yaml
services:
  - type: web
    name: sisters-promise-api
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: DATABASE_URL
        scope: pull_request,preview,production
        value: mongodb+srv://...
      - key: JWT_SECRET
        scope: pull_request,preview,production
        value: your-secret-here
```

**Option 3: Containers (Docker)**
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 443
CMD ["npm", "start"]
```

### Mobile Deployment

**iOS Distribution:**
```bash
# Create release build
npm run build:ios

# In Xcode
1. Product → Scheme → Edit Scheme → Release
2. Product → Archive
3. Distribute App
4. Upload to App Store Connect
```

**Android Distribution:**
```bash
# Create release APK
npm run build:android

# Upload to Google Play Console
```

---

## Performance & Scalability

### Backend Optimization

1. **Database Indexing**
   ```javascript
   // Create indexes for common queries
   userSchema.index({ email: 1 });
   productSchema.index({ category: 1 });
   productSchema.index({ name: 'text' });
   orderSchema.index({ userId: 1, createdAt: -1 });
   ```

2. **Caching Strategy**
   ```javascript
   // Cache products list
   const cache = new Map();
   
   export const getProductsWithCache = async (category) => {
     const key = `products_${category}`;
     
     if (cache.has(key)) {
       return cache.get(key);
     }
     
     const products = await Product.find({ category });
     cache.set(key, products);
     
     // Clear cache after 5 minutes
     setTimeout(() => cache.delete(key), 5 * 60 * 1000);
     
     return products;
   };
   ```

3. **Pagination**
   ```javascript
   app.get('/api/products', async (req, res) => {
     const page = parseInt(req.query.page) || 1;
     const limit = parseInt(req.query.limit) || 10;
     const skip = (page - 1) * limit;
     
     const products = await Product.find()
       .skip(skip)
       .limit(limit)
       .sort({ createdAt: -1 });
     
     res.json({ success: true, data: { items: products, page, limit } });
   });
   ```

### Frontend Optimization

1. **Image Optimization**
   - [ ] Use thumbnail URLs for lists
   - [ ] Load full images only in detail screens
   - [ ] Implement progressive image loading

2. **API Request Optimization**
   - [ ] Implement request debouncing
   - [ ] Cache responses where appropriate
   - [ ] Batch requests when possible
   - [ ] Use compression

3. **State Management**
   - [ ] Minimize global state updates
   - [ ] Use useMemo/useCallback appropriately
   - [ ] Implement lazy loading for screens

---

## Security Best Practices

### Backend Security

1. **Authentication & Authorization**
   ```javascript
   // Always validate tokens
   const authenticate = (req, res, next) => {
     const token = req.headers.authorization?.split(' ')[1];
     if (!token) return res.status(401).json({ success: false });
     
     try {
       req.user = jwt.verify(token, process.env.JWT_SECRET);
       next();
     } catch (err) {
       res.status(401).json({ success: false });
     }
   };
   ```

2. **Input Validation**
   ```javascript
   // Validate and sanitize all inputs
   const { body, validationResult } = require('express-validator');
   
   app.post('/api/users/login', [
     body('email').isEmail().normalizeEmail(),
     body('password').isLength({ min: 6 })
   ], (req, res) => {
     const errors = validationResult(req);
     if (!errors.isEmpty()) {
       return res.status(400).json({ errors: errors.array() });
     }
     // Process login...
   });
   ```

3. **Rate Limiting**
   ```javascript
   const rateLimit = require('express-rate-limit');
   
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,  // 15 minutes
     max: 100,                    // 100 requests per window
     message: 'Too many requests'
   });
   
   app.use('/api/', limiter);
   ```

4. **HTTPS & SSL**
   - [ ] Always use HTTPS in production
   - [ ] Install valid SSL certificate
   - [ ] Implement HSTS headers
   - [ ] Keep certificates updated

5. **Database Security**
   - [ ] Use strong passwords
   - [ ] Enable MongoDB authentication
   - [ ] Use IP whitelist on MongoDB Atlas
   - [ ] Encrypt sensitive fields
   - [ ] Regular backups

### Frontend Security

1. **Token Storage**
   ```javascript
   // Use AsyncStorage but consider Secure Storage for production
   // For extra security on iOS/Android:
   // - Use react-native-keychain for iOS Keychain
   // - Use Android SharedPreferences Encrypted
   ```

2. **SSL Pinning** (Production)
   ```javascript
   // Prevent man-in-the-middle attacks
   // Install react-native-ssl-pinning package
   ```

3. **Input Validation**
   - [ ] Validate all form inputs client-side
   - [ ] Sanitize user data before display
   - [ ] Prevent SQL injection / NoSQL injection

4. **Secure Communication**
   - [ ] Always use HTTPS
   - [ ] Implement certificate pinning
   - [ ] Validate SSL certificates

---

## Quick Reference Commands

### Development

```bash
# Backend
cd /Users/drob/Documents/SistersPromise
npm start                    # Start backend server
npm run dev                  # Start with livereload

# Mobile
cd SistersPromiseMobile
npm start                    # Start Metro bundler
npm run ios                  # Launch iOS simulator
npm run android             # Launch Android emulator

# Launch All
/Users/drob/Documents/SistersPromise/launch-all.sh
/Users/drob/Documents/SistersPromise/kill-all.sh
```

### MongoDB Operations

```bash
# Connect to MongoDB Atlas
mongosh "mongodb+srv://..."

# Query examples
db.users.find({ email: "test@example.com" })
db.products.find({ category: "soap" })
db.orders.find({ creatorId: ObjectId("...") })
```

### Deployment

```bash
# Build iOS
npm run build:ios

# Build Android
npm run build:android

# Deploy backend to Render/Heroku
git push render main
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2026 | Initial comprehensive template |

---

## Support & Resources

- **API Documentation:** See API_DATA_AUDIT_REPORT.md
- **Fixes Applied:** See API_FIXES_SUMMARY.md
- **Quick Lookup:** See QUICK_REFERENCE.md
- **Deployment:** See DEPLOYMENT_CHECKLIST.md

**Last Updated:** January 18, 2026
