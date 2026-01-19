const http = require('http');

async function testEndpoint(path, method = 'GET') {
  return new Promise((resolve) => {
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: { 'Content-Type': 'application/json' }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode }));
    });

    req.on('error', () => resolve({ status: 'ERROR' }));
    req.setTimeout(3000, () => req.destroy());
    
    if (method === 'POST') req.write('{}');
    req.end();
  });
}

async function runTests() {
  console.log('\n' + '='.repeat(90));
  console.log('COMPLETE API ENDPOINT STATUS CHECK');
  console.log('='.repeat(90) + '\n');

  const categories = {
    'Health & Status': [
      ['/api/health', 'GET', 'Health Check']
    ],
    'Products': [
      ['/api/products', 'GET', 'All Products'],
      ['/api/products/categories', 'GET', 'Categories'],
      ['/api/products/search?q=soap', 'GET', 'Search Products']
    ],
    'Rewards System': [
      ['/api/rewards/offers', 'GET', 'Get BOGO Offers'],
      ['/api/rewards/bundles', 'GET', 'Get Bundles'],
      ['/api/rewards/free-gifts', 'GET', 'Free Gift Options']
    ],
    'Users & Auth': [
      ['/api/users/login', 'POST', 'Login'],
      ['/api/users/register', 'POST', 'Register']
    ],
    'Email Services': [
      ['/api/email/stats', 'GET', 'Email Stats'],
      ['/api/email/subscriber/denise@sisterspromise.com', 'GET', 'Get Subscriber']
    ],
    'Analytics': [
      ['/api/analytics/event', 'POST', 'Track Event'],
      ['/api/analytics/purchase', 'POST', 'Track Purchase'],
      ['/api/analytics/product', 'POST', 'Track Product View']
    ],
    'Checkout': [
      ['/api/checkout', 'POST', 'Checkout Flow']
    ]
  };

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [category, endpoints] of Object.entries(categories)) {
    console.log(`\n${category}`);
    console.log('-'.repeat(90));

    for (const [path, method, name] of endpoints) {
      const result = await testEndpoint(path, method);
      
      let status = '?';
      if (result.status === 'ERROR') {
        status = 'ERROR';
        totalFailed++;
      } else if (result.status < 400) {
        status = `OK ${result.status}`;
        totalPassed++;
      } else if (result.status < 500) {
        status = `OK ${result.status}`;
        totalPassed++;
      } else {
        status = `FAIL ${result.status}`;
        totalFailed++;
      }

      const icon = status.includes('OK') ? 'YES' : ' NO';
      console.log(`  [${icon}] ${method.padEnd(6)} ${path.padEnd(50)} ${name}`);
    }
  }

  console.log('\n' + '='.repeat(90));
  console.log('SUMMARY');
  console.log('='.repeat(90));
  console.log(`Operational: ${totalPassed}`);
  console.log(`Failed:      ${totalFailed}`);
  console.log(`Total:       ${totalPassed + totalFailed}`);
  console.log(`Success Rate: ${((totalPassed / (totalPassed + totalFailed)) * 100).toFixed(1)}%\n`);

  process.exit(0);
}

runTests().catch(console.error);
setTimeout(() => { process.exit(1); }, 60000);
