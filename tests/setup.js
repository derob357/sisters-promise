// Test environment setup
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.JWT_EXPIRY = '1h';
process.env.SQUARE_ACCESS_TOKEN = 'test-token';
process.env.SQUARE_ENVIRONMENT = 'sandbox';
process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
process.env.GA_MEASUREMENT_ID = 'G-TEST123';
process.env.GA_API_SECRET = 'test-api-secret';
