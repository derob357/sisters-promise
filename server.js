// Square Payment Integration Server for Sisters Promise
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { Client, Environment } = require('square');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');

dotenv.config();

const app = express();

// Security Middleware - Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://recaptcha.net', 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/'],
      frameSrc: ['https://recaptcha.net', 'https://www.google.com/recaptcha/'],
      styleSrc: ["'self'", "'unsafe-inline'"],
    },
  },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
}));

// Rate limiting - protect against brute force attacks
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip || req.connection.remoteAddress,
});

const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // max 5 contact form submissions per hour
  message: 'Too many contact form submissions, please try again later.',
  skipSuccessfulRequests: false,
});

const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // max 10 checkout attempts per minute
  message: 'Too many checkout attempts, please try again later.',
});

app.use(generalLimiter);

// CORS configuration - restrict origins
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-Requested-With'],
  maxAge: 3600,
};

app.use(cors(corsOptions));

// Body parser middleware with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ limit: '10kb', extended: true }));

// Data sanitization - prevent NoSQL injection and XSS
app.use(mongoSanitize({
  replaceWith: '_',
  onSanitize: ({ req, key }) => {
    console.warn(`Sanitized ${key} in request body`);
  },
}));

// Custom middleware to sanitize and validate input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>\"']/g, '')
    .slice(0, 500); // Limit length
};

// Serve static files with cache busting
app.use(express.static('./', {
  maxAge: '1h',
  etag: false,
}));

// Initialize Square Client
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT === 'production' ? Environment.Production : Environment.Sandbox,
});

const catalogApi = client.catalogApi;
const paymentsApi = client.paymentsApi;

// Error handling middleware
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    Error.captureStackTrace(this, this.constructor);
  }
}

const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Health check endpoint
app.get('/api/health', generalLimiter, (req, res) => {
  try {
    res.json({ 
      status: 'ok', 
      message: 'Sisters Promise API is running',
      timestamp: new Date().toISOString(),
      environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Health check failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
    });
  }
});

/**
 * Get all products from Square Catalog
 * GET /api/products
 */
