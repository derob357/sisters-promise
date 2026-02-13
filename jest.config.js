module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  setupFiles: ['./tests/setup.js'],
  collectCoverageFrom: [
    'middleware/**/*.js',
    'services/**/*.js',
    'models/**/*.js',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  testTimeout: 10000,
};
