# Sister's Promise API - Complete Reference

**Backend Stack:** Express.js 4.22.1 + MongoDB + WebSocket  
**API Base URL:** `https://api.sisterspromise.com/api` (or `https://localhost:443` for development)

---

## Quick Start

### Authentication
```bash
# 1. Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123",
    "firstName": "John",
    "lastName": "Doe"
  }'

# 2. Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecurePass123"
  }'
# Returns: { token: "jwt_token_here", user: {...} }

# 3. Use token in requests
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer jwt_token_here"
```

---

## API Endpoints (40+ total)

### **PUBLIC ENDPOINTS** (No authentication required)

#### Health Check
```
GET /api/health
Returns: { status: "ok", timestamp: "..." }
```

#### Products
```
GET /api/products
- Query params: category, sortBy, limit, offset
- Returns: { products: [...], total: 100 }

GET /api/products/:id
- Returns: { product: {...} }
```

#### Contact & Email
```
POST /api/contact
- Rate limit: 5 per hour per IP
- Body: { name, email, subject, message, phone, recaptchaToken }
- Returns: { success: true, message: "..." }

POST /api/email/subscribe
- Rate limit: 5 per hour per IP
- Body: { email, firstName, lastName, interests: [...] }
- Returns: { success: true, subscriberId: "..." }

GET /api/email/unsubscribe/:token
- Returns: { success: true }
```

#### Analytics (Public)
```
POST /api/analytics/event
POST /api/analytics/signup
POST /api/analytics/purchase
POST /api/analytics/email-subscription
POST /api/analytics/campaign
POST /api/analytics/product
POST /api/analytics/form
```

#### Checkout (Square Integration)
```
POST /api/checkout
- Rate limit: Per-minute (prevent abuse)
- Body: {
    items: [{ productId, quantity, price }],
    amount: 99.99,
    currency: "USD",
    nonce: "square_nonce_from_client"
  }
- Returns: { orderId, status, receiptUrl }
```

---

### **AUTHENTICATED ENDPOINTS** (Require JWT token)

#### Authentication
```
GET /api/auth/me
- Returns: { user: { id, email, firstName, lastName, role, createdAt } }

POST /api/auth/change-password
- Body: { currentPassword, newPassword }
- Returns: { success: true }

PUT /api/auth/profile
- Body: { firstName, lastName, phone, address }
- Returns: { user: {...} }
```

#### Chat System

**Create & List Rooms**
```
POST /api/chat/rooms
- Body: { name, description, isPrivate, members: [...] }
- Returns: { room: { id, name, createdAt } }

GET /api/chat/rooms
- Returns: { rooms: [...], total: 25 }

GET /api/chat/rooms/:roomId
- Returns: { room: {...}, members: [...] }
```

**Messages**
```
POST /api/chat/messages
- Body: { roomId, content, type: "text|image|file" }
- Returns: { message: { id, content, createdAt, author: {...} } }

GET /api/chat/messages/:roomId
- Query: ?limit=50&offset=0
- Returns: { messages: [...], hasMore: true }

PUT /api/chat/messages/:messageId
- Body: { content }
- Returns: { message: {...} }

DELETE /api/chat/messages/:messageId
- Returns: { success: true }

POST /api/chat/messages/:messageId/read
- Returns: { success: true }

POST /api/chat/messages/:messageId/reactions
- Body: { emoji: "👍" }
- Returns: { reactions: { "👍": 3, "❤️": 1 } }

POST /api/chat/messages/:messageId/pin (Admin)
- Returns: { pinned: true }
```

**Search**
```
GET /api/chat/search
- Query: ?query=keyword&roomId=...
- Returns: { messages: [...] }

GET /api/chat/unread
- Returns: { unreadCount: 5, unreadRooms: [...] }
```

**Room Management**
```
POST /api/chat/rooms/:roomId/members (Admin)
- Body: { userId }
- Returns: { success: true }

POST /api/chat/rooms/:roomId/mute
- Body: { userId, duration: 3600000 }
- Returns: { muted: true }

POST /api/chat/rooms/:roomId/unmute
- Body: { userId }
- Returns: { unmuted: true }
```

#### Moderation System

