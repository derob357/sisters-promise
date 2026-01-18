#!/bin/bash

# Quick Start Script for Sisters Promise Development
# This file is executable - run with: ./quick-start.sh

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════════╗
║                  Sisters Promise - Development Quick Start                ║
╚════════════════════════════════════════════════════════════════════════════╝

This guide will help you get the full stack running in minutes.

PREREQUISITES (Check these first):
───────────────────────────────────────────────────────────────────────────

✓ Node.js 18+ installed
  └─ Check: node --version

✓ Xcode Command Line Tools installed (macOS)
  └─ Check: xcode-select --print-path
  └─ Install: xcode-select --install

✓ Watchman installed (macOS)
  └─ Check: watchman --version
  └─ Install: brew install watchman

✓ MongoDB Atlas Account
  └─ Connection string in credentials.json or .env

✓ npm packages installed
  └─ Backend: cd SistersPromise && npm install
  └─ Mobile: cd SistersPromiseMobile && npm install


OPTION 1: AUTOMATED LAUNCH (Recommended for Development)
───────────────────────────────────────────────────────────────────────────

Just run:

  ./launch-all.sh

This will start:
  • Backend server on https://localhost:443
  • Metro bundler
  • iOS simulator

Log output displayed in separate terminal panes.

Stop with Ctrl+C


OPTION 2: MANUAL LAUNCH (For troubleshooting or selective starting)
───────────────────────────────────────────────────────────────────────────

Terminal 1 - Backend Server:
  cd /Users/drob/Documents/SistersPromise
  npm start

Terminal 2 - Metro Bundler:
  cd /Users/drob/Documents/SistersPromise/SistersPromiseMobile
  npm start -- --reset-cache

Terminal 3 - iOS Simulator:
  cd /Users/drob/Documents/SistersPromise/SistersPromiseMobile
  npm run ios


OPTION 3: SELECT WHICH SERVICES TO START
───────────────────────────────────────────────────────────────────────────

Only backend:
  ./launch-all.sh --backend-only

Only Metro bundler:
  ./launch-all.sh --metro-only

Only iOS simulator (requires Metro already running):
  ./launch-all.sh --ios-only

Debug mode (verbose logging):
  ./launch-all.sh --debug


TESTING THE SETUP
───────────────────────────────────────────────────────────────────────────

1. Backend Health:
   curl -k https://localhost:443/api/health
   (Should return 200 OK)

2. Login Test:
   curl -k -X POST https://localhost:443/api/users/login \
     -H "Content-Type: application/json" \
     -d '{"email":"d@sp.com","password":"pass123"}'
   (Should return user object + token)

3. Products Test:
   curl -k https://localhost:443/api/products
   (Should return array of products)

4. Mobile App:
   - Wait for simulator to appear
   - See login screen
   - Enter: d@sp.com / pass123
   - Tap Login
   - Should see home screen


TROUBLESHOOTING
───────────────────────────────────────────────────────────────────────────

"Port 443 already in use":
  → The launcher will auto-kill. If problem persists:
  lsof -ti:443 | xargs kill -9

"Metro won't start":
  → Clear cache and try again:
  cd SistersPromiseMobile
  rm -rf node_modules/.cache
  npm start -- --reset-cache

"Simulator won't launch":
  → Start simulator manually:
  xcrun simctl boot "iPhone 15"
  → Then run: npm run ios

"Can't connect to backend":
  → Verify backend is running: ps aux | grep "node server.js"
  → Check logs: tail -f logs/backend_*.log
  → Try health check: curl -k https://localhost:443/api/health

"Database connection fails":
  → Verify MongoDB Atlas connection string in .env
  → Check network access in MongoDB Atlas (IP whitelist)
  → Test connection: mongosh "mongodb+srv://..."

"Images not loading":
  → Check product has images array
  → Verify image URLs are accessible
  → Check for CORS errors in browser/app console


IMPORTANT COMMANDS
───────────────────────────────────────────────────────────────────────────

Stop all services:
  ./kill-all.sh

View logs:
  tail -f logs/backend_*.log
  tail -f logs/metro_*.log
  tail -f logs/ios_*.log

Reset mobile cache:
  cd SistersPromiseMobile && npm start -- --reset-cache

Connect to MongoDB:
  mongosh "mongodb+srv://..."

Check running processes:
  ps aux | grep -E "node|react-native"


DOCUMENTATION
───────────────────────────────────────────────────────────────────────────

Comprehensive Development Guide:
  → MOBILE_APP_TEMPLATE.md

API Reference:
  → API_DATA_AUDIT_REPORT.md

Complete Fixes Applied:
  → API_FIXES_SUMMARY.md

Quick API Lookup:
  → QUICK_REFERENCE.md

Deployment Guide:
  → DEPLOYMENT_CHECKLIST.md


NEXT STEPS
───────────────────────────────────────────────────────────────────────────

1. Start the services: ./launch-all.sh

2. Test login in the simulator

3. Browse products

4. Add item to cart

5. Test checkout flow

6. Verify order in MongoDB


SUPPORT
───────────────────────────────────────────────────────────────────────────

For detailed information about:
  - Project structure
  - API design patterns
  - Common issues & solutions
  - Security best practices
  - Performance optimization
  - Deployment procedures

→ See MOBILE_APP_TEMPLATE.md (comprehensive guide)


EOF
