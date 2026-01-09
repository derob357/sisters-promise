# Square Payment Integration Setup Guide

This guide explains how to set up and configure the Square payment integration for Sisters Promise.

## Overview

The Square integration allows Sisters Promise to:
- Display products from your Square Catalog on the website
- Process payments directly through Square
- Manage inventory and orders through Square
- Link to your Square shop at https://sisters-promise-inc.square.site/s/shop

## Prerequisites

Before you begin, you'll need:
1. A Square account (https://squareup.com)
2. Square Location ID
3. Square Access Token
4. Square Application ID

## Getting Your Square Credentials

### Step 1: Square Account Setup

1. Go to [Square Dashboard](https://squareup.com/dashboard)
2. Log in to your Sisters Promise account
3. Navigate to **Developer** → **Applications**

### Step 2: Create or Select an Application

1. Click **+ New Application**
2. Name it: `Sisters Promise`
3. Select **Web** as the application type
4. Click **Create Application**

### Step 3: Get Your Credentials

From the Application page, you'll find:

**Access Token:**
- Go to **Credentials** tab
- Under "Access Token", click **Show**
- Copy the access token (starts with `sq0atp_...`)
- This is your `SQUARE_ACCESS_TOKEN`

**Application ID:**
- On the same page, find "Application ID"
- Copy this value
- This is your `SQUARE_APPLICATION_ID`

**Location ID:**
- Go to **Locations** in the Developer menu
- Click on your Sisters Promise location
- Copy the "Location ID"
- This is your `SQUARE_LOCATION_ID`

### Step 4: Environment Configuration

Create a `.env` file in the project root:

```bash
# Copy .env.example (or create new)
cp .env.example .env
```

Edit `.env` and add your Square credentials:

```env
# Square API Configuration for Sisters Promise
SQUARE_APPLICATION_ID=your_app_id_here
SQUARE_ACCESS_TOKEN=your_access_token_here
SQUARE_LOCATION_ID=your_location_id_here
SQUARE_ENVIRONMENT=sandbox
NODE_ENV=development
PORT=3000
```

**Important:** Keep `.env` private! It's protected by `.gitignore` and should never be committed to git.

## Installation

### Step 1: Install Dependencies

```bash
cd /Users/drob/Documents/SistersPromise
npm install
```

This installs:
- `express` - Web server framework
- `cors` - Cross-origin resource sharing
- `dotenv` - Environment variable management
- `square` - Square SDK
- `uuid` - Unique identifier generation
- `concurrently` - Run multiple processes simultaneously

### Step 2: Update HTML Files

Your `index.html` and `pages/shop.html` need to include the Square integration script:

```html
<script src="./assets/js/square-integration.js"></script>
```

To display products, add this container where you want products to appear:

```html
<div id="square-products" class="row"></div>
```

The script will automatically populate this container with your Square products.

## Running the Integration

### Option 1: Development Mode (Recommended)

Starts both the backend server and frontend simultaneously:

```bash
npm run dev
```

This will:
- Start Express server on http://localhost:3000
- Open the website in your default browser

### Option 2: Backend Only

Just run the API server:

```bash
npm run server
```

Server runs on http://localhost:3000

### Option 3: Frontend Only

Just run the website:

```bash
npm start
```

Website opens in browser (no backend available)

## API Endpoints

### GET /api/health

Health check endpoint to verify server is running.

**Request:**
```bash
curl http://localhost:3000/api/health
```

**Response:**
```json
{
  "status": "ok",
  "message": "Sisters Promise Square integration is running",
  "environment": "sandbox"
}
```

### GET /api/products

Fetch all products from your Square Catalog.

**Request:**
```bash
curl http://localhost:3000/api/products
```

**Response:**
```json
{
  "success": true,
  "count": 3,
  "products": [
    {
      "id": "NCHK2RLTLG3PZPZ5H6I2OPBY",
      "name": "Sea Moss Soap",
      "description": "Natural handmade sea moss soap",
      "variations": [
        {
          "itemVariationData": {
            "priceMoney": {
              "amount": 1299,
              "currency": "USD"
            }
          }
        }
      ],
      "imageUrl": "https://square-production-s3.amazonaws.com/...",
      "categoryId": "..."
    }
  ]
}
```

### GET /api/products/:id

Fetch a single product by ID.

**Request:**
```bash
curl http://localhost:3000/api/products/NCHK2RLTLG3PZPZ5H6I2OPBY
```

**Response:**
```json
{
  "success": true,
  "product": {
    "id": "NCHK2RLTLG3PZPZ5H6I2OPBY",
    "name": "Sea Moss Soap",
    "description": "Natural handmade sea moss soap",
    "variations": [...],
    "imageUrl": "...",
    "categoryId": "..."
  }
}
```

### POST /api/checkout

Process a payment through Square.

**Request:**
```bash
curl -X POST http://localhost:3000/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "sourceId": "nonce_from_square_web_payments",
    "amount": 1299,
    "currency": "USD",
    "note": "Sisters Promise purchase"
  }'
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "wQJbSEA5bKHJfFEo2cUnJLKMYR5ZY",
    "amount_money": {
      "amount": 1299,
      "currency": "USD"
    },
    "status": "COMPLETED"
  }
}
```

## JavaScript Usage

### Fetch All Products

```javascript
SquareIntegration.fetchProducts()
  .then(products => {
    console.log('Products:', products);
  });
```

### Render Products to Page

```javascript
// Render 6 products to container with id "square-products"
SquareIntegration.renderProducts('square-products', 6);
```

### Fetch Single Product

```javascript
SquareIntegration.fetchProduct('PRODUCT_ID')
  .then(product => {
    console.log('Product:', product);
  });
```

### Process Payment

```javascript
SquareIntegration.processPayment(sourceId, amount)
  .then(result => {
    console.log('Payment successful:', result);
  })
  .catch(error => {
    console.error('Payment failed:', error);
  });
```

## Environments

### Sandbox (Development)

Used for testing without real transactions.

```env
SQUARE_ENVIRONMENT=sandbox
```

### Production

Used for real transactions with real money.

```env
SQUARE_ENVIRONMENT=production
```

**Important:** Only use production credentials with a production backend!

## Troubleshooting

### Server won't start

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:** Port 3000 is already in use. Either:
1. Kill the process using port 3000: `lsof -i :3000` then `kill -9 <PID>`
2. Change PORT in .env to a different number

### Products not loading

Check these:
1. **Is the server running?** Run `npm run server` in another terminal
2. **Are credentials correct?** Verify `SQUARE_ACCESS_TOKEN` and `SQUARE_APPLICATION_ID` in `.env`
3. **Do you have products in Square?** Log in to Square and add products to your catalog
4. **Check browser console** for error messages (F12 → Console)

### CORS errors

If you see CORS errors in the browser console:
1. Ensure the server is running on http://localhost:3000
2. Verify `cors` is installed: `npm ls cors`
3. Restart the server

### Authentication errors

If you see "401 Unauthorized" errors:
1. Check that your `SQUARE_ACCESS_TOKEN` is correct in `.env`
2. Verify you're not mixing sandbox and production tokens/credentials
3. Regenerate the access token in Square Dashboard if it expired

## File Structure

```
/Users/drob/Documents/SistersPromise/
├── server.js                      # Express backend server
├── package.json                   # Dependencies and npm scripts
├── .env                          # Secret credentials (local only)
├── .env.example                  # Credentials template (safe to commit)
├── .gitignore                    # Protects .env from git
├── index.html                    # Home page
├── pages/shop.html               # Shop page
└── assets/
    └── js/
        └── square-integration.js  # Frontend API client
```

## Security Best Practices

1. **Never commit `.env`** - It's protected by `.gitignore`
2. **Keep tokens secret** - Don't share or post your access token
3. **Rotate tokens regularly** - Regenerate in Square Dashboard periodically
4. **Use environment variables** - Never hardcode credentials in code
5. **HTTPS only in production** - Always use secure connections
6. **Validate server-side** - Never trust client-side payment data

## Next Steps

1. Add your Square credentials to `.env`
2. Run `npm install` to install dependencies
3. Start the server with `npm run dev`
4. Verify products load on `http://localhost:3000`
5. Test the integration with your Sisters Promise products
6. Deploy to production when ready

## Support

For issues or questions:
- Square Developer Support: https://developer.squareup.com/docs
- Square Community: https://www.reddit.com/r/Square
- GitHub Issues: https://github.com/derob357/sisters-promise/issues

## Additional Resources

- [Square Web Payments SDK](https://developer.squareup.com/reference/sdks/web/payments)
- [Square Catalog API](https://developer.squareup.com/reference/square/catalog-api)
- [Square Payments API](https://developer.squareup.com/reference/square/payments-api)
- [Square Node.js SDK](https://github.com/squareup/square-nodejs-sdk)
