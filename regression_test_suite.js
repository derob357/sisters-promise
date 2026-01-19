/**
 * Regression Test Suite - Sisters Promise App
 * Automated tests to verify no features break
 */

// Run with: npm run test:regression

const http = require('http');

// Test configuration
const TEST_URL = 'http://localhost:3000';
const timeout = 5000;

// Test data
let authToken = null;
let testUserId = null;

// ==================== HELPER FUNCTIONS ====================

async function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(TEST_URL + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const req = http.request(options, (res) => {
      let responseData = '';
      res.on('data', chunk => { responseData += chunk; });
      res.on('end', () => {
        try {
          const parsed = JSON.parse(responseData);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: responseData });
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(timeout);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

function assertEquals(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`Assertion failed: ${message} (expected ${expected}, got ${actual})`);
  }
}

// ==================== REGRESSION TEST SUITES ====================

const tests = {
  // AUTHENTICATION REGRESSION TESTS
  authentication: {
    'Login with valid credentials': async () => {
      const result = await request('POST', '/api/users/login', {
        email: 'deric.robinson71@gmail.com',
        password: '***REMOVED***'
      });
      assertEquals(result.status, 200, 'Login should return 200');
      assert(result.data.token, 'Token should be returned');
      authToken = result.data.token;
      testUserId = result.data.user?.id;
    },

    'Login with invalid credentials returns 401': async () => {
      const result = await request('POST', '/api/users/login', {
        email: 'deric.robinson71@gmail.com',
        password: 'wrongpassword'
      });
      assertEquals(result.status, 401, 'Invalid credentials should return 401');
    },

    'Login without email returns 400': async () => {
      const result = await request('POST', '/api/users/login', {
        password: 'password123'
      });
      assert(result.status >= 400, 'Missing email should return error');
    }
  },

  // PRODUCT REGRESSION TESTS
  products: {
    'Get all products returns list': async () => {
      const result = await request('GET', '/api/products');
      assertEquals(result.status, 200, 'Get products should return 200');
      assert(result.data.success, 'Response should have success flag');
      assert(result.data.data && Array.isArray(result.data.data.products), 'Products should be an array');
    },

    'Product categories endpoint works': async () => {
      const result = await request('GET', '/api/products/categories');
      assertEquals(result.status, 200, 'Get categories should return 200');
      assert(result.data.success, 'Response should have success flag');
      assert(Array.isArray(result.data.categories), 'Categories should be an array');
    },

    'Product search works': async () => {
      const result = await request('GET', '/api/products/search?q=soap');
      assertEquals(result.status, 200, 'Search should return 200');
      assert(result.data.success || Array.isArray(result.data), 'Search results should be valid');
    }
  },

  // REWARDS REGRESSION TESTS
  rewards: {
    'Get rewards offers': async () => {
      const result = await request('GET', '/api/rewards/offers');
      assertEquals(result.status, 200, 'Get offers should return 200');
      assert(Array.isArray(result.data), 'Offers should be an array');
      assert(result.data.length > 0, 'Should have at least one offer');
    },

    'Get product bundles': async () => {
      const result = await request('GET', '/api/rewards/bundles');
      assertEquals(result.status, 200, 'Get bundles should return 200');
      assert(Array.isArray(result.data), 'Bundles should be an array');
      assert(result.data.length > 0, 'Should have at least one bundle');
    },

    'Get free gifts': async () => {
      const result = await request('GET', '/api/rewards/free-gifts');
      assertEquals(result.status, 200, 'Get gifts should return 200');
      assert(Array.isArray(result.data), 'Gifts should be an array');
    },

    'Get user rewards with auth': async () => {
      if (!authToken) throw new Error('No auth token');
      const result = await request('GET', '/api/rewards/user', null, authToken);
      assertEquals(result.status, 200, 'Get user rewards should return 200');
      assert(result.data.points !== undefined, 'Should have points field');
      assert(result.data.tier !== undefined, 'Should have tier field');
    },

    'Get rewards history': async () => {
      if (!authToken) throw new Error('No auth token');
      const result = await request('GET', '/api/rewards/history', null, authToken);
      assertEquals(result.status, 200, 'Get history should return 200');
      assert(Array.isArray(result.data), 'History should be an array');
    }
  },

  // EMAIL REGRESSION TESTS
  email: {
    'Get email stats': async () => {
      const result = await request('GET', '/api/email/stats');
      assertEquals(result.status, 200, 'Get email stats should return 200');
    },

    'Get subscriber info': async () => {
      const result = await request('GET', '/api/email/subscriber/denise@sisterspromise.com');
      assert(result.status === 200 || result.status === 404, 'Should return 200 or 404');
    }
  },

  // ANALYTICS REGRESSION TESTS
  analytics: {
    'Track event': async () => {
      const result = await request('POST', '/api/analytics/event', {
        event: 'test_event',
        properties: { test: true }
      });
      assertEquals(result.status, 200, 'Track event should return 200');
    },

    'Track purchase': async () => {
      const result = await request('POST', '/api/analytics/purchase', {
        orderId: 'test-order-123',
        amount: 99.99
      });
      assertEquals(result.status, 200, 'Track purchase should return 200');
    },

    'Track product view': async () => {
      const result = await request('POST', '/api/analytics/product', {
        productId: 'test-product-123',
        productName: 'Test Product'
      });
      assertEquals(result.status, 200, 'Track product should return 200');
    }
  },

  // ADMIN REGRESSION TESTS
  admin: {
    'Get admin stats with auth': async () => {
      if (!authToken) throw new Error('No auth token');
      const result = await request('GET', '/api/admin/stats', null, authToken);
      // May be 200 or 403 depending on permissions
      assert(result.status === 200 || result.status === 403, 'Should return 200 or 403');
    },

    'Get admin orders with auth': async () => {
      if (!authToken) throw new Error('No auth token');
      const result = await request('GET', '/api/admin/orders', null, authToken);
      assert(result.status === 200 || result.status === 403, 'Should return 200 or 403');
    },

    'Get admin users with auth': async () => {
      if (!authToken) throw new Error('No auth token');
      const result = await request('GET', '/api/admin/users', null, authToken);
      assert(result.status === 200 || result.status === 403, 'Should return 200 or 403');
    }
  },

  // CHECKOUT REGRESSION TESTS
  checkout: {
    'Checkout endpoint works': async () => {
      const result = await request('POST', '/api/checkout', {
        items: [{ id: 'test-1', quantity: 1, price: 19.99 }],
        email: 'customer@example.com'
      });
      // May return various status codes depending on validation
      assert(result.status < 500, 'Should not return 500 error');
    }
  },

  // SECURITY REGRESSION TESTS
  security: {
    'Protected endpoints require auth': async () => {
      const result = await request('GET', '/api/rewards/user');
      assertEquals(result.status, 401, 'Protected endpoint without token should return 401');
    },

    'Invalid token returns 401': async () => {
      const result = await request('GET', '/api/rewards/user', null, 'invalid-token');
      assertEquals(result.status, 401, 'Invalid token should return 401');
    }
  },

  // DATA INTEGRITY REGRESSION TESTS
  integrity: {
    'BOGO offers have required fields': async () => {
      const result = await request('GET', '/api/rewards/offers');
      assert(result.data.length > 0, 'Should have offers');
      const offer = result.data[0];
      assert(offer.id !== undefined, 'Offer should have id');
      assert(offer.type !== undefined, 'Offer should have type');
      assert(offer.title !== undefined, 'Offer should have title');
    },

    'Bundles have correct pricing': async () => {
      const result = await request('GET', '/api/rewards/bundles');
      assert(result.data.length > 0, 'Should have bundles');
      result.data.forEach(bundle => {
        assert(bundle.bundlePrice < bundle.originalPrice, 'Bundle should be discounted');
        assert(bundle.savings > 0, 'Bundle should have savings');
      });
    }
  }
};

// ==================== TEST RUNNER ====================

async function runTests() {
  const categoryFilter = process.argv[2];
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  const failures = [];

  console.log('\n' + '='.repeat(70));
  console.log('REGRESSION TEST SUITE - Sisters Promise App');
  console.log('='.repeat(70) + '\n');

  for (const [category, categoryTests] of Object.entries(tests)) {
    if (categoryFilter && !category.includes(categoryFilter)) continue;

    console.log(`\n${category.toUpperCase()}`);
    console.log('-'.repeat(70));

    for (const [testName, testFn] of Object.entries(categoryTests)) {
      totalTests++;
      try {
        await testFn();
        console.log(`  ✅ ${testName}`);
        passedTests++;
      } catch (error) {
        console.log(`  ❌ ${testName}`);
        console.log(`     Error: ${error.message}`);
        failedTests++;
        failures.push({ category, testName, error: error.message });
      }
    }
  }

  // SUMMARY
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${failedTests}/${totalTests}`);
  console.log(`📊 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%\n`);

  if (failures.length > 0) {
    console.log('FAILURES:');
    failures.forEach(f => {
      console.log(`  [${f.category}] ${f.testName}`);
      console.log(`    ${f.error}`);
    });
    console.log();
    process.exit(1);
  } else {
    console.log('🎉 ALL REGRESSION TESTS PASSED!\n');
    process.exit(0);
  }
}

// ==================== EXECUTION ====================

console.log('Starting regression tests...');
console.log('Note: Ensure server is running on http://localhost:3000\n');

runTests().catch(error => {
  console.error('Test suite error:', error.message);
  process.exit(1);
});

setTimeout(() => {
  console.error('\nTest suite timeout - forcing exit');
  process.exit(1);
}, 60000);
