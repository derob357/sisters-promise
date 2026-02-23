/**
 * MongoDB Database Configuration
 * Handles connection to MongoDB and provides connection utilities
 */

const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
const dotenv = require('dotenv');

// Load environment based on NODE_ENV (don't override if already set by server.js)
const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';
const envPath = path.resolve(envFile);
if (!process.env.MONGODB_URI && fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/sisters-promise';

let globalDbError = null;

/**
 * Connect to MongoDB
 */
const connectDB = async () => {
  try {
    console.log('🔌 Attempting to connect to MongoDB...');
    console.log(`📍 Using URI: ${MONGODB_URI.replace(/\/\/[^:]+:[^@]+@/, '//****:****@')}`);

    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 45000,
      connectTimeoutMS: 30000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });
    console.log('✅ MongoDB connected successfully');
    console.log(`📊 Database: ${mongoose.connection.db.databaseName}`);
    globalDbError = null;
    return mongoose.connection;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.error('💡 Tip: Ensure MONGODB_URI is set in Render environment variables');
    globalDbError = String(error.message);
    // Don't exit, allow app to run with fallback to file-based storage
    return null;
  }
};

const getDbError = () => globalDbError;

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log('✓ MongoDB disconnected');
  } catch (error) {
    console.error('✗ MongoDB disconnection error:', error.message);
  }
};

/**
 * Check if MongoDB is connected
 */
const isConnected = () => {
  return mongoose.connection.readyState === 1;
};

module.exports = {
  connectDB,
  disconnectDB,
  isConnected,
  getDbError,
  mongoose,
};
