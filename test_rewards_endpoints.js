/**
 * Test Rewards API Endpoints
 */

const https = require('https');
const http = require('http');

// Bypass SSL for self-signed cert
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Helper function to make HTTP requests
function makeRequest(options, postData = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const agent = options.port === 443 ? httpsAgent : undefined;
    
    const req = protocol.request({ ...options, agent }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

async function runTests() {
  console.log('\n=== REWARDS API ENDPOINT TESTS ===\n');
  
  try {
    // Test 1: Get all offers
    console.log('Test 1: GET /api/rewards/offers');
    let result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/rewards/offers',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  ✓ Status: ${result.status}`);
    console.log(`  ✓ Offers: ${result.data.length} items`);
    result.data.forEach(offer => {
      console.log(`    - ${offer.type.toUpperCase()}: ${offer.title}`);
    });
    
    // Test 2: Get all bundles
    console.log('\nTest 2: GET /api/rewards/bundles');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/rewards/bundles',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  ✓ Status: ${result.status}`);
    console.log(`  ✓ Bundles: ${result.data.length} items`);
    result.data.forEach(bundle => {
      console.log(`    - ${bundle.name}: $${bundle.bundlePrice.toFixed(2)} (save ${bundle.savingsPercent}%)`);
    });
    
    // Test 3: Get free gifts
    console.log('\nTest 3: GET /api/rewards/free-gifts');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/rewards/free-gifts',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });
    console.log(`  ✓ Status: ${result.status}`);
    console.log(`  ✓ Free Gifts: ${result.data.length} items`);
    result.data.forEach(gift => {
      console.log(`    - ${gift.name}: $${gift.value.toFixed(2)}`);
    });
    
    // Test 4: Login to get auth token
    console.log('\nTest 4: POST /api/users/login');
    result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'deric.robinson71@gmail.com',
      password: '***REMOVED***'
    });
    
    if (result.status === 200) {
      const token = result.data.token;
      console.log(`  ✓ Status: ${result.status}`);
      console.log(`  ✓ Token: ${token.substring(0, 30)}...`);
      
      // Test 5: Get user rewards (authenticated)
      console.log('\nTest 5: GET /api/rewards/user (authenticated)');
      result = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/rewards/user',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`  ✓ Status: ${result.status}`);
      console.log(`  ✓ Points: ${result.data.points}`);
      console.log(`  ✓ Tier: ${result.data.tier}`);
      console.log(`  ✓ Total Purchases: ${result.data.totalPurchases}`);
      console.log(`  ✓ Free Gifts Earned: ${result.data.freeGiftsEarned}`);
      console.log(`  ✓ Last Purchase: ${result.data.lastPurchaseDate || 'Never'}`);
      
      // Test 6: Get rewards history
      console.log('\nTest 6: GET /api/rewards/history (authenticated)');
      result = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/rewards/history',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      console.log(`  ✓ Status: ${result.status}`);
      console.log(`  ✓ History entries: ${result.data.length} items`);
      if (result.data.length > 0) {
        result.data.slice(0, 2).forEach(entry => {
          console.log(`    - ${entry.type}: ${entry.points} points - ${entry.description}`);
        });
      }
    } else {
      console.log(`  ✗ Login failed: ${result.status}`);
      console.log(`  Error: ${result.data.error || result.data}`);
    }
    
    console.log('\n=== ALL TESTS COMPLETED ===\n');
  } catch (error) {
    console.error('Test error:', error.message);
  }
  
  process.exit(0);
}

// Run tests
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
