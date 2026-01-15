# Email Marketing System - Implementation Guide

## Overview

The Sisters Promise application now includes a comprehensive, reliable email marketing and subscriber management system. This system handles:

- **Subscriber Management**: Add, update, and manage customer email subscriptions
- **Email Templates**: Professional, branded email templates for various campaigns
- **Marketing Campaigns**: Create and send newsletter campaigns to subscribers
- **Promotional Emails**: Send special promotions and discount codes
- **Transactional Emails**: Send order confirmations and cart reminders
- **Analytics & Tracking**: Monitor email performance and subscriber engagement
- **Data Protection**: GDPR-compliant unsubscribe functionality

## Features

### 1. Subscriber Management

#### Add New Subscriber
```bash
curl -X POST http://localhost:3000/api/email/subscribe \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "preferences": {
      "marketing": true,
      "newsletter": true,
      "promotions": true,
      "productUpdates": true
    },
    "recaptchaToken": "token_from_frontend"
  }'
```

#### Get Subscriber Info
```bash
curl http://localhost:3000/api/email/subscriber/customer@example.com
```

#### Update Subscriber Preferences
```bash
curl -X POST http://localhost:3000/api/email/update/customer@example.com \
  -H "Content-Type: application/json" \
  -d '{
    "preferences": {
      "marketing": true,
      "newsletter": false,
      "promotions": true
    }
  }'
```

#### Unsubscribe (One-Click)
- Links in all emails include: `/api/email/unsubscribe/{unsubscribeToken}`
- GDPR compliant and user-friendly

### 2. Email Statistics

```bash
curl http://localhost:3000/api/email/stats
```

Returns:
- Total subscribers
- Active subscribers
- Unsubscribed count
- Bounced emails
- Campaign performance metrics

### 3. Marketing Campaigns

#### Create Campaign
```bash
curl -X POST http://localhost:3000/api/admin/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name": "August Newsletter",
    "subject": "Exciting News from Sisters Promise",
    "templateId": "newsletter",
    "type": "newsletter",
    "scheduleTime": "2025-08-15T10:00:00Z"
  }'
```

#### Send Campaign to Subscribers
```bash
curl -X POST http://localhost:3000/api/admin/campaigns/{campaignId}/send \
  -H "Content-Type: application/json" \
  -d '{
    "filterType": "newsletter"
  }'
```

Filter types:
- `all`: All active subscribers
- `newsletter`: Subscribers who opted in for newsletters
- `marketing`: Subscribers who opted in for marketing
- `promotions`: Subscribers who opted in for promotions

### 4. Promotional Campaigns

```bash
curl -X POST http://localhost:3000/api/admin/promotions/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Summer Sale!",
    "description": "Get 20% off all products this weekend",
    "code": "SUMMER20",
    "link": "https://sisterspromise.com/pages/shop"
  }'
```

### 5. Transactional Emails

#### Order Confirmation
```bash
curl -X POST http://localhost:3000/api/email/order-confirmation \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "order": {
      "id": "ORDER-123456",
      "date": "2025-01-15T10:00:00Z",
      "items": [
        {
          "name": "Sea Moss Soap",
          "quantity": 2,
          "price": 15.99
        }
      ],
      "total": 31.98,
      "trackingUrl": "https://sisterspromise.com/orders/ORDER-123456"
    }
  }'
```

#### Abandoned Cart Reminder
```bash
curl -X POST http://localhost:3000/api/email/abandoned-cart \
  -H "Content-Type: application/json" \
  -d '{
    "email": "customer@example.com",
    "cartItems": [
      {
        "name": "Nourishing Sea Moss Serum",
        "price": 34.99
      },
      {
        "name": "Luxurious Body Lotion",
        "price": 24.99
      }
    ]
  }'
```

### 6. Email Testing

Test email templates before sending to subscribers:
```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "templateId": "welcome"
  }'
```

### 7. Export Subscribers

Export your subscriber list as CSV:
```bash
curl http://localhost:3000/api/email/export > subscribers.csv
```

## Architecture

### File Structure

```
/models
  └── EmailSubscriber.js          # Subscriber data model & business logic
/services
  └── EmailService.js             # Email sending & template rendering
/templates/emails
  ├── welcome.html                # Welcome email template
  ├── newsletter.html             # Newsletter template
  ├── promotion.html              # Promotional email template
  ├── order-confirmation.html     # Order confirmation template
  └── abandoned-cart.html         # Abandoned cart reminder template
/data
  ├── subscribers.json            # Subscriber data (file storage)
  ├── campaigns.json              # Campaign data
  └── email-logs.json             # Email activity logs
```

### Components

#### EmailSubscriber Class
- Manages subscriber list (file-based storage)
- Handles subscriptions, preferences, and unsubscribes
- Tracks campaign performance
- Provides statistics and export functionality

**Note**: Currently uses file-based JSON storage. For production, integrate with:
- MongoDB
- PostgreSQL
- Firebase
- AWS DynamoDB

#### EmailService Class
- Sends emails via SMTP or SendGrid
- Renders email templates with dynamic variables
- Handles various email types (welcome, promotional, transactional)
- Manages bulk email sending

## Email Providers

### SMTP (Gmail, Custom Servers)

**Setup Gmail:**
1. Enable 2-Factor Authentication on your Google Account
2. Generate an App-Specific Password: https://myaccount.google.com/apppasswords
3. Configure in `.env`:
   ```
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-specific-password
   ```

### SendGrid

