// Square Payment Integration Server for Sisters Promise
const express = require('express');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const { Client, Environment } = require('square');
const { v4: uuidv4 } = require('uuid');
const axios = require('axios');
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const EmailSubscriber = require('./models/EmailSubscriber');
const EmailService = require('./services/EmailService');
const { connectDB, isConnected } = require('./config/database');
const UserService = require('./services/UserService');
const AnalyticsService = require('./services/AnalyticsService');
const { authenticate, adminOrOwner, ownerOnly } = require('./middleware/auth');

dotenv.config();

const app = express();

// Initialize database connection
connectDB().catch(err => {
  console.warn('MongoDB connection failed, using file-based storage as fallback');
});

// Initialize default users (owner and admin)
UserService.initializeDefaultUsers().catch(err => {
  console.warn('Could not initialize default users:', err.message);
});

// Initialize email services
const emailSubscriber = new EmailSubscriber(isConnected());
const emailService = new EmailService();

// Security Middleware - Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://recaptcha.net', 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/', 'https://cdn.jsdelivr.net'],
      frameSrc: ['https://recaptcha.net', 'https://www.google.com/recaptcha/'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'https://cdn.jsdelivr.net', 'https://googletagmanager.com', 'https://www.googletagmanager.com'],
    },
  },
  // HSTS - Force HTTPS for 1 year
  hsts: { 
    maxAge: 31536000, // 1 year in seconds
    includeSubDomains: true, 
    preload: true,
  },
  frameguard: { action: 'deny' },
  noSniff: true,
  xssFilter: true,
  // Enforce HTTPS
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
}));

// Additional security headers for HTTPS
app.use((req, res, next) => {
  // Enforce HTTPS
  if (process.env.NODE_ENV === 'production' && req.protocol !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
  }
  
  // Additional security headers
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  next();
});

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

// reCAPTCHA Enterprise Assessment Function
async function createRecaptchaAssessment(token, recaptchaAction = 'submit') {
  try {
    const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID;
    const recaptchaKey = process.env.RECAPTCHA_ENTERPRISE_KEY;

    if (!projectID || !recaptchaKey) {
      console.error('Missing reCAPTCHA Enterprise configuration');
      return null;
    }

    const client = new RecaptchaEnterpriseServiceClient();
    const projectPath = client.projectPath(projectID);

    const request = {
      assessment: {
        event: {
          token: token,
          siteKey: recaptchaKey,
        },
      },
      parent: projectPath,
    };

    const [response] = await client.createAssessment(request);

    // Check if the token is valid
    if (!response.tokenProperties.valid) {
      console.log(`reCAPTCHA token invalid: ${response.tokenProperties.invalidReason}`);
      return null;
    }

    // Check if the expected action was executed
    if (response.tokenProperties.action === recaptchaAction) {
      const score = response.riskAnalysis.score;
      console.log(`reCAPTCHA risk score: ${score}`);
      
      if (response.riskAnalysis.reasons) {
        response.riskAnalysis.reasons.forEach((reason) => {
          console.log(`  Reason: ${reason}`);
        });
      }
      
      return score;
    } else {
      console.log(`Action mismatch: expected ${recaptchaAction}, got ${response.tokenProperties.action}`);
      return null;
    }
  } catch (error) {
    console.error('reCAPTCHA assessment error:', error.message);
    return null;
  }
}

// Interpret reCAPTCHA Enterprise Score
function interpretRecaptchaScore(score) {
  if (score >= 0.9) return { level: 'VERY_LOW_RISK', action: 'allow', description: 'Definitely legitimate' };
  if (score >= 0.7) return { level: 'LOW_RISK', action: 'allow', description: 'Likely legitimate' };
  if (score >= 0.5) return { level: 'MEDIUM_RISK', action: 'allow', description: 'May be suspicious' };
  if (score >= 0.3) return { level: 'HIGH_RISK', action: 'review', description: 'Likely suspicious' };
  return { level: 'VERY_HIGH_RISK', action: 'block', description: 'Definitely suspicious' };
}

// Annotate reCAPTCHA Assessment (send feedback)
async function annotateRecaptchaAssessment(assessmentName, annotation) {
  try {
    const client = new RecaptchaEnterpriseServiceClient();
    
    const request = {
      name: assessmentName,
      annotation: annotation, // 'LEGITIMATE', 'FRAUDULENT', 'MALICIOUS_LOGIN', 'UNWANTED_SIGNUP'
    };

    await client.annotateAssessment(request);
    console.log(`Assessment ${assessmentName} annotated as ${annotation}`);
    return true;
  } catch (error) {
    console.error('Failed to annotate assessment:', error.message);
    return false;
  }
}

// Custom middleware to sanitize and validate input
const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>\"']/g, '')
    .slice(0, 500); // Limit length
};

// Serve static files - images, CSS, JavaScript, etc.
app.use(express.static(__dirname, {
  maxAge: '1h',
  etag: false,
}));

