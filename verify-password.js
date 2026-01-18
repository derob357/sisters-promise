const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const bcryptjs = require('bcryptjs');

dotenv.config({ path: path.resolve('.env') });
const User = require('./models/User');

(async () => {
  try {
    const uri = process.env.MONGODB_URI;
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    
    const user = await User.findOne({ email: 'd@sp.com' }).select('+password');
    if (user) {
      console.log('User found: ' + user.email);
      console.log('Password hash exists: ' + (user.password ? 'Yes' : 'No'));
      console.log('Password hash (first 20 chars): ' + user.password.substring(0, 20) + '...');
      console.log('First Name: ' + user.firstName);
      console.log('Role: ' + user.role);
      console.log('Status: ' + user.status);
      
      // Verify the password works
      const match = await bcryptjs.compare('Sisters@Promise2025', user.password);
      console.log('Password verification: ' + (match ? 'MATCH - Password is correct' : 'NO MATCH'));
    } else {
      console.log('User not found');
    }
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();