**Reporting**
```
POST /api/chat/messages/:messageId/report
- Body: { reason: "harassment|spam|...", description: "..." }
- Returns: { report: { id, status: "pending", reportCount: 1 } }

POST /api/chat/violations
- Body: { userId, violationType, description }
- Returns: { violation: {...} }

POST /api/chat/mute-check (User)
- Body: { userId, roomId }
- Returns: { isMuted: true, muteExpiry: "2024-12-20T..." }
```

**Admin Actions**
```
GET /api/chat/reports (Admin)
- Query: ?status=pending|resolved
- Returns: { reports: [...], total: 15 }

GET /api/chat/reports/:reportId (Admin)
- Returns: { report: {...}, message: {...}, reporter: {...} }

POST /api/chat/reports/:reportId/resolve (Admin)
- Body: { action: "dismiss|user_muted|user_banned", notes: "..." }
- Returns: { resolved: true }

POST /api/chat/mute (Admin)
- Body: {
    userId, userName, reason, duration, roomId
  }
- Returns: { muted: true, expiresAt: "..." }

DELETE /api/chat/mute/:userId (Admin)
- Returns: { unmuted: true }

GET /api/chat/muted (Admin)
- Query: ?muteType=global|room&roomId=...
- Returns: { mutes: [...] }
```

---

### **ADMIN ENDPOINTS** (Requires Admin or Owner role)

#### User Management
```
GET /api/admin/users
- Returns: { users: [...], total: 50 }

GET /api/admin/users/:userId
- Returns: { user: {...} }

POST /api/admin/users
- Body: { email, password, firstName, lastName, role }
- Returns: { user: {...} }

PUT /api/admin/users/:userId/role
- Body: { role: "admin|moderator|standard" }
- Returns: { user: {...} }

PUT /api/admin/users/:userId/suspend
- Body: { reason, duration }
- Returns: { suspended: true }

PUT /api/admin/users/:userId/deactivate
- Returns: { deactivated: true }

PUT /api/admin/users/:userId/reactivate
- Returns: { reactivated: true }

DELETE /api/admin/users/:userId (Owner only)
- Returns: { deleted: true }
```

#### Order Management
```
POST /api/admin/orders/manual
- Body: { items, customer, amount, paymentMethod, status }
- Returns: { order: {...} }

GET /api/admin/orders/manual
- Returns: { orders: [...], total: 200 }

GET /api/admin/orders/:orderId
- Returns: { order: {...}, items: [...], customer: {...} }

PUT /api/admin/orders/:orderId/payment-status
- Body: { paymentStatus: "pending|completed|failed" }
- Returns: { order: {...} }

PUT /api/admin/orders/:orderId/order-status
- Body: { orderStatus: "processing|shipped|delivered|cancelled" }
- Returns: { order: {...} }
```

#### Email Campaigns
```
POST /api/admin/campaigns
- Body: { name, subject, template, recipientSegment }
- Returns: { campaign: {...} }

GET /api/admin/campaigns/:campaignId
- Returns: { campaign: {...} }

POST /api/admin/campaigns/:campaignId/send
- Returns: { sent: 1250, failed: 3 }

POST /api/admin/promotions/send
- Body: { promotionName, targetSegment, discount }
- Returns: { sent: true, recipientCount: 1200 }
```

#### Email Management
```
GET /api/email/stats
- Returns: { totalSubscribers, openRate, clickRate, unsubscribeRate }

GET /api/email/subscriber/:email
- Returns: { subscriber: {...}, campaigns: [...] }

POST /api/email/update/:email
- Body: { firstName, lastName, interests, preferences }
- Returns: { updated: true }

GET /api/email/export
- Returns: CSV file download

POST /api/email/test
- Body: { email, templateId }
- Returns: { sent: true }

POST /api/email/order-confirmation
- Body: { orderId, email }
- Returns: { sent: true }

POST /api/email/abandoned-cart
- Body: { userId, cartItems }
- Returns: { sent: true }
```

---

## Setup Instructions

### 1. **Environment Variables** (.env file)

