# Backend Setup & Deployment Guide

Complete guide to set up the Sisters Promise API backend server.

---

## Prerequisites

- Node.js 20+ (Get from nodejs.org)
- MongoDB (Cloud Atlas or local)
- Git
- HTTPS certificate (Let's Encrypt or self-signed for dev)

---

## Quick Setup (5 minutes)

### Step 1: Clone & Install

```bash
cd ~/Documents/SistersPromise
npm install
```

### Step 2: Environment Setup

```bash
# Copy template
cp .env.example .env

# Edit with your values
nano .env
```

**Minimal .env** (for testing):
```dotenv
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/sisterspromise
JWT_SECRET=your-secret-key-here-at-least-32-chars-long
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:8081
```

### Step 3: Start Server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Visit: `http://localhost:3000/api/health`

---

## Full Production Setup

### 1. Database Setup (MongoDB Atlas - Recommended)

**Step 1: Create Account**
1. Go to [mongodb.com/cloud](https://www.mongodb.com/cloud)
2. Sign up (free tier available)
3. Create organization & project

**Step 2: Create Cluster**
1. Choose cloud provider (AWS, Google, Azure)
2. Choose region closest to users
3. Create cluster (takes 2-5 minutes)

**Step 3: Get Connection String**
1. Click "Connect"
2. Choose "Connect your application"
3. Select Node.js driver
4. Copy connection string
5. Replace `<password>` with your database password

**Step 4: Configure in .env**
```dotenv
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sisterspromise?retryWrites=true&w=majority
```

**Step 5: Create Indexes**
```bash
# Run once to optimize queries
node -e "const db = require('./config/database'); db.createIndexes();"
```

---

### 2. Email Service Setup

#### Option A: Gmail (Recommended for small volume)

1. **Enable 2FA on Gmail account**
   - Go to myaccount.google.com/security
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to security tab (step 1 again)
   - Find "App passwords" (appears after 2FA is enabled)
   - Select Mail and Windows Computer
   - Copy the 16-character password

3. **Update .env**
   ```dotenv
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASS=xxxx xxxx xxxx xxxx
   ```

#### Option B: SendGrid (Recommended for production)

1. **Sign up at sendgrid.com**
2. **Create API Key**
   - Settings → API Keys → Create API Key
   - Copy key

3. **Update .env**
   ```dotenv
   SENDGRID_API_KEY=SG.your-key-here
   ```

4. **Update email service in code**
   - Uncomment SendGrid integration in EmailService.js

---

### 3. Square Payment Setup

1. **Create Account**
   - Go to [squareup.com/dashboard](https://squareup.com/dashboard)
   - Sign up for business account

2. **Get Credentials**
   - Go to Developer → API Keys
   - Copy Production Credentials
   - Application ID & Access Token

3. **Update .env**
   ```dotenv
   SQUARE_APP_ID=sq0atp-xxxxx
   SQUARE_ACCESS_TOKEN=sq0atp-xxxxx
   SQUARE_ENVIRONMENT=PRODUCTION
   ```

---

### 4. SSL/TLS Certificate (HTTPS)

#### Option A: Let's Encrypt (Free - Production)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --standalone -d api.sisterspromise.com

# Certificates location:
# /etc/letsencrypt/live/api.sisterspromise.com/privkey.pem
# /etc/letsencrypt/live/api.sisterspromise.com/fullchain.pem

# Update .env
SSL_KEY_PATH=/etc/letsencrypt/live/api.sisterspromise.com/privkey.pem
SSL_CERT_PATH=/etc/letsencrypt/live/api.sisterspromise.com/fullchain.pem
```

**Auto-renewal:**
```bash
# Renews automatically 30 days before expiration
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

#### Option B: Self-signed (Development only)

```bash
# Generate key + cert
openssl req -x509 -newkey rsa:4096 \
  -keyout private-key.pem \
  -out certificate.pem \
  -days 365 -nodes

# Update .env
SSL_KEY_PATH=./private-key.pem
SSL_CERT_PATH=./certificate.pem
```

---

### 5. Google Analytics Setup

1. **Create Google Analytics Account**
   - Go to analytics.google.com
   - Create new property
   - Select "Web"
   - Get Measurement ID (G_XXXXX)

2. **Create API Credentials**
   - Go to Google Cloud Console
   - Create Service Account
   - Create JSON key
   - Save credentials

3. **Update .env**
   ```dotenv
   GA_MEASUREMENT_ID=G_XXXXXXXXXX
   GA_API_SECRET=xxxxx
   ```

---

### 6. reCAPTCHA Setup (Optional but Recommended)

1. **Go to [google.com/recaptcha/admin](https://www.google.com/recaptcha/admin)**
2. **Create new site**
   - reCAPTCHA version: v3
   - Add domains: sisterspromise.com, api.sisterspromise.com
3. **Get keys**
   - Site Key (for frontend)
   - Secret Key (for backend)
4. **Update .env**
   ```dotenv
   RECAPTCHA_SITE_KEY=xxxxx
   RECAPTCHA_SECRET_KEY=xxxxx
   ```

---

### 7. Admin Users Setup

Create default admin & owner accounts:

```bash
# Edit .env
ADMIN_EMAIL=admin@sisterspromise.com
ADMIN_PASSWORD=SecureAdminPass123!
OWNER_EMAIL=owner@sisterspromise.com
OWNER_PASSWORD=SecureOwnerPass123!
```

**Run initialization:**
```bash
node scripts/initializeUsers.js
```

Or manually create via API:
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"admin@sisterspromise.com",
    "password":"SecureAdminPass123!",
    "firstName":"Admin",
    "lastName":"User",
    "role":"admin"
  }'
```

---

## Deployment Options

### Option 1: Render.com (Easiest)

1. **Connect GitHub Repository**
   ```
   Go to dashboard.render.com
   New Web Service
   Select GitHub repo: derob357/SistersPromise
   ```

2. **Configure Service**
   ```
   Name: sisters-promise-api
   Environment: Node
   Build Command: npm install
   Start Command: npm start
   ```

3. **Add Environment Variables**
   - Click "Environment"
   - Add all .env variables
   - Save

4. **Deploy**
   - Click Deploy
   - Takes 5-10 minutes
   - Get live URL

### Option 2: AWS EC2 (More Control)

```bash
# 1. Launch Ubuntu instance
# 2. SSH into instance

# 3. Install Node
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Install MongoDB
sudo apt-get install -y mongodb

# 5. Clone repo
cd ~
git clone https://github.com/derob357/SistersPromise.git
cd SistersPromise

# 6. Install dependencies
npm install

# 7. Create .env file
nano .env

# 8. Install PM2
sudo npm install -g pm2

# 9. Start server
pm2 start server.js --name "api"
pm2 save
pm2 startup

# 10. Set up nginx reverse proxy
sudo apt-get install -y nginx
# Configure nginx.conf to proxy to localhost:3000
```

### Option 3: Railway

1. Go to [railway.app](https://railway.app)
2. Connect GitHub
3. Select repository
4. Add MongoDB plugin
5. Set environment variables
6. Deploy

### Option 4: Heroku (Legacy but works)

```bash
heroku login
heroku create sisters-promise-api
git push heroku main
heroku config:set NODE_ENV=production
# Add other env vars via dashboard
```

---

## Monitoring & Logs

### PM2 (Local/EC2)

```bash
# View logs
pm2 logs api

# Monitor
pm2 monit

# Restart if crash
pm2 start server.js --watch --max-memory-restart 1G
```

### CloudWatch (AWS)

```bash
# View CloudWatch logs in AWS Console
```

### Papertrail (All platforms)

```bash
# 1. Sign up at papertrailapp.com
# 2. Get syslog address
# 3. Forward logs:

pm2 start server.js --log /var/log/sisters-promise.log

# Forward syslog
sudo vim /etc/rsyslog.d/30-papertrail.conf

# Add:
*.* @@logs1.papertrailapp.com:12345
```

---

## Testing APIs

### Health Check
```bash
curl https://api.sisterspromise.com/api/health
```

### Create Test User
```bash
curl -X POST https://api.sisterspromise.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email":"test@example.com",
    "password":"TestPass123!",
    "firstName":"Test",
    "lastName":"User"
  }'
```

### Get Products
```bash
curl https://api.sisterspromise.com/api/products
```

---

## Troubleshooting

### "Cannot connect to MongoDB"
- Check MONGODB_URI in .env
- Verify IP whitelist in MongoDB Atlas
- Check network connectivity

### "SMTP auth error"
- Verify email password (not Gmail password if 2FA enabled)
- Use App Password instead
- Check SMTP_HOST & SMTP_PORT

### "Certificate verification failed"
- Let's Encrypt: Check renewal: `sudo certbot renew --dry-run`
- Self-signed: Add to Node: `NODE_TLS_REJECT_UNAUTHORIZED=0` (dev only)

### "Port 3000 already in use"
```bash
# Find process
lsof -i :3000

# Kill process
kill -9 PID
```

### "Out of memory"
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm start
```

---

## Backup & Recovery

### Database Backup (MongoDB Atlas)

```bash
# Create backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/sisterspromise" \
  --out backup_$(date +%Y%m%d)

# Restore backup
mongorestore --uri="mongodb+srv://..." backup_YYYYMMDD
```

### Code Backup

```bash
# Push to GitHub
git add -A
git commit -m "backup: $(date)"
git push origin main
```

---

## Security Checklist

- [ ] HTTPS enabled (Let's Encrypt certificate)
- [ ] MongoDB encrypted connection
- [ ] JWT_SECRET changed (32+ characters)
- [ ] Admin/Owner passwords changed
- [ ] SMTP password secured
- [ ] API keys (Square, reCAPTCHA) not in code
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation enabled
- [ ] Logs monitored
- [ ] Backups automated
- [ ] Firewall configured
- [ ] DDoS protection enabled

---

**Last Updated:** January 16, 2026