// Route handlers for HTML pages
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

app.get('/pages/contact', (req, res) => {
  res.sendFile(__dirname + '/pages/contact.html');
});

app.get('/pages/shop', (req, res) => {
  res.sendFile(__dirname + '/pages/shop.html');
});

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

// ============================================================================
// EMAIL MARKETING AND SUBSCRIBER MANAGEMENT ENDPOINTS
// ============================================================================

/**
 * Subscribe to newsletter
 * POST /api/email/subscribe
 */
app.post('/api/email/subscribe', contactLimiter, asyncHandler(async (req, res) => {
  try {
    const { email, firstName = '', lastName = '', preferences = {}, recaptchaToken } = req.body;

    // Validate input
    if (!email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email is required'
      });
    }

    // reCAPTCHA verification
    if (recaptchaToken) {
      const riskScore = await createRecaptchaAssessment(recaptchaToken, 'subscribe');
      const riskLevel = interpretRecaptchaScore(riskScore);
      
      if (riskLevel.action === 'block') {
        return res.status(403).json({
          error: 'Subscription Failed',
          message: 'Unable to process subscription at this time',
          riskLevel: riskLevel.level
        });
      }
    }

    // Add subscriber
    const subscriber = emailSubscriber.addSubscriber({
      email: sanitizeInput(email),
      firstName: sanitizeInput(firstName),
      lastName: sanitizeInput(lastName),
      preferences,
      source: 'website'
    });

    // Send welcome email
    await emailService.sendWelcomeEmail(subscriber);

    res.status(201).json({
      success: true,
      message: 'Successfully subscribed! Check your email for a welcome message.',
      subscriberId: subscriber.id,
      email: subscriber.email
    });

  } catch (error) {
    console.error('Subscription error:', error.message);
    
    if (error.message.includes('already subscribed')) {
      return res.status(409).json({
        error: 'Already Subscribed',
        message: 'This email is already subscribed to our newsletter'
      });
    }

    res.status(400).json({
      error: 'Subscription Failed',
      message: error.message || 'Unable to process subscription'
    });
  }
}));

/**
 * Update subscriber preferences
 * POST /api/email/update/:email
 */
app.post('/api/email/update/:email', asyncHandler(async (req, res) => {
  try {
    const { email } = req.params;
    const { preferences } = req.body;

    if (!preferences) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Preferences are required'
      });
    }

    const subscriber = emailSubscriber.updateSubscriber(email, { preferences });

    res.json({
      success: true,
      message: 'Preferences updated successfully',
      subscriber: {
        email: subscriber.email,
        preferences: subscriber.preferences
      }
    });

  } catch (error) {
    console.error('Update preferences error:', error.message);
    res.status(400).json({
      error: 'Update Failed',
      message: error.message || 'Unable to update preferences'
    });
  }
}));

/**
 * Unsubscribe from newsletter
 * GET /api/email/unsubscribe/:token
 */
app.get('/api/email/unsubscribe/:token', asyncHandler(async (req, res) => {
  try {
    const { token } = req.params;

    emailSubscriber.unsubscribeByToken(token);

    // Return an HTML page confirming unsubscription
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Unsubscribed - Sisters Promise</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 { color: #333; }
          p { color: #666; line-height: 1.6; }
          a { color: #667eea; text-decoration: none; font-weight: 600; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Unsubscribed</h1>
          <p>You have been successfully unsubscribed from Sisters Promise emails.</p>
          <p>We're sorry to see you go! If you change your mind, you can always resubscribe on our <a href="/">website</a>.</p>
        </div>
      </body>
      </html>
    `);

  } catch (error) {
    console.error('Unsubscribe error:', error.message);
    res.status(400).send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Error - Sisters Promise</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            margin: 0;
          }
          .container {
            background: white;
            padding: 40px;
            border-radius: 8px;
            text-align: center;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
          }
          h1 { color: #e74c3c; }
          p { color: #666; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>⚠️ Error</h1>
          <p>Unable to process your request. The unsubscribe link may be invalid or expired.</p>
        </div>
      </body>
      </html>
    `);
  }
}));

/**
 * Get subscriber info
 * GET /api/email/subscriber/:email
 */
app.get('/api/email/subscriber/:email', asyncHandler(async (req, res) => {
  try {
    const { email } = req.params;
    const subscriber = emailSubscriber.getSubscriber(email);

    if (!subscriber) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Subscriber not found'
      });
    }

    res.json({
      success: true,
      subscriber: {
        id: subscriber.id,
        email: subscriber.email,
        firstName: subscriber.firstName,
        lastName: subscriber.lastName,
        status: subscriber.status,
        preferences: subscriber.preferences,
        subscriptionDate: subscriber.subscriptionDate,
        lastUpdated: subscriber.lastUpdated
      }
    });

  } catch (error) {
    console.error('Get subscriber error:', error.message);
    res.status(500).json({
      error: 'Server Error',
      message: 'Unable to retrieve subscriber information'
    });
  }
}));

