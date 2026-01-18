#!/usr/bin/env node

/**
 * One-time script to create a user in MongoDB
 * Usage: node scripts/createUser.js
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

// Import User model
const User = require('../models/User');

async function createUser(email, password, firstName, lastName, role = 'owner') {
  try {
    console.log('Connecting to MongoDB...');
    
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✓ Connected to MongoDB');

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      console.log(`✗ User already exists: ${email}`);
      await mongoose.connection.close();
      return false;
    }

    // Hash password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Create user
    const user = new User({
      id: uuidv4(),
      email: email.toLowerCase(),
      firstName: firstName || email.split('@')[0],
      lastName: lastName || '',
      password: hashedPassword,
      role: role,
    });

    await user.save();

    console.log(`✓ User created successfully:`);
    console.log(`  Email: ${user.email}`);
    console.log(`  Name: ${user.firstName} ${user.lastName}`);
    console.log(`  Role: ${user.role}`);
    console.log(`  ID: ${user.id}`);

    await mongoose.connection.close();
    console.log('✓ Connection closed');
    
    return true;
  } catch (error) {
    console.error('✗ Error creating user:', error.message);
    try {
      await mongoose.connection.close();
    } catch (e) {
      // ignore
    }
    return false;
  }
}

// Get email, password from command line or use defaults
const email = process.argv[2] || 'd@sp.com';
const password = process.argv[3] || 'pass123';
const firstName = process.argv[4] || 'Owner';
const lastName = process.argv[5] || 'Account';
const role = process.argv[6] || 'owner';

console.log('Creating user with:');
console.log(`  Email: ${email}`);
console.log(`  Password: ${password}`);
console.log(`  Name: ${firstName} ${lastName}`);
console.log(`  Role: ${role}`);
console.log('');

createUser(email, password, firstName, lastName, role).then((success) => {
  process.exit(success ? 0 : 1);
});
