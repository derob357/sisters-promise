# Sisters Promise - Installation & Quick Start Guide

## Overview

Sisters Promise is a modern, secure e-commerce website built with Node.js, Express, Square payments, and Bootstrap. It includes comprehensive security features, contact forms with bot protection, and real-time product integration.

## Prerequisites

- **Node.js** 14.x or higher
- **npm** 6.x or higher
- **Git** for version control
- A **Square** account with API credentials
- A **Google reCAPTCHA** account for contact form protection

## Installation Steps

### 1. Clone or Navigate to Project

```bash
cd /Users/drob/Documents/SistersPromise
```

### 2. Install Dependencies

```bash
npm install
```

This installs all required packages:
- `express` - Web server framework
- `helmet` - Security headers
- `express-rate-limit` - Rate limiting
- `express-mongo-sanitize` - Input sanitization
- `cors` - Cross-origin resource sharing
- `square` - Square payment SDK
- `axios` - HTTP client
- `dotenv` - Environment variables
- `uuid` - Unique identifiers
- `concurrently` - Multiple processes

### 3. Configure Environment Variables

Copy the example file:
```bash
cp .env.example .env
```

Edit `.env` and add your credentials:

```env
# Square API Configuration
SQUARE_APPLICATION_ID=your_app_id_here
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_ENVIRONMENT=sandbox

# reCAPTCHA Configuration
RECAPTCHA_SITE_KEY=your_site_key_here
RECAPTCHA_SECRET_KEY=your_secret_key_here

# Server Configuration
NODE_ENV=development
PORT=3000
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5000
```

### 4. Get Your Credentials

#### Square API Credentials
1. Go to https://squareup.com/dashboard
2. Navigate to **Developer** → **Applications**
3. Create a new application or select existing
4. Get **Application ID** and **Access Token** from Credentials
5. Get **Location ID** from Locations section

#### reCAPTCHA Credentials
1. Go to https://www.google.com/recaptcha/admin
2. Click **Create** and add new site
3. Type: **reCAPTCHA v3**
4. Add domains: `localhost`, `sisterspromise.com`
5. Copy **Site Key** and **Secret Key**

### 5. Update Contact Form

Update the reCAPTCHA site key in `pages/contact.html`:

```html
<script>
  window.RECAPTCHA_SITE_KEY = 'your_site_key_here';
</script>
```

## Running the Application

### Development Mode (Recommended)

Starts backend server and frontend together:

```bash
npm run dev
```

This runs:
- Express API server on `http://localhost:3000`
- Opens website in your default browser

### Backend Only

Just run the API server:

```bash
npm run server
```

Server runs on `http://localhost:3000`

### Frontend Only

Just open the website:

```bash
npm start
```

Opens `index.html` in browser (no backend)

## Project Structure

```
/Users/drob/Documents/SistersPromise/
├── server.js                      # Express backend with all APIs
├── package.json                   # Project configuration
├── .env                          # Environment variables (local, never commit)
├── .env.example                  # Template for environment variables
├── .gitignore                    # Git ignore rules
├── README.md                     # Project overview
├── SECURITY.md                   # Security documentation
├── SQUARE_INTEGRATION_SETUP.md   # Square setup guide
│
├── index.html                    # Home page
├── pages/
│   ├── shop.html                # Product shop page
│   ├── contact.html             # Contact form with reCAPTCHA
│   └── ...
│
├── assets/
│   ├── js/
│   │   └── square-integration.js # Frontend API client
│   ├── css/
│   ├── img/
│   │   └── Herobg.png          # Hero banner image
│   └── ...
│
└── node_modules/                # Installed dependencies (not in git)
```

## API Endpoints

### Product Endpoints

**Get all products:**
```bash
curl http://localhost:3000/api/products
```

**Get single product:**
```bash
curl http://localhost:3000/api/products/{PRODUCT_ID}
```

### Payment Endpoint

**Process payment:**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "nonce_from_square",
    "amount": 1299,
    "currency": "USD"
  }'
```

### Contact Endpoint

**Submit contact form:**
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "message": "I have a question about your products",
    "recaptchaToken": "token_from_recaptcha"
  }'
```

### Health Check

**Check server status:**
```bash
curl http://localhost:3000/api/health
```

## Security Features

✅ **Helmet.js** - Security headers (CSP, HSTS, frameGuard, etc.)
✅ **Rate Limiting** - Prevent brute force attacks (3 tier system)
✅ **Input Sanitization** - Protect against XSS and injection attacks
✅ **reCAPTCHA v3** - Bot protection on contact form
✅ **CORS Configuration** - Restrict API to allowed origins
✅ **Error Handling** - Safe error messages in production
✅ **Payload Limits** - 10KB max request size
✅ **Data Validation** - Strict validation on all inputs