/**
 * Get email statistics
 * GET /api/email/stats
 */
app.get('/api/email/stats', asyncHandler(async (req, res) => {
  try {
    const subscriberStats = emailSubscriber.getStats();
    const campaignStats = emailSubscriber.getCampaignsStats();

    res.json({
      success: true,
      subscribers: subscriberStats,
      campaigns: campaignStats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Get stats error:', error.message);
    res.status(500).json({
      error: 'Server Error',
      message: 'Unable to retrieve statistics'
    });
  }
}));

/**
 * Send test email
 * POST /api/email/test
 */
app.post('/api/email/test', asyncHandler(async (req, res) => {
  try {
    const { email, templateId = 'welcome' } = req.body;

    if (!email) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email is required'
      });
    }

    const testSubscriber = {
      email: sanitizeInput(email),
      firstName: 'Test',
      lastName: 'User',
      unsubscribeToken: 'test-token'
    };

    const success = await emailService.sendCustomEmail(testSubscriber, {
      template: templateId,
      subject: `Test Email - ${templateId}`,
      fallbackText: 'This is a test email',
      variables: { firstName: 'Test User' }
    });

    if (!success) {
      return res.status(500).json({
        error: 'Send Failed',
        message: 'Unable to send test email. Check email configuration.'
      });
    }

    res.json({
      success: true,
      message: `Test email sent to ${email}`,
      template: templateId
    });

  } catch (error) {
    console.error('Test email error:', error.message);
    res.status(500).json({
      error: 'Test Failed',
      message: error.message || 'Unable to send test email'
    });
  }
}));

/**
 * Export subscribers as CSV (admin only - add authentication in production)
 * GET /api/email/export
 */
app.get('/api/email/export', asyncHandler(async (req, res) => {
  try {
    const csv = emailSubscriber.exportAsCSV();
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=subscribers.csv');
    res.send(csv);

  } catch (error) {
    console.error('Export error:', error.message);
    res.status(500).json({
      error: 'Export Failed',
      message: 'Unable to export subscribers'
    });
  }
}));

/**
 * Create marketing campaign
 * POST /api/admin/campaigns
 */
app.post('/api/admin/campaigns', asyncHandler(async (req, res) => {
  try {
    const { name, subject, templateId, type = 'newsletter', scheduleTime } = req.body;

    if (!name || !subject || !templateId) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'name, subject, and templateId are required'
      });
    }

    const campaign = emailSubscriber.createCampaign({
      name: sanitizeInput(name),
      subject: sanitizeInput(subject),
      templateId: sanitizeInput(templateId),
      type,
      scheduleTime
    });

    res.status(201).json({
      success: true,
      message: 'Campaign created successfully',
      campaign
    });

  } catch (error) {
    console.error('Create campaign error:', error.message);
    res.status(400).json({
      error: 'Creation Failed',
      message: error.message || 'Unable to create campaign'
    });
  }
}));

/**
 * Get campaign by ID
 * GET /api/admin/campaigns/:campaignId
 */
app.get('/api/admin/campaigns/:campaignId', asyncHandler(async (req, res) => {
  try {
    const { campaignId } = req.params;
    const campaign = emailSubscriber.getCampaign(campaignId);

    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    res.json({
      success: true,
      campaign
    });

  } catch (error) {
    console.error('Get campaign error:', error.message);
    res.status(500).json({
      error: 'Server Error',
      message: 'Unable to retrieve campaign'
    });
  }
}));

/**
 * Send campaign to subscribers
 * POST /api/admin/campaigns/:campaignId/send
 */
app.post('/api/admin/campaigns/:campaignId/send', asyncHandler(async (req, res) => {
  try {
    const { campaignId } = req.params;
    const { filterType = 'all' } = req.body;

    const campaign = emailSubscriber.getCampaign(campaignId);
    if (!campaign) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Campaign not found'
      });
    }

    // Get subscribers based on filter
    let subscribers = [];
    if (filterType === 'all') {
      subscribers = emailSubscriber.getAllActiveSubscribers();
    } else {
      subscribers = emailSubscriber.getActiveSubscribers(filterType);
    }

    if (subscribers.length === 0) {
      return res.status(400).json({
        error: 'No Recipients',
        message: 'No active subscribers found for this campaign'
      });
    }

    // Send campaign
    const result = await emailService.sendNewsletter(campaign, subscribers);

    // Update campaign
    emailSubscriber.updateCampaignStatus(campaignId, 'sent');
    const updatedCampaign = emailSubscriber.getCampaign(campaignId);
    updatedCampaign.recipientCount = subscribers.length;

    res.json({
      success: true,
      message: `Campaign sent to ${result.success} subscribers`,
      campaign: updatedCampaign,
      details: {
        successful: result.success,
        failed: result.failed,
        total: subscribers.length
      }
    });

  } catch (error) {
    console.error('Send campaign error:', error.message);
    res.status(500).json({
      error: 'Send Failed',
      message: error.message || 'Unable to send campaign'
    });
  }
}));

