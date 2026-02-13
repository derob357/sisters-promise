# HTTPS/TLS Security Implementation

## Overview

All API traffic to Sister's Promise is encrypted using HTTPS/TLS (Transport Layer Security). This document explains the implementation and how to configure it for development and production.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Applications                       │
│   (Web: index.html, Mobile: React Native SistersPromiseMobile)
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ HTTPS/TLS Encrypted
                     │ (Port 443)
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          Express Server (server.js)                         │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  HTTPS Server (Port 443)                             │   │
│  │  - SSL/TLS Certificate (server.crt)                  │   │
│  │  - Private Key (server.key)                          │   │
│  │  - HSTS Headers (Force HTTPS)                        │   │
│  │  - Security Headers (CSP, X-Frame-Options, etc.)    │   │
│  └──────────────────────────────────────────────────────┘   │
│                     │                                        │
│  ┌──────────────────▼──────────────────────────────────┐   │
│  │  HTTP Server (Port 3000)                            │   │
│  │  - Redirects to HTTPS (301)                         │   │
│  │  - Used during development/debugging                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Security Middleware                                │   │
│  │  - Rate limiting                                    │   │
│  │  - Input sanitization                               │   │
│  │  - CORS with HTTPS                                 │   │
│  │  - JWT Authentication                               │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│          MongoDB Database (Encrypted Connection)            │
│  - All queries encrypted over HTTPS                         │
│  - Optional TLS for MongoDB connection                      │
└─────────────────────────────────────────────────────────────┘
```

## Certificate Generation

### Development Certificates

Self-signed certificates are automatically generated for development:

```bash
# Manually generate certificates
node generate-certs.js

# Output:
# ✓ SSL certificates generated successfully
#   Certificate: /path/to/certs/server.crt
#   Private Key: /path/to/certs/server.key
```

**What happens:**
- Script creates `certs/` directory
- Generates 2048-bit RSA private key
- Creates self-signed X.509 certificate (365-day validity)
- Sets secure file permissions (600 for key, 644 for cert)

**Files created:**
```
certs/
├── server.crt  (Public certificate - safe to share)
└── server.key  (Private key - NEVER share or commit to git!)
```

### Production Certificates

For production, use **Let's Encrypt** (free) or commercial CAs:

#### Using Let's Encrypt with Certbot

```bash
# Install certbot
brew install certbot  # macOS
# OR
sudo apt-get install certbot  # Linux

# Generate certificate
sudo certbot certonly --standalone -d sisterspromise.com -d www.sisterspromise.com

# Certificates will be at:
# /etc/letsencrypt/live/sisterspromise.com/privkey.pem
# /etc/letsencrypt/live/sisterspromise.com/fullchain.pem

# Update .env:
CERT_PATH=/etc/letsencrypt/live/sisterspromise.com/fullchain.pem
KEY_PATH=/etc/letsencrypt/live/sisterspromise.com/privkey.pem

# Auto-renew (runs daily)
sudo certbot renew
```

#### Using Commercial Certificate Authority

1. Generate CSR (Certificate Signing Request):
```bash
openssl req -new -newkey rsa:2048 -nodes \
  -keyout private.key -out request.csr
```

2. Submit CSR to CA (GoDaddy, Namecheap, etc.)

3. Download certificate and update paths in .env

## Configuration

### Environment Variables

```bash
# .env configuration

# HTTPS/TLS Settings
USE_HTTPS=true
PORT=3000           # HTTP redirect port
HTTPS_PORT=443      # HTTPS port (default)
CERT_PATH=./certs/server.crt
KEY_PATH=./certs/server.key

# HSTS (HTTP Strict Transport Security)
# Forces HTTPS for 1 year, including subdomains
HSTS_MAX_AGE=31536000
HSTS_INCLUDE_SUBDOMAINS=true
HSTS_PRELOAD=true

# API URLs
APP_URL=https://sisterspromise.com
API_BASE_URL=https://sisterspromise.com:443/api

# CORS - Allow HTTPS only
ALLOWED_ORIGINS=https://sisterspromise.com,https://www.sisterspromise.com
```

## Security Headers

All responses include security headers:

### Strict-Transport-Security (HSTS)
```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```
- Forces HTTPS for 1 year
- Applies to all subdomains
- Browser preload list prevents even first request from being HTTP

### Content-Security-Policy (CSP)
```
default-src 'self'
script-src 'self' 'unsafe-inline' https://googletagmanager.com
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com
connect-src 'self' https://googletagmanager.com
```

### Additional Security Headers
```
X-Frame-Options: DENY              # Prevent clickjacking
X-Content-Type-Options: nosniff    # Prevent MIME type sniffing
X-XSS-Protection: 1; mode=block    # Legacy XSS protection
```

## Client Configuration

### Web Client (HTML/JavaScript)

```javascript
// Automatically use HTTPS in production
const API_URL = window.location.protocol === 'https:' 
  ? 'https://sisterspromise.com'
  : 'https://localhost:443';

// Axios configuration
const api = axios.create({
  baseURL: API_URL + '/api',
  httpsAgent: new https.Agent({
    rejectUnauthorized: true  // Verify certificates
  })
});
```

### Mobile Client (React Native)

```javascript
// .env configuration
API_BASE_URL=https://localhost:443

