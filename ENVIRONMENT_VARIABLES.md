# Environment Variables Reference

## Overview

The Sisters Promise application requires environment variables for:
- Backend server configuration
- Database connectivity
- Authentication and security
- Payment processing
- Email services
- Analytics
- Mobile app configuration

---

## Backend Server (`.env`)

Located: `/Users/drob/Documents/SistersPromise/.env`

### Required Variables

#### Database Configuration (REQUIRED)
```env
# MongoDB connection string - Production database
MONGODB_URI=mongodb+srv://derob357:***REMOVED***@cluster0sp.ysdiayg.mongodb.net/sisterspromise?retryWrites=true&w=majority&appName=Cluster0SP
```
- **Type:** Database URI
- **Default:** None (REQUIRED)
- **Format:** MongoDB Atlas connection string with credentials
- **Usage:** All database queries for users, products, orders

#### Authentication (REQUIRED)
```env
# JWT secret key for token signing/verification
JWT_SECRET=***REMOVED***
```
- **Type:** String (should be strong/random)
- **Default:** None (REQUIRED)
- **Length:** Recommend 32+ characters
- **Usage:** Signing authentication tokens, verifying token validity

---

### Optional Variables

#### Server Configuration
```env
# Environment mode
NODE_ENV=development  # or 'production'

# Server listening port
PORT=3000  # Default: 3000

# Allowed origins for CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

#### Email Service (Optional - defaults to console logging)
```env
# Email provider: 'smtp' or 'sendgrid'
EMAIL_PROVIDER=smtp

# SMTP Configuration (if using SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@sisterspromise.com

# SendGrid Configuration (if using SendGrid)
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxx

# Email addresses
APP_URL=http://localhost:3000  # URL in email links
REPLY_TO_EMAIL=info@sisterspromise.com
```

#### Square Payment Processing (Optional - defaults to sandbox)
```env
# Square API credentials
SQUARE_APPLICATION_ID=temp_app_id_placeholder
SQUARE_ACCESS_TOKEN=temp_access_token_placeholder
SQUARE_LOCATION_ID=temp_location_id_placeholder
SQUARE_ENVIRONMENT=sandbox  # or 'production'
```

#### Google reCAPTCHA (Optional - can be disabled)
```env
# Google Cloud configuration
GOOGLE_CLOUD_PROJECT_ID=sisters-promise
RECAPTCHA_ENTERPRISE_KEY=***REMOVED***
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json  # Path to service account key
```

#### Analytics (Optional - backend analytics)
```env
GA_MEASUREMENT_ID=G_XXXXXXXXXX
GA_API_SECRET=your-ga4-api-secret
```

#### Deployment (Optional - auto-detected)
```env
# Render deployment detection (auto-set by Render platform)
RENDER=true  # Set by Render, triggers cloud mode
```

---

## Mobile App (`.env`)

Located: `/Users/drob/Documents/SistersPromise/SistersPromiseMobile/.env`

### Required Variables

#### API Configuration
```env
# Backend API URL - used by both iOS and Android
# Development: Points to local backend (port 3000 or 443)
# Production: Points to production backend URL
API_BASE_URL=https://127.0.0.1:443

# For physical devices, use your local machine IP:
# API_BASE_URL=https://192.168.1.100:443
```

- **Type:** URL with protocol
- **Default:** None (REQUIRED)
- **Development:** `https://127.0.0.1:443` (iOS Simulator/Android Emulator)
- **Physical Device:** `https://YOUR_LOCAL_IP:443`
- **Production:** `https://your-production-domain.com`

---

### Optional Variables

#### Analytics Configuration
```env
# Google Analytics (Optional - app analytics)
GA_MEASUREMENT_ID=G_XXXXXXXXXX
GA_API_SECRET=your-ga4-api-secret-key

# Apple Analytics (Optional - iOS only)
APPLE_APP_ID=com.sisterspromise.app
APPLE_TEAM_ID=XXXXXXXXXX
```

#### Environment Control
```env
# Environment mode (development/production)
ENV=development
```

- **Type:** String
- **Values:** `development` or `production`
- **Default:** `development`
- **Usage:** Controls logging, error verbosity, analytics behavior

---

## React Native Built-in Variables

The mobile app uses React Native's built-in `__DEV__` global:

```javascript
// Automatically true during development, false in production build
if (__DEV__) {
  // Dev-only code (logging, error boundaries with stack traces)
}
```

---

## Development Setup Checklist

### For Backend Development

```bash
# 1. Copy template .env (if not exists)
cp .env.example .env

# 2. Set REQUIRED variables:
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

# 3. Optional - set if using email:
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# 4. Verify setup
npm run server
# Should start on port 3000 or configured PORT
```

### For Mobile Development

```bash
# 1. Copy template .env (if not exists)
cp .env.example .env

# 2. Set REQUIRED variable:
API_BASE_URL=https://127.0.0.1:443
# Or for physical device:
API_BASE_URL=https://192.168.1.X:443  # Your machine's local IP

# 3. Run app
npm run ios   # iOS Simulator
npm run android  # Android Emulator

# 4. Verify connection
# Check logs for "API connected successfully"
```

---

## Production Deployment

### Backend (Render/Cloud Platform)

