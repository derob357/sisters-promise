# API Key Dependencies - Functions That Won't Work

## Summary

Your app currently has **3 critical API keys set to placeholder values** and **2 optional services not configured**. This document identifies which specific functions will fail or degrade without real credentials.

---

## 🔴 CRITICAL - Payment Processing (BLOCKS CHECKOUT)

### Current Status
```
SQUARE_APPLICATION_ID=temp_app_id_placeholder           ❌ PLACEHOLDER
SQUARE_ACCESS_TOKEN=temp_access_token_placeholder       ❌ PLACEHOLDER
SQUARE_LOCATION_ID=temp_location_id_placeholder         ❌ PLACEHOLDER
```

### Affected Endpoints & Functions

#### 1. **POST /api/checkout** (server.js, line 631)
- **What it does:** Processes credit/debit card payments
- **How it fails:** Calls `paymentsApi.createPayment()` with placeholder Square credentials → Square API rejects request with `401 Unauthorized`
- **Error response:** HTTP 400 - "Payment processing failed"
- **Impact:** ⚠️ **APP CANNOT ACCEPT PAYMENTS** - This breaks the entire revenue model
- **Mobile integration:** CartContext → checkout() → POST /api/checkout

#### 2. **Square Client Initialization** (server.js, line 25-40)
```javascript
const client = new Client({
  accessToken: process.env.SQUARE_ACCESS_TOKEN,
  environment: process.env.SQUARE_ENVIRONMENT || 'sandbox'
});
const paymentsApi = client.getPaymentsApi();
```
- **Problem:** Uses placeholder `SQUARE_ACCESS_TOKEN`
- **Result:** All Square API calls (payments, refunds, customers) fail at initialization

### User Impact
- **Shop page:** "Purchase Now" button → POST /api/checkout → **ERROR**
- **Mobile app:** Cart checkout → completes but payment fails
- **Error message:** "Payment processing failed - Unable to process payment" (production), or full error in development

