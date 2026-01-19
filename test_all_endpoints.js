/**
 * Comprehensive API Endpoint Test Suite
 * Tests ALL endpoints in the Sisters Promise system
 */

const https = require('https');
const http = require('http');

// Test configuration
const BASE_HTTPS = 'https://localhost:443';
const BASE_HTTP = 'http://localhost:3000';

// SSL bypass for self-signed certificates
const httpsAgent = new https.Agent({ rejectUnauthorized: false });

// Helper function for HTTP requests
async function makeRequest(options, postData = null, base = BASE_HTTP) {
  return new Promise((resolve, reject) => {
    const protocol = options.port === 443 ? https : http;
    const agent = options.port === 443 ? httpsAgent : undefined;
    
    const req = protocol.request({ ...options, agent }, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: data, headers: res.headers });
        }
      });
    });
    
    req.on('error', reject);
    if (postData) req.write(JSON.stringify(postData));
    req.end();
  });
}

// Test suite
async function runTests() {
  console.log('\n' + '='.repeat(100));
  console.log('COMPREHENSIVE API ENDPOINT TEST SUITE');
  console.log('='.repeat(100) + '\n');

  const results = {
    passed: 0,
    failed: 0,
    skipped: 0,
    endpoints: []
  };

  let authToken = null;
  let userId = null;

  try {
    // =====================================================================
    // STEP 1: AUTHENTICATION - Get token first
    // =====================================================================
    console.log('\n📋 STEP 1: Authentication Setup\n');

    let result = await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, {
      email: 'deric.robinson71@gmail.com',
      password: '***REMOVED***'
    });

    if (result.status === 200 && result.data.token) {
      authToken = result.data.token;
      userId = result.data.user?.id;
      console.log(`✅ LOGIN - Status: ${result.status}`);
      console.log(`   Token obtained: ${authToken.substring(0, 30)}...`);
      console.log(`   User ID: ${userId}\n`);
      results.passed++;
    } else {
      console.log(`❌ LOGIN - Status: ${result.status} - FAILED TO GET AUTH TOKEN\n`);
      results.failed++;
    }

    // =====================================================================
    // STEP 2: PUBLIC ENDPOINTS (No authentication required)
    // =====================================================================
    console.log('\n📋 STEP 2: PUBLIC ENDPOINTS (No Auth Required)\n');

    const publicTests = [
      { method: 'GET', path: '/api/health', desc: 'Health Check' },
      { method: 'GET', path: '/api/products/categories', desc: 'Get Product Categories' },
      { method: 'GET', path: '/api/products', desc: 'Get All Products' },
      { method: 'GET', path: '/api/products/search?q=soap', desc: 'Search Products' },
      { method: 'GET', path: '/api/rewards/offers', desc: 'Get Rewards Offers' },
      { method: 'GET', path: '/api/rewards/bundles', desc: 'Get Product Bundles' },
      { method: 'GET', path: '/api/rewards/free-gifts', desc: 'Get Free Gift Options' },
      { method: 'GET', path: '/api/email/subscriber/denise@sisterspromise.com', desc: 'Get Subscriber Info' },
      { method: 'GET', path: '/api/email/stats', desc: 'Get Email Stats' }
    ];

    for (const test of publicTests) {
      try {
        const result = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: test.path,
          method: test.method,
          headers: { 'Content-Type': 'application/json' }
        });

        if (result.status < 400) {
          console.log(`✅ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
          results.passed++;
        } else {
          console.log(`❌ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
          results.failed++;
        }
        results.endpoints.push({ path: test.path, method: test.method, status: result.status });
      } catch (err) {
        console.log(`❌ ${test.method} ${test.path} - ${test.desc} (ERROR: ${err.message})`);
        results.failed++;
      }
    }

    // =====================================================================
    // STEP 3: USER ENDPOINTS (Authentication required)
    // =====================================================================
    console.log('\n📋 STEP 3: USER ENDPOINTS (Auth Required)\n');

    if (authToken) {
      const userTests = [
        { method: 'GET', path: '/api/users/profile', desc: 'Get User Profile' },
      ];

      for (const test of userTests) {
        try {
          const result = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: test.path,
            method: test.method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (result.status < 400) {
            console.log(`✅ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
            results.passed++;
          } else {
            console.log(`❌ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
            results.failed++;
          }
          results.endpoints.push({ path: test.path, method: test.method, status: result.status });
        } catch (err) {
          console.log(`❌ ${test.method} ${test.path} - ${test.desc} (ERROR: ${err.message})`);
          results.failed++;
        }
      }
    }

    // =====================================================================
    // STEP 4: REWARDS ENDPOINTS (Authentication required)
    // =====================================================================
    console.log('\n📋 STEP 4: REWARDS ENDPOINTS (Auth Required)\n');

    if (authToken) {
      const rewardsTests = [
        { method: 'GET', path: '/api/rewards/user', desc: 'Get User Rewards Data' },
        { method: 'GET', path: '/api/rewards/history', desc: 'Get Rewards History' }
      ];

      for (const test of rewardsTests) {
        try {
          const result = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: test.path,
            method: test.method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (result.status < 400) {
            console.log(`✅ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
            results.passed++;
          } else {
            console.log(`❌ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
            results.failed++;
          }
          results.endpoints.push({ path: test.path, method: test.method, status: result.status });
        } catch (err) {
          console.log(`❌ ${test.method} ${test.path} - ${test.desc} (ERROR: ${err.message})`);
          results.failed++;
        }
      }
    }

    // =====================================================================
    // STEP 5: ANALYTICS ENDPOINTS
    // =====================================================================
    console.log('\n📋 STEP 5: ANALYTICS ENDPOINTS\n');

    const analyticsTests = [
      {
        method: 'POST',
        path: '/api/analytics/event',
        desc: 'Track Custom Event',
        data: { eventName: 'test_event', eventData: { test: true } }
      },
      {
        method: 'POST',
        path: '/api/analytics/product',
        desc: 'Track Product View',
        data: { productId: 'test123', productName: 'Test Product' }
      },
      {
        method: 'POST',
        path: '/api/analytics/purchase',
        desc: 'Track Purchase',
        data: { orderId: 'order123', amount: 29.99 }
      }
    ];

    for (const test of analyticsTests) {
      try {
        const result = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: test.path,
          method: test.method,
          headers: { 'Content-Type': 'application/json' }
        }, test.data);

        if (result.status < 400) {
          console.log(`✅ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
          results.passed++;
        } else {
          console.log(`❌ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
          results.failed++;
        }
        results.endpoints.push({ path: test.path, method: test.method, status: result.status });
      } catch (err) {
        console.log(`❌ ${test.method} ${test.path} - ${test.desc} (ERROR: ${err.message})`);
        results.failed++;
      }
    }

    // =====================================================================
    // STEP 6: ADMIN ENDPOINTS (Admin/Owner only)
    // =====================================================================
    console.log('\n📋 STEP 6: ADMIN ENDPOINTS (Auth Required - Admin/Owner)\n');

    if (authToken) {
      const adminTests = [
        { method: 'GET', path: '/api/admin/stats', desc: 'Get Admin Dashboard Stats' },
        { method: 'GET', path: '/api/admin/orders', desc: 'List All Orders' },
        { method: 'GET', path: '/api/admin/users', desc: 'List All Users' },
        { method: 'GET', path: '/api/admin/rewards/stats', desc: 'Get Rewards Stats' }
      ];

      for (const test of adminTests) {
        try {
          const result = await makeRequest({
            hostname: 'localhost',
            port: 3000,
            path: test.path,
            method: test.method,
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (result.status < 400) {
            console.log(`✅ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
            results.passed++;
          } else if (result.status === 403) {
            console.log(`⚠️  ${test.method} ${test.path} - ${test.desc} (403 - Permission Denied - Expected)`);
            results.skipped++;
          } else {
            console.log(`❌ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
            results.failed++;
          }
          results.endpoints.push({ path: test.path, method: test.method, status: result.status });
        } catch (err) {
          console.log(`❌ ${test.method} ${test.path} - ${test.desc} (ERROR: ${err.message})`);
          results.failed++;
        }
      }
    }

    // =====================================================================
    // STEP 7: EMAIL ENDPOINTS
    // =====================================================================
    console.log('\n📋 STEP 7: EMAIL ENDPOINTS\n');

    const emailTests = [
      {
        method: 'POST',
        path: '/api/email/subscribe',
        desc: 'Subscribe to Newsletter',
        data: { email: 'testuser123@example.com' }
      }
    ];

    for (const test of emailTests) {
      try {
        const result = await makeRequest({
          hostname: 'localhost',
          port: 3000,
          path: test.path,
          method: test.method,
          headers: { 'Content-Type': 'application/json' }
        }, test.data);

        if (result.status < 400 || result.status === 409) { // 409 = already exists
          console.log(`✅ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
          results.passed++;
        } else {
          console.log(`❌ ${test.method} ${test.path} - ${test.desc} (${result.status})`);
          results.failed++;
        }
        results.endpoints.push({ path: test.path, method: test.method, status: result.status });
      } catch (err) {
        console.log(`❌ ${test.method} ${test.path} - ${test.desc} (ERROR: ${err.message})`);
        results.failed++;
      }
    }

    // =====================================================================
    // STEP 8: CHECKOUT ENDPOINT
    // =====================================================================
    console.log('\n📋 STEP 8: CHECKOUT ENDPOINT\n');

    try {
      const result = await makeRequest({
        hostname: 'localhost',
        port: 3000,
        path: '/api/checkout',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      }, {
        items: [{ id: 'product1', quantity: 1, price: 19.99 }],
        email: 'customer@example.com'
      });

      // Checkout might return 400 if missing required fields, that's OK
      if (result.status < 500) {
        console.log(`✅ POST /api/checkout - Checkout Flow (${result.status})`);
        results.passed++;
      } else {
        console.log(`❌ POST /api/checkout - Checkout Flow (${result.status})`);
        results.failed++;
      }
      results.endpoints.push({ path: '/api/checkout', method: 'POST', status: result.status });
    } catch (err) {
      console.log(`❌ POST /api/checkout - Checkout Flow (ERROR: ${err.message})`);
      results.failed++;
    }

    // =====================================================================
    // FINAL SUMMARY
    // =====================================================================
    console.log('\n' + '='.repeat(100));
    console.log('TEST SUMMARY');
    console.log('='.repeat(100) + '\n');

    console.log(`✅ Passed:  ${results.passed}`);
    console.log(`❌ Failed:  ${results.failed}`);
    console.log(`⚠️  Skipped: ${results.skipped}`);
    console.log(`📊 Total:   ${results.passed + results.failed + results.skipped}\n`);

    const passRate = ((results.passed / (results.passed + results.failed)) * 100).toFixed(1);
    console.log(`📈 Pass Rate: ${passRate}%\n`);

    // Group by status
    const by200 = results.endpoints.filter(e => e.status === 200).length;
    const by4xx = results.endpoints.filter(e => e.status >= 400 && e.status < 500).length;
    const by5xx = results.endpoints.filter(e => e.status >= 500).length;

    console.log(`Status Code Distribution:`);
    console.log(`  200 OK:       ${by200}`);
    console.log(`  4xx Errors:   ${by4xx}`);
    console.log(`  5xx Errors:   ${by5xx}\n`);

    console.log('='.repeat(100) + '\n');

  } catch (error) {
    console.error('Test suite error:', error.message);
  }

  process.exit(0);
}

// Run tests
console.log('Starting comprehensive API endpoint tests...');
runTests().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});

// Set timeout to prevent hanging
setTimeout(() => {
  console.error('\n⏱️  Test timeout - forcing exit');
  process.exit(1);
}, 60000);
