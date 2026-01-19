# Quick Reference - Sisters Promise Mobile App (v009.6)

**Last Updated:** January 19, 2026

## ✅ Current Build Status

### Mobile App Features Implemented
- ✅ User authentication (login/register)
- ✅ Product browsing with search & categories
- ✅ Shopping cart management
- ✅ Order checkout & creation
- ✅ User profile screen
- ✅ Blog posts display
- ✅ Admin dashboard (role-based)
- ✅ Order management (admin)
- ✅ Error boundary with logging
- ✅ App restart functionality
- ✅ Custom Sisters Promise app icon
- ✅ Multi-screen layout (iPhone & iPad)

### Backend Endpoints Implemented
| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/health` | GET | No | Server health check |
| `/api/users/register` | POST | No | User registration |
| `/api/users/login` | POST | No | User authentication |
| `/api/users/profile` | GET | Yes | Get user profile |
| `/api/users/change-password` | POST | Yes | Change password |
| `/api/products` | GET | No | Get all products |
| `/api/products/:id` | GET | No | Get single product |
| `/api/products/categories` | GET | No | Get product categories |
| `/api/products/search` | GET | No | Search products |
| `/api/checkout` | POST | No | Square payment |
| `/api/orders` | POST | Yes | Create order |
| `/api/admin/stats` | GET | Yes* | Admin statistics |
| `/api/admin/orders` | GET | Yes* | Admin order list |
| `/api/analytics/*` | POST | No | Track analytics events |
| `/api/email/subscribe` | POST | No | Newsletter subscription |

*Requires admin/owner role

## 📲 Mobile App Screens

### Public Screens (No Auth Required)
1. **LoginScreen** - Login with email/password
2. **RegisterScreen** - Create new account
3. **HomeScreen** - Browse products with search/filter
4. **ProductDetailScreen** - Product information
5. **CartScreen** - View & manage cart items
6. **CheckoutScreen** - Enter shipping & create order
7. **PrivacyPolicyScreen** - Privacy policy text
8. **BlogScreen** - Blog posts (placeholder)

### Protected Screens (Auth Required)
9. **ProfileScreen** - User account settings
10. **AdminDashboardScreen** - Admin stats (admin/owner only)
11. **OrderManagementScreen** - Order list & updates (admin/owner only)

## 🔐 Test Credentials

```
Admin Account:
  Email: deric.robinson71@gmail.com
  Password: (set during registration)
  Role: admin
  
Test Customer:
  Email: customer@example.com
  Password: customer123
  Role: standard
```

## 📊 Database Structure

### Users Collection
- `_id` - MongoDB ID
- `firstName`, `lastName` - Name
- `email` - Unique email
- `passwordHash` - Hashed password
- `phone` - Contact number
- `role` - [standard, subscriber, admin, owner]
- `status` - [active, inactive, suspended]
- `createdAt` - Registration timestamp

### Products Collection
- `_id` - MongoDB ID
- `name` - Product name
- `category` - Product category
- `price` - Product price
- `description` - Description
- `images` - Image URLs array
- `etsyListingId` - Etsy integration ID (if applicable)
- `stock` - Quantity available

### Orders Collection
- `_id` - MongoDB ID
- `userId` - Reference to user
- `items` - Array of order items
- `total` - Order total
- `status` - [pending, processing, shipped, delivered, cancelled]
- `shippingAddress` - Address details
- `createdAt` - Order date

## 🔧 Important Fixes (v009 Series)

| Version | Fix |
|---------|-----|
| v009.0 | Fixed bottom tab bar icons |
| v009.1 | Added Blog & Admin tabs |
| v009.2 | Added admin stats/orders endpoints |
| v009.3 | Implemented error boundary |
| v009.4 | Added admin error logs |
| v009.5 | Fixed React key prop warning |
| v009.6 | Added custom app icon & iPad support |

## 🚀 Git Commits

Latest commits in order:
```
v009.6 - Update app icon to Sisters Promise logo for iOS
v009.5 - Fix key prop warning - use MongoDB _id for all list renders
v009.4 - Add admin/owner error view with copyable logs
v009.3 - Add friendly error screen with app restart
v009.2 - Add admin dashboard API endpoints (backend)
v009.1 - Add Blog and Admin tabs with role-based navigation
v009.0 - Fix bottom tab bar icons
```

## 🐛 Known Limitations

- ⏳ Physical iOS device deployment requires code signing
- ⏳ Android APK not yet built
- ⏳ Production deployment not yet configured
- ⏳ Email integration in progress

## 💡 Quick Start

```bash
# 1. Start backend
cd /Users/drob/Documents/SistersPromise && npm start

# 2. Start Metro (new terminal)
cd /Users/drob/Documents/SistersPromise/SistersPromiseMobile
npm start -- --reset-cache

# 3. Deploy to simulator (new terminal)
npx react-native run-ios --simulator="iPhone 16 Pro"

# 4. Test login
Use admin account or register new user
```

**Status: READY FOR TESTING**

All code changes deployed. Backend/Frontend ready for restart and rebuild.