/**
 * Send promotional email
 * POST /api/admin/promotions/send
 */
app.post('/api/admin/promotions/send', asyncHandler(async (req, res) => {
  try {
    const { title, description, code, link, emails = null } = req.body;

    if (!title || !description) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'title and description are required'
      });
    }

    const promotion = {
      title: sanitizeInput(title),
      description: sanitizeInput(description),
      code: sanitizeInput(code || ''),
      link: link || null
    };

    // Send to specific emails or all subscribers interested in promotions
    let subscribers = emails 
      ? emails.map(email => emailSubscriber.getSubscriber(email)).filter(Boolean)
      : emailSubscriber.getActiveSubscribers('promotions');

    if (subscribers.length === 0) {
      return res.status(400).json({
        error: 'No Recipients',
        message: 'No subscribers found for this promotion'
      });
    }

    let successCount = 0;
    let failedCount = 0;

    for (const subscriber of subscribers) {
      const sent = await emailService.sendPromotion(subscriber, promotion);
      if (sent) {
        successCount++;
      } else {
        failedCount++;
      }
    }

    res.json({
      success: true,
      message: `Promotion sent to ${successCount} subscribers`,
      details: {
        successful: successCount,
        failed: failedCount,
        total: subscribers.length
      }
    });

  } catch (error) {
    console.error('Send promotion error:', error.message);
    res.status(500).json({
      error: 'Send Failed',
      message: error.message || 'Unable to send promotion'
    });
  }
}));

/**
 * Send order confirmation email
 * POST /api/email/order-confirmation
 */
app.post('/api/email/order-confirmation', asyncHandler(async (req, res) => {
  try {
    const { email, order } = req.body;

    if (!email || !order) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'email and order are required'
      });
    }

    const subscriber = emailSubscriber.getSubscriber(email);
    if (!subscriber) {
      return res.status(404).json({
        error: 'Subscriber Not Found',
        message: 'Email not found in subscriber list'
      });
    }

    const sent = await emailService.sendOrderConfirmation(subscriber, order);

    if (!sent) {
      return res.status(500).json({
        error: 'Send Failed',
        message: 'Unable to send order confirmation email'
      });
    }

    res.json({
      success: true,
      message: 'Order confirmation email sent',
      email
    });

  } catch (error) {
    console.error('Order confirmation error:', error.message);
    res.status(500).json({
      error: 'Error',
      message: error.message || 'Unable to send order confirmation'
    });
  }
}));

/**
 * Send abandoned cart reminder
 * POST /api/email/abandoned-cart
 */
app.post('/api/email/abandoned-cart', asyncHandler(async (req, res) => {
  try {
    const { email, cartItems } = req.body;

    if (!email || !cartItems || cartItems.length === 0) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'email and cartItems are required'
      });
    }

    const subscriber = emailSubscriber.getSubscriber(email);
    if (!subscriber) {
      return res.status(404).json({
        error: 'Subscriber Not Found',
        message: 'Email not found in subscriber list'
      });
    }

    const sent = await emailService.sendAbandonedCartReminder(subscriber, cartItems);

    if (!sent) {
      return res.status(500).json({
        error: 'Send Failed',
        message: 'Unable to send abandoned cart reminder'
      });
    }

    res.json({
      success: true,
      message: 'Abandoned cart reminder email sent',
      email
    });

  } catch (error) {
    console.error('Abandoned cart error:', error.message);
    res.status(500).json({
      error: 'Error',
      message: error.message || 'Unable to send abandoned cart reminder'
    });
  }
}));

// ============================================================================
// END EMAIL MARKETING ENDPOINTS
// ============================================================================

