#!/usr/bin/env node

/**
 * SSL/TLS Certificate Generation Script for Development
 * 
 * Generates self-signed certificates for HTTPS development
 * For production, use Let's Encrypt or a trusted CA
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const CERT_DIR = path.join(__dirname, 'certs');
const CERT_FILE = path.join(CERT_DIR, 'server.crt');
const KEY_FILE = path.join(CERT_DIR, 'server.key');

// Create certs directory if it doesn't exist
if (!fs.existsSync(CERT_DIR)) {
  fs.mkdirSync(CERT_DIR, { recursive: true });
  console.log('✓ Created certificates directory');
}

// Check if certificates already exist
if (fs.existsSync(CERT_FILE) && fs.existsSync(KEY_FILE)) {
  console.log('✓ SSL certificates already exist');
  process.exit(0);
}

console.log('Generating self-signed SSL certificates for development...\n');

try {
  // Generate private key and self-signed certificate
  const command = `openssl req -x509 -newkey rsa:2048 -keyout "${KEY_FILE}" -out "${CERT_FILE}" -days 365 -nodes -subj "/C=US/ST=State/L=City/O=Sisters Promise/CN=localhost"`;
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('\n✓ SSL certificates generated successfully');
  console.log(`  Certificate: ${CERT_FILE}`);
  console.log(`  Private Key: ${KEY_FILE}`);
  console.log('\n⚠️  These are self-signed certificates for development only.');
  console.log('  For production, use proper certificates from Let\'s Encrypt or a trusted CA.\n');
  
  // Set proper permissions
  fs.chmodSync(KEY_FILE, 0o600);
  fs.chmodSync(CERT_FILE, 0o644);
  
} catch (error) {
  console.error('❌ Failed to generate certificates:');
  console.error(error.message);
  console.error('\nMake sure OpenSSL is installed:');
  console.error('  macOS: brew install openssl');
  console.error('  Linux: sudo apt-get install openssl');
  console.error('  Windows: Download from https://slproweb.com/products/Win32OpenSSL.html');
  process.exit(1);
}