// api.js service
const api = axios.create({
  baseURL: API_BASE_URL + '/api',
  httpsAgent: {
    rejectUnauthorizedCerts: false  // Accept self-signed in dev
  }
});
```

**Development:** Self-signed certificates accepted (rejectUnauthorizedCerts: false)
**Production:** Proper certificates required (rejectUnauthorizedCerts: true)

## Running the Server

### Development Mode

```bash
# Automatic certificate generation
npm start
# Output:
# ✓ HTTPS server listening on https://localhost:443
# ✓ HTTP redirect server listening on http://localhost:3000
```

### Production Mode

```bash
# Set environment
NODE_ENV=production npm start

# Server enforces HTTPS
# - HTTP requests redirected to HTTPS
# - HSTS header forces future HTTPS
# - Proper certificates required
```

## Testing HTTPS Connection

### Using curl

```bash
# Test HTTPS with self-signed cert (ignore warnings)
curl -k https://localhost:443/api/health

# Test HTTP redirect
curl -i http://localhost:3000/
# Response: 301 Moved Permanently -> https://...
```

### Using openssl

```bash
# View certificate details
openssl x509 -in certs/server.crt -text -noout

# Check certificate validity
openssl x509 -in certs/server.crt -noout -dates

# Verify key and certificate match
openssl x509 -noout -modulus -in certs/server.crt | openssl md5
openssl rsa -noout -modulus -in certs/server.key | openssl md5
```

### Using Postman

1. Disable "SSL certificate verification" for development
2. Set URL to `https://localhost:443/api/...`
3. Requests will work despite self-signed cert

## Troubleshooting

### Certificate Issues

**"ERR_CERT_AUTHORITY_INVALID"**
- Expected for self-signed development certificates
- Click "Advanced" → "Proceed" in browser (dev only)
- In code: set `rejectUnauthorized: false` for axios

**"ENOENT: no such file or directory, open 'certs/server.crt'"**
```bash
# Generate missing certificates
node generate-certs.js

# Or automatically on server start
npm start
```

### Port Already in Use

```bash
# Find process using port 443
lsof -i :443
# Or port 3000
lsof -i :3000

# Kill process (macOS)
kill -9 <PID>

# Or use different ports
HTTPS_PORT=8443 PORT=8000 npm start
```

### Mixed Content Errors

**In browser:** "Mixed Content: The page at 'https://...' was loaded over HTTPS, but requested an insecure resource 'http://...'."

**Fix:** Ensure all API calls use HTTPS
```javascript
// ✗ Wrong
const api = axios.create({ baseURL: 'http://localhost:3000' });

// ✓ Correct
const api = axios.create({ baseURL: 'https://localhost:443' });
```

## Certificate Renewal

### Development Certificates

Generated certificates are valid for 365 days. Regenerate when needed:

```bash
# Remove old certificates
rm -rf certs/

# Generate new ones
node generate-certs.js
```

### Let's Encrypt Production Certificates

Automatic renewal (90-day validity):

```bash
# Check renewal status
sudo certbot renew --dry-run

# Manual renewal
sudo certbot renew

# Auto-renewal via systemd timer (Linux)
sudo systemctl enable certbot.timer
```

## Security Best Practices

1. ✅ **Always use HTTPS in production**
   - Never expose API over HTTP
   - Enable HSTS header
   - Use proper certificates from trusted CA

2. ✅ **Keep private keys secure**
   - Never commit `.key` files to git
   - Use file permissions (600)
   - Restrict access to key files

3. ✅ **Monitor certificate expiration**
   - Set calendar reminders for Let's Encrypt (90 days)
   - For commercial certs: 30 days before expiration
   - Use monitoring tools to alert

4. ✅ **Rotate keys regularly**
   - At least annually
   - After security incidents
   - When staff changes

5. ✅ **Validate certificate chains**
   - Ensure intermediate certificates are included
   - Use `openssl` to verify chain completeness

6. ✅ **Use TLS 1.2+ only**
   - Disable SSLv3, TLS 1.0, 1.1 (outdated)
   - Node.js defaults to TLS 1.2+

## Monitoring & Maintenance

### Certificate Status Dashboard

```bash
# Check SSL Labs rating
# Visit: https://www.ssllabs.com/ssltest/analyze.html?d=sisterspromise.com

# Monitor certificate expiration
echo "Certificate expires on:"
openssl x509 -in certs/server.crt -noout -dates
```

### Logs to Monitor

```bash
# Check server logs for TLS errors
# In production: use centralized logging (e.g., ELK stack)

# In development: check console
npm start | grep -i "ssl\|tls\|certificate"
```

## References

- [OWASP: Transport Layer Protection](https://owasp.org/www-community/attacks/Manipulator-in-the-middle_attack)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [Node.js HTTPS Module](https://nodejs.org/en/docs/guides/nodejs-https-ssl/)
- [MDN: HSTS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Strict-Transport-Security)
- [SSL Labs Best Practices](https://github.com/ssllabs/research/wiki/SSL-and-TLS-Deployment-Best-Practices)

## Support

For issues:
- Email: denise@sisterspromise.com
- Check logs: `npm start 2>&1 | tail -50`
- Verify certs: `openssl x509 -in certs/server.crt -text -noout`