/**
 * Contact Form Submission with reCAPTCHA Enterprise
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
    // Verify reCAPTCHA token with Google Cloud reCAPTCHA Enterprise
    const score = await createRecaptchaAssessment(recaptchaToken, 'submit');

    // Check if score is valid and above threshold (0.5)
    if (score === null || score < 0.5) {
      return res.status(400).json({ 
        error: 'reCAPTCHA verification failed. Please try again.' 
      });
    }

    // Interpret the score
    const riskAssessment = interpretRecaptchaScore(score);
    console.log(`reCAPTCHA Risk Level: ${riskAssessment.level} - ${riskAssessment.description}`);

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeInput(name),
      email: sanitizeInput(email),
      message: sanitizeInput(message),
      riskScore: score,
      riskLevel: riskAssessment.level,
      timestamp: new Date().toISOString(),
      ip: req.ip || req.connection.remoteAddress,
    };

    // Here you would typically save to database or send email
    console.log('Contact form submission:', sanitizedData);

    // TODO: Implement email sending via nodemailer or similar
    // TODO: For production, store assessment ID and annotate later based on user behavior
    
    // For now, just confirm receipt
    res.status(200).json({
      success: true,
      message: 'Your message has been received. We will contact you soon!',
      reference: uuidv4(),
      riskLevel: riskAssessment.level,
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

// ==================== USER MANAGEMENT ENDPOINTS ====================

/**
 * POST /api/auth/register
 * Register a new standard user account
 */
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, firstName, lastName, password, confirmPassword } = req.body;

    if (!email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'Passwords do not match',
      });
    }

    const user = await UserService.createUser(email, firstName, lastName, password, 'standard');

    const { generateToken } = require('./middleware/auth');
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user,
    });
  } catch (error) {
    console.error('Registration error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    const result = await UserService.authenticateUser(email, password);

    res.json({
      success: true,
      message: 'Login successful',
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(401).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/auth/me
 * Get current user profile (requires authentication)
 */
app.get('/api/auth/me', authenticate, (req, res) => {
  try {
    res.json({
      success: true,
      user: UserService.sanitizeUser(req.user),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/auth/change-password
 * Change user password (requires authentication)
 */
app.post('/api/auth/change-password', authenticate, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        error: 'Current and new passwords are required',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        error: 'New passwords do not match',
      });
    }

    await UserService.changePassword(req.user.id, currentPassword, newPassword);

    res.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Password change error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/auth/profile
 * Update user profile (requires authentication)
 */
app.put('/api/auth/profile', authenticate, async (req, res) => {
  try {
    const { firstName, lastName, phone, profileImage } = req.body;

    const user = await UserService.updateUser(req.user.id, {
      firstName,
      lastName,
      phone,
      profileImage,
    });

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user,
    });
  } catch (error) {
    console.error('Profile update error:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/users
 * Get all users (admin/owner only)
 */
app.get('/api/admin/users', authenticate, adminOrOwner, async (req, res) => {
  try {
    const { role, status } = req.query;
    const users = await UserService.getAllUsers(role, status);

    res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error('Error fetching users:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * GET /api/admin/users/:userId
 * Get specific user (admin/owner only)
 */
app.get('/api/admin/users/:userId', authenticate, adminOrOwner, async (req, res) => {
  try {
    const user = await UserService.getUserById(req.params.userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/admin/users
 * Create new user (admin/owner only)
 */
app.post('/api/admin/users', authenticate, adminOrOwner, async (req, res) => {
  try {
    const { email, firstName, lastName, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, and role are required',
      });
    }

    const user = await UserService.createUser(email, firstName, lastName, password, role);

    res.status(201).json({
      success: true,
      message: 'User created successfully',
      user,
    });
  } catch (error) {
    console.error('Error creating user:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/users/:userId/role
 * Assign role to user (owner only)
 */
app.put('/api/admin/users/:userId/role', authenticate, ownerOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!role) {
      return res.status(400).json({
        success: false,
        error: 'Role is required',
      });
    }

    const user = await UserService.assignRole(req.params.userId, role);

    res.json({
      success: true,
      message: 'Role assigned successfully',
      user,
    });
  } catch (error) {
    console.error('Error assigning role:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/users/:userId/suspend
 * Suspend user account (admin/owner only)
 */
app.put('/api/admin/users/:userId/suspend', authenticate, adminOrOwner, async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await UserService.suspendUser(req.params.userId, reason);

    res.json({
      success: true,
      message: 'User suspended successfully',
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/users/:userId/deactivate
 * Deactivate user account (admin/owner only)
 */
app.put('/api/admin/users/:userId/deactivate', authenticate, adminOrOwner, async (req, res) => {
  try {
    const user = await UserService.deactivateUser(req.params.userId);

    res.json({
      success: true,
      message: 'User deactivated successfully',
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * PUT /api/admin/users/:userId/reactivate
 * Reactivate user account (admin/owner only)
 */
app.put('/api/admin/users/:userId/reactivate', authenticate, adminOrOwner, async (req, res) => {
  try {
    const user = await UserService.reactivateUser(req.params.userId);

    res.json({
      success: true,
      message: 'User reactivated successfully',
      user,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * DELETE /api/admin/users/:userId
 * Delete user (owner only)
 */
app.delete('/api/admin/users/:userId', authenticate, ownerOnly, async (req, res) => {
  try {
    await UserService.deleteUser(req.params.userId);

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
});

// ==================== MANUAL ORDER MANAGEMENT (ADMIN/OWNER ONLY) ====================

/**
 * POST /api/admin/orders/manual
 * Create manual order (admin/owner can enter orders and take payments)
 */
app.post('/api/admin/orders/manual', authenticate, adminOrOwner, asyncHandler(async (req, res) => {
  const {
    customerName,
    customerEmail,
    customerPhone,
    orderDate,
    shippingAddress,
    products,
    paymentMethod,
    paymentReference,
    subtotal,
    shipping,
    tax,
    total,
    notes,
  } = req.body;

  // Validate required fields
  if (!customerName || !customerEmail || !shippingAddress || !products || products.length === 0) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields: customerName, customerEmail, shippingAddress, products'
    });
  }

  if (!paymentMethod) {
    return res.status(400).json({
      success: false,
      error: 'Payment method is required'
    });
  }

  try {
    // Create order object
    const order = {
      id: uuidv4(),
      customerName: sanitizeInput(customerName),
      customerEmail: sanitizeInput(customerEmail),
      customerPhone: sanitizeInput(customerPhone),
      orderDate: orderDate || new Date().toISOString(),
      shippingAddress: {
        street: sanitizeInput(shippingAddress.street),
        city: sanitizeInput(shippingAddress.city),
        state: sanitizeInput(shippingAddress.state),
        zip: sanitizeInput(shippingAddress.zip),
        country: sanitizeInput(shippingAddress.country),
      },
      products: products.map(p => ({
        name: sanitizeInput(p.name),
        quantity: Math.max(1, parseInt(p.quantity) || 1),
        price: Math.max(0, parseFloat(p.price) || 0),
      })),
      paymentMethod: sanitizeInput(paymentMethod),
      paymentReference: sanitizeInput(paymentReference),
      subtotal: parseFloat(subtotal) || 0,
      shipping: parseFloat(shipping) || 0,
      tax: parseFloat(tax) || 0,
      total: parseFloat(total) || 0,
      notes: sanitizeInput(notes),
      paymentStatus: paymentMethod === 'cash' ? 'pending' : 'processing',
      orderStatus: 'confirmed',
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save to database if connected
    if (isConnected()) {
      const ManualOrder = require('./models/ManualOrder');
      await ManualOrder.create(order);
    } else {
      // Fallback to file storage
      const EmailSubscriber = require('./models/EmailSubscriber');
      const subscriber = new EmailSubscriber(false);
      subscriber.saveOrder(order);
    }

    // Track in analytics
    await AnalyticsService.trackPurchase({
      userId: null,
      transactionId: order.id,
      value: order.total,
      currency: 'USD',
      items: order.products.map(p => ({ name: p.name, quantity: p.quantity, price: p.price })),
      paymentMethod: order.paymentMethod,
    });

    // Send confirmation email to customer
    await emailService.sendOrderConfirmation({
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      orderId: order.id,
      products: order.products,
      total: order.total,
      shippingAddress: order.shippingAddress,
    });

    // Send notification to admin/owner
    await emailService.sendOrderNotification({
      orderId: order.id,
      customerName: order.customerName,
      customerEmail: order.customerEmail,
      total: order.total,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      createdBy: req.user.email,
    });

    console.log(`✓ Manual order created: ${order.id} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      message: 'Manual order created successfully',
      order: {
        id: order.id,
        customerName: order.customerName,
        total: order.total,
        paymentStatus: order.paymentStatus,
        createdAt: order.createdAt,
      }
    });
  } catch (error) {
    console.error('Error creating manual order:', error.message);
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}));

/**
 * GET /api/admin/orders/manual
 * List all manual orders (admin/owner only)
 */
app.get('/api/admin/orders/manual', authenticate, adminOrOwner, asyncHandler(async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const skip = Math.max(0, parseInt(req.query.skip) || 0);

    if (isConnected()) {
      const ManualOrder = require('./models/ManualOrder');
      const orders = await ManualOrder.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
      const count = await ManualOrder.countDocuments();

      res.json({
        success: true,
        orders,
        count,
        limit,
        skip,
      });
    } else {
      // Fallback: return empty array
      res.json({
        success: true,
        orders: [],
        count: 0,
        limit,
        skip,
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}));

/**
 * GET /api/admin/orders/:orderId
 * Get specific manual order (admin/owner only)
 */
app.get('/api/admin/orders/:orderId', authenticate, adminOrOwner, asyncHandler(async (req, res) => {
  try {
    if (isConnected()) {
      const ManualOrder = require('./models/ManualOrder');
      const order = await ManualOrder.findById(req.params.orderId);

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      res.json({
        success: true,
        order,
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Order not found',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}));

/**
 * PUT /api/admin/orders/:orderId/payment-status
 * Update payment status (admin/owner only)
 */
app.put('/api/admin/orders/:orderId/payment-status', authenticate, adminOrOwner, asyncHandler(async (req, res) => {
  const { paymentStatus, paymentReference } = req.body;

  if (!paymentStatus || !['pending', 'completed', 'failed', 'refunded'].includes(paymentStatus)) {
    return res.status(400).json({
      success: false,
      error: 'Valid paymentStatus required: pending, completed, failed, refunded',
    });
  }

  try {
    if (isConnected()) {
      const ManualOrder = require('./models/ManualOrder');
      const order = await ManualOrder.findByIdAndUpdate(
        req.params.orderId,
        {
          paymentStatus,
          paymentReference: paymentReference || undefined,
          updatedAt: new Date().toISOString(),
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Send status update email to customer
      await emailService.sendPaymentStatusUpdate({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        orderId: order.id,
        paymentStatus,
        total: order.total,
      });

      res.json({
        success: true,
        message: 'Payment status updated successfully',
        order,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Database unavailable',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}));

/**
 * PUT /api/admin/orders/:orderId/order-status
 * Update order status (admin/owner only)
 */
app.put('/api/admin/orders/:orderId/order-status', authenticate, adminOrOwner, asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  if (!orderStatus || !['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'].includes(orderStatus)) {
    return res.status(400).json({
      success: false,
      error: 'Valid orderStatus required: confirmed, processing, shipped, delivered, cancelled',
    });
  }

  try {
    if (isConnected()) {
      const ManualOrder = require('./models/ManualOrder');
      const order = await ManualOrder.findByIdAndUpdate(
        req.params.orderId,
        {
          orderStatus,
          updatedAt: new Date().toISOString(),
        },
        { new: true }
      );

      if (!order) {
        return res.status(404).json({
          success: false,
          error: 'Order not found',
        });
      }

      // Send status update email to customer
      await emailService.sendOrderStatusUpdate({
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        orderId: order.id,
        orderStatus,
      });

      res.json({
        success: true,
        message: 'Order status updated successfully',
        order,
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Database unavailable',
      });
    }
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
    });
  }
}));

// ==================== ANALYTICS ENDPOINTS ====================

/**
 * POST /api/analytics/event
 * Track custom event
 */
app.post('/api/analytics/event', async (req, res) => {
  try {
    const { eventName, eventData, userId } = req.body;

    if (!eventName) {
      return res.status(400).json({
        success: false,
        error: 'Event name is required',
      });
    }

    await AnalyticsService.trackEvent(eventName, eventData || {}, userId);

    res.json({
      success: true,
      message: 'Event tracked successfully',
    });
  } catch (error) {
    console.error('Analytics error:', error.message);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/signup
 * Track user signup
 */
app.post('/api/analytics/signup', async (req, res) => {
  try {
    const { email, userType } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    await AnalyticsService.trackSignup(email, userType || 'standard');

    res.json({
      success: true,
      message: 'Signup tracked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/purchase
 * Track purchase event
 */
app.post('/api/analytics/purchase', async (req, res) => {
  try {
    const { userId, transactionId, value, currency, items, paymentMethod } = req.body;

    if (!transactionId || !value) {
      return res.status(400).json({
        success: false,
        error: 'Transaction ID and value are required',
      });
    }

    await AnalyticsService.trackPurchase({
      userId,
      transactionId,
      value,
      currency: currency || 'USD',
      items: items || [],
      paymentMethod: paymentMethod || 'card',
    });

    res.json({
      success: true,
      message: 'Purchase tracked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/email-subscription
 * Track email subscription
 */
app.post('/api/analytics/email-subscription', async (req, res) => {
  try {
    const { email, subscriptionType } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email is required',
      });
    }

    await AnalyticsService.trackEmailSubscription(email, subscriptionType || 'newsletter');

    res.json({
      success: true,
      message: 'Email subscription tracked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/campaign
 * Track campaign event (sent/opened/clicked)
 */
app.post('/api/analytics/campaign', async (req, res) => {
  try {
    const { action, campaignId, campaignName, email, recipientCount, linkUrl } = req.body;

    if (!action || !campaignId) {
      return res.status(400).json({
        success: false,
        error: 'Action and campaign ID are required',
      });
    }

    if (action === 'sent') {
      await AnalyticsService.trackCampaignSent(campaignId, campaignName, recipientCount);
    } else if (action === 'opened') {
      await AnalyticsService.trackCampaignOpened(campaignId, email);
    } else if (action === 'clicked') {
      await AnalyticsService.trackCampaignClicked(campaignId, email, linkUrl);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: sent, opened, or clicked',
      });
    }

    res.json({
      success: true,
      message: `Campaign ${action} tracked successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/product
 * Track product events (view, add to cart, etc)
 */
app.post('/api/analytics/product', async (req, res) => {
  try {
    const { action, productId, productName, category, price, userId, quantity } = req.body;

    if (!action || !productId) {
      return res.status(400).json({
        success: false,
        error: 'Action and product ID are required',
      });
    }

    if (action === 'view') {
      await AnalyticsService.trackProductView(productId, productName, category, price);
    } else if (action === 'add_to_cart') {
      await AnalyticsService.trackAddToCart(userId, productId, productName, price, quantity);
    } else if (action === 'search') {
      await AnalyticsService.trackSearch(productName, 1);
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid action. Must be: view, add_to_cart, or search',
      });
    }

    res.json({
      success: true,
      message: `Product ${action} tracked successfully`,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * POST /api/analytics/form
 * Track form submission
 */
app.post('/api/analytics/form', async (req, res) => {
  try {
    const { formName, userId } = req.body;

    if (!formName) {
      return res.status(400).json({
        success: false,
        error: 'Form name is required',
      });
    }

    await AnalyticsService.trackFormSubmission(formName, userId);

    res.json({
      success: true,
      message: 'Form submission tracked successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTPS server');
  process.exit(0);
});

// Load SSL certificates for HTTPS
const certPath = path.join(__dirname, 'certs', 'server.crt');
const keyPath = path.join(__dirname, 'certs', 'server.key');

let httpsServer;
let httpServer;

if (fs.existsSync(certPath) && fs.existsSync(keyPath)) {
  try {
    const sslOptions = {
      cert: fs.readFileSync(certPath),
      key: fs.readFileSync(keyPath),
    };

    // Create HTTPS server
    httpsServer = https.createServer(sslOptions, app);

    // Create HTTP server that redirects to HTTPS
    httpServer = http.createServer((req, res) => {
      res.writeHead(301, { Location: `https://${req.headers.host}${req.url}` });
      res.end();
    });

    // Start both servers
    const HTTPS_PORT = process.env.HTTPS_PORT || 443;
    const HTTP_PORT = process.env.PORT || 3000;

    httpsServer.listen(HTTPS_PORT, () => {
      console.log(`\n✓ Sisters Promise API server running on https://localhost:${HTTPS_PORT}`);
      console.log(`✓ HTTP server redirecting to HTTPS on port ${HTTP_PORT}`);
      console.log(`✓ Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
      console.log(`✓ Security: HTTPS/TLS enabled, Helmet enabled, Rate limiting active`);
      console.log(`✓ Max payload size: 10KB`);
      console.log(`✓ Authentication: JWT enabled with role-based access control`);
      console.log(`✓ Default Users: Owner (denise@sisterspromise.com), Admin (deric.robinson71@gmail.com)`);
      console.log(`✓ Analytics: Google Analytics 4 and Apple Analytics enabled`);
      console.log(`✓ Encryption: All API traffic encrypted with SSL/TLS\n`);

      if (!process.env.SQUARE_ACCESS_TOKEN) {
        console.warn('⚠️  Warning: SQUARE_ACCESS_TOKEN not configured');
      }
      if (!process.env.RECAPTCHA_SECRET_KEY) {
        console.warn('⚠️  Warning: RECAPTCHA_SECRET_KEY not configured for contact form');
      }
      if (!process.env.JWT_SECRET) {
        console.warn('⚠️  Warning: JWT_SECRET not configured - using default (not secure for production)');
      }
    });

    httpServer.listen(HTTP_PORT, () => {
      console.log(`✓ HTTP redirect server listening on http://localhost:${HTTP_PORT}`);
    });
  } catch (error) {
    console.error('Failed to load SSL certificates:', error.message);
    console.log('Falling back to HTTP only...\n');
    
    app.listen(PORT, () => {
      console.log(`\n✓ Sisters Promise API server running on http://localhost:${PORT}`);
      console.log(`⚠️  WARNING: Running on HTTP (unencrypted) - Not recommended for production`);
      console.log(`✓ Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
      console.log(`✓ Security: Helmet enabled, Rate limiting active, Input sanitization enabled`);
      console.log(`✓ Max payload size: 10KB`);
      console.log(`✓ Authentication: JWT enabled with role-based access control`);
      console.log(`✓ Default Users: Owner (denise@sisterspromise.com), Admin (deric.robinson71@gmail.com)`);
      console.log(`✓ Analytics: Google Analytics 4 and Apple Analytics enabled\n`);
    });
  }
} else {
  console.log('SSL certificates not found. Generating...\n');
  try {
    const { execSync } = require('child_process');
    execSync('node generate-certs.js', { stdio: 'inherit' });
    console.log('Certificates generated. Please restart the server.\n');
    process.exit(0);
  } catch (error) {
    console.error('Failed to generate certificates. Running HTTP only.\n');
    app.listen(PORT, () => {
      console.log(`\n✓ Sisters Promise API server running on http://localhost:${PORT}`);
      console.log(`⚠️  WARNING: Running on HTTP (unencrypted) - Not recommended for production`);
      console.log(`✓ Environment: ${process.env.SQUARE_ENVIRONMENT || 'sandbox'}`);
      console.log(`✓ Security: Helmet enabled, Rate limiting active, Input sanitization enabled`);
      console.log(`✓ Max payload size: 10KB`);
      console.log(`✓ Authentication: JWT enabled with role-based access control`);
      console.log(`✓ Default Users: Owner (denise@sisterspromise.com), Admin (deric.robinson71@gmail.com)`);
      console.log(`✓ Analytics: Google Analytics 4 and Apple Analytics enabled\n`);
    });
  }
}
  console.log('\n');
});
