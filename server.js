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
const { RecaptchaEnterpriseServiceClient } = require('@google-cloud/recaptcha-enterprise');
const EmailSubscriber = require('./models/EmailSubscriber');
const EmailService = require('./services/EmailService');

dotenv.config();

const app = express();

// Initialize email services
const emailSubscriber = new EmailSubscriber();
const emailService = new EmailService();

// Security Middleware - Helmet for security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", 'https://recaptcha.net', 'https://www.google.com/recaptcha/', 'https://www.gstatic.com/recaptcha/', 'https://cdn.jsdelivr.net'],
      frameSrc: ['https://recaptcha.net', 'https://www.google.com/recaptcha/'],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://cdnjs.cloudflare.com', 'https://cdn.jsdelivr.net'],
      connectSrc: ["'self'", 'https://cdn.jsdelivr.net'],
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
});
