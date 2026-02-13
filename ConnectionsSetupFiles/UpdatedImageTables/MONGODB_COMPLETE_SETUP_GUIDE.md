# Sister's Promise - Complete MongoDB Setup Guide
## WITH ENHANCED IMAGE SUPPORT (Full + Thumbnails)

**Total Time:** 60-75 minutes  
**Difficulty:** Intermediate  
**Updated:** January 16, 2026

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [MongoDB Installation](#mongodb-installation)
3. [Database Schema](#database-schema-with-images)
4. [Backend Setup](#backend-setup)
5. [Database Initialization](#database-initialization)
6. [Mobile App Setup](#mobile-app-setup)
7. [Testing](#testing)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 16+ installed (`node --version`)
- [ ] npm or yarn installed
- [ ] Git installed
- [ ] Terminal/Command Prompt access
- [ ] Text editor (VS Code recommended)
- [ ] 5GB free disk space

---

## MongoDB Installation

### macOS (via Homebrew)

```bash
# Install Homebrew (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install MongoDB
brew tap mongodb/brew
brew install mongodb-community@7.0

# Start MongoDB service
brew services start mongodb-community@7.0

# Verify it's running
brew services list | grep mongodb
```

**Expected:** `mongodb-community started`

### Linux (Ubuntu/Debian)

```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -

# Create list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu $(lsb_release -cs)/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list

# Update packages
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod

# Verify
sudo systemctl status mongod
```

### Windows

1. Download MongoDB from: https://www.mongodb.com/try/download/community
2. Run the installer (choose "Complete" installation)
3. Install as Windows Service
4. Verify: Open Command Prompt and run `mongosh`

### Docker (All Platforms)

```bash
# Pull MongoDB image
docker pull mongo:7.0

# Run MongoDB container
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password \
  -v mongodb_data:/data/db \
  mongo:7.0

# Verify
docker ps | grep mongo
```

---

## Database Schema with Images

### Product Schema (ENHANCED)

```javascript
{
  name: String,              // Product name
  description: String,       // Product description
  price: Number,             // Price in USD
  category: String,          // Category (soap, bath, etc.)
  
  // NEW: Images array with thumbnails
  images: [
    {
      url: String,           // Full-size image URL (e.g., 2000x2000)
      thumbnailUrl: String,  // Thumbnail URL (e.g., 340x270)
      alt: String,           // Alt text for accessibility
      isPrimary: Boolean     // Mark main product image
    }
  ],
  
  // Legacy field (backward compatible)
  imageUrl: String,          // Primary image URL
  
  stockQuantity: Number,     // Available stock
  isActive: Boolean,         // Product visibility
  etsyListingId: String,     // Etsy listing ID
  createdAt: Date,           // Creation timestamp
  updatedAt: Date            // Last update timestamp
}
```

### Example Product with Images

```javascript
{
  name: "Turmeric Ginger Latte Soap",
  description: "Handcrafted soap with turmeric and ginger",
  price: 10.00,
  category: "soap",
  images: [
    {
      url: "https://i.etsystatic.com/.../il_fullxfull.xxx.jpg",
      thumbnailUrl: "https://i.etsystatic.com/.../il_340x270.xxx.jpg",
      alt: "Turmeric Ginger Latte Soap - handmade",
      isPrimary: true
    }
  ],
  imageUrl: "https://i.etsystatic.com/.../il_fullxfull.xxx.jpg",
  stockQuantity: 50,
  etsyListingId: "717857432"
}
```

### Other Collections

**Users:**
- email (unique)
- password (hashed with bcrypt)
- name
- role (customer/admin)

**Orders:**
- userId (reference to User)
- totalAmount
- status (pending/processing/shipped/delivered/cancelled)
- items[] (productId, quantity, priceAtPurchase)
- shippingAddress
- trackingNumber

**Carts:**
- userId
- productId
- quantity

**AnalyticsEvents:**
- eventName
- eventData
- userId
- sessionId

---

## Backend Setup

### 1. Clone Backend Repository

```bash
git clone https://github.com/derob357/sisters-promise.git
cd sisters-promise
```

### 2. Install Dependencies

```bash
npm install
```

**Required packages:**
```bash
npm install express mongoose bcrypt jsonwebtoken dotenv cors
```

### 3. Create .env File

```bash
# Create .env in backend root
cat > .env << 'ENVFILE'
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/sisters_promise
# OR for Docker:
# MONGODB_URI=mongodb://admin:password@localhost:27017/sisters_promise?authSource=admin

# JWT Secret (change in production!)
JWT_SECRET=your-super-secret-jwt-key-change-this

# Google Analytics (optional)
GA_MEASUREMENT_ID=G-XXXXXXXXXX

# CORS Origins
ALLOWED_ORIGINS=http://localhost:8081,http://192.168.1.0/24
ENVFILE
```

### 4. Verify Backend Structure

```bash
# Check directory structure
ls -la

# Expected files/folders:
# - server.js (main entry point)
# - models/ (database models)
# - services/ (business logic)
# - middleware/ (auth, etc.)
# - config/ (database config)
# - .env (environment variables)
# - package.json
```

---

## Database Initialization

### Method 1: Run Setup Script (Recommended)

```bash
# Copy setup script to backend folder
# (Use one of the setup scripts provided)

# Run setup
node setup-database-mongodb.js
```

**Expected Output:**
```
🚀 Sister's Promise MongoDB Setup
✅ MongoDB connection successful
🗑️  Clearing existing data...
📋 Creating indexes...
📦 Inserting sample products with image arrays...
✓ Inserted 5 products with image arrays
👤 Creating users...
✓ Admin user created (admin@sisterspromise.com / admin123)
✓ Test customer created (customer@example.com / customer123)
📦 Creating sample order...
✅ MongoDB setup complete!
📸 Image Features:
  ✓ Full-size images for product details
  ✓ Thumbnail images for fast lists
  ✓ Alt text for accessibility
  ✓ Support for multiple images per product
```

### Method 2: Manual Setup via mongosh

```bash
# Connect to MongoDB
mongosh sisters_promise

# Create product manually
db.products.insertOne({
  name: "Turmeric Ginger Latte Soap",
  description: "Handcrafted soap",
  price: 10.00,
  category: "soap",
  images: [{
    url: "https://i.etsystatic.com/.../il_fullxfull.xxx.jpg",
    thumbnailUrl: "https://i.etsystatic.com/.../il_340x270.xxx.jpg",
    alt: "Turmeric soap",
    isPrimary: true
  }],
  imageUrl: "https://i.etsystatic.com/.../il_fullxfull.xxx.jpg",
  stockQuantity: 50,
  etsyListingId: "717857432",
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
})

# Verify
db.products.find().pretty()
```

### Verify Database

```bash
# Connect to MongoDB
mongosh sisters_promise

# List collections
show collections
# Expected: analyticsevents, carts, orders, products, users

# Count products
db.products.countDocuments()
# Expected: 5 (or your count)

# Verify image structure
db.products.findOne({}, { images: 1, name: 1 })
# Should show images array with url, thumbnailUrl, alt, isPrimary

# Exit
exit
```

---

## Mobile App Setup

### 1. Clone Mobile Repository

```bash
cd ..
git clone https://github.com/derob357/sisters-promise-mobile.git
cd sisters-promise-mobile
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Fix Critical Issues

```bash
# Install missing uuid package
npm install uuid --save

# Install react-native-dotenv
npm install react-native-dotenv --save-dev
```

### 4. Create .env File

**CRITICAL: Use your computer's IP address, NOT localhost!**

```bash
# Get your IP address
# macOS/Linux:
ifconfig | grep "inet " | grep -v 127.0.0.1

# Windows:
ipconfig | findstr IPv4

# Create .env file (replace 192.168.1.XXX with YOUR IP)
cat > .env << 'ENVFILE'
# Backend API URL - USE YOUR COMPUTER'S IP!
API_BASE_URL=http://192.168.1.XXX:3000/api

# For Android Emulator (alternative):
# API_BASE_URL=http://10.0.2.2:3000/api

# Environment
ENV=development
ENVFILE
```

**Example:**
- Your IP: `192.168.1.105`
- Your .env: `API_BASE_URL=http://192.168.1.105:3000/api`

### 5. Update Mobile Code for Images

Edit `src/components/ProductCard.js`:

```javascript
const ProductCard = ({ product }) => {
  // Get primary image or fallback
  const primaryImage = product.images?.find(img => img.isPrimary) 
    || product.images?.[0]
    || { thumbnailUrl: product.imageUrl, alt: product.name };

  return (
    <TouchableOpacity onPress={() => navigateToDetail(product)}>
      <Image
        source={{ uri: primaryImage.thumbnailUrl }}  // Use thumbnail!
        style={styles.thumbnail}
        accessible={true}
        accessibilityLabel={primaryImage.alt}
      />
      <Text>{product.name}</Text>
      <Text>${product.price.toFixed(2)}</Text>
    </TouchableOpacity>
  );
};
```

Edit `src/screens/ProductDetailScreen.js`:

```javascript
const ProductDetailScreen = ({ route }) => {
  const { product } = route.params;
  const primaryImage = product.images?.find(img => img.isPrimary) 
    || product.images?.[0];

  return (
    <ScrollView>
      <Image
        source={{ uri: primaryImage.url }}  // Use full image!
        style={styles.mainImage}
        resizeMode="contain"
      />
      {/* ... rest of component ... */}
    </ScrollView>
  );
};
```

---

## Testing

### 1. Test Backend API

```bash
# Start backend server
cd sisters-promise
npm start

# Should see:
# Server running on port 3000
# MongoDB connected successfully
```

**Test endpoints:**

```bash
# Health check
curl http://localhost:3000/health
# Expected: {"status":"ok"}

# Get products
curl http://localhost:3000/api/products
# Expected: Array of 5 products with images arrays

# Test product with images
curl http://localhost:3000/api/products | jq '.[0].images'
# Expected:
# [
#   {
#     "url": "https://i.etsystatic.com/.../il_fullxfull.xxx.jpg",
#     "thumbnailUrl": "https://i.etsystatic.com/.../il_340x270.xxx.jpg",
#     "alt": "Product description",
#     "isPrimary": true
#   }
# ]

# Register user
curl -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"test123","name":"Test User"}'

# Login
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@example.com","password":"customer123"}'
```

### 2. Test Mobile App

```bash
# Start Metro bundler
cd sisters-promise-mobile
npm start

# In another terminal, run Android
npm run android

# Or iOS
npm run ios
```

**Test Features:**

1. **Product List (Thumbnails)**
   - Open app
   - Browse products
   - Thumbnails should load quickly
   - All 5 products visible

2. **Product Details (Full Images)**
   - Tap a product
   - Full-size image should appear
   - High quality image visible

3. **User Registration**
   - Tap "Register"
   - Enter email, password, name
   - Should create account

4. **User Login**
   - Email: customer@example.com
   - Password: customer123
   - Should log in successfully

5. **Add to Cart**
   - Select a product
   - Tap "Add to Cart"
   - Cart icon should update

6. **Place Order**
   - Go to cart
   - Tap "Checkout"
   - Fill shipping info
   - Place order

7. **Verify Order in DB**
   ```bash
   mongosh sisters_promise
   db.orders.find().sort({createdAt:-1}).limit(1).pretty()
   exit
   ```

### 3. Test Image Loading

**Product List Performance:**
- Products should load in <2 seconds
- Thumbnails (340x270) are ~50-100KB each
- Smooth scrolling

**Product Detail Performance:**
- Full image should load in <3 seconds
- Full images (2000x2000) are ~300-500KB each
- Sharp, high-quality display

---

## Troubleshooting

### MongoDB Won't Start

**macOS:**
```bash
# Check status
brew services list | grep mongodb

# Restart
brew services restart mongodb-community

# Check logs
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

**Linux:**
```bash
# Check status
sudo systemctl status mongod

# Restart
sudo systemctl restart mongod

# Check logs
sudo journalctl -u mongod -f
```

**Docker:**
```bash
# Check container
docker ps -a | grep mongo

# Restart
docker restart mongodb

# Check logs
docker logs mongodb
```

### Mobile App Can't Connect to Backend

**Issue:** "Network request failed" or timeout errors

**Solutions:**

1. **Verify backend is running:**
   ```bash
   curl http://localhost:3000/health
   ```

2. **Check mobile .env file:**
   ```bash
   # Should have YOUR computer's IP, not localhost!
   cat .env
   # Correct: API_BASE_URL=http://192.168.1.105:3000/api
   # Wrong: API_BASE_URL=http://localhost:3000/api
   ```

3. **Find your IP address:**
   ```bash
   # macOS/Linux
   ifconfig | grep "inet " | grep -v 127.0.0.1
   
   # Windows
   ipconfig | findstr IPv4
   ```

4. **Test backend from mobile device IP:**
   ```bash
   # Replace with your IP
   curl http://192.168.1.105:3000/health
   ```

5. **Check firewall:**
   ```bash
   # macOS - allow port 3000
   # System Settings > Network > Firewall
   
   # Linux - allow port 3000
   sudo ufw allow 3000/tcp
   ```

6. **Android Emulator specific:**
   ```bash
   # Use special IP for Android emulator
   # In .env:
   API_BASE_URL=http://10.0.2.2:3000/api
   ```

### Images Not Loading

**Issue:** Products show but images are broken

**Solutions:**

1. **Verify image URLs in database:**
   ```bash
   mongosh sisters_promise
   db.products.findOne({}, { images: 1 })
   ```

2. **Check image structure:**
   ```javascript
   // Should have:
   {
     images: [{
       url: "https://i.etsystatic.com/.../il_fullxfull.xxx.jpg",
       thumbnailUrl: "https://i.etsystatic.com/.../il_340x270.xxx.jpg",
       alt: "...",
       isPrimary: true
     }]
   }
   ```

3. **Test image URL directly:**
   ```bash
   # Open in browser:
   https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg
   ```

4. **Check mobile app code:**
   - ProductCard should use `primaryImage.thumbnailUrl`
   - ProductDetail should use `primaryImage.url`

### Port 3000 Already in Use

```bash
# Find what's using port 3000
lsof -i :3000

# Kill the process
kill -9 <PID>

# Or use different port
# In backend .env:
PORT=3001

# In mobile .env:
API_BASE_URL=http://192.168.1.XXX:3001/api
```

### Database Connection Errors

**Error:** `MongoServerError: Authentication failed`

**Solution:**
```bash
# Check MONGODB_URI in .env
# For local MongoDB:
MONGODB_URI=mongodb://localhost:27017/sisters_promise

# For Docker MongoDB:
MONGODB_URI=mongodb://admin:password@localhost:27017/sisters_promise?authSource=admin

# For MongoDB Atlas:
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sisters_promise
```

---

## Success Checklist

- [ ] MongoDB installed and running
- [ ] Backend repository cloned
- [ ] Backend dependencies installed
- [ ] Backend .env file created
- [ ] Database initialized with image support
- [ ] 5 products with images arrays in database
- [ ] Admin user created
- [ ] Test customer created
- [ ] Backend server starts without errors
- [ ] Backend API endpoints respond
- [ ] Mobile repository cloned
- [ ] Mobile dependencies installed
- [ ] Mobile .env file created with correct IP
- [ ] Mobile app builds successfully
- [ ] Products display with thumbnails
- [ ] Product details show full images
- [ ] User can register/login
- [ ] User can add to cart
- [ ] User can place order
- [ ] Order appears in database

---

## Next Steps

1. **Customize Products:**
   - Add your own products using CSV import
   - Update product images
   - Set correct stock quantities

2. **Configure Payment:**
   - Add Stripe integration
   - Set up payment processing
   - Test checkout flow

3. **Deploy Backend:**
   - Set up production database (MongoDB Atlas)
   - Deploy to cloud (Heroku, AWS, DigitalOcean)
   - Configure production environment

4. **Build Release APK:**
   - Generate signing key
   - Build production APK
   - Test on real device

5. **Launch App:**
   - Publish to Google Play Store
   - Set up analytics
   - Monitor performance

---

## Quick Reference

**Start Backend:**
```bash
cd sisters-promise
npm start
```

**Start Mobile:**
```bash
cd sisters-promise-mobile
npm start
# In another terminal:
npm run android
```

**View Database:**
```bash
mongosh sisters_promise
show collections
db.products.find().pretty()
```

**Test API:**
```bash
curl http://localhost:3000/api/products
```

---

**Created:** January 16, 2026  
**Updated:** January 16, 2026  
**Version:** 2.0 (with enhanced image support)  
**Status:** Production Ready
