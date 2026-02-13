/**
 * Sister's Promise - Real Etsy Products Import
 * WITH PROPER IMAGE SUPPORT (Full + Thumbnails)
 * 
 * Run: node sisters-promise-products-with-images.js
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sisters_promise';

// Enhanced MongoDB Schema with proper image support
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true },
  
  // NEW: Proper image structure
  images: [{
    url: { type: String, required: true },           // Full-size image URL
    thumbnailUrl: { type: String, required: true },  // Thumbnail URL
    alt: { type: String },                           // Alt text for accessibility
    isPrimary: { type: Boolean, default: false }     // Mark the main product image
  }],
  
  // Legacy field for backward compatibility
  imageUrl: { type: String },
  thumbnailUrl: { type: String },                  // CSV/Square thumbnail URL
  alt: { type: String },                           // CSV/Square alt text
  
  stockQuantity: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  etsyListingId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, trim: true },
  role: { type: String, enum: ['customer', 'admin'], default: 'customer' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const Product = mongoose.model('Product', productSchema);
const User = mongoose.model('User', userSchema);

// Helper function to create thumbnail URL from Etsy full URL
function getEtsyThumbnailUrl(fullUrl) {
  // Etsy URL format: il_fullxfull.xxxxx.jpg
  // Thumbnail format: il_340x270.xxxxx.jpg (or il_170x135 for smaller)
  return fullUrl.replace('il_fullxfull', 'il_340x270');
}

// Real products from your Etsy store with proper image arrays
const products = [
  {
    name: 'Turmeric Ginger Latte Soap',
    description: 'Handcrafted soap infused with organic turmeric and ginger. This luxurious latte-inspired soap combines the anti-inflammatory properties of turmeric with the warming essence of ginger. Perfect for brightening skin and providing a spa-like experience. Made with all-natural ingredients, no harsh chemicals.',
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
    imageUrl: 'https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg', // Legacy
    stockQuantity: 50,
    etsyListingId: '717857432',
    isActive: true
  },
  {
    name: 'Organic Seamoss Aloe Soap',
    description: 'Hydrating soap for sensitive skin. Made with authentic Irish sea moss and organic aloe vera, this gentle soap is rich in 92 essential minerals. Perfect for nourishing and hydrating dry, sensitive skin. Handmade in small batches with love and intention.',
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
    etsyListingId: '717898892',
    isActive: true
  },
  {
    name: 'Pink Himalayan Sea Salt Soap',
    description: 'Detoxifying soap made with authentic Pink Himalayan sea salt. This mineral-rich soap gently exfoliates while drawing out impurities from your pores. Contains 84 trace minerals to nourish and revitalize your skin. Perfect for all skin types.',
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
    etsyListingId: '908416748',
    isActive: true
  },
  {
    name: 'Seamoss Soap (24 Bars)',
    description: 'Bulk pack of 24 handmade sea moss soap bars. Perfect for resellers, large families, or extended use. Each bar is crafted with authentic Irish sea moss and natural ingredients. Great value for our most popular product. Individually wrapped for freshness.',
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
    etsyListingId: '811138109',
    isActive: true
  },
  {
    name: 'Bath Salt Soaks',
    description: 'Luxurious bath salt blend for ultimate relaxation. Infused with essential oils and mineral-rich salts to soothe tired muscles and soften skin. Perfect for a spa-like experience at home. Choose from various therapeutic scents.',
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
    etsyListingId: '793802160',
    isActive: true
  }
];

async function importProducts() {
  console.log('🚀 Sister's Promise - Importing Products with Image Support\n');
  console.log('📡 Connecting to MongoDB...');
  console.log(`   URI: ${MONGODB_URI}\n`);
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');
    
    // Clear existing products
    console.log('🗑️  Clearing old products...');
    const deletedCount = await Product.deleteMany({});
    console.log(`✓ Removed ${deletedCount.deletedCount} old products\n`);
    
    // Import new products
    console.log('📦 Importing products with image arrays...\n');
    const insertedProducts = await Product.insertMany(products);
    
    console.log('✅ Products imported successfully!\n');
    console.log('🛍️  Your Product Catalog:');
    console.log('═'.repeat(90));
    
    insertedProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name}`);
      console.log(`   💰 Price: $${product.price.toFixed(2)}`);
      console.log(`   📦 Category: ${product.category}`);
      console.log(`   📊 Stock: ${product.stockQuantity} units`);
      console.log(`   🖼️  Images: ${product.images.length} image(s)`);
      
      product.images.forEach((img, i) => {
        console.log(`      ${i + 1}. ${img.isPrimary ? '⭐ ' : '   '}Full: ${img.url.substring(0, 60)}...`);
        console.log(`         Thumb: ${img.thumbnailUrl.substring(0, 60)}...`);
      });
      
      console.log(`   🔗 Etsy: https://www.etsy.com/listing/${product.etsyListingId}`);
    });
    
    // Statistics
    const totalValue = insertedProducts.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);
    const avgPrice = insertedProducts.reduce((sum, p) => sum + p.price, 0) / insertedProducts.length;
    const totalImages = insertedProducts.reduce((sum, p) => sum + p.images.length, 0);
    
    console.log('\n' + '═'.repeat(90));
    console.log('📊 Inventory Statistics:');
    console.log(`   Total Products: ${insertedProducts.length}`);
    console.log(`   Total Images: ${totalImages} (Full + Thumbnails)`);
    console.log(`   Average Price: $${avgPrice.toFixed(2)}`);
    console.log(`   Total Inventory Value: $${totalValue.toFixed(2)}`);
    console.log(`   Price Range: $${Math.min(...insertedProducts.map(p => p.price)).toFixed(2)} - $${Math.max(...insertedProducts.map(p => p.price)).toFixed(2)}`);
    
    // Setup users
    console.log('\n👤 Setting up users...');
    const existingAdmin = await User.findOne({ email: 'admin@sisterspromise.com' });
    
    if (!existingAdmin) {
      const adminPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        email: 'admin@sisterspromise.com',
        password: adminPassword,
        name: 'Admin User',
        role: 'admin'
      });
      console.log('✓ Admin created (admin@sisterspromise.com / admin123)');
    } else {
      console.log('✓ Admin already exists');
    }
    
    const existingCustomer = await User.findOne({ email: 'customer@example.com' });
    if (!existingCustomer) {
      const customerPassword = await bcrypt.hash('customer123', 10);
      await User.create({
        email: 'customer@example.com',
        password: customerPassword,
        name: 'Test Customer',
        role: 'customer'
      });
      console.log('✓ Test customer created (customer@example.com / customer123)');
    }
    
    console.log('\n✅ Import complete!');
    console.log('🎉 Products with full image support are now in MongoDB!\n');
    console.log('📋 Image Features:');
    console.log('   ✓ Full-size images for product details');
    console.log('   ✓ Thumbnail images for lists/grids');
    console.log('   ✓ Alt text for accessibility');
    console.log('   ✓ Primary image marking');
    console.log('   ✓ Support for multiple images per product\n');
    console.log('📋 Next Steps:');
    console.log('  1. Start backend: npm start');
    console.log('  2. Test API: curl http://localhost:3000/api/products');
    console.log('  3. Mobile app will automatically use thumbnails for lists');
    console.log('  4. Mobile app will use full images for detail views\n');
    
  } catch (error) {
    console.error('\n❌ Import error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Ensure MongoDB is running');
    console.error('  2. Check MONGODB_URI in .env');
    console.error('  3. Install dependencies: npm install mongoose bcrypt\n');
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

importProducts();
