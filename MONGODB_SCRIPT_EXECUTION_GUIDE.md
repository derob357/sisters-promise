# How to Run MongoDB Setup Scripts - Production Ready

## 🎯 Quick Start (2 Minutes)

Your MongoDB scripts are production-ready and will use your `.env.production` settings automatically.

---

## ✅ Prerequisites

Before running any script, verify:

```bash
# 1. MongoDB is running
mongosh --version
# Should show: mongosh 1.x.x

# 2. Node.js is installed
node --version
npm --version

# 3. .env.production has correct MONGODB_URI
cat .env.production | grep MONGODB_URI
# Should show: mongodb+srv://derob357:***REMOVED***@cluster0sp.mongodb.net/sisterspromise?...

# 4. You have internet (for Atlas cloud connection)
ping mongodb.com
```

---

## 🚀 Method 1: Setup Everything at Once (Recommended)

**Use this for first-time setup:**

```bash
# Navigate to backend directory
cd /Users/drob/Documents/SistersPromise

# Run complete setup (creates all collections + sample data)
node setup-database-mongodb.js
```

**What it does:**
- ✅ Connects to MongoDB Atlas (production)
- ✅ Clears existing data
- ✅ Creates all indexes
- ✅ Inserts 5 sample products with images
- ✅ Creates 2 test users (admin + customer)
- ✅ Creates 1 sample order

**Expected Output:**
```
🚀 Sisters Promise MongoDB Setup (PRODUCTION)
📡 MongoDB URI: mongodb+srv://derob357:2-Bel0w...

✅ MongoDB connection successful

📦 Inserting sample products with image arrays...
✓ Inserted 5 products

👤 Creating users...
✓ Admin created (admin@sisterspromise.com / admin123)
✓ Customer created (customer@example.com / customer123)

✅ MongoDB setup complete!
```

---

## 🆕 Method 2: Import Only Products (Etsy Data)

**Use this to replace products:**

```bash
cd /Users/drob/Documents/SistersPromise

# Import your real Etsy products
node sisters-promise-products-with-images.js
```

**What it does:**
- ✅ Clears existing products
- ✅ Imports all 5 real Etsy products
- ✅ Keeps existing users + orders

**Expected Output:**
```
🚀 Sisters Promise - Importing Products

✅ MongoDB connected

🛍️  Your Product Catalog:

1. Turmeric Ginger Latte Soap
   Price: $10.00
   Stock: 50 units
   Images: 1

✓ Imported 5 products
```

---

## 🔍 Method 3: Manual Verification via mongosh

**Check what's in your database:**

```bash
# Connect to MongoDB
mongosh "mongodb+srv://derob357:***REMOVED***@cluster0sp.mongodb.net/sisterspromise"

# List collections
show collections

# Count products
db.products.countDocuments()

# View one product with images
db.products.findOne({}, { name: 1, images: 1, price: 1 })

# View all products
db.products.find().pretty()

# View users
db.users.find()

# Exit
exit
```

---

## 📋 Which Script to Use?

| Scenario | Script | Command |
|----------|--------|---------|
| First time setup | `setup-database-mongodb.js` | `node setup-database-mongodb.js` |
| Update only products | `sisters-promise-products-with-images.js` | `node sisters-promise-products-with-images.js` |
| Add custom products | `import-products-from-csv.js` | `node import-products-from-csv.js` |
| Manual control | mongosh | `mongosh "mongodb+srv://..."` |

---

## 🔑 Test Credentials

After running `setup-database-mongodb.js`:

**Admin Account:**
```
Email: admin@sisterspromise.com
Password: admin123
Role: admin
```

**Customer Account:**
```
Email: customer@example.com
Password: customer123
Role: customer
```

---

## ✅ Verify Setup Worked

### Test 1: Check Collections

```bash
mongosh sisters_promise
show collections
# Should show: analyticsevents, carts, orders, products, users
```

### Test 2: Check Product Images

```bash
mongosh sisters_promise
db.products.findOne({}, { images: 1, name: 1 })

# Should show:
# {
#   name: "Turmeric Ginger Latte Soap",
#   images: [{
#     url: "https://i.etsystatic.com/.../il_fullxfull.xxx.jpg",
#     thumbnailUrl: "https://i.etsystatic.com/.../il_340x270.xxx.jpg",
#     alt: "...",
#     isPrimary: true
#   }]
# }
```

### Test 3: Check API Endpoint

```bash
# Start backend server first
cd /Users/drob/Documents/SistersPromise
npm start

# In another terminal, test API
curl http://localhost:3000/api/products | jq '.[0].images'

# Should return image array
```

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to MongoDB"

**Solution:**
```bash
# 1. Check connection string
cat .env.production | grep MONGODB_URI

# 2. Verify credentials work
mongosh "mongodb+srv://derob357:***REMOVED***@cluster0sp.mongodb.net/sisterspromise"

# 3. Allow your IP in MongoDB Atlas
# Go to: mongodb.com/cloud → Network Access → Add 0.0.0.0/0
```

### Problem: "Command not found: mongosh"

**Solution:**
```bash
# Install MongoDB tools
brew install mongosh

# Or use npm
npm install -g mongosh
```

### Problem: "Scripts exist but running them gives error"

**Solution:**
```bash
# 1. Verify Node packages are installed
npm install mongoose bcrypt dotenv

# 2. Run with explicit node version
node --version
node setup-database-mongodb.js
```

### Problem: "Port 3000 already in use"

**Solution:**
```bash
# Find process using port 3000
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

---

## 📊 Next Steps

After running setup:

1. ✅ **Backend Running:** `npm start`
2. ✅ **Database Populated:** 5 products with images
3. ✅ **Test Users Created:** Admin + Customer
4. ✅ **API Ready:** Test at `http://localhost:3000/api/products`

---

## 🎯 Production Checklist

- [x] MongoDB Atlas free tier setup
- [x] Connection string in `.env.production`
- [x] Setup scripts created (committed to GitHub)
- [x] Test data ready to import
- [x] Image URLs from Etsy included
- [ ] Run setup script
- [ ] Verify data in MongoDB
- [ ] Test API endpoints
- [ ] Deploy backend to Render
- [ ] Test from mobile app

---

## 📞 Questions?

All scripts automatically:
- ✅ Use your `.env.production` file
- ✅ Connect to MongoDB Atlas (not local)
- ✅ Use production credentials
- ✅ Handle errors gracefully
- ✅ Display clear success/error messages

**Just run the script and follow the output!** 🚀