For detailed security information, see [SECURITY.md](./SECURITY.md)

## Security Best Practices

### For Developers

1. **Never commit `.env`** - It's protected by `.gitignore`
2. **Use `.env.example`** as template for new developers
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Use HTTPS in production** - Required for security
5. **Test all inputs** - Try XSS and SQL injection attempts
6. **Monitor error logs** - Watch for suspicious activity

### For Users

1. **Use strong passwords** - Square account security is critical
2. **Enable 2FA** - On all admin accounts
3. **Regular backups** - Back up your .env file securely
4. **Update regularly** - Keep npm packages current
5. **Review logs** - Monitor API usage and errors

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Products Not Loading

1. Check server is running: `npm run server`
2. Verify Square credentials in `.env`
3. Check browser console for errors (F12)
4. Test API: `curl http://localhost:3000/api/health`

### Contact Form Not Working

1. Verify reCAPTCHA keys in `.env`
2. Check reCAPTCHA domain configuration
3. Verify `pages/contact.html` has correct site key
4. Check browser console for errors
5. Test with `curl` to verify backend

### CORS Errors

1. Check `ALLOWED_ORIGINS` in `.env`
2. Verify request is from allowed origin
3. Restart server after changing `.env`

### Dependencies Issues

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## Environment Variables Explained

| Variable | Purpose | Example |
|----------|---------|---------|
| `SQUARE_APPLICATION_ID` | Square app ID | `sq0app123...` |
| `SQUARE_ACCESS_TOKEN` | Square API token | `sq0atp_abc...` |
| `SQUARE_LOCATION_ID` | Your shop location | `LXYZABC123` |
| `SQUARE_ENVIRONMENT` | sandbox or production | `sandbox` |
| `RECAPTCHA_SITE_KEY` | Google reCAPTCHA site key | `6Lc...` |
| `RECAPTCHA_SECRET_KEY` | Google reCAPTCHA secret | `6Lc...` |
| `NODE_ENV` | development or production | `development` |
| `PORT` | Server port | `3000` |
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |

## Production Deployment

### Pre-Deployment Checklist

```bash
# 1. Test in production mode
NODE_ENV=production npm run server

# 2. Run security audit
npm audit

# 3. Fix vulnerabilities
npm audit fix

# 4. Update all dependencies
npm update

# 5. Test all features
# - Product loading
# - Contact form
# - Payment (with test card)
```

### Deploy to Heroku

```bash
# Create Heroku app
heroku create sisters-promise

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set SQUARE_ENVIRONMENT=production
heroku config:set SQUARE_APPLICATION_ID=your_prod_id
heroku config:set SQUARE_ACCESS_TOKEN=your_prod_token
heroku config:set RECAPTCHA_SITE_KEY=your_site_key
heroku config:set RECAPTCHA_SECRET_KEY=your_secret_key

# Deploy
git push heroku main
```

### Deploy to AWS/DigitalOcean

1. Set up server with Node.js
2. Clone repository
3. Set environment variables via system env or `.env` file
4. Set up SSL/TLS certificate (Let's Encrypt)
5. Configure reverse proxy (Nginx/Apache)
6. Start with PM2 or systemd

## Common Tasks

### Update Products

Products are fetched from your Square Catalog:
1. Update products in Square Dashboard
2. Products sync automatically (cached)
3. Clear cache to force refresh

### Customize Website

1. Edit HTML files in root and `pages/` directory
2. Edit CSS in `assets/css/`
3. Edit JavaScript in `assets/js/`
4. Rebuild with `npm run build` if using Gulp

### Monitor Logs

```bash
# Check error logs
tail -f logs/error.log

# Check access logs
tail -f logs/access.log

# Search for specific errors
grep "Payment error" logs/error.log
```

## Support & Documentation

- **Square Documentation:** https://developer.squareup.com/docs
- **reCAPTCHA Docs:** https://developers.google.com/recaptcha
- **Express.js Guide:** https://expressjs.com
- **Security Best Practices:** See [SECURITY.md](./SECURITY.md)
- **Square Integration:** See [SQUARE_INTEGRATION_SETUP.md](./SQUARE_INTEGRATION_SETUP.md)

## License

MIT License - See LICENSE file for details

## Support

For issues or questions:
1. Check this guide first
2. Review SECURITY.md and SQUARE_INTEGRATION_SETUP.md
3. Create GitHub issue: https://github.com/derob357/sisters-promise/issues
4. Email: support@sisterspromise.com

---

**Last Updated:** January 2024
**Version:** 1.0.0
**Status:** Production Ready
