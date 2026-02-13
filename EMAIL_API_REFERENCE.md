# Email Marketing API - Quick Reference

## Subscriber Management

### Subscribe to Newsletter
```
POST /api/email/subscribe
Content-Type: application/json

{
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
}

Response: 201 Created
{
  "success": true,
  "message": "Successfully subscribed!",
  "subscriberId": "abc123def456",
  "email": "customer@example.com"
}
```

### Get Subscriber Info
```
GET /api/email/subscriber/customer@example.com

Response: 200 OK
{
  "success": true,
  "subscriber": {
    "id": "abc123def456",
    "email": "customer@example.com",
    "firstName": "Jane",
    "lastName": "Doe",
    "status": "active",
    "preferences": {...},
    "subscriptionDate": "2025-01-15T10:00:00Z"
  }
}
```

### Update Preferences
```
POST /api/email/update/customer@example.com
Content-Type: application/json

{
  "preferences": {
    "marketing": false,
    "newsletter": true,
    "promotions": true
  }
}

Response: 200 OK
{
  "success": true,
  "message": "Preferences updated successfully",
  "subscriber": {
    "email": "customer@example.com",
    "preferences": {...}
  }
}
```

### Unsubscribe (One-Click)
```
GET /api/email/unsubscribe/token_xyz123

Response: 200 OK (HTML page)
✓ Unsubscribed
You have been successfully unsubscribed from Sister's Promise emails.
```

### Get Statistics
```
GET /api/email/stats

Response: 200 OK
{
  "success": true,
  "subscribers": {
    "total": 1250,
    "active": 1180,
    "unsubscribed": 50,
    "bounced": 20,
    "complained": 0,
    "subscriptionRate": "94.40%"
  },
  "campaigns": {
    "totalCampaigns": 5,
    "sentCampaigns": 3,
    "draftCampaigns": 1,
    "scheduledCampaigns": 1,
    "totalOpens": 450,
    "totalClicks": 120,
    "avgOpenRate": "150.00",
    "avgClickRate": "40.00"
  },
  "timestamp": "2025-01-15T10:00:00Z"
}
```

### Export Subscribers
```
GET /api/email/export

Response: 200 OK (CSV file)
Email,First Name,Last Name,Status,Subscription Date,Marketing,Newsletter,Promotions
customer1@example.com,"Jane","Doe","active","2025-01-15T10:00:00Z","Yes","Yes","Yes"
customer2@example.com,"John","Smith","active","2025-01-14T09:30:00Z","No","Yes","Yes"
```

---

## Email Testing

### Send Test Email
```
POST /api/email/test
Content-Type: application/json

{
  "email": "your-email@example.com",
  "templateId": "welcome"
}

Response: 200 OK
{
  "success": true,
  "message": "Test email sent to your-email@example.com",
  "template": "welcome"
}

Available Templates:
- welcome
- newsletter
- promotion
- order-confirmation
- abandoned-cart
```

---

## Campaign Management

### Create Campaign
```
POST /api/admin/campaigns
Content-Type: application/json

{
  "name": "Summer Newsletter",
  "subject": "Amazing Summer Products & Tips",
  "templateId": "newsletter",
  "type": "newsletter",
  "scheduleTime": "2025-08-15T10:00:00Z"
}

Response: 201 Created
{
  "success": true,
  "message": "Campaign created successfully",
  "campaign": {
    "id": "camp_xyz789",
    "name": "Summer Newsletter",
    "subject": "Amazing Summer Products & Tips",
    "status": "draft",
    "createdAt": "2025-01-15T10:00:00Z",
    "sentAt": null,
    "recipientCount": 0,
    "openCount": 0,
    "clickCount": 0
  }
}
```

### Get Campaign
```
GET /api/admin/campaigns/camp_xyz789

Response: 200 OK
{
  "success": true,
  "campaign": {
    "id": "camp_xyz789",
    "name": "Summer Newsletter",
    "status": "draft",
    "subject": "Amazing Summer Products & Tips",
    "templateId": "newsletter",
    "type": "newsletter",
    "createdAt": "2025-01-15T10:00:00Z",
    "sentAt": null,
    "recipientCount": 0,
    "openCount": 0,
    "clickCount": 0,
    "bounceCount": 0,
    "unsubscribeCount": 0
  }
}
```

### Send Campaign
```
POST /api/admin/campaigns/camp_xyz789/send
Content-Type: application/json

{
  "filterType": "newsletter"
}

Filter Types:
- all                  (All active subscribers)
- newsletter          (Newsletter preference enabled)
- marketing           (Marketing preference enabled)
- promotions          (Promotions preference enabled)
- productUpdates      (Product updates preference enabled)

Response: 200 OK
{
  "success": true,
  "message": "Campaign sent to 1180 subscribers",
  "campaign": {
    "id": "camp_xyz789",
    "status": "sent",
    "sentAt": "2025-01-15T10:30:00Z",
    "recipientCount": 1180,
    "openCount": 0,
    "clickCount": 0
  },
  "details": {
    "successful": 1180,
    "failed": 0,
    "total": 1180
  }
}
```

---

## Promotional Emails

