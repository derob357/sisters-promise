# Sisters Promise - Security & Best Practices Guide

## Table of Contents

1. [Security Overview](#security-overview)
2. [Environment Configuration](#environment-configuration)
3. [Input Sanitization](#input-sanitization)
4. [Error Handling](#error-handling)
5. [API Security](#api-security)
6. [Contact Form & reCAPTCHA](#contact-form--recaptcha)
7. [Deployment Security](#deployment-security)
8. [Regular Maintenance](#regular-maintenance)

---

## Security Overview

This document outlines all security measures implemented in the Sisters Promise web application.

### Security Features Implemented:

✅ **Helmet.js** - Security headers (CSP, HSTS, X-Frame-Options, etc.)
✅ **Rate Limiting** - Prevents brute force attacks on all endpoints
✅ **Input Sanitization** - Protects against XSS and NoSQL injection
✅ **CORS Configuration** - Restricts API access to allowed origins
✅ **Body Size Limits** - Prevents large payload attacks (10KB limit)
✅ **reCAPTCHA v3** - Bot protection for contact forms
✅ **Error Handling** - Secure error responses (no stack traces in production)
✅ **HTTPS Ready** - Support for secure connections
✅ **Data Validation** - Strict input validation on all endpoints

---

## Environment Configuration

### Required Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Square API Configuration
SQUARE_APPLICATION_ID=your_app_id_here
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_ENVIRONMENT=sandbox|production

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here

# Server Configuration
NODE_ENV=development|production
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,https://sisterspromise.com
```

### Security Notes:

- **NEVER** commit `.env` to version control
- `.env` is protected by `.gitignore`
- Use `.env.example` as a template for new developers
- In production, set environment variables through your hosting provider (Heroku, AWS, etc.)
- Always use different credentials for sandbox and production

---

## Input Sanitization

### Server-Side Sanitization

The server implements multiple layers of sanitization:

1. **express-mongo-sanitize** - Removes potential NoSQL injection attacks
2. **Custom sanitizeInput()** function - Removes HTML/script tags
3. **Input validation** - Checks type, length, format
4. **Body size limits** - Max 10KB per request

### Sanitization Example:

```javascript
// This function removes dangerous characters:
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()                    // Remove whitespace
    .replace(/[<>\"']/g, '')   // Remove HTML tags
    .slice(0, 500);            // Limit length
};
```

### Frontend Sanitization

```javascript
// XSS Prevention - Text content automatically encoded:
const sanitize = function(str) {
  const div = document.createElement('div');
  div.textContent = str;  // Use textContent, not innerHTML
  return div.innerHTML;
};
```

### Input Validation Rules:

| Field | Min Length | Max Length | Format |
|-------|-----------|-----------|--------|
| Name | 2 | 100 | Text |
| Email | 5 | 100 | RFC 5322 regex |
| Message | 10 | 1000 | Text |
| Product ID | 5 | 500 | URL safe |
| Amount | 1 | 999999 | Integer (cents) |

---

## Error Handling

### Error Handling Strategy

The application implements comprehensive error handling:

#### 1. Synchronous Errors
```javascript
try {
  // Code that might throw
} catch (error) {
  // Log error
  console.error(error);
  // Return safe error message (no details in production)
  res.status(500).json({
    error: 'Operation failed',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : 'Internal server error'
  });
}
```

#### 2. Async Error Handler
```javascript
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
```

#### 3. Global Error Middleware
```javascript
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  
  res.status(statusCode).json({
    error: err.message,
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});
```

### Error Responses

**Development Mode** - Includes stack trace:
```json
{
  "error": "Database connection failed",
  "stack": "Error: ...",
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

**Production Mode** - Safe response:
```json
{
  "error": "Internal server error",
  "timestamp": "2024-01-08T12:00:00.000Z"
}
```

---

## API Security

### Rate Limiting

Three different rate limits protect different endpoints:

#### 1. General Limiter (All Routes)
```javascript
windowMs: 15 * 60 * 1000  // 15 minutes
max: 100                  // 100 requests per IP
```

#### 2. Contact Form Limiter
```javascript
windowMs: 60 * 60 * 1000  // 1 hour
max: 5                    // 5 submissions per IP per hour
```

#### 3. Checkout Limiter
```javascript
windowMs: 60 * 1000       // 1 minute
max: 10                   // 10 attempts per IP per minute
```

### CORS Configuration

Only allows requests from specified origins:

```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') 
    || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
  maxAge: 3600,
};
```

### API Endpoints

#### GET /api/health
- **Rate Limit**: General (100 per 15 min)
- **Returns**: Server status
- **Security**: No authentication required

#### GET /api/products
- **Rate Limit**: General (100 per 15 min)
- **Returns**: Product list from Square
- **Security**: Requires valid Square token
- **Validation**: Returns max 100 products

#### GET /api/products/:id
- **Rate Limit**: General (100 per 15 min)
- **Returns**: Single product details
- **Security**: Validates product ID format
- **Validation**: Min 5 chars, URL safe only

#### POST /api/checkout
- **Rate Limit**: Strict (10 per minute)
- **Returns**: Payment confirmation
- **Security**: Validates sourceId and amount
- **Validation**: Amount 1-999999 cents

#### POST /api/contact
- **Rate Limit**: Moderate (5 per hour)
- **Returns**: Confirmation message
- **Security**: Requires reCAPTCHA verification
- **Validation**: Name, email, message format validation

---

## Contact Form & reCAPTCHA

### Setting Up reCAPTCHA v3

1. **Create reCAPTCHA Keys:**
   - Go to https://www.google.com/recaptcha/admin
   - Click **Create** → Add new site
   - Name: `Sisters Promise`
   - Type: **reCAPTCHA v3**
   - Domains: `localhost`, `sisterspromise.com`, `www.sisterspromise.com`

2. **Get Your Keys:**
   - Copy **Site Key** → `RECAPTCHA_SITE_KEY` in `.env`
   - Copy **Secret Key** → `RECAPTCHA_SECRET_KEY` in `.env`

3. **How reCAPTCHA v3 Works:**
   - Automatically analyzes user behavior
   - Returns score 0.0 (bot) to 1.0 (human)
   - No CAPTCHA puzzle required
   - Configurable threshold (default 0.5)

### Contact Form Flow

```
1. User fills out form
   ↓
2. JavaScript validates locally
   ↓
3. reCAPTCHA token generated
   ↓
4. Form + token sent to /api/contact
   ↓
5. Server verifies token with Google
   ↓
6. Server validates all inputs
   ↓
7. Message stored/sent
   ↓
8. User receives confirmation
```

### Contact Form Validation

**Client-Side (Immediate):**
- Name: 2-100 characters
- Email: Valid RFC 5322 format
- Message: 10-1000 characters

**Server-Side (Verified):**
- reCAPTCHA score > 0.5
- Input re-validation
- NoSQL injection protection
- XSS protection

---

## Deployment Security

### Pre-Deployment Checklist

```bash
# 1. Update Node.js and npm
node --version  # Should be 14.x or higher
npm --version   # Should be 6.x or higher

# 2. Install security audit
npm audit

# 3. Fix vulnerabilities
npm audit fix

# 4. Test in production mode
NODE_ENV=production npm run server

# 5. Verify environment variables
# Ensure all production .env variables are set correctly
```

### Production Environment Configuration

```env
# Production .env settings
NODE_ENV=production
SQUARE_ENVIRONMENT=production
ALLOWED_ORIGINS=https://sisterspromise.com,https://www.sisterspromise.com

# Enable security headers
ENABLE_SECURITY_HEADERS=true

# Database (if implemented)
DATABASE_URL=your_production_db_url

# Monitoring (optional)
SENTRY_DSN=your_sentry_dsn
```

### HTTPS Configuration

**Required for production:**
- SSL/TLS certificate (Let's Encrypt recommended)
- Force HTTPS redirects
- Set Secure flag on cookies
- HSTS header enabled (365 days)

### Hosting Recommendations

**Heroku:**
```bash
heroku config:set NODE_ENV=production
heroku config:set SQUARE_ENVIRONMENT=production
```

**AWS Lambda:**
- Use AWS Secrets Manager
- CloudFront for CDN
- WAF for DDoS protection

**DigitalOcean/VPS:**
- Use systemd for process management
- Nginx reverse proxy
- Let's Encrypt SSL

---

## Regular Maintenance

### Weekly Tasks

```bash
# Check for dependency updates
npm outdated

# Monitor logs for errors
tail -f logs/error.log

# Test critical flows manually
# - Product fetching
# - Contact form submission
# - Payment processing (sandbox)
```

### Monthly Tasks

```bash
# Security audit
npm audit

# Update dependencies
npm update
npm audit fix

# Review error logs
cat logs/error.log | grep -i error

# Test all endpoints with curl
curl http://localhost:3000/api/health
```

### Quarterly Tasks

```bash
# Major dependency updates
npm update --save

# Security scan with npm-check
npm-check-updates

# Penetration testing (recommended)
# - Test for OWASP Top 10 vulnerabilities
# - SQL injection attempts
# - XSS vectors
# - CSRF attacks

# Review access logs
tail -100 logs/access.log | grep POST
```

### Security Dependency Updates

Keep these packages updated for security:

- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `express-mongo-sanitize` - Input sanitization
- `square` - Payment processing
- `express` - Core framework
- `dotenv` - Environment variables

---

## Security Resources

### OWASP Top 10 (2023)

The application protects against:

1. ✅ **Broken Access Control** - Input validation, rate limiting
2. ✅ **Cryptographic Failures** - HTTPS support, secure headers
3. ✅ **Injection** - Input sanitization, parameterized queries
4. ✅ **Insecure Design** - Security-first architecture
5. ✅ **Security Misconfiguration** - Helmet.js security headers
6. ✅ **Vulnerable Components** - npm audit, regular updates
7. ✅ **Authentication Failures** - reCAPTCHA verification
8. ✅ **Data Integrity Failures** - Secure data transmission
9. ✅ **Logging Gaps** - Comprehensive error logging
10. ✅ **SSRF** - Input validation on URLs

### Useful Links

- [OWASP Security Guidelines](https://owasp.org/www-project-security-guidelines/)
- [Express.js Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [reCAPTCHA Documentation](https://developers.google.com/recaptcha)
- [Square Payment Security](https://developer.squareup.com/docs/build-basics/common-api-patterns/securely-transmit-payment-details)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

---

## Support & Questions

For security concerns or questions:

1. Create an issue on GitHub
2. Email: security@sisterspromise.com
3. Do not disclose security vulnerabilities publicly
4. Follow responsible disclosure practices

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Status:** Production Ready