```env
NODE_ENV=production
PORT=443  # or 8080 (Render will handle SSL)
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_strong_jwt_secret_32_chars_min

# Production API keys
SQUARE_ENVIRONMENT=production
SQUARE_APPLICATION_ID=prod_app_id
SQUARE_ACCESS_TOKEN=prod_access_token
SQUARE_LOCATION_ID=prod_location_id

# Email service (production)
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.prod_key_xxxxxxxxx
SMTP_FROM=noreply@sisterspromise.com
APP_URL=https://sisterspromise.com

# Analytics
GA_MEASUREMENT_ID=G_prod_xxxxx
GA_API_SECRET=prod_secret_xxxxx
```

### Mobile App (Testflight/App Store)

```env
ENV=production
API_BASE_URL=https://api.sisterspromise.com
GA_MEASUREMENT_ID=G_prod_xxxxx
GA_API_SECRET=prod_secret_xxxxx
APPLE_APP_ID=com.sisterspromise.app
APPLE_TEAM_ID=production_team_id
```

---

## Environment Variable Priority

### Backend (Node.js)

1. **Environment variables** (highest priority)
   - Set in `.env` file or OS environment
   - Example: `MONGODB_URI=...`

2. **Defaults in code** (lowest priority)
   - Fallback values in configuration files
   - Example: `PORT = process.env.PORT || 3000`

### Mobile App (React Native)

1. **`.env` file** (highest priority)
   - Development: `SistersPromiseMobile/.env`
   - Production: `SistersPromiseMobile/.env.production`

2. **Hardcoded defaults** (lowest priority)
   - Fallback in `api.js` or service files

---

## Security Best Practices

### Never Commit Secrets
```bash
# .env is in .gitignore (DON'T COMMIT!)
git status  # Should NOT show .env

# Create .env.example with placeholder values
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your-jwt-secret-here-min-32-characters
```

### Local Development
```bash
# Keep strong secrets even locally
JWT_SECRET=$(openssl rand -base64 32)

# Don't use same secrets across environments
# Dev, staging, and production each need unique secrets
```

### Production Deployment
```bash
# Use platform-specific secret management
# Render: Use Environment Groups or Dashboard settings
# GitHub: Use Repository Secrets for CI/CD
# Never commit production secrets to git
```

---

## Troubleshooting

### "MONGODB_URI is undefined"
- **Cause:** Missing `.env` file or MONGODB_URI not set
- **Fix:** 
  ```bash
  # Copy example to .env
  cp .env.example .env
  # Edit .env with your MongoDB URI
  ```

### "JWT_SECRET is undefined"
- **Cause:** Missing JWT_SECRET in `.env`
- **Fix:**
  ```env
  JWT_SECRET=your-random-secret-here
  ```
  **Generate:** `openssl rand -base64 32`

### "Cannot connect to API" (mobile)
- **Cause:** Wrong API_BASE_URL
- **Fix:**
  ```bash
  # For simulator (runs on host Mac):
  API_BASE_URL=https://127.0.0.1:443
  
  # For physical device (needs actual IP):
  API_BASE_URL=https://192.168.1.100:443  # Your Mac's local IP
  ```

### "Email not sending"
- **Cause:** Missing or incorrect email configuration
- **Fix:**
  ```env
  # Enable email (optional, defaults to console)
  EMAIL_PROVIDER=smtp
  SMTP_HOST=smtp.gmail.com
  SMTP_USER=your-email@gmail.com
  SMTP_PASSWORD=app-password-not-regular-password
  ```

### "Analytics not tracking"
- **Cause:** Missing GA configuration (not critical, optional)
- **Status:** App works fine without analytics

---

## Quick Reference Table

| Variable | Service | Required | Default | Type |
|----------|---------|----------|---------|------|
| `MONGODB_URI` | Backend | Yes | - | URL |
| `JWT_SECRET` | Backend | Yes | - | String |
| `NODE_ENV` | Backend | No | development | String |
| `PORT` | Backend | No | 3000 | Number |
| `API_BASE_URL` | Mobile | Yes | - | URL |
| `ENV` | Mobile | No | development | String |
| `SQUARE_APPLICATION_ID` | Backend | No | - | String |
| `SENDGRID_API_KEY` | Backend | No | - | String |
| `SMTP_HOST` | Backend | No | - | String |
| `GA_MEASUREMENT_ID` | Both | No | - | String |

---

## File Locations

```
SistersPromise/
├── .env                          ← Backend config
├── .env.example                  ← Backend template
├── .env.production               ← Backend production
├── SistersPromiseMobile/
│   ├── .env                      ← Mobile config
│   ├── .env.example              ← Mobile template
│   └── .env.production           ← Mobile production
```

---

## Example Complete `.env` Setup

### Backend Development
```env
# Database
MONGODB_URI=mongodb+srv://derob357:***REMOVED***@cluster0sp.ysdiayg.mongodb.net/sisterspromise

# Auth
JWT_SECRET=your-secure-random-secret-here-32-chars

# Server
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000

# Email (optional)
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@sisterspromise.com
APP_URL=http://localhost:3000
REPLY_TO_EMAIL=info@sisterspromise.com

# Square (optional)
SQUARE_APPLICATION_ID=SQ_app_id_here
SQUARE_ACCESS_TOKEN=SQ_token_here
SQUARE_LOCATION_ID=SQ_location_here
SQUARE_ENVIRONMENT=sandbox
```

### Mobile Development
```env
# API
API_BASE_URL=https://127.0.0.1:443

# Environment
ENV=development

# Analytics (optional)
GA_MEASUREMENT_ID=G_dev_xxxxx
GA_API_SECRET=ga_secret_here
APPLE_APP_ID=com.sisterspromise.app
APPLE_TEAM_ID=development_team_id
```
