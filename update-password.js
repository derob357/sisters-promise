const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

// Load .env first
const envPath = path.resolve('.env');
dotenv.config({ path: envPath });

const User = require('./models/User');

async function updatePassword() {
  try {
    // Use MongoDB URI from .env
    const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/sisters-promise';
    
    console.log('Connecting to MongoDB...');
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('Connected to MongoDB');
    
    const user = await User.findOne({ email: 'd@sp.com' });
    if (!user) {
      console.error('User not found');
      process.exit(1);
    }
    
    // Generate compliant password (8+ chars, mixed case, special chars, numbers)
    const newPassword = 'Sisters@Promise2025';
    
    console.log('Updating password...');
    user.password = newPassword;
    await user.save();
    
    console.log('=== PASSWORD UPDATE SUCCESS ===');
    console.log('Email: d@sp.com');
    console.log('New Password: Sisters@Promise2025');
    console.log('Compliance: 19 characters (8+ required), UPPERCASE, lowercase, special char, numbers');
    console.log('================================');
    
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

updatePassword();
