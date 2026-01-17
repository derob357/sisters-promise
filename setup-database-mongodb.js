/**
 * MongoDB Database Setup Script for Sisters Promise
 * WITH ENHANCED IMAGE SUPPORT (Full + Thumbnails)
 * Run with: node setup-database-mongodb.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sisters_promise';

// Define Schemas with ENHANCED IMAGE SUPPORT
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, trim: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true },
  
  // NEW: Enhanced image array with thumbnails
  images: [{
    url: { type: String, required: true },           // Full-size image URL
    thumbnailUrl: { type: String, required: true },  // Thumbnail URL
    alt: { type: String },                           // Alt text for accessibility
    isPrimary: { type: Boolean, default: false }     // Mark the main product image
  }],
  
  // Legacy field for backward compatibility
  imageUrl: { type: String },
  
  stockQuantity: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  etsyListingId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const orderSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  totalAmount: { type: Number, required: true, min: 0 },
  status: { 
    type: String, 
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'pending' 
  },
  shippingAddress: { type: String },
  trackingNumber: { type: String },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    productName: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    priceAtPurchase: { type: Number, required: true, min: 0 }
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const analyticsEventSchema = new mongoose.Schema({
  eventName: { type: String, required: true },
  eventData: { type: mongoose.Schema.Types.Mixed },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sessionId: { type: String },
  createdAt: { type: Date, default: Date.now }
});

const cartSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, default: 1, min: 1 },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Create Models
const User = mongoose.model('User', userSchema);
const Product = mongoose.model('Product', productSchema);
const Order = mongoose.model('Order', orderSchema);
const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);
const Cart = mongoose.model('Cart', cartSchema);

async function setupDatabase() {
  console.log('🚀 Sisters Promise MongoDB Setup\n');
  console.log('📡 Connecting to MongoDB...');
  console.log(`   URI: ${MONGODB_URI}\n`);
  
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connection successful\n');
    
    // Drop existing collections (optional - comment out to preserve data)
    console.log('🗑️  Clearing existing data...');
    await User.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await AnalyticsEvent.deleteMany({});
    await Cart.deleteMany({});
    console.log('✓ Collections cleared\n');
    
    // Create indexes
    console.log('📋 Creating indexes...');
    await User.collection.createIndex({ email: 1 }, { unique: true });
    await Product.collection.createIndex({ category: 1 });
    await Product.collection.createIndex({ isActive: 1 });
    await Order.collection.createIndex({ userId: 1 });
    await Order.collection.createIndex({ status: 1 });
    await Order.collection.createIndex({ createdAt: -1 });
    await AnalyticsEvent.collection.createIndex({ eventName: 1 });
    await AnalyticsEvent.collection.createIndex({ createdAt: -1 });
    await Cart.collection.createIndex({ userId: 1, productId: 1 }, { unique: true });
    console.log('✓ Indexes created\n');
    
    // Insert sample products WITH ENHANCED IMAGE SUPPORT
    console.log('📦 Inserting sample products with image arrays...\n');
    
    const sampleProducts = [
      {
        name: 'Turmeric Ginger Latte Soap',
        description: 'Handcrafted soap infused with organic turmeric and ginger. This luxurious latte-inspired soap combines the anti-inflammatory properties of turmeric with the warming essence of ginger. Perfect for brightening skin and providing a spa-like experience.',
        price: 10.00,
        category: 'soap',
        images: [
          {
            url: 'https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg',
            thumbnailUrl: 'https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_340x270.2451554459_ij8l.jpg',
            alt: 'Turmeric Ginger Latte Soap - handmade natural soap',
            isPrimary: true
          }
        ],
        imageUrl: 'https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg',
        stockQuantity: 50,
        etsyListingId: '717857432'
      },
      {
        name: 'Organic Seamoss Aloe Soap',
        description: 'Hydrating soap for sensitive skin. Made with authentic Irish sea moss and organic aloe vera, this gentle soap is rich in 92 essential minerals. Perfect for nourishing and hydrating dry, sensitive skin.',
        price: 12.00,
        category: 'soap',
        images: [
          {
            url: 'https://i.etsystatic.com/20603018/r/il/e3c6b6/6662019347/il_fullxfull.6662019347_7309.jpg',
            thumbnailUrl: 'https://i.etsystatic.com/20603018/r/il/e3c6b6/6662019347/il_340x270.6662019347_7309.jpg',
            alt: 'Organic Seamoss Aloe Soap for sensitive skin',
            isPrimary: true
          }
        ],
        imageUrl: 'https://i.etsystatic.com/20603018/r/il/e3c6b6/6662019347/il_fullxfull.6662019347_7309.jpg',
        stockQuantity: 50,
        etsyListingId: '717898892'
      },
      {
        name: 'Pink Himalayan Sea Salt Soap',
        description: 'Detoxifying soap made with authentic Pink Himalayan sea salt. This mineral-rich soap gently exfoliates while drawing out impurities from your pores. Contains 84 trace minerals to nourish and revitalize your skin.',
        price: 10.00,
        category: 'soap',
        images: [
          {
            url: 'https://i.etsystatic.com/20603018/r/il/d7c5b3/2726892206/il_fullxfull.2726892206_7mzl.jpg',
            thumbnailUrl: 'https://i.etsystatic.com/20603018/r/il/d7c5b3/2726892206/il_340x270.2726892206_7mzl.jpg',
            alt: 'Pink Himalayan Sea Salt Soap - natural exfoliating soap',
            isPrimary: true
          }
        ],
        imageUrl: 'https://i.etsystatic.com/20603018/r/il/d7c5b3/2726892206/il_fullxfull.2726892206_7mzl.jpg',
        stockQuantity: 50,
        etsyListingId: '908416748'
      },
      {
        name: 'Seamoss Soap (24 Bars)',
        description: 'Bulk pack of 24 handmade sea moss soap bars. Perfect for resellers, large families, or extended use. Each bar is crafted with authentic Irish sea moss and natural ingredients. Great value for our most popular product.',
        price: 240.00,
        category: 'soap',
        images: [
          {
            url: 'https://i.etsystatic.com/20603018/r/il/f2cc1c/6613929090/il_fullxfull.6613929090_c8ts.jpg',
            thumbnailUrl: 'https://i.etsystatic.com/20603018/r/il/f2cc1c/6613929090/il_340x270.6613929090_c8ts.jpg',
            alt: 'Seamoss Soap bulk pack - 24 bars wholesale',
            isPrimary: true
          }
        ],
        imageUrl: 'https://i.etsystatic.com/20603018/r/il/f2cc1c/6613929090/il_fullxfull.6613929090_c8ts.jpg',
        stockQuantity: 10,
        etsyListingId: '811138109'
      },
      {
        name: 'Bath Salt Soaks',
        description: 'Luxurious bath salt blend for ultimate relaxation. Infused with essential oils and mineral-rich salts to soothe tired muscles and soften skin. Perfect for a spa-like experience at home.',
        price: 16.00,
        category: 'bath',
        images: [
          {
            url: 'https://i.etsystatic.com/20603018/r/il/0ba154/2305876750/il_fullxfull.2305876750_fn93.jpg',
            thumbnailUrl: 'https://i.etsystatic.com/20603018/r/il/0ba154/2305876750/il_340x270.2305876750_fn93.jpg',
            alt: 'Bath Salt Soaks - relaxing bath salts',
            isPrimary: true
          }
        ],
        imageUrl: 'https://i.etsystatic.com/20603018/r/il/0ba154/2305876750/il_fullxfull.2305876750_fn93.jpg',
        stockQuantity: 50,
        etsyListingId: '793802160'
      }
    ];
    
    const insertedProducts = await Product.insertMany(sampleProducts);
    console.log(`✓ Inserted ${insertedProducts.length} products with image arrays`);
    
    // Create admin user
    console.log('\n👤 Creating users...');
    const adminPassword = await bcrypt.hash('admin123', 10);
    const adminUser = await User.create({
      email: 'admin@sisterspromise.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'admin'
    });
    console.log('✓ Admin user created');
    console.log('   Email: admin@sisterspromise.com');
    console.log('   Password: admin123');
    
    // Create sample customer user
    const customerPassword = await bcrypt.hash('customer123', 10);
    const customerUser = await User.create({
      email: 'customer@example.com',
      password: customerPassword,
      name: 'Test Customer',
      role: 'customer'
    });
    console.log('✓ Test customer created');
    console.log('   Email: customer@example.com');
    console.log('   Password: customer123');
    
    // Create sample order for customer
    console.log('\n📦 Creating sample order...');
    const sampleOrder = await Order.create({
      userId: customerUser._id,
      totalAmount: 22.00,
      status: 'delivered',
      shippingAddress: '123 Main St, Anytown, ST 12345',
      trackingNumber: 'TRACK123456789',
      items: [
        {
          productId: insertedProducts[0]._id,
          productName: insertedProducts[0].name,
          quantity: 1,
          priceAtPurchase: 10.00
        },
        {
          productId: insertedProducts[1]._id,
          productName: insertedProducts[1].name,
          quantity: 1,
          priceAtPurchase: 12.00
        }
      ]
    });
    console.log('✓ Sample order created');
    
    // Verify collections
    console.log('\n📊 Database Summary:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\nCollections created:');
    collections.forEach(col => {
      console.log(`  ✓ ${col.name}`);
    });
    
    // Count records
    const userCount = await User.countDocuments();
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const totalImages = insertedProducts.reduce((sum, p) => sum + p.images.length, 0);
    
    console.log('\n📈 Record counts:');
    console.log(`  • Users: ${userCount}`);
    console.log(`  • Products: ${productCount}`);
    console.log(`  • Orders: ${orderCount}`);
    console.log(`  • Product Images: ${totalImages} (Full + Thumbnails)`);
    
    console.log('\n✅ MongoDB setup complete!');
    console.log('\n📸 Image Features:');
    console.log('  ✓ Full-size images for product details');
    console.log('  ✓ Thumbnail images for fast lists');
    console.log('  ✓ Alt text for accessibility');
    console.log('  ✓ Support for multiple images per product');
    console.log('\n🚀 Ready to start the server\n');
    
  } catch (error) {
    console.error('\n❌ MongoDB setup error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Make sure MongoDB is running:');
    console.error('     macOS: brew services list | grep mongodb');
    console.error('     Linux: sudo systemctl status mongod');
    console.error('     Docker: docker ps | grep mongo');
    console.error('  2. Check MONGODB_URI in .env file');
    console.error('  3. Verify connection: mongosh');
    console.error('  4. Check firewall settings');
    console.error('  5. Ensure required packages installed: npm install mongoose bcrypt\n');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupDatabase();
