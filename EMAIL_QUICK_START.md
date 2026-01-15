# Email Marketing System - Quick Start

## 1. Install Dependencies

```bash
npm install
```

This installs:
- `nodemailer` - Email sending via SMTP
- `nodemailer-sendgrid-transport` - SendGrid integration

## 2. Configure Email Provider

### Option A: Gmail (Easiest for Development)

1. Generate App-Specific Password:
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Windows Computer"
   - Google generates a 16-character password

2. Update `.env`:
   ```
   EMAIL_PROVIDER=smtp
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-gmail@gmail.com
   SMTP_PASSWORD=your-app-specific-password
   ```

### Option B: SendGrid (Recommended for Production)

1. Create SendGrid account: https://sendgrid.com
2. Get API key: https://app.sendgrid.com/settings/api_keys
3. Update `.env`:
   ```
   EMAIL_PROVIDER=sendgrid
   SENDGRID_API_KEY=SG.your_api_key_here
   ```

## 3. Test Email Configuration

```bash
curl -X POST http://localhost:3000/api/email/test \
  -H "Content-Type: application/json" \
  -d '{"email":"your-email@gmail.com","templateId":"welcome"}'
```

Check your email inbox!

## 4. Add Subscription Form to Website

Add to your HTML:

```html
<form id="emailForm">
  <input type="email" id="email" placeholder="Email" required>
  <input type="text" id="firstName" placeholder="First Name">
  <button type="submit">Subscribe</button>
</form>

<script>
  document.getElementById('emailForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const response = await fetch('/api/email/subscribe', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: document.getElementById('email').value,
        firstName: document.getElementById('firstName').value,
        preferences: {
          marketing: true,
          newsletter: true,
          promotions: true
        }
      })
    });
    const data = await response.json();
    alert(data.message);
  });
</script>
```

## 5. Send Your First Campaign

```bash
# Create a campaign
curl -X POST http://localhost:3000/api/admin/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "name":"My First Newsletter",
    "subject":"Welcome to Sisters Promise!",
    "templateId":"newsletter",
    "type":"newsletter"
  }'

# Copy the campaign ID from response, then send it:
curl -X POST http://localhost:3000/api/admin/campaigns/{campaignId}/send \
  -H "Content-Type: application/json" \
  -d '{"filterType":"newsletter"}'
```

## 6. Check Statistics

```bash
curl http://localhost:3000/api/email/stats
```

## Common API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/email/subscribe` | POST | Add subscriber |
| `/api/email/stats` | GET | View statistics |
| `/api/email/test` | POST | Send test email |
| `/api/admin/campaigns` | POST | Create campaign |
| `/api/admin/campaigns/{id}/send` | POST | Send campaign |
| `/api/email/export` | GET | Export subscribers CSV |

## Data Storage

- **Subscribers**: `/data/subscribers.json`
- **Campaigns**: `/data/campaigns.json`
- **Logs**: `/data/email-logs.json`

These are created automatically on first use.

## Next Steps

1. ✅ Install dependencies
2. ✅ Configure email provider
3. ✅ Test email system
4. ✅ Add signup form to website
5. ✅ Create and send first campaign
6. ⏭️ Monitor performance with `/api/email/stats`

## Troubleshooting

**Emails not sending?**
- Check `.env` configuration
- Run test endpoint: `/api/email/test`
- Check console for error messages

**Need help?**
- See `EMAIL_MARKETING_GUIDE.md` for detailed documentation
- Check `/data/email-logs.json` for activity history