**Setup SendGrid:**
1. Create a SendGrid account: https://sendgrid.com
2. Get your API key: https://app.sendgrid.com/settings/api_keys
3. Configure in `.env`:
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
   ```

## Security & Best Practices

### ✅ Implemented Features

1. **Rate Limiting**: Contact and subscription endpoints are rate-limited
2. **Input Sanitization**: All user inputs are sanitized
3. **reCAPTCHA Integration**: Prevents spam subscriptions
4. **GDPR Compliance**: One-click unsubscribe with unique tokens
5. **Email Validation**: Validates email format before storing
6. **Duplicate Prevention**: Prevents duplicate subscriptions
7. **Bounce & Complaint Tracking**: Marks problematic emails
8. **Data Encryption**: Sensitive data handled securely

### 🔒 Production Recommendations

1. **Add Authentication**: Protect admin endpoints with JWT or API keys
   ```javascript
   // Example: Add middleware to admin routes
   const adminAuth = (req, res, next) => {
     const apiKey = req.headers['x-api-key'];
     if (apiKey !== process.env.ADMIN_API_KEY) {
       return res.status(401).json({ error: 'Unauthorized' });
     }
     next();
   };
   ```

2. **Use Database**: Replace JSON file storage with MongoDB or PostgreSQL
   ```javascript
   // Would involve integrating a database driver
   // and updating EmailSubscriber class
   ```

3. **Enable HTTPS**: Always use HTTPS in production

4. **Monitor Email Deliverability**: Implement webhook handlers for:
   - Bounces
   - Complaints
   - Delivery confirmations

5. **Schedule Campaigns**: Use a job scheduler (node-cron, Bull) for:
   - Sending scheduled campaigns
   - Re-engagement campaigns
   - Automated follow-ups

## Email Templates

All templates are located in `/templates/emails/` and use a simple variable system:

```html
<p>Hello {{firstName}},</p>
<p><a href="{{unsubscribeLink}}">Unsubscribe</a></p>
```

### Available Variables

- `{{firstName}}` - Subscriber's first name
- `{{lastName}}` - Subscriber's last name
- `{{email}}` - Subscriber's email
- `{{unsubscribeLink}}` - Unsubscribe URL
- `{{campaignId}}` - Campaign ID
- `{{subscriberId}}` - Subscriber ID

### Adding New Templates

1. Create HTML file in `/templates/emails/`
2. Use template variables (`{{variableName}}`)
3. Reference in API calls by template filename

Example: Create `/templates/emails/birthday-offer.html`
```javascript
await emailService.sendCustomEmail(subscriber, {
  template: 'birthday-offer',
  subject: 'Your Special Birthday Offer!',
  variables: { discount: '25%' }
});
```

## Monitoring & Analytics

### View Recent Activity
```bash
curl http://localhost:3000/api/email/stats
```

### Track Campaign Performance
- Open rates
- Click-through rates
- Bounce rates
- Unsubscribe rates

### Email Logs
All email activities are logged to `/data/email-logs.json`:
- Subscriptions
- Unsubscriptions
- Email sends
- Opens & clicks
- Bounces & complaints

## Integration Examples

### Subscribe Button on Frontend
```html
<form id="subscribeForm">
  <input type="email" id="email" required>
  <input type="text" id="firstName" placeholder="First Name">
  <input type="text" id="lastName" placeholder="Last Name">
  <button type="submit">Subscribe</button>
</form>

<script>
  document.getElementById('subscribeForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const response = await fetch('/api/email/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: document.getElementById('email').value,
        firstName: document.getElementById('firstName').value,
        lastName: document.getElementById('lastName').value,
        preferences: {
          marketing: true,
          newsletter: true,
          promotions: true
        }
      })
    });
    
    const data = await response.json();
    if (response.ok) {
      alert('Successfully subscribed!');
    } else {
      alert('Error: ' + data.message);
    }
  });
</script>
```

### Send Email on Order Completion
```javascript
// In your checkout handler
app.post('/api/checkout', checkoutLimiter, asyncHandler(async (req, res) => {
  // ... process payment ...
  
  // After successful payment:
  const order = {
    id: orderId,
    date: new Date(),
    items: cartItems,
    total: totalAmount,
    trackingUrl: `${process.env.APP_URL}/orders/${orderId}`
  };
  
  await fetch('/api/email/order-confirmation', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: customerEmail, order })
  });
}));
```

## Troubleshooting

### Emails Not Sending

1. **Check Email Configuration**
   - Verify `.env` has correct SMTP or SendGrid credentials
   - Run test: `curl -X POST http://localhost:3000/api/email/test`

2. **Check Server Logs**
   - Look for error messages in console
   - Email service logs failures with details

3. **Verify Email Provider**
   - Gmail: Ensure App-Specific Password is used
   - SendGrid: Verify API key is valid

### Low Delivery Rate

1. Check bounce/complaint logs
2. Implement email authentication (SPF, DKIM, DMARC)
3. Monitor sender reputation with ISPs
4. Clean subscriber list regularly

### Template Issues

1. Ensure template files are in `/templates/emails/`
2. Check variable names are correct (case-sensitive)
3. Test with `/api/email/test` endpoint

## Next Steps

1. **Install Dependencies**: `npm install`
2. **Configure Environment**: Copy `.env.example` to `.env` and fill in values
3. **Test Email Service**: Use `/api/email/test` endpoint
4. **Add Subscribe Form**: Add signup form to your website
5. **Create Campaigns**: Use admin endpoints to send campaigns
6. **Monitor Performance**: Check `/api/email/stats` regularly

## Support

For questions or issues:
- Check email logs: `/data/email-logs.json`
- Test with `/api/email/test` endpoint
- Verify environment configuration
- Check server console for error messages

---

**Version**: 1.0  
**Last Updated**: January 2025  
**Maintainer**: Sisters Promise Team