### Send Promotion
```
POST /api/admin/promotions/send
Content-Type: application/json

{
  "title": "Summer Sale!",
  "description": "Get 20% off all skincare products this weekend",
  "code": "SUMMER20",
  "link": "https://sisterspromise.com/pages/shop",
  "emails": null
}

If "emails" is null, sends to all subscribers with promotions enabled.
If "emails" is provided, sends only to those specific addresses.

Response: 200 OK
{
  "success": true,
  "message": "Promotion sent to 1050 subscribers",
  "details": {
    "successful": 1050,
    "failed": 0,
    "total": 1050
  }
}
```

---

## Transactional Emails

### Order Confirmation
```
POST /api/email/order-confirmation
Content-Type: application/json

{
  "email": "customer@example.com",
  "order": {
    "id": "ORDER-123456",
    "date": "2025-01-15T10:00:00Z",
    "items": [
      {
        "name": "Sea Moss Soap",
        "quantity": 2,
        "price": 15.99
      },
      {
        "name": "Luxury Lotion",
        "quantity": 1,
        "price": 34.99
      }
    ],
    "total": 66.97,
    "trackingUrl": "https://sisterspromise.com/orders/ORDER-123456"
  }
}

Response: 200 OK
{
  "success": true,
  "message": "Order confirmation email sent",
  "email": "customer@example.com"
}
```

### Abandoned Cart Reminder
```
POST /api/email/abandoned-cart
Content-Type: application/json

{
  "email": "customer@example.com",
  "cartItems": [
    {
      "name": "Sea Moss Serum",
      "price": 34.99
    },
    {
      "name": "Body Scrub",
      "price": 24.99
    }
  ]
}

Response: 200 OK
{
  "success": true,
  "message": "Abandoned cart reminder email sent",
  "email": "customer@example.com"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Validation Error",
  "message": "Email is required"
}
```

### 409 Conflict
```json
{
  "error": "Already Subscribed",
  "message": "This email is already subscribed to our newsletter"
}
```

### 404 Not Found
```json
{
  "error": "Not Found",
  "message": "Subscriber not found"
}
```

### 500 Server Error
```json
{
  "error": "Server Error",
  "message": "Unable to retrieve subscriber information"
}
```

---

## Common Usage Patterns

### 1. Subscribe User + Send Welcome
```javascript
// 1. User fills form and submits
const response = await fetch('/api/email/subscribe', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: emailInput.value,
    firstName: nameInput.value,
    preferences: {marketing: true, newsletter: true}
  })
});

// Welcome email is sent automatically!
// Show success message to user
const data = await response.json();
console.log(data.message);
```

### 2. Create & Send Newsletter Monthly
```bash
# Monday: Create campaign
curl -X POST http://localhost:3000/api/admin/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"January Newsletter","subject":"What'\''s New","templateId":"newsletter"}'

# Copy campaign ID: camp_xyz789

# Wednesday: Review and send
curl -X POST http://localhost:3000/api/admin/campaigns/camp_xyz789/send \
  -H "Content-Type: application/json" \
  -d '{"filterType":"newsletter"}'
```

### 3. Send Promotional Campaign
```bash
curl -X POST http://localhost:3000/api/admin/promotions/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Flash Sale!",
    "description": "48 hours only - 30% off!",
    "code": "FLASH30"
  }'
```

### 4. Send Order Confirmation
```javascript
// After processing payment:
await fetch('/api/email/order-confirmation', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    email: customer.email,
    order: {
      id: orderId,
      date: new Date(),
      items: cart.items,
      total: cart.total,
      trackingUrl: `${baseUrl}/orders/${orderId}`
    }
  })
});
```

---

## Rate Limiting

Email endpoints have rate limiting:
- **General**: 100 requests per 15 minutes per IP
- **Subscribe**: 5 requests per hour per IP
- **Contact**: 5 requests per hour per IP

---

## Data Format Examples

### Subscriber Object
```json
{
  "id": "abc123def456",
  "email": "jane@example.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "preferences": {
    "marketing": true,
    "newsletter": true,
    "promotions": false,
    "productUpdates": true
  },
  "status": "active",
  "subscriptionDate": "2025-01-15T10:00:00Z",
  "lastUpdated": "2025-01-15T10:30:00Z",
  "bounced": false,
  "complained": false,
  "unsubscribeToken": "token_xyz123abc456"
}
```

### Campaign Object
```json
{
  "id": "camp_xyz789",
  "name": "Summer Newsletter",
  "subject": "Summer Products & Tips",
  "templateId": "newsletter",
  "type": "newsletter",
  "status": "sent",
  "scheduleTime": null,
  "createdAt": "2025-01-15T10:00:00Z",
  "sentAt": "2025-01-15T10:30:00Z",
  "recipientCount": 1180,
  "openCount": 450,
  "clickCount": 120,
  "bounceCount": 5,
  "complaintCount": 0,
  "unsubscribeCount": 3
}
```

---

## Tips & Best Practices

✅ **Do:**
- Test with `/api/email/test` before sending campaigns
- Segment subscribers by preferences
- Monitor stats regularly with `/api/email/stats`
- Keep email list clean (monitor bounces)
- Personalize with subscriber first names
- Include unsubscribe link (automatically added)

❌ **Don't:**
- Send to inactive subscribers
- Over-send (monitor unsubscribe rates)
- Use generic email addresses
- Send without testing first
- Ignore bounce/complaint data

---

For more information, see:
- `EMAIL_MARKETING_GUIDE.md` - Comprehensive guide
- `EMAIL_QUICK_START.md` - Setup instructions
- `EMAIL_IMPLEMENTATION_SUMMARY.md` - Architecture & features
