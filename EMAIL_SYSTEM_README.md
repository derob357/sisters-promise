# Email Marketing & Customer List System

A production-ready, reliable email marketing and subscriber management system for the Sisters Promise app.

## 🎯 What This Does

Manages your customer email list and sends marketing campaigns. All done reliably and securely.

**Key Features:**
- ✅ Maintain customer email list
- ✅ Send newsletters and promotions  
- ✅ Track campaign performance
- ✅ Send order confirmations
- ✅ GDPR compliant (one-click unsubscribe)
- ✅ Secure and rate-limited
- ✅ Works with Gmail or SendGrid

## 🚀 Quick Start (5 Minutes)

1. **Install**
   ```bash
   npm install
   ```

2. **Configure** (copy `.env.example` to `.env` and add your email provider)
   ```bash
   cp .env.example .env
   # Edit .env - add Gmail or SendGrid credentials
   ```

3. **Test**
   ```bash
   npm start
   # In another terminal:
   curl -X POST http://localhost:3000/api/email/test \
     -H "Content-Type: application/json" \
     -d '{"email":"your-email@gmail.com","templateId":"welcome"}'
   ```

Check your email inbox for the test!

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| `EMAIL_QUICK_START.md` | 5-minute setup guide |
| `EMAIL_API_REFERENCE.md` | API endpoints & examples |
| `EMAIL_MARKETING_GUIDE.md` | Complete guide (300+ lines) |
| `EMAIL_SETUP_CHECKLIST.md` | Implementation steps |
| `EMAIL_IMPLEMENTATION_SUMMARY.md` | What was built & architecture |

**Start with**: `EMAIL_QUICK_START.md`

## 📦 What's Included

### Core System
- **EmailSubscriber** - Manages subscriber list and campaigns
- **EmailService** - Sends emails via SMTP/SendGrid
- **5 Email Templates** - Welcome, newsletter, promo, order, cart reminder

### API Endpoints (13 Total)
- Subscribe/unsubscribe users
- Manage preferences
- Create & send campaigns
- Send promotions
- Send order confirmations
- Track statistics

### Security Features
- Rate limiting
- Input validation
- Email validation
- reCAPTCHA integration
- Duplicate prevention
- GDPR compliance
- Activity logging

## 🔧 Email Providers

### Gmail (Best for Development)
```env
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=app-specific-password
```

### SendGrid (Best for Production)
```env
EMAIL_PROVIDER=sendgrid
SENDGRID_API_KEY=SG.your_api_key
```

## 💡 Common Tasks

### Add Email Signup Form
```html
<form id="subscribe">
  <input type="email" placeholder="Email" required>
  <button type="submit">Subscribe</button>
</form>

<script>
  document.getElementById('subscribe').addEventListener('submit', async (e) => {
    e.preventDefault();
    await fetch('/api/email/subscribe', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({
        email: e.target[0].value,
        preferences: {marketing: true, newsletter: true}
      })
    });
    alert('Subscribed!');
  });
</script>
```

### Create & Send Newsletter
```bash
# Create campaign
CAMPAIGN_ID=$(curl -X POST http://localhost:3000/api/admin/campaigns \
  -H "Content-Type: application/json" \
  -d '{"name":"Newsletter","subject":"News","templateId":"newsletter"}' \
  | jq -r '.campaign.id')

# Send campaign
curl -X POST http://localhost:3000/api/admin/campaigns/$CAMPAIGN_ID/send \
  -H "Content-Type: application/json" \
  -d '{"filterType":"newsletter"}'
```

### Send Promotion
```bash
curl -X POST http://localhost:3000/api/admin/promotions/send \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sale!",
    "description": "20% off!",
    "code": "SALE20"
  }'
```

## 📊 API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/email/subscribe` | POST | Add subscriber |
| `/api/email/stats` | GET | View statistics |
| `/api/email/test` | POST | Send test email |
| `/api/admin/campaigns` | POST | Create campaign |
| `/api/admin/campaigns/{id}/send` | POST | Send campaign |
| `/api/admin/promotions/send` | POST | Send promotion |
| `/api/email/order-confirmation` | POST | Send order email |
| `/api/email/abandoned-cart` | POST | Send cart reminder |

See `EMAIL_API_REFERENCE.md` for complete documentation.

## 📁 File Structure

```
/models
  └── EmailSubscriber.js              # Subscriber management
/services
  └── EmailService.js                 # Email sending
/templates/emails
  ├── welcome.html                    # Welcome email
  ├── newsletter.html                 # Newsletter
  ├── promotion.html                  # Promotions
  ├── order-confirmation.html         # Orders
  └── abandoned-cart.html             # Cart reminders
/data
  ├── subscribers.json                # Auto-created
  ├── campaigns.json                  # Auto-created
  └── email-logs.json                 # Auto-created
```

## 🔒 Security

✅ Implemented:
- Rate limiting on all endpoints
- Input sanitization
- Email validation
- reCAPTCHA protection
- GDPR compliance (one-click unsubscribe)
- Bounce & complaint tracking
- Activity logging

## 📈 Get Started

1. Read `EMAIL_QUICK_START.md` (5 minutes)
2. Configure `.env` file
3. Run `npm start`
4. Test with `/api/email/test`
5. Add signup form to website
6. Send your first campaign!

## 🆘 Need Help?

- **Setup issues**: See `EMAIL_QUICK_START.md`
- **API questions**: See `EMAIL_API_REFERENCE.md`
- **Best practices**: See `EMAIL_MARKETING_GUIDE.md`
- **Architecture**: See `EMAIL_IMPLEMENTATION_SUMMARY.md`

## 📊 Data Storage

- **Development**: JSON files in `/data/`
- **Production**: Upgrade to MongoDB or PostgreSQL

## 🎓 Learn More

- [Nodemailer Documentation](https://nodemailer.com/)
- [SendGrid Documentation](https://sendgrid.com/docs/)
- [Email Best Practices](https://www.campaignmonitor.com/best-practices/)

## ✨ Features at a Glance

| Feature | Status |
|---------|--------|
| Subscriber management | ✅ Complete |
| Email templates | ✅ 5 templates |
| Newsletter campaigns | ✅ Complete |
| Promotional emails | ✅ Complete |
| Order confirmations | ✅ Complete |
| Cart reminders | ✅ Complete |
| Statistics & tracking | ✅ Complete |
| GDPR compliance | ✅ Complete |
| Security | ✅ Complete |
| Documentation | ✅ Complete |
| Admin dashboard | ⏭️ Future |
| A/B testing | ⏭️ Future |
| Advanced segmentation | ⏭️ Future |

## 📞 Questions?

Check the documentation files first! They cover:
- Installation & setup
- API endpoints & examples
- Security best practices
- Troubleshooting
- Architecture & design

---

**Status**: ✅ Production Ready

**Version**: 1.0

**Created**: January 15, 2025

**Ready to start building your customer relationships!** 🚀
