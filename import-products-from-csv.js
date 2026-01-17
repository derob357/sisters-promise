/**
 * Sisters Promise - CSV Product Importer
 * WITH FULL IMAGE SUPPORT (Full + Thumbnails)
 * 
 * HOW TO USE:
 * 1. Create/edit products.csv file
 * 2. Run: node import-products-from-csv.js
 * 
 * CSV FORMAT:
 * name,description,price,category,imageUrl,thumbnailUrl,alt,stockQuantity,etsyListingId
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const fs = require('fs');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sisters_promise';
const CSV_FILE = process.env.CSV_FILE || 'products.csv';

// MongoDB Schemas with Image Support
const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true },
  
  // Image support: Full + Thumbnails
  images: [{
    url: { type: String, required: true },
    thumbnailUrl: { type: String, required: true },
    alt: { type: String },
    isPrimary: { type: Boolean, default: false }
  }],
  
  // Legacy field
  imageUrl: { type: String },
  
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

// Parse CSV line (handles quotes and commas)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current);
  return result;
}

// Parse CSV with new image fields
function parseCSV(csvContent) {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file is empty or has no data rows');
  }
  
  const headers = lines[0].split(',').map(h => h.trim());
  const products = [];
  
  // Validate headers
  const requiredHeaders = ['name', 'price', 'imageUrl'];
  const hasImageSupport = headers.includes('thumbnailUrl');
  
  console.log(`CSV Headers: ${headers.join(', ')}`);
  console.log(`Image support: ${hasImageSupport ? 'Yes (Full + Thumbnails)' : 'No (Legacy mode)'}\n`);
  
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    if (values.length !== headers.length) {
      console.warn(`⚠️  Row ${i + 1} has incorrect number of columns, skipping`);
      continue;
    }
    
    const rowData = {};
    headers.forEach((header, index) => {
      let value = values[index].trim();
      
      // Convert price and stockQuantity to numbers
      if (header === 'price' || header === 'stockQuantity') {
        value = parseFloat(value) || 0;
      }
      
      rowData[header] = value;
    });
    
    // Validation
    if (!rowData.name || !rowData.price) {
      console.warn(`⚠️  Row ${i + 1} missing required fields (name, price), skipping`);
      continue;
    }
    
    // Build product object with image array
    const product = {
      name: rowData.name,
      description: rowData.description || rowData.name,
      price: rowData.price,
      category: rowData.category || 'other',
      stockQuantity: rowData.stockQuantity || 0,
      etsyListingId: rowData.etsyListingId || '',
      isActive: true
    };
    
    // Handle images
    if (rowData.imageUrl) {
      // Create images array
      const thumbnailUrl = rowData.thumbnailUrl || rowData.imageUrl.replace('il_fullxfull', 'il_340x270');
      const alt = rowData.alt || rowData.name;
      
      product.images = [{
        url: rowData.imageUrl,
        thumbnailUrl: thumbnailUrl,
        alt: alt,
        isPrimary: true
      }];
      
      // Legacy field
      product.imageUrl = rowData.imageUrl;
    }
    
    products.push(product);
  }
  
  return products;
}

// Create sample CSV if it doesn't exist
function createSampleCSV() {
  const sampleCSV = `name,description,price,category,imageUrl,thumbnailUrl,alt,stockQuantity,etsyListingId
Turmeric Ginger Latte Soap,"Handcrafted soap infused with organic turmeric and ginger. Anti-inflammatory properties.",10.00,soap,https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_fullxfull.2451554459_ij8l.jpg,https://i.etsystatic.com/20603018/r/il/f31683/2451554459/il_340x270.2451554459_ij8l.jpg,Turmeric Ginger Latte Soap - handmade natural soap,50,717857432
Organic Seamoss Aloe Soap,"Hydrating soap for sensitive skin. Rich in 92 essential minerals.",12.00,soap,https://i.etsystatic.com/20603018/r/il/e3c6b6/6662019347/il_fullxfull.6662019347_7309.jpg,https://i.etsystatic.com/20603018/r/il/e3c6b6/6662019347/il_340x270.6662019347_7309.jpg,Organic Seamoss Aloe Soap for sensitive skin,50,717898892
Pink Himalayan Sea Salt Soap,"Detoxifying soap with Pink Himalayan sea salt. 84 trace minerals.",10.00,soap,https://i.etsystatic.com/20603018/r/il/d7c5b3/2726892206/il_fullxfull.2726892206_7mzl.jpg,https://i.etsystatic.com/20603018/r/il/d7c5b3/2726892206/il_340x270.2726892206_7mzl.jpg,Pink Himalayan Sea Salt Soap - natural exfoliating soap,50,908416748
Seamoss Soap (24 Bars),"Bulk pack of 24 handmade sea moss soap bars. Great value.",240.00,soap,https://i.etsystatic.com/20603018/r/il/f2cc1c/6613929090/il_fullxfull.6613929090_c8ts.jpg,https://i.etsystatic.com/20603018/r/il/f2cc1c/6613929090/il_340x270.6613929090_c8ts.jpg,Seamoss Soap bulk pack - 24 bars,10,811138109
Bath Salt Soaks,"Luxurious bath salt blend for ultimate relaxation.",16.00,bath,https://i.etsystatic.com/20603018/r/il/0ba154/2305876750/il_fullxfull.2305876750_fn93.jpg,https://i.etsystatic.com/20603018/r/il/0ba154/2305876750/il_340x270.2305876750_fn93.jpg,Bath Salt Soaks - relaxing bath salts,50,793802160`;
  
  fs.writeFileSync('products.csv', sampleCSV);
  console.log('✅ Created sample products.csv file');
  console.log('   Includes: Full image URLs + Thumbnail URLs\n');
}

async function importFromCSV() {
  console.log('🚀 Sisters Promise - CSV Product Importer\n');
  
  try {
    // Check if CSV file exists
    if (!fs.existsSync(CSV_FILE)) {
      console.log('📝 CSV file not found. Creating sample file...\n');
      createSampleCSV();
      console.log('📋 Next steps:');
      console.log('  1. Open products.csv');
      console.log('  2. Update with your products');
      console.log('  3. Include imageUrl AND thumbnailUrl columns');
      console.log('  4. Run: node import-products-from-csv.js\n');
      process.exit(0);
    }
    
    // Read and parse CSV
    console.log(`📂 Reading ${CSV_FILE}...`);
    const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
    const products = parseCSV(csvContent);
    
    if (products.length === 0) {
      console.error('❌ No valid products found in CSV file');
      process.exit(1);
    }
    
    console.log(`✓ Parsed ${products.length} products from CSV\n`);
    
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ MongoDB connected\n');
    
    // Clear existing products
    console.log('🗑️  Clearing existing products...');
    const deletedCount = await Product.deleteMany({});
    console.log(`✓ Removed ${deletedCount.deletedCount} old products\n`);
    
    // Insert new products
    console.log('📦 Importing products with image support...\n');
    const insertedProducts = await Product.insertMany(products);
    
    console.log('✅ Products imported successfully!\n');
    console.log('🛍️  Product Catalog:');
    console.log('═'.repeat(90));
    
    insertedProducts.forEach((product, index) => {
      console.log(`\n${index + 1}. ${product.name} - $${product.price.toFixed(2)}`);
      console.log(`   Category: ${product.category} | Stock: ${product.stockQuantity}`);
      console.log(`   Images: ${product.images.length}`);
      product.images.forEach((img, i) => {
        console.log(`     ${i + 1}. ${img.isPrimary ? '⭐' : '  '} Full: ${img.url.substring(0, 55)}...`);
        console.log(`        Thumb: ${img.thumbnailUrl.substring(0, 55)}...`);
      });
      if (product.etsyListingId) {
        console.log(`   🔗 Etsy: https://www.etsy.com/listing/${product.etsyListingId}`);
      }
    });
    
    // Statistics
    const categories = {};
    insertedProducts.forEach(p => {
      categories[p.category] = (categories[p.category] || 0) + 1;
    });
    
    console.log('\n' + '═'.repeat(90));
    console.log('📈 Summary:');
    console.log(`   Products: ${insertedProducts.length}`);
    console.log(`   Categories: ${Object.keys(categories).join(', ')}`);
    
    const prices = insertedProducts.map(p => p.price);
    const avgPrice = prices.reduce((a, b) => a + b, 0) / prices.length;
    console.log(`   Price Range: $${Math.min(...prices).toFixed(2)} - $${Math.max(...prices).toFixed(2)}`);
    console.log(`   Average Price: $${avgPrice.toFixed(2)}`);
    
    const totalValue = insertedProducts.reduce((sum, p) => sum + (p.price * p.stockQuantity), 0);
    console.log(`   Total Inventory Value: $${totalValue.toFixed(2)}`);
    
    // Setup admin user
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
      console.log('✓ Admin user already exists');
    }
    
    console.log('\n✅ CSV import complete!');
    console.log('🎉 Products with image support are now in MongoDB!\n');
    console.log('📋 Image Features:');
    console.log('   ✓ Full-size images for detail pages');
    console.log('   ✓ Thumbnail images for fast product lists');
    console.log('   ✓ Alt text for accessibility\n');
    console.log('📋 Next steps:');
    console.log('  1. Start backend: npm start');
    console.log('  2. Test API: curl http://localhost:3000/api/products');
    console.log('  3. Run mobile app: npm run android\n');
    
  } catch (error) {
    console.error('\n❌ Import error:', error.message);
    console.error('\n🔧 Troubleshooting:');
    console.error('  1. Check CSV file format');
    console.error('  2. Ensure MongoDB is running');
    console.error('  3. Verify MONGODB_URI in .env');
    console.error('  4. Check column headers match expected format\n');
    process.exit(1);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.connection.close();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the import
importFromCSV();
