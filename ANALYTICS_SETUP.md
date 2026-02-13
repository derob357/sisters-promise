# Google Analytics & Apple Analytics Setup Guide

## Overview

Sister's Promise is configured for comprehensive analytics tracking across Google Analytics 4 and Apple Analytics, enabling you to track user behavior, conversions, and engagement metrics.

## Google Analytics 4 Setup

### Step 1: Create GA4 Property

1. Go to [Google Analytics](https://analytics.google.com)
2. Sign in with your Google account
3. Click **Admin** (bottom left)
4. Click **Create Property** in the Property column
5. Fill in property details:
   - **Property name**: Sister's Promise
   - **Reporting timezone**: Your timezone
   - **Currency**: USD
   - **Industry category**: Shopping/Retail
6. Click **Create**

### Step 2: Create Data Stream

1. In **Data Streams**, click **Create**
2. Select **Web** as the platform
3. Enter:
   - **Website URL**: https://sisterspromise.com
   - **Stream name**: Sister's Promise Web
4. Click **Create stream**
5. You'll see your **Measurement ID** (starts with `G_`)

### Step 3: Configure Environment Variables

Add to your `.env` file:

```bash
GA_MEASUREMENT_ID=G_XXXXXXXXXX
GA_API_SECRET=your-secret-key
```

To get the API Secret:
1. In GA4, go to **Admin** → **Data Streams** → Select your stream
2. Scroll down to **Measurement Protocol** → **Create**
3. Click the info icon to view and copy your **API Secret**

### Step 4: Update HTML

The analytics script will use your `GA_MEASUREMENT_ID` from the configuration. Update in `index.html`:

```html
<script>
  window.GA_MEASUREMENT_ID = 'G_XXXXXXXXXX'; // Your actual ID
</script>
```

## Apple Analytics Setup

### For Native iOS/macOS Apps

1. In Xcode, open your app's **Target** settings
2. Go to **Signing & Capabilities** → **App Tracking Transparency**
3. Configure tracking identifiers
4. Use `SKAdNetwork` for conversion tracking

### For Web (iOS Safari)

Apple Analytics on the web works through:
- **GA4 Integration**: The same GA4 tracking works on iOS Safari
- **App-to-Web Measurement**: If you have an iOS app, configure App Tracking Transparency
- **Web Clips**: Configure `apple-app-site-association` for deep linking

Configuration in `index.html`:
```html
<meta name="apple-app-site-association" content='{"apps":[],"webcredentials":{"apps":["XXXXXXXXXX.com.sisterspromise"]}}'>
```

### Privacy Considerations

Apple Analytics requires:
- Clear privacy policy
- User consent for tracking
- No cross-site tracking for personalization
- Transparent data practices

## Implementation in Sister's Promise

### Client-Side Tracking (Frontend)

The `assets/js/analytics-tracking.js` file provides:

```javascript
// Track page views
analyticsService.trackPageView('/shop');

// Track events
analyticsService.trackEvent('search', {
  search_term: 'moisturizer',
  results_count: 12
});

// Track purchases
analyticsService.trackPurchase({
  items: [
    { id: 'prod_001', name: 'Sea Moss Soap', price: 12.99, quantity: 2 }
  ],
  value: 25.98,
  currency: 'USD',
  transaction_id: 'txn_12345'
});

// Track user properties
analyticsService.setUserProperties({
  userId: 'user_123',
  userType: 'subscriber',
  subscriptionStatus: 'active'
});
```

### Server-Side Tracking (Backend)

The `services/AnalyticsService.js` file provides server-side tracking via Google Analytics Measurement Protocol:

```javascript
const AnalyticsService = require('./services/AnalyticsService');

// Track signup
await AnalyticsService.trackSignup('user@email.com', 'standard');

// Track purchase
await AnalyticsService.trackPurchase({
  userId: 'user_123',
  transactionId: 'txn_12345',
  value: 99.99,
  currency: 'USD',
  items: [...],
  paymentMethod: 'card'
});

// Track email campaign
await AnalyticsService.trackCampaignSent('campaign_001', 'January Sale', 5000);
```

## API Endpoints

### POST /api/analytics/event
Track custom events

```bash
curl -X POST http://localhost:3000/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "custom_event",
    "eventData": {
      "key": "value"
    },
    "userId": "optional_user_id"
  }'
```

### POST /api/analytics/signup
Track user signup

```bash
curl -X POST http://localhost:3000/api/analytics/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "userType": "standard"
  }'
```

### POST /api/analytics/purchase
Track purchase events

```bash
curl -X POST http://localhost:3000/api/analytics/purchase \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user_123",
    "transactionId": "txn_12345",
    "value": 99.99,
    "currency": "USD",
    "items": [
      {
        "id": "prod_001",
        "name": "Product Name",
        "price": 99.99,
        "quantity": 1
      }
    ],
    "paymentMethod": "card"
  }'
```

### POST /api/analytics/email-subscription
Track email subscriptions

```bash
curl -X POST http://localhost:3000/api/analytics/email-subscription \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "subscriptionType": "newsletter"
  }'
```

### POST /api/analytics/campaign
Track email campaign events

```bash
# Campaign sent
curl -X POST http://localhost:3000/api/analytics/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "action": "sent",
    "campaignId": "campaign_001",
    "campaignName": "January Sale",
    "recipientCount": 5000
  }'

# Campaign opened
curl -X POST http://localhost:3000/api/analytics/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "action": "opened",
    "campaignId": "campaign_001",
    "email": "user@example.com"
  }'

# Campaign link clicked
curl -X POST http://localhost:3000/api/analytics/campaign \
  -H "Content-Type: application/json" \
  -d '{
    "action": "clicked",
    "campaignId": "campaign_001",
    "email": "user@example.com",
    "linkUrl": "https://sisterspromise.com/shop"
  }'
```

### POST /api/analytics/product
Track product interactions

```bash
# View product
curl -X POST http://localhost:3000/api/analytics/product \
  -H "Content-Type: application/json" \
  -d '{
    "action": "view",
    "productId": "prod_001",
    "productName": "Sea Moss Soap",
    "category": "Soaps",
    "price": 12.99
  }'

# Add to cart
curl -X POST http://localhost:3000/api/analytics/product \
  -H "Content-Type: application/json" \
  -d '{
    "action": "add_to_cart",
    "productId": "prod_001",
    "productName": "Sea Moss Soap",
    "price": 12.99,
    "quantity": 2,
    "userId": "user_123"
  }'
```

### POST /api/analytics/form
Track form submissions

```bash
curl -X POST http://localhost:3000/api/analytics/form \
  -H "Content-Type: application/json" \
  -d '{
    "formName": "contact_form",
    "userId": "optional_user_id"
  }'
```

## Events Tracked Automatically

The system automatically tracks:

- ✅ Page views
- ✅ Product views
- ✅ Cart additions
- ✅ Purchases
- ✅ Form submissions
- ✅ Email subscriptions
- ✅ Campaign sends/opens/clicks
- ✅ User logins/signups
- ✅ Search queries
- ✅ Errors and exceptions

## Privacy & Compliance

### GDPR Compliance
- Anonymized IP addresses
- No third-party ads enabled
- User consent via `setConsentMode()`
- Easy opt-out via email unsubscribe

### CCPA Compliance
- No cross-site personalization
- Transparent data collection
- User data access available via APIs
- Data retention settings configured

## Testing Analytics

### Enable GA4 Debug Mode

In your GA4 property:
1. Admin → Data Streams → Select stream
2. Scroll to **Data Collection** → **Google Analytics Debugger**
3. Install [GA Debugger Chrome Extension](https://chrome.google.com/webstore)
4. View real-time events in the extension

### Test Endpoints

```bash
# Test with curl
curl -X POST http://localhost:3000/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventName": "test_event",
    "eventData": {"test": true}
  }'

# View response
# Expected: { "success": true, "message": "Event tracked successfully" }
```

## Monitoring & Reporting

### Key Metrics to Track
- User acquisition
- Conversion rates
- Average order value
- Email engagement rates
- Product performance
- Traffic sources
- Device types
- User retention

### GA4 Dashboard Recommendations
1. Create custom dashboards for:
   - Sales & Revenue
   - User Acquisition
   - Email Campaign Performance
   - Product Performance
   - Device/Platform Analysis

2. Set up alerts for:
   - Conversion drops
   - Revenue thresholds
   - Traffic anomalies

## Troubleshooting

### No Events Appearing in GA4

1. **Check Measurement ID**: Verify `GA_MEASUREMENT_ID` is correct
2. **Check Network Tab**: Ensure requests to `googletagmanager.com` are successful
3. **Review GA4 Real-time Reports**: May take 24-48 hours for full reports
4. **Enable Debug Mode**: Use GA Debugger extension to verify events

### Apple Analytics Not Showing Data

1. **Check WebKit Configuration**: Verify app-to-web integration if using native app
2. **Privacy Settings**: Ensure user hasn't disabled app tracking
3. **Time Zone**: Verify GA4 and Apple Analytics use same timezone

### Measurement Protocol Issues

1. **API Secret**: Verify `GA_API_SECRET` is correct
2. **Request Format**: Check JSON payload structure matches GA4 spec
3. **Rate Limiting**: Default is 10,000 hits per day per property

## Resources

- [Google Analytics 4 Documentation](https://developers.google.com/analytics/devguides/collection/ga4)
- [GA4 Events Reference](https://support.google.com/analytics/answer/9322688)
- [Measurement Protocol v1](https://developers.google.com/analytics/devguides/collection/protocol/ga4)
- [Apple App Tracking Transparency](https://developer.apple.com/documentation/apptrackingtransparency)
- [GDPR & Analytics](https://analytics.google.com/analytics/web/#/gdpr)
