# Deploy Sisters Promise to Render.com

## Step-by-Step Deployment Guide

### Step 1: Prepare Your GitHub Repository
```bash
cd /Users/drob/Documents/SistersPromise
git add .
git commit -m "Prepare for Render.com deployment"
git push origin master
```

### Step 2: Create Render.com Account
1. Go to https://render.com
2. Click "Sign Up" 
3. Choose "GitHub" to sign up with your GitHub account
4. Authorize Render to access your GitHub repositories

### Step 3: Create New Web Service
1. Click "New +" button → Select "Web Service"
2. Select your `sisters-promise` repository
3. Configure the service:
   - **Name:** sisters-promise (or your preferred name)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Plan:** Free tier (sufficient for testing)

### Step 4: Set Environment Variables
In the Render dashboard, go to your service's "Environment" tab and add:

```
SQUARE_APPLICATION_ID=your_square_app_id
SQUARE_ACCESS_TOKEN=your_square_access_token
SQUARE_LOCATION_ID=your_square_location_id
SQUARE_ENVIRONMENT=sandbox (or production)
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://sisters-promise-xxxx.onrender.com
```

⚠️ **Important:** Replace the ALLOWED_ORIGINS URL with your actual Render URL (shown in dashboard after deployment)

### Step 5: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy your app
3. Wait for deployment to complete (usually 2-5 minutes)
4. Your app will be live at: `https://your-service-name.onrender.com`

### Step 6: Get Your Square & reCAPTCHA Credentials

You'll need:

**For Square:**
- Go to https://developer.squareup.com/apps
- Create a new application
- Get your Application ID, Access Token, and Location ID from the credentials tab

**For reCAPTCHA v3:**
- Go to https://www.google.com/recaptcha/admin
- Create a new site
- Add your Render domain to the domains list
- Get your Site Key and Secret Key

### Step 7: Update Environment Variables with Real Credentials
1. Go back to Render dashboard → Your service → Environment
2. Update all the placeholder credentials with real ones from Square and Google
3. Click "Save" - service will automatically redeploy

### Step 8: Test Your Deployment
- Visit your Render URL
- Test the contact form
- Check that images load correctly
- Test Shop and Ingredients pages

### Troubleshooting

**Blank page?**
- Check Render logs: Click service → "Logs" tab
- Look for errors about missing environment variables

**CSS/Images not loading?**
- Verify ALLOWED_ORIGINS in environment variables
- Check server.js static file serving configuration

**Contact form not working?**
- Verify reCAPTCHA credentials are correct
- Check API endpoints in browser console for errors

### Production Checklist

- [ ] Square credentials obtained and added
- [ ] reCAPTCHA credentials obtained and added
- [ ] ALLOWED_ORIGINS updated with actual Render URL
- [ ] NODE_ENV set to production
- [ ] All environment variables configured
- [ ] Website loads and displays correctly
- [ ] Images and CSS render properly
- [ ] Contact form works
- [ ] Shop and Ingredients pages accessible

### Redeploy After Changes

To deploy updates:
```bash
git add .
git commit -m "Your commit message"
git push origin master
```

Render will automatically redeploy within a few seconds!

### Free Tier Limits (Render)
- 750 hours/month (sufficient for most sites)
- Spins down after 15 minutes of inactivity (5-10 second cold start)
- 100GB outbound data/month

### Next Steps
- Set up a custom domain (optional) in Render settings
- Set up automatic deployments (already enabled)
- Monitor logs for any issues

---

**Need help?** Check Render's documentation: https://render.com/docs