app.get('/api/products', asyncHandler(async (req, res) => {
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    return res.status(500).json({
      error: 'Configuration Error',
      message: 'Square API not properly configured'
    });
  }

  try {
    const response = await catalogApi.listCatalog();
    
    if (!response.result?.objects) {
      return res.json({ 
        success: true,
        count: 0,
        products: []
      });
    }

    // Filter and sanitize products
    const products = response.result.objects
      .filter(item => item.type === 'ITEM' && item.itemData)
      .map(item => ({
        id: sanitizeInput(item.id),
        name: sanitizeInput(item.itemData?.name || 'Unnamed Product'),
        description: sanitizeInput(item.itemData?.description || ''),
        variations: item.itemData?.variations || [],
        imageUrl: item.itemData?.imageIds?.[0] || null,
        categoryId: item.itemData?.categoryId || null
      }))
      .slice(0, 100); // Limit to 100 products

    res.json({ 
      success: true,
      count: products.length,
      products,
      cached: false,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({
      error: 'Failed to fetch products',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * Get single product by ID
 * GET /api/products/:id
 */
app.get('/api/products/:id', asyncHandler(async (req, res) => {
  const productId = sanitizeInput(req.params.id);
  
  if (!productId || productId.length < 5) {
    return res.status(400).json({ 
      error: 'Invalid product ID format' 
    });
  }

  try {
    const response = await catalogApi.retrieveCatalogObject(productId);
    const item = response.result?.object;

    if (!item || item.type !== 'ITEM') {
      return res.status(404).json({ 
        error: 'Product not found' 
      });
    }

    res.json({
      success: true,
      product: {
        id: sanitizeInput(item.id),
        name: sanitizeInput(item.itemData?.name || 'Unnamed Product'),
        description: sanitizeInput(item.itemData?.description || ''),
        variations: item.itemData?.variations || [],
        imageUrl: item.itemData?.imageIds?.[0] || null,
        categoryId: item.itemData?.categoryId || null
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error.message);
    res.status(500).json({
      error: 'Failed to fetch product',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

/**
 * Create a payment (for checkout processing)
 * POST /api/checkout
 */
app.post('/api/checkout', checkoutLimiter, asyncHandler(async (req, res) => {
  const { sourceId, amount, currency = 'USD', note = '' } = req.body;

  // Input validation
  if (!sourceId || typeof sourceId !== 'string' || sourceId.length < 5) {
    return res.status(400).json({ 
      error: 'Invalid source ID' 
    });
  }

  if (!amount || typeof amount !== 'number' || amount < 1 || amount > 999999) {
    return res.status(400).json({ 
      error: 'Invalid amount. Must be between 1 and 999999 cents.' 
    });
  }

  if (!process.env.SQUARE_LOCATION_ID) {
    return res.status(500).json({
      error: 'Configuration Error',
      message: 'Location not configured'
    });
  }

  try {
    const sanitizedNote = sanitizeInput(note);
    
    const response = await paymentsApi.createPayment({
      sourceId: sanitizeInput(sourceId),
      amountMoney: {
        amount: Math.floor(amount),
        currency: sanitizeInput(currency)
      },
      note: sanitizedNote,
      idempotencyKey: uuidv4(),
      locationId: sanitizeInput(process.env.SQUARE_LOCATION_ID)
    });

    if (response.result?.payment) {
      res.json({
        success: true,
        payment: {
          id: response.result.payment.id,
          status: response.result.payment.status,
          amount: response.result.payment.amountMoney?.amount,
          currency: response.result.payment.amountMoney?.currency,
          timestamp: new Date().toISOString()
        }
      });
    }
  } catch (error) {
    console.error('Payment error:', error.message);
    res.status(400).json({
      error: 'Payment processing failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Unable to process payment'
    });
  }
}));

/**
 * Contact Form Submission with reCAPTCHA
 * POST /api/contact
 */
app.post('/api/contact', contactLimiter, asyncHandler(async (req, res) => {
  const { name, email, message, recaptchaToken } = req.body;

  // Validate reCAPTCHA token
  if (!recaptchaToken) {
    return res.status(400).json({ 
      error: 'reCAPTCHA verification required' 
    });
  }

  // Input validation
  if (!name || typeof name !== 'string' || name.length < 2 || name.length > 100) {
    return res.status(400).json({ 
      error: 'Invalid name. Must be between 2 and 100 characters.' 
    });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email) || email.length > 100) {
    return res.status(400).json({ 
      error: 'Invalid email address' 
    });
  }

  if (!message || typeof message !== 'string' || message.length < 10 || message.length > 1000) {
    return res.status(400).json({ 
      error: 'Invalid message. Must be between 10 and 1000 characters.' 
    });
  }

  try {
    // Verify reCAPTCHA token with Google
    const recaptchaResponse = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      null,
      {
        params: {
          secret: process.env.RECAPTCHA_SECRET_KEY,
          response: recaptchaToken,
        },
      }
    );

    if (!recaptchaResponse.data.success || recaptchaResponse.data.score < 0.5) {
      return res.status(400).json({ 
        error: 'reCAPTCHA verification failed. Please try again.' 
      });
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      message: sanitizeInput(message),
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Here you would typically save to database or send email
    console.log('Contact form submission:', sanitizedData);

    // TODO: Implement email sending via nodemailer or similar
    // For now, just confirm receipt
    res.status(200).json({
      success: true,
      message: 'Your message has been received. We will contact you soon!',
      reference: uuidv4(),
    });
  } catch (error) {
    console.error('Contact form error:', error.message);
    res.status(500).json({
      error: 'Failed to process contact form',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
}));

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    path: req.originalUrl,
    method: req.method,
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const isDevelopment = process.env.NODE_ENV === 'development';

  console.error(`[${new Date().toISOString()}] Error:`, err);

  res.status(statusCode).json({
    error: err.message || 'Internal Server Error',
    ...(isDevelopment && { stack: err.stack }),
    timestamp: new Date().toISOString(),
  });
});

// Start server
const PORT = process.env.PORT || 3000;

// Graceful shutdown
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

app.listen(PORT, () => {
  console.log(`\n✓ Sisters Promise API server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
  console.log(`✓ Security: Helmet enabled, Rate limiting active, Input sanitization enabled`);
  console.log(`✓ Max payload size: 10KB`);
  
  if (!process.env.SQUARE_ACCESS_TOKEN) {
    console.warn('\n⚠️  Warning: SQUARE_ACCESS_TOKEN not configured');
  }
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️  Warning: RECAPTCHA_SECRET_KEY not configured for contact form');
  }
  console.log('\n');
