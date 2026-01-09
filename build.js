#!/usr/bin/env node

/**
 * Sisters Promise Build Script
 * Creates a production-ready output folder for deployment
 */

const fs = require('fs');
const path = require('path');

const OUTPUT_DIR = 'dist';
const EXCLUDE_DIRS = ['node_modules', '.git', '.github', 'docs', 'sections', 'dist', '.gitignore'];
const EXCLUDE_FILES = ['server.js', 'build.js', 'gulpfile.js', 'package-lock.json', 'bower.json', 'genezio.yaml', 'presentation.html', 'template.html', 'index.html.bak'];

function copyDir(src, dest, isRoot = false) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const files = fs.readdirSync(src);

  files.forEach(file => {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    // Skip excluded directories at root level
    if (isRoot && EXCLUDE_DIRS.includes(file)) {
      return;
    }

    // Skip excluded files at root level
    if (isRoot && EXCLUDE_FILES.includes(file)) {
      return;
    }

    if (stat.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  });
}

function createEnvTemplate() {
  const envTemplate = `# Sisters Promise Environment Configuration
# Fill in your production credentials before deployment

# Square Payment Processing
SQUARE_APPLICATION_ID=your_production_app_id
SQUARE_ACCESS_TOKEN=your_production_access_token
SQUARE_LOCATION_ID=your_production_location_id
SQUARE_ENVIRONMENT=production

# Google reCAPTCHA v3
RECAPTCHA_SITE_KEY=your_recaptcha_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key

# Server Configuration
NODE_ENV=production
PORT=3000
ALLOWED_ORIGINS=https://sisterspromise.com,https://www.sisterspromise.com
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, '.env.production'), envTemplate);
}

function createDeploymentGuide() {
  const guide = `# Sisters Promise - Deployment Guide

## Production Build Contents

This \`dist\` folder contains all files needed to deploy Sisters Promise to your production server.

### What's Included:
- **index.html** - Home page
- **pages/** - Contact and shop pages
- **assets/** - Images, CSS, and JavaScript files
- **server.js** - Express backend server
- **package.json** - Node.js dependencies
- **.env.production** - Environment template (fill with production credentials)

### What's Excluded:
- Node modules (install fresh on server)
- Git history
- Development files
- Documentation files

## Deployment Steps

### 1. Upload to Server
Upload the entire \`dist\` folder to your server. You can use:
- FTP/SFTP
- Git push
- Cloud deployment (Heroku, AWS, DigitalOcean, etc.)

### 2. Install Dependencies
\`\`\`bash
cd dist
npm install --production
\`\`\`

### 3. Configure Environment
Copy \`.env.production\` to \`.env\` and fill in your production credentials:
\`\`\`bash
cp .env.production .env
# Edit .env with your real credentials
\`\`\`

### 4. Required Credentials

**Square Payments:**
- Get from: https://squareup.com/dashboard/apps-and-settings/applications
- Fields: Application ID, Access Token, Location ID

**Google reCAPTCHA v3:**
- Get from: https://www.google.com/recaptcha/admin
- Fields: Site Key, Secret Key

### 5. Start the Server
\`\`\`bash
npm start
# or for production with PM2:
pm2 start server.js --name "sisters-promise"
\`\`\`

### 6. Configure SSL/TLS
Ensure your domain has an SSL certificate. Use Let's Encrypt for free:
\`\`\`bash
sudo certbot certonly --standalone -d sisterspromise.com -d www.sisterspromise.com
\`\`\`

### 7. Set Up Reverse Proxy (Optional but Recommended)

**Nginx Configuration:**
\`\`\`nginx
server {
    listen 443 ssl http2;
    server_name sisterspromise.com www.sisterspromise.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
\`\`\`

### 8. Monitor Logs
\`\`\`bash
pm2 logs sisters-promise
\`\`\`

## Security Checklist

- [ ] NODE_ENV set to "production"
- [ ] Real reCAPTCHA credentials configured
- [ ] Real Square credentials configured
- [ ] SSL/TLS certificate installed
- [ ] Firewall rules configured
- [ ] Regular backups enabled
- [ ] Monitoring and alerts set up
- [ ] Rate limiting enabled (already configured)
- [ ] Security headers enabled (Helmet.js active)

## Troubleshooting

### Port Already in Use
\`\`\`bash
# Check what's using port 3000
lsof -i :3000
# Kill the process
kill -9 <PID>
\`\`\`

### SSL Certificate Issues
- Ensure domain DNS is pointing to your server
- Check certificate expiration: \`certbot certificates\`
- Renew certificates: \`certbot renew\`

### Database Errors
- Verify reCAPTCHA and Square credentials are correct
- Check network connectivity to Square API
- Review error logs in PM2

## Build Information

- **Build Date:** ${new Date().toISOString()}
- **Build Environment:** Node.js ${process.version}
- **Platform:** ${process.platform}

For more information, see:
- SECURITY.md
- INSTALLATION.md
- SECURITY_COMPLETION_REPORT.md
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'DEPLOYMENT.md'), guide);
}

function main() {
  console.log('🔨 Building Sisters Promise...\n');

  // Remove old dist folder
  if (fs.existsSync(OUTPUT_DIR)) {
    console.log(`📦 Removing old ${OUTPUT_DIR} folder...`);
    fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
  }

  // Create dist folder
  console.log(`📁 Creating ${OUTPUT_DIR} folder...`);
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Copy all files
  console.log('📋 Copying files...');
  copyDir('.', OUTPUT_DIR, true);

  // Create environment template
  console.log('🔐 Creating .env.production template...');
  createEnvTemplate();

  // Create deployment guide
  console.log('📖 Creating DEPLOYMENT.md guide...');
  createDeploymentGuide();

  // Copy documentation files
  const docFiles = ['SECURITY.md', 'INSTALLATION.md', 'SECURITY_COMPLETION_REPORT.md', 'README.md'];
  console.log('📚 Copying documentation...');
  docFiles.forEach(file => {
    const srcPath = path.join('.', file);
    if (fs.existsSync(srcPath)) {
      fs.copyFileSync(srcPath, path.join(OUTPUT_DIR, file));
    }
  });

  // Create package-lock.json note
  const note = `This folder is ready for production deployment.

## Quick Start:

1. npm install --production
2. cp .env.production .env
3. Fill in your production credentials in .env
4. npm start

See DEPLOYMENT.md for detailed instructions.
`;
  fs.writeFileSync(path.join(OUTPUT_DIR, 'READY_TO_DEPLOY.txt'), note);

  // List contents
  console.log('\n✅ Build complete!\n');
  console.log(`📦 ${OUTPUT_DIR}/ folder contents:`);
  const files = fs.readdirSync(OUTPUT_DIR);
  files.forEach(file => {
    const stat = fs.statSync(path.join(OUTPUT_DIR, file));
    const icon = stat.isDirectory() ? '📁' : '📄';
    console.log(`   ${icon} ${file}`);
  });

  console.log(`\n🚀 Next steps:`);
  console.log(`   1. cd ${OUTPUT_DIR}`);
  console.log(`   2. npm install --production`);
  console.log(`   3. cp .env.production .env`);
  console.log(`   4. Edit .env with your production credentials`);
  console.log(`   5. npm start`);
  console.log(`\n📖 See ${OUTPUT_DIR}/DEPLOYMENT.md for detailed instructions\n`);
}

// Run build
try {
  main();
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
