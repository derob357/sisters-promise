// Etsy API Integration Server for Sisters Promise
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('./'));

// Etsy API configuration
const ETSY_API_KEY = process.env.ETSY_API_KEY;
const ETSY_SHOP_ID = process.env.ETSY_SHOP_ID;
const ETSY_API_BASE = 'https://openapi.etsy.com/v3/application';

/**
 * Fetch products from Etsy shop
 * GET /api/products
 */
app.get('/api/products', async (req, res) => {
  try {
    if (!ETSY_API_KEY || !ETSY_SHOP_ID) {
      return res.status(400).json({ 
        error: 'Etsy API credentials not configured. Please set ETSY_API_KEY and ETSY_SHOP_ID in .env file'
      });
    }

    const url = `${ETSY_API_BASE}/shops/${ETSY_SHOP_ID}/listings/active?limit=100`;
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': ETSY_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Etsy API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Transform Etsy data to our format
    const products = data.results.map(listing => ({
      id: listing.listing_id,
      title: listing.title,
      description: listing.description,
      price: listing.price.amount / 100, // Convert from cents
      currency: listing.price.currency_code,
      url: `https://www.etsy.com/listing/${listing.listing_id}`,
      images: listing.url_images || [],
      tags: listing.tags || []
    }));

    res.json({
      success: true,
      count: products.length,
      products: products
    });

  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch products from Etsy',
      details: error.message
    });
  }
});

/**
 * Get single product details
 * GET /api/products/:id
 */
app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;

    if (!ETSY_API_KEY) {
      return res.status(400).json({ error: 'Etsy API key not configured' });
    }

    const url = `${ETSY_API_BASE}/listings/${id}`;
    
    const response = await fetch(url, {
      headers: {
        'x-api-key': ETSY_API_KEY,
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Etsy API error: ${response.status}`);
    }

    const listing = await response.json();
    
    const product = {
      id: listing.listing_id,
      title: listing.title,
      description: listing.description,
      price: listing.price.amount / 100,
      currency: listing.price.currency_code,
      url: `https://www.etsy.com/listing/${listing.listing_id}`,
      images: listing.url_images || [],
      tags: listing.tags || []
    };

    res.json({
      success: true,
      product: product
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ 
      error: 'Failed to fetch product from Etsy',
      details: error.message
    });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Sisters Promise API is running' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Sisters Promise API server running on http://localhost:${PORT}`);
  console.log('Etsy integration is active');
  if (!ETSY_API_KEY || !ETSY_SHOP_ID) {
    console.warn('⚠️  Warning: Etsy API credentials not configured. Please add ETSY_API_KEY and ETSY_SHOP_ID to .env file');
  }
});
