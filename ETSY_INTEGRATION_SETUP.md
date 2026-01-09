# Sisters Promise - Etsy API Integration Setup

## Overview
This setup allows Sisters Promise to automatically pull product listings, images, and details directly from the Etsy shop.

## Prerequisites
1. Node.js (v14 or higher)
2. Etsy Developer Account
3. Etsy App credentials

## Step 1: Get Etsy API Credentials

1. Go to https://www.etsy.com/developers
2. Sign in with your Etsy seller account
3. Create a new app:
   - App name: "Sisters Promise Website"
   - App description: "E-commerce integration for Sisters Promise skincare products"
   - Accept the terms and create the app
4. Copy your **API Key** from the app credentials
5. Find your **Shop ID**:
   - Go to Shop Settings → Info & Appearance
   - Your Shop ID is visible in the URL or shop details

## Step 2: Configure Environment Variables

1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and add your credentials:
   ```
   ETSY_API_KEY=your_actual_etsy_api_key_here
   ETSY_SHOP_ID=your_actual_shop_id_here
   NODE_ENV=development
   PORT=3000
   ```

**⚠️ Important:** Never commit the `.env` file to git. It's already in `.gitignore`.

## Step 3: Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (backend server)
- CORS (cross-origin requests)
- dotenv (environment variables)
- node-fetch (HTTP requests)
- concurrently (run multiple commands)

## Step 4: Running the Integration

### Option 1: Development Mode (Recommended)
Run both the API server and the website together:

```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3000
- Frontend development server with file watching

### Option 2: Server Only
If you just want to run the API:

```bash
npm run server
```

The API will be available at `http://localhost:3000`

### Option 3: Website Only (No Etsy Integration)
Run the website without the backend:

```bash
npm start
```

## API Endpoints

Once the server is running, you can access:

### Get All Products
```
GET http://localhost:3000/api/products
```

Returns all active listings from your Etsy shop with:
- Product ID
- Title
- Description
- Price
- Currency
- Product images
- Etsy shop URL
- Tags

**Example Response:**
```json
{
  "success": true,
  "count": 12,
  "products": [
    {
      "id": 1234567890,
      "title": "Sea Moss Soap",
      "description": "Handmade organic sea moss soap...",
      "price": 14.99,
      "currency": "USD",
      "url": "https://www.etsy.com/listing/1234567890",
      "images": [...],
      "tags": ["soap", "organic", "sea moss"]
    },
    ...
  ]
}
```

### Get Single Product
```
GET http://localhost:3000/api/products/:listing_id
```

### Health Check
```
GET http://localhost:3000/api/health
```

## Using in Your Website

### Automatic Product Rendering
Add this script to any page where you want products displayed:

```html
<div id="etsy-products"></div>

<script src="./assets/js/etsy-integration.js"></script>
```

The products will automatically load and display from your Etsy shop.

### Custom Implementation
Use the JavaScript API:

```javascript
// Fetch all products
const products = await EtsyIntegration.fetchProducts();

// Fetch single product
const product = await EtsyIntegration.fetchProduct(listing_id);

// Render products to container
await EtsyIntegration.renderProducts('container-id', 6);
```

## Updating Shop Pages

### Home Page (index.html)
Replace featured products section:
```html
<section id="featured" class="py-5">
  <div class="container">
    <div id="etsy-products"></div>
  </div>
</section>
<script src="./assets/js/etsy-integration.js"></script>
```

### Shop Page (pages/shop.html)
Replace the static product cards with:
```html
<div id="etsy-products"></div>
<script src="../assets/js/etsy-integration.js"></script>
```

## Troubleshooting

### "Etsy API credentials not configured"
- Make sure `.env` file exists in the project root
- Verify `ETSY_API_KEY` and `ETSY_SHOP_ID` are set correctly
- Restart the server after changing `.env`

### "HTTP 403 - Forbidden"
- Your API key may be invalid or expired
- Check that you have the correct API key from Etsy
- Verify your shop ID is correct

### Products not loading
- Check browser console for errors
- Verify the API server is running: `curl http://localhost:3000/api/health`
- Make sure `.env` file is in the project root, not in a subdirectory

### CORS errors
- The API should handle CORS automatically
- If you still get errors, check that the frontend is accessing `http://localhost:3000`

## Security Notes

1. **Never commit your `.env` file** - API keys should never be in git
2. **Use environment variables** - All sensitive data should be in `.env`
3. **API key rotation** - If you suspect your API key is compromised, regenerate it in Etsy Developer Dashboard
4. **Production deployment** - Use environment variables or secure secret management services (Heroku Config Vars, AWS Secrets Manager, etc.)

## Next Steps

1. Get your Etsy API credentials
2. Create `.env` file with your credentials
3. Run `npm install`
4. Run `npm run dev`
5. Visit http://localhost:3000 and verify products are loading
6. Update the shop and home pages to use the automatic product integration

## Support

For issues with:
- **Etsy API**: https://developer.etsy.com/documentation
- **Express.js**: https://expressjs.com
- **This integration**: Check the troubleshooting section above
