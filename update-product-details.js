/**
 * Update Products with Detailed Information
 * Adds comprehensive product details for featured products
 */

const mongoose = require('mongoose');
require('dotenv').config();

const Product = require('./models/Product');

const productDetails = [
  {
    // Sea Moss + Aloe Soap
    slug: 'seamoss-aloe',
    name: 'Sea Moss + Aloe Soap',
    description: 'Hydrating Sensitive Skin - Enriched with natural sea moss and aloe vera for nourished, moisturized skin.',
    shortDescription: 'A gentle, mineral-rich soap crafted to cleanse, hydrate, and soothe the skin. Made with sea moss and aloe vera, this formula supports healthy-looking skin while maintaining moisture balance. Ideal for daily use and sensitive skin.',
    price: 12.00,
    category: 'Soap',
    fullDescription: 'Handcrafted in small batches, this soap is designed to support healthy, balanced skin while leaving it soft, calm, and refreshed. Formulated with organic oils and botanicals, Sea Moss + Aloe Soap creates a creamy, gentle lather that cleanses without stripping the skin\'s natural moisture. The fresh, clean aroma offers a calming aromatherapy experience, making it ideal for daily use.',
    benefits: [
      'Helps hydrate and soften dry, stressed skin',
      'Supports a smooth, healthy-looking complexion',
      'Gently cleanses while maintaining moisture balance',
      'Suitable for sensitive and problem-prone skin'
    ],
    aromatherapy: 'Light, clean, and refreshing — promotes a sense of calm and renewal during your daily skincare ritual.',
    bestFor: 'Normal, dry, sensitive, and combination skin types. Crafted with intention and care, this soap is perfect for those seeking a clean, natural approach to everyday skincare.',
    keyIngredients: [
      {
        name: 'Sea Moss',
        description: 'Rich in natural minerals that help nourish and support the skin barrier',
        icon: 'fas fa-water'
      },
      {
        name: 'Aloe Vera',
        description: 'Known to calm, hydrate, and soothe irritated or dry skin',
        icon: 'fas fa-leaf'
      },
      {
        name: 'Organic Oils',
        description: 'Gently cleanse without stripping natural moisture',
        icon: 'fas fa-seedling'
      }
    ],
    howToUse: [
      'Lather onto wet skin',
      'Massage gently and rinse thoroughly',
      'Follow with your favorite Sister\'s Promise lotion'
    ],
    ingredients: 'Sodium Olivate (Olive Oil), Sodium Cocoate (Coconut Oil), Vitis Vinifera (Grape) Seed Oil, Vitamin E: Tocopherol, Sea Moss (Chondrus Crispus), Aloe Barbadensis Leaf, Water (Aqua), Sodium Hydroxide†',
    ingredientNote: '†Sodium hydroxide is used in the soapmaking process and is not present in the finished product.',
    images: [
      {
        url: './assets/img/Product/featureProduct01.png',
        thumbnailUrl: './assets/img/Product/featureProduct01.png',
        alt: 'Sea Moss + Aloe Soap',
        isPrimary: true
      }
    ],
    stockQuantity: 50,
    isActive: true
  },
  {
    // Turmeric Ginger Latte Soap
    slug: 'turmeric-ginger',
    name: 'Turmeric Ginger Latte Soap',
    description: 'Anti-Inflammatory & Aromatic - Soothing bar with turmeric and ginger for a luxurious experience.',
    shortDescription: 'A warm, nourishing soap made with turmeric and ginger to gently cleanse, soften, and support radiant-looking skin.',
    price: 10.00,
    category: 'Soap',
    fullDescription: 'Warm, comforting, and deeply nourishing, Turmeric Ginger Latte Soap is crafted to gently cleanse while supporting brighter-looking, healthier skin. This handcrafted bar blends turmeric and ginger with rich plant oils to create a creamy, luxurious lather that leaves skin feeling soft, smooth, and refreshed. Known for their skin-loving properties, turmeric and ginger help support a more even-looking complexion while providing a naturally comforting aromatherapy experience. The warm, earthy scent makes this soap especially soothing as part of a daily self-care ritual.',
    benefits: [
      'Helps promote a brighter, more even-looking complexion',
      'Gently cleanses while maintaining moisture',
      'Leaves skin feeling soft, smooth, and renewed',
      'Ideal for daily use and full-body cleansing'
    ],
    aromatherapy: 'Warm and grounding with subtle spice notes — encourages relaxation and balance.',
    bestFor: 'Normal, dry, combination, and dull-looking skin. Crafted with intention using clean, plant-based ingredients, this soap transforms everyday cleansing into a spa-like experience.',
    keyIngredients: [
      {
        name: 'Turmeric',
        description: 'Known to help brighten and even skin tone naturally',
        icon: 'fas fa-mortar-pestle'
      },
      {
        name: 'Ginger',
        description: 'Supports circulation and provides antioxidant benefits',
        icon: 'fas fa-fire'
      },
      {
        name: 'Plant Oils',
        description: 'Rich, nourishing oils for soft, supple skin',
        icon: 'fas fa-seedling'
      }
    ],
    howToUse: [
      'Wet skin with warm water',
      'Lather soap between hands or directly on body',
      'Massage gently in circular motions',
      'Rinse thoroughly and pat dry'
    ],
    ingredients: 'Sodium Olivate (Olive Oil), Sodium Cocoate (Coconut Oil), Turmeric Root Powder, Ginger Root Extract, Shea Butter, Water (Aqua), Sodium Hydroxide†',
    ingredientNote: '†Sodium hydroxide is used in the soapmaking process and is not present in the finished product.',
    images: [
      {
        url: './assets/img/Product/featureProduct02.png',
        thumbnailUrl: './assets/img/Product/featureProduct02.png',
        alt: 'Turmeric Ginger Latte Soap',
        isPrimary: true
      }
    ],
    stockQuantity: 45,
    isActive: true
  },
  {
    // Bath Salts
    slug: 'bath-salts',
    name: 'Aromatherapy Bath Salts',
    description: 'Aromatherapy Blend - Luxurious bath salts with essential oils for a soothing spa experience at home.',
    shortDescription: 'Transform your bath into a spa sanctuary with mineral-rich salts and essential oils for deep relaxation.',
    price: 16.00,
    category: 'Bath & Body',
    fullDescription: 'Indulge in the ultimate self-care ritual with our Aromatherapy Bath Salts. Blended with mineral-rich Epsom and sea salts, this luxurious soak helps ease tension, soothe tired muscles, and calm the mind. Enhanced with therapeutic essential oils, each bath becomes a restorative spa experience in the comfort of your home.',
    benefits: [
      'Helps relax tired, sore muscles',
      'Supports detoxification and skin renewal',
      'Promotes deep relaxation and stress relief',
      'Leaves skin feeling soft and refreshed'
    ],
    aromatherapy: 'Calming blend of lavender, eucalyptus, and chamomile — creates a peaceful, meditative atmosphere.',
    bestFor: 'All skin types. Perfect for evening self-care rituals, post-workout recovery, or anytime you need to unwind and recharge.',
    keyIngredients: [
      {
        name: 'Epsom Salt',
        description: 'Rich in magnesium to help soothe muscles and reduce tension',
        icon: 'fas fa-gem'
      },
      {
        name: 'Sea Salt',
        description: 'Mineral-rich salt that supports skin detoxification',
        icon: 'fas fa-water'
      },
      {
        name: 'Essential Oils',
        description: 'Pure botanical oils for aromatherapy and skin nourishment',
        icon: 'fas fa-spa'
      }
    ],
    howToUse: [
      'Fill bathtub with warm water',
      'Add 1/2 to 1 cup of bath salts under running water',
      'Stir to dissolve and release aromatic oils',
      'Soak for 20-30 minutes',
      'Rinse with fresh water and pat dry'
    ],
    ingredients: 'Magnesium Sulfate (Epsom Salt), Sea Salt, Lavandula Angustifolia (Lavender) Oil, Eucalyptus Globulus Oil, Chamomilla Recutita (Chamomile) Oil, Dried Botanicals',
    ingredientNote: 'External use only. Avoid if allergic to any ingredients.',
    images: [
      {
        url: './assets/img/Product/featureProduct03.png',
        thumbnailUrl: './assets/img/Product/featureProduct03.png',
        alt: 'Aromatherapy Bath Salts',
        isPrimary: true
      }
    ],
    stockQuantity: 30,
    isActive: true
  }
];

async function updateProducts() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('✅ Connected to MongoDB\n');

    for (const productData of productDetails) {
      const { slug, ...data } = productData;
      
      console.log(`📦 Updating product: ${data.name}`);
      
      // Try to find by name first
      let product = await Product.findOne({ name: data.name });
      
      if (product) {
        // Update existing product
        Object.assign(product, data);
        await product.save();
        console.log(`   ✅ Updated existing product: ${product.name}`);
      } else {
        // Create new product
        product = new Product(data);
        await product.save();
        console.log(`   ✅ Created new product: ${product.name}`);
      }
      
      console.log(`   📝 Product ID: ${product._id}\n`);
    }

    console.log('✅ All products updated successfully!');
    console.log('\n📋 Next Steps:');
    console.log('  1. Restart the backend server: npm start');
    console.log('  2. Test product detail pages in browser');
    console.log('  3. Products are now accessible via:');
    console.log('     - /pages/product-detail.html?id=<product-id>');
    console.log('     - API: /api/products/<product-id>\n');

  } catch (error) {
    console.error('❌ Error updating products:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
  }
}

updateProducts();