```dotenv
# Server
NODE_ENV=production
PORT=3000
API_URL=https://api.sisterspromise.com

# Database
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/sisterspromise
MONGODB_LOCAL=mongodb://localhost:27017/sisterspromise

# JWT
JWT_SECRET=your-super-secret-key-min-32-chars
JWT_EXPIRY=7d

# HTTPS/TLS (Production)
SSL_KEY_PATH=/etc/ssl/private/key.pem
SSL_CERT_PATH=/etc/ssl/certs/cert.pem

# Square Payment
SQUARE_APP_ID=sq0atp-xxxxx
SQUARE_ACCESS_TOKEN=sq0atp-xxxxx
SQUARE_ENVIRONMENT=PRODUCTION

# Email Service
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@sisterspromise.com
SMTP_PASS=your-app-password
GMAIL_REFRESH_TOKEN=xxx
GMAIL_CLIENT_ID=xxx
GMAIL_CLIENT_SECRET=xxx

# Google Analytics
GA_MEASUREMENT_ID=G_XXXXX
GA_API_SECRET=xxxxx

# Recaptcha
RECAPTCHA_PROJECT_ID=your-project-id
RECAPTCHA_API_KEY=xxxxx

# Admin Users
ADMIN_EMAIL=admin@sisterspromise.com
ADMIN_PASSWORD=SecureAdminPass123
OWNER_EMAIL=owner@sisterspromise.com
OWNER_PASSWORD=SecureOwnerPass123

# CORS
ALLOWED_ORIGINS=https://sisterspromise.com,https://app.sisterspromise.com,http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR=/uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 2. **Start the Server**

```bash
# Development
npm run dev

# Production (with PM2)
npm install -g pm2
pm2 start server.js --name "sisters-promise-api" --env production
pm2 save
pm2 startup

# With systemd (recommended)
sudo cp sisters-promise.service /etc/systemd/system/
sudo systemctl enable sisters-promise
sudo systemctl start sisters-promise
```

### 3. **Database Setup**

```bash
# MongoDB Atlas (Cloud - Recommended)
1. Create cluster at mongodb.com/cloud
2. Get connection string
3. Add IP whitelist
4. Set MONGODB_URI in .env

# Local MongoDB
# macOS
brew install mongodb-community
brew services start mongodb-community

# Linux
sudo apt-get install mongodb
sudo systemctl start mongod

# Create indexes
node scripts/createIndexes.js
```

### 4. **SSL/TLS Certificate Setup**

```bash
# Let's Encrypt (Free - Recommended)
sudo certbot certonly --standalone -d api.sisterspromise.com

# Self-signed (Development only)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

### 5. **Email Service Setup**

```bash
# Gmail Configuration
1. Enable 2-Factor Authentication
2. Create App Password (16 chars)
3. Use App Password in SMTP_PASS
4. Set up OAuth 2.0 credentials

# SendGrid (Alternative)
# npm install sendgrid/mail
# Use SendGrid API key instead of SMTP
```

### 6. **Deployment (Production)**

**Option A: Render.com (Recommended)**
```bash
git push origin main
# Auto-deploys from GitHub
```

**Option B: AWS EC2**
```bash
# Launch instance
# Install Node 20, MongoDB, PM2
# Clone repo
# Set environment variables
# npm install && npm start
```

**Option C: Railway**
```bash
# Connect GitHub repo
# Set environment variables
# Deploy
```

---

## Error Responses

### Common Errors

```json
// 400 - Bad Request
{
  "success": false,
  "error": "Email is already registered"
}

// 401 - Unauthorized
{
  "success": false,
  "error": "Invalid or expired token"
}

// 403 - Forbidden
{
  "success": false,
  "error": "Admin access required"
}

// 404 - Not Found
{
  "success": false,
  "error": "User not found"
}

// 429 - Rate Limited
{
  "success": false,
  "error": "Too many requests, please try again later"
}

// 500 - Server Error
{
  "success": false,
  "error": "Internal server error"
}
```

---

## Testing API

### Using cURL
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123!","firstName":"Test"}'
```

### Using Postman
1. Import collection: `api-collection.json`
2. Set environment variables
3. Run requests

### Using Thunder Client (VS Code)
1. Install Thunder Client extension
2. Create requests in-editor
3. Save collections

---

## WebSocket Events (Real-time Chat)

```javascript
// Connect
const socket = io('https://api.sisterspromise.com', {
  auth: { token: jwt_token }
});

// Events
socket.on('message:new', (message) => {...});
socket.on('message:updated', (message) => {...});
socket.on('user:joined', (user) => {...});
socket.on('user:typing', (user) => {...});
socket.on('room:updated', (room) => {...});
```

---

**Last Updated:** January 16, 2026  
**Version:** 1.0.0  
**Maintained By:** Sister's Promise Development Team
