// Square Payment Integration Server for Sisters Promise
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { Client, Environment } = require('square');
const { v4: uuidv4 } = require('uuid');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Initialize Square Client
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
});

const catalogApi = client.catalogApi;
const paymentsApi = client.paymentsApi;

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Sisters Promise Square integration is running',
    environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
  });
});

/**
 * Get all products from Square Catalog
 * GET /api/products
 */
app.get('/api/products', async (req, res) => {
  try {
    if (!process.env.SQUARE_ACCESS_TOKEN) {
      return res.status(400).json({
        error: 'Missing SQUARE_ACCESS_TOKEN in environment configuration',
        message: 'Please set SQUARE_ACCESS_TOKEN in your .env file'
      });
    }

    const response = await catalogApi.listCatalog();
    
    // Filter for item objects only (products)
    const products = response.result.objects
      ?.filter(item => item.type === 'ITEM')
      .map(item => ({
        id: item.id,
        name: item.itemData?.name || 'Unnamed Product',
        description: item.itemData?.description || '',
        variations: item.itemData?.variations || [],
        imageUrl: item.itemData?.imageIds?.[0] || null,
        categoryId: item.itemData?.categoryId || null
      })) || [];

    res.json({ 
      success: true,
      count: products.length,
      products
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({
      error: 'Failed to fetch products from Square',
      details: error.message
    });
  }
});

/**
 * Get single product by ID
 * GET /api/products/:id
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    const response = await catalogApi.retrieveCatalogObject(req.params.id);
    const item = response.result.object;

    if (item.type !== 'ITEM') {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json({
      success: true,
      product: {
        id: item.id,
        name: item.itemData?.name || 'Unnamed Product',
        description: item.itemData?.description || '',
        variations: item.itemData?.variations || [],
        imageUrl: item.itemData?.imageIds?.[0] || null,
        categoryId: item.itemData?.categoryId || null
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({
      error: 'Failed to fetch product from Square',
      details: error.message
    });
  }
});

/**
 * Create a payment (for checkout processing)
 * POST /api/checkout
 */
app.post('/api/checkout', async (req, res) => {
  try {
    const { sourceId, amount, currency = 'USD', note = '' } = req.body;

    if (!sourceId || !amount) {
      return res.status(400).json({ 
        error: 'Missing required fields: sourceId and amount' 
      });
    }

    if (!process.env.SQUARE_LOCATION_ID) {
      return res.status(400).json({
        error: 'Missing SQUARE_LOCATION_ID in environment configuration'
      });
    }

    const response = await paymentsApi.createPayment({
      sourceId,
      amount,
      currency,
      note,
      idempotencyKey: uuidv4(),
      locationId: process.env.SQUARE_LOCATION_ID
    });

    res.json({
      success: true,
      payment: response.result.payment
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(400).json({
      error: 'Payment failed',
      details: error.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Sisters Promise Square integration server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
});

// Start server
app.listen(PORT, () => {
  console.log(`Sisters Promise API server running on http://localhost:${PORT}`);
  console.log('Etsy integration is active');
  if (!ETSY_API_KEY || !ETSY_SHOP_ID) {
    console.warn('⚠️  Warning: Etsy API credentials not configured. Please add ETSY_API_KEY and ETSY_SHOP_ID to .env file');
  }
});