### Fix Required
1. Go to [Square Developer Dashboard](https://developer.squareup.com/apps)
2. Get credentials from **Credentials** tab:
   - Application ID
   - Access Token
   - Location ID
3. Update `.env`:
   ```
   SQUARE_APPLICATION_ID=sq_live_abc123xyz...
   SQUARE_ACCESS_TOKEN=sq_live_ABC123XYZ...
   SQUARE_LOCATION_ID=L12ABC3XYZ...
   SQUARE_ENVIRONMENT=production  # or 'sandbox' for testing
   ```
4. Restart backend: `npm start`

---

## 🟠 HIGH PRIORITY - Bot Protection for Forms

### Current Status
```
GOOGLE_CLOUD_PROJECT_ID=not-configured              ❌ NOT SET
RECAPTCHA_ENTERPRISE_KEY=6LcNuUQs...                ⚠️ PLACEHOLDER (public key only)
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json   ❌ FILE MISSING
```

### Affected Endpoints & Functions

#### 1. **POST /api/email/subscribe** (server.js, line 837)
- **What it does:** Newsletter subscription with bot protection
- **How it fails:**
  ```javascript
  if (recaptchaToken) {
    const riskScore = await createRecaptchaAssessment(recaptchaToken, 'subscribe');
    // ... reCAPTCHA setup function at line 146
  }
  ```
  - Calls `createRecaptchaAssessment()` → needs `GOOGLE_CLOUD_PROJECT_ID` + valid credentials file
  - Missing credentials.json → function returns `null`
  - Missing project ID → console error logs but continues
- **Error response:** Assessment skipped, subscribers accepted without bot verification
- **Impact:** ⚠️ **ALLOWS BOTS TO SPAM NEWSLETTER** - No protection on signup
- **Behavior:** Newsletter signup still works, but no bot detection

#### 2. **POST /api/contact** (assumed similar pattern)
- **What it does:** Contact form submission with bot protection
- **How it fails:** Same as above - reCAPTCHA assessment fails silently
- **Impact:** Contact form accepts spam/bot submissions

#### 3. **createRecaptchaAssessment()** Function (server.js, line 146)
```javascript
async function createRecaptchaAssessment(token, recaptchaAction = 'submit') {
  const projectID = process.env.GOOGLE_CLOUD_PROJECT_ID;
  const recaptchaKey = process.env.RECAPTCHA_ENTERPRISE_KEY;

  if (!projectID || !recaptchaKey) {
    console.error('Missing reCAPTCHA Enterprise configuration');
    return null;  // ← Returns null, bypassing all checks
  }
  
  const client = new RecaptchaEnterpriseServiceClient();
  // ... attempts to create assessment, will fail without credentials.json
}
```
- **Returns:** `null` if config missing
- **Risk score interpretation:** Never called, so no risk blocking

#### 4. **interpretRecaptchaScore()** Function (server.js, line 203)
- **Status:** Never called because `createRecaptchaAssessment()` returns null
- **Would block subscribers if:** Score < 0.3 (HIGH_RISK)
- **Would review if:** Score 0.3-0.5 (MEDIUM_RISK)

### User Impact
- **Contact form:** Accepts all submissions without bot verification
- **Newsletter signup:** Accepts all emails including bots
- **Shop page:** Bots can subscribe to promotions
- **No error:** Users don't see problems - spam flows through silently

### Fix Required
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Enable reCAPTCHA Enterprise API
3. Create a reCAPTCHA Enterprise key for your domain
4. Download service account JSON credentials
5. Update `.env`:
   ```
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   RECAPTCHA_ENTERPRISE_KEY=your_enterprise_key_id
   GOOGLE_APPLICATION_CREDENTIALS=./sisters-promise-fd1cf4a03bdf.json
   ```
6. Place credentials JSON file in project root
7. Restart backend

---

## 🟡 MEDIUM PRIORITY - Email Notifications (GRACEFUL FALLBACK)

### Current Status
```
SENDGRID_API_KEY=(not set)                           ❌ NOT SET
SMTP_HOST=(not set)                                  ❌ NOT SET
SMTP_USER=(not set)                                  ❌ NOT SET
SMTP_PASSWORD=(not set)                              ❌ NOT SET
```

### Affected Endpoints & Functions

#### 1. **POST /api/email/subscribe** (server.js, line 837)
```javascript
// Send welcome email
await emailService.sendWelcomeEmail(subscriber);
```
- **What it does:** Sends welcome email to new newsletter subscribers
- **Current behavior:** Calls `emailService.sendWelcomeEmail()` → logs warning if no SENDGRID_API_KEY → returns early
- **Error:** Silent failure (no error response to user, but email not sent)
- **User experience:** Subscription confirms as success, but no welcome email arrives
- **Stack location:** services/EmailService.js line 100-120

#### 2. **sendOrderConfirmation()** (EmailService.js, line 407)
- **What it does:** Sends order confirmation after checkout
- **Current behavior:** Logs warning, returns early without sending
- **User experience:** Order created but customer never receives confirmation email
- **Data loss:** Order details not communicated

#### 3. **sendWelcomeEmail()** (EmailService.js, line 81)
- **What it does:** Welcome email for new subscribers
- **Current behavior:** `if (!process.env.SENDGRID_API_KEY) return false;` (line 65)
- **User experience:** No confirmation that email was sent

#### 4. **sendPromotion()** (EmailService.js, line 150)
- **What it does:** Marketing emails for promotions/sales
- **Current behavior:** Returns early without sending
- **User experience:** Promotions never reach subscribers

#### 5. **sendShippingUpdate()** (EmailService.js, line 180)
- **What it does:** Shipping tracking and delivery updates
- **Current behavior:** Returns early without sending
- **User experience:** Customers don't know when orders arrive

#### 6. **sendNewsletterEmail()** (EmailService.js, line 210)
- **What it does:** Bulk newsletter to all subscribers
- **Current behavior:** Returns early without sending
- **User experience:** Newsletter campaign doesn't reach audience

### User Impact
- **No transactional emails:** Orders, confirmations, shipping updates don't arrive
- **No marketing emails:** Newsletters and promotions don't reach subscribers
- **Silent failures:** App reports success but emails never sent
- **Customer confusion:** Users think they're subscribed but never get emails
- **App continues:** No crashes, just missing communication

### Current Safety Mechanism
```javascript
// From services/EmailService.js line 65-66
const setupSendGrid = () => {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[EmailService] SendGrid not configured - emails will not be sent');
    return false;
  }
  // ... actual setup
};
```
✅ App won't crash, but emails silently don't send

### Fix Required
**Option A: SendGrid (Recommended)**
1. Create [SendGrid](https://sendgrid.com) account
2. Generate API key from Settings → API Keys
3. Update `.env`:
   ```
   SENDGRID_API_KEY=SG.your_api_key_here
   SENDGRID_FROM_EMAIL=orders@sistersp romise.com
   ```

**Option B: SMTP (Gmail, Office365, etc.)**
1. Get SMTP credentials from your email provider
2. Update `.env`:
   ```
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   ```
3. Update EmailService.js to use SMTP instead of SendGrid

---

## 🟢 LOW PRIORITY - Analytics (OPTIONAL)

### Current Status
```
GA_MEASUREMENT_ID=(not set)                          ⚠️ OPTIONAL
GA_API_SECRET=(not set)                              ⚠️ OPTIONAL
```

### Affected Endpoints & Functions

#### 1. **POST /api/analytics/purchase** (server.js, line 800)
- **What it does:** Tracks successful purchases to Google Analytics
- **Current behavior:** Logs to console, returns success (doesn't actually send to GA)
- **Impact:** ⚠️ **No analytics data collected** - app still functions perfectly
- **User experience:** Zero impact - everything works normally

#### 2. **POST /api/analytics/product** (server.js, line 809)
- **What it does:** Tracks product views/clicks
- **Current behavior:** Logs to console only
- **Impact:** You have no visibility into product interest

#### 3. **POST /api/analytics/email-subscription** (server.js, line 819)
- **What it does:** Tracks email signup events
- **Current behavior:** Logs to console only
- **Impact:** No funnel analytics for subscriptions

#### 4. **POST /api/analytics/form** (server.js, line 829)
- **What it does:** Tracks form submissions
- **Current behavior:** Logs to console only
- **Impact:** No visibility into contact form usage

### User Impact
- **Zero impact on functionality** - all app features work normally
- **Zero impact on user experience** - users see no differences
- **Zero impact on checkout** - payments still process (if Square keys fixed)
- **Impact on business:** No analytics data for decision making

### Current Safety Mechanism
✅ All analytics endpoints return success with console logging - zero risk of crashes

### Fix Required (Only if needed for metrics)
1. Create [Google Analytics](https://analytics.google.com) property for your website
2. Get Measurement ID and API Secret
3. Update `.env`:
   ```
   GA_MEASUREMENT_ID=G_ABCD1234EF
   GA_API_SECRET=your_secret_here
   ```

---

## 📋 Quick Reference: What Breaks vs What Degrades

| Feature | Current Status | Breaks App? | User Sees Error? | Fix Priority |
|---------|----------------|------------|------------------|--------------|
| **Checkout/Payments** | Placeholder Square keys | ✅ YES | ✅ YES | 🔴 CRITICAL |
| **Bot Protection** | Missing credentials | ❌ NO | ❌ NO | 🟠 HIGH |
| **Email Notifications** | Not configured | ❌ NO | ❌ NO | 🟡 MEDIUM |
| **Analytics** | Not configured | ❌ NO | ❌ NO | 🟢 LOW |

---

## 🧪 Testing Without Real Keys

### Current Behavior (With Placeholders)
1. **Checkout page:** Appears normal, but clicking "Purchase" fails
2. **Newsletter signup:** Appears to succeed, email never arrives
3. **Contact form:** Accepts spam/bot submissions
4. **Analytics:** All endpoints respond but no data collected

### Test Cases

#### Test 1: Payment Processing
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{"sourceId":"sq_test_123","amount":1000}'
```
**Result with placeholder keys:** `401 Unauthorized from Square API`

#### Test 2: Newsletter Signup
```bash
curl -X POST http://localhost:3000/api/email/subscribe \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","firstName":"Test"}'
```
**Result without SendGrid:** `201 Success (but no email sent)`

#### Test 3: Form Submission
```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{"name":"Test","email":"test@example.com","message":"Hello"}'
```
**Result without reCAPTCHA:** `200 Success (but no bot protection)`

---

## 🔧 Environment Setup Sequence

For **minimum viable product** (to accept payments):
1. ✅ Get Square API credentials
2. Update `.env` with Square keys
3. Test checkout endpoint

For **production ready**:
1. ✅ Square API credentials
2. ✅ SendGrid API key for transactional emails
3. ✅ reCAPTCHA Enterprise setup
4. ✅ Google Analytics (optional)

---

## 📝 Notes

- **Placeholder values don't cause crashes** - they cause silent failures or API rejections
- **EmailService has built-in guards** - won't crash if SendGrid not configured
- **reCAPTCHA gracefully degrades** - bot protection just skips if not configured
- **Analytics endpoints are resilient** - they'll never fail, just won't collect data
- **Payments CANNOT gracefully degrade** - checkout must have real Square keys to work

---

## 🚀 Deployment Checklist

Before deploying to production:

- [ ] Square credentials obtained and verified working
- [ ] `.env` updated with real Square keys (not test keys)
- [ ] SendGrid API key configured (or SMTP alternative)
- [ ] reCAPTCHA Enterprise set up with valid project ID
- [ ] Google credentials.json file in place
- [ ] Analytics property created (optional)
- [ ] Test payment processing with real test cards
- [ ] Test email delivery (order confirmation, signup)
- [ ] Test bot protection on contact form
- [ ] Verify `.env` is in `.gitignore` (never commit secrets!)
