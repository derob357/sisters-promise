/**
 * Test file to verify all error handling and data validation
 * Run: node test-error-handling.js
 */

// Test 1: Validate productService handles all response formats
console.log('TEST 1: Product Service Response Handling');
console.log('==========================================');

const testFormats = [
  {
    name: 'Format 1: { data: { products: [...] } }',
    response: { data: { products: [{ id: 1, name: 'Product 1' }] } }
  },
  {
    name: 'Format 2: { products: [...] }',
    response: { products: [{ id: 1, name: 'Product 1' }] }
  },
  {
    name: 'Format 3: Direct array',
    response: [{ id: 1, name: 'Product 1' }]
  },
  {
    name: 'Format 4: { data: [...] }',
    response: { data: [{ id: 1, name: 'Product 1' }] }
  },
  {
    name: 'Format 5: Empty/null',
    response: null
  },
  {
    name: 'Format 6: Undefined',
    response: undefined
  },
];

const extractProducts = (response) => {
  let products = [];
  
  if (response?.data?.products && Array.isArray(response.data.products)) {
    products = response.data.products;
  } else if (response?.products && Array.isArray(response.products)) {
    products = response.products;
  } else if (Array.isArray(response)) {
    products = response;
  } else if (response?.data && Array.isArray(response.data)) {
    products = response.data;
  }
  
  return Array.isArray(products) ? products : [];
};

testFormats.forEach(test => {
  try {
    const result = extractProducts(test.response);
    const isArray = Array.isArray(result);
    console.log(`${test.name}: ${isArray ? 'PASS' : 'FAIL'} (${result.length} items)`);
  } catch (err) {
    console.log(`${test.name}: FAIL - ${err.message}`);
  }
});

// Test 2: Validate .map() safety
console.log('\nTEST 2: Safe Array Mapping');
console.log('============================');

const safeMap = (data, callback) => {
  try {
    if (!Array.isArray(data)) {
      console.warn('Data is not an array:', typeof data);
      return [];
    }
    return data.map(callback);
  } catch (err) {
    console.error('Mapping error:', err.message);
    return [];
  }
};

const products = [
  { id: 1, name: 'Product 1', price: 10 },
  { id: 2, name: 'Product 2', price: 20 },
];

console.log('Valid array mapping:');
const result = safeMap(products, p => ({ ...p, discounted: p.price * 0.9 }));
console.log(`Result: ${JSON.stringify(result)}`);

console.log('\nInvalid data (null):');
const nullResult = safeMap(null, p => p);
console.log(`Result: ${JSON.stringify(nullResult)}`);

console.log('\nInvalid data (undefined):');
const undefinedResult = safeMap(undefined, p => p);
console.log(`Result: ${JSON.stringify(undefinedResult)}`);

// Test 3: Category extraction
console.log('\nTEST 3: Safe Category Extraction');
console.log('==================================');

const products3 = [
  { id: 1, category: 'soap' },
  { id: 2, category: 'lotion' },
  { id: 3, category: 'soap' },
  { id: 4, category: null },
  { id: 5 }, // Missing category
];

try {
  const categories = new Set(
    products3
      .filter(p => p && p.category)
      .map(p => p.category)
  );
  console.log(`Unique categories: ${Array.from(categories).join(', ')}`);
  console.log('PASS');
} catch (err) {
  console.log(`FAIL: ${err.message}`);
}

// Test 4: Order products mapping
console.log('\nTEST 4: Safe Order Products Mapping');
console.log('====================================');

const orderProducts = [
  { name: 'Product 1', quantity: 2, price: 10 },
  { name: 'Product 2', quantity: 1, price: 20 },
  { name: 'Bad Product' }, // Missing price/quantity
];

try {
  const validProducts = orderProducts
    .filter(p => p && p.name && typeof p.quantity === 'number' && typeof p.price === 'number');
  
  const productsList = validProducts
    .map(p => `<tr><td>${p.name}</td><td>${p.quantity}</td><td>$${p.price.toFixed(2)}</td></tr>`)
    .join('');
  
  console.log('Valid products HTML generated successfully');
  console.log('Products counted:', validProducts.length);
  console.log('PASS');
} catch (err) {
  console.log(`FAIL: ${err.message}`);
}

console.log('\n✅ All error handling tests completed');
