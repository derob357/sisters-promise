# GitHub Actions Setup Guide for Sister's Promise Mobile

This guide will help you set up automated builds for your React Native app using GitHub Actions.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Workflow Files](#workflow-files)
3. [Setting Up Secrets](#setting-up-secrets)
4. [Android Build Setup](#android-build-setup)
5. [iOS Build Setup](#ios-build-setup)
6. [Troubleshooting](#troubleshooting)
7. [Advanced Configuration](#advanced-configuration)

---

## 🚀 Quick Start

### Step 1: Copy Workflow Files to Your Repository

Copy the `.github/workflows/` directory to your repository root:

```bash
mkdir -p .github/workflows
cp build-android.yml .github/workflows/
cp build-ios.yml .github/workflows/
cp build-all.yml .github/workflows/
```

### Step 2: Commit and Push

```bash
git add .github/
git commit -m "Add GitHub Actions workflows"
git push origin main
```

### Step 3: Watch the Build

Go to your GitHub repository → **Actions** tab to see your builds in progress!

---

## 📁 Workflow Files

### 1. `build-android.yml` - Android APK Builder
- **Triggers:** Push to `main`/`develop`, Pull Requests, Manual
- **Output:** Debug and Release APK files
- **Duration:** ~5-10 minutes
- **Cost:** Free (included in GitHub free tier)

### 2. `build-ios.yml` - iOS App Builder
- **Triggers:** Push to `main`/`develop`, Pull Requests, Manual
- **Output:** iOS Simulator builds, IPA (with signing)
- **Duration:** ~15-20 minutes
- **Cost:** Uses macOS runners (free tier: 500 minutes/month)

### 3. `build-all.yml` - Combined Builder
- **Triggers:** Push to `main`, Tags (v*), Manual
- **Output:** Both Android and iOS builds
- **Features:** Runs tests first, creates GitHub releases
- **Duration:** ~20-30 minutes

---

## 🔐 Setting Up Secrets

GitHub Secrets store sensitive information securely. Here's how to set them up:

### Navigation
1. Go to your repository on GitHub
2. Click **Settings**
3. Click **Secrets and variables** → **Actions**
4. Click **New repository secret**

### Required Secrets

#### For All Builds (Required)
```
API_BASE_URL
└─ Your backend API URL (e.g., https://api.sisterspromise.com)

GA_MEASUREMENT_ID
└─ Google Analytics measurement ID (e.g., G-XXXXXXXXXX)

GA_API_SECRET
└─ Google Analytics API secret key
```

#### For Android Release Signing (Optional but Recommended)

**Step 1: Generate a Keystore**
```bash
keytool -genkey -v \
  -keystore release.keystore \
  -alias release \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Answer the prompts and remember your passwords!
```

**Step 2: Convert Keystore to Base64**
```bash
base64 -i release.keystore -o release.keystore.base64

# On macOS/Linux
base64 release.keystore > release.keystore.base64

# Copy the contents of release.keystore.base64
```

**Step 3: Add to GitHub Secrets**
```
RELEASE_KEYSTORE_BASE64
└─ The base64 encoded keystore file

RELEASE_KEYSTORE_PASSWORD
└─ The keystore password you set

RELEASE_KEY_ALIAS
└─ The key alias (usually "release")

RELEASE_KEY_PASSWORD
└─ The key password you set
```

#### For iOS Builds (Optional - For App Store Distribution)

**⚠️ Important:** iOS builds for simulator work without signing. For App Store/TestFlight:

```
APPLE_CERTIFICATE_BASE64
└─ Your Apple distribution certificate (.p12 file, base64 encoded)

APPLE_CERTIFICATE_PASSWORD
└─ The certificate password

PROVISIONING_PROFILE_BASE64
└─ Your provisioning profile (base64 encoded)

APPLE_TEAM_ID
└─ Your Apple Developer Team ID (found in App Store Connect)

APPLE_APP_ID
└─ Your app's bundle identifier (e.g., com.sisterspromise.app)
```

**How to get iOS certificates:**
1. Log into [Apple Developer Portal](https://developer.apple.com/)
2. Go to **Certificates, Identifiers & Profiles**
3. Create a Distribution Certificate
4. Download as `.p12` file
5. Convert to base64: `base64 -i cert.p12 -o cert.base64`

---

## 🤖 Android Build Setup

### Automatic Builds

The Android workflow automatically builds when you:
- Push to `main` or `develop` branches
- Create a pull request
- Manually trigger from Actions tab

### Manual Build Trigger

1. Go to **Actions** tab
2. Select **Build Android APK**
3. Click **Run workflow**
4. Choose branch and click **Run workflow**

### Download Your APK

After build completes:
1. Go to the workflow run
2. Scroll to **Artifacts** section
3. Download `app-release` or `app-debug`
4. Extract the ZIP file
5. Install `app-release.apk` on your Android device

### Installing on Device

**Method 1: ADB (For Developers)**
```bash
adb install app-release.apk
```

**Method 2: Direct Install**
1. Enable "Install from Unknown Sources" in Android Settings
2. Copy APK to device
3. Open and install

---

## 🍎 iOS Build Setup

### Prerequisites

- Apple Developer Account ($99/year)
- Xcode installed locally (for testing)
- Code signing certificates and profiles

### Automatic Builds

iOS builds run on macOS runners (costs more minutes):
- Simulator builds: Work without signing
- App Store builds: Require signing certificates

### Download Your iOS Build

1. Go to workflow run
2. Download `ios-build` artifact
3. Open `.app` file in Xcode iOS Simulator

### For App Store Distribution

You'll need to:
1. Set up certificates in Apple Developer Portal
2. Add secrets to GitHub (see above)
3. Use Fastlane for automated submission (optional)

**Recommended:** Use [Fastlane](https://fastlane.tools/) for automated iOS releases:
```bash
# Install Fastlane
brew install fastlane

# Initialize
cd ios
fastlane init
```

---

## 🔧 Troubleshooting

### Android Build Fails

**Issue:** `permission denied: ./gradlew`
**Fix:** The workflow automatically makes gradlew executable

**Issue:** `SDK not found`
**Fix:** The workflow installs JDK 17 automatically

**Issue:** `Execution failed for task ':app:lintVitalRelease'`
**Fix:** Add to `android/app/build.gradle`:
```gradle
lintOptions {
    checkReleaseBuilds false
    abortOnError false
}
```

### iOS Build Fails

**Issue:** `No such module 'React'`
**Fix:** CocoaPods issue. The workflow runs `pod install` automatically

**Issue:** `Code signing error`
**Fix:** Check that all signing secrets are properly set

**Issue:** `xcodebuild command not found`
**Fix:** This shouldn't happen on macOS runners, but check Xcode version

### Workflow Not Triggering

**Issue:** Workflow doesn't run on push
**Fix:** Check that:
1. Files are in `.github/workflows/` directory
2. YAML syntax is valid
3. Branch name matches (main vs master)

### Build Takes Too Long

**Android:** Normal build time is 5-10 minutes
**iOS:** Normal build time is 15-20 minutes

If builds consistently timeout (60 minutes):
1. Check for infinite loops in code
2. Reduce dependencies
3. Use caching (already configured)

---

## ⚡ Advanced Configuration

### Changing Trigger Branches

Edit the workflow file:
```yaml
on:
  push:
    branches: [ main, develop, staging ]  # Add more branches
```

### Build on Schedule

Add to workflow:
```yaml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
```

### Slack Notifications

Add this step to workflows:
```yaml
- name: Slack Notification
  if: always()
  uses: 8398a7/action-slack@v3
  with:
    status: ${{ job.status }}
    webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

### Deploy to Firebase App Distribution

Add after build steps:
```yaml
- name: Deploy to Firebase
  uses: wzieba/Firebase-Distribution-Github-Action@v1
  with:
    appId: ${{ secrets.FIREBASE_APP_ID }}
    token: ${{ secrets.FIREBASE_TOKEN }}
    groups: testers
    file: android/app/build/outputs/apk/release/app-release.apk
```

### Version Bump Automation

Add to workflow:
```yaml
- name: Bump version
  run: |
    npm version patch
    git push --tags
```

---

## 📊 Build Status Badge

Add to your README.md:
```markdown
![Android Build](https://github.com/YOUR_USERNAME/sisters-promise-mobile/actions/workflows/build-android.yml/badge.svg)
![iOS Build](https://github.com/YOUR_USERNAME/sisters-promise-mobile/actions/workflows/build-ios.yml/badge.svg)
```

---

## 💰 GitHub Actions Costs

### Free Tier (Public Repos)
- **Linux runners:** Unlimited
- **macOS runners:** 500 minutes/month
- **Windows runners:** Unlimited

### Free Tier (Private Repos)
- **Linux runners:** 2,000 minutes/month
- **macOS runners:** 500 minutes/month
- **Windows runners:** 2,000 minutes/month

**Cost Multipliers:**
- Linux: 1x
- macOS: 10x (so 1 minute = 10 minutes)
- Windows: 2x

**Example:** A 20-minute macOS iOS build = 200 minutes from your quota.

**Recommendation:** Use Android builds frequently, iOS builds only for releases.

---

## 📚 Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [React Native Publishing Guide](https://reactnative.dev/docs/signed-apk-android)
- [Fastlane for React Native](https://docs.fastlane.tools/getting-started/cross-platform/react-native/)
- [Apple Developer Portal](https://developer.apple.com/)

---

## 🆘 Getting Help

If you encounter issues:

1. Check the **Actions** tab for detailed error logs
2. Review this guide's Troubleshooting section
3. Search [GitHub Discussions](https://github.com/facebook/react-native/discussions)
4. Ask on [Stack Overflow](https://stackoverflow.com/questions/tagged/react-native)

---

## ✅ Checklist

Before your first build:
- [ ] Workflow files copied to `.github/workflows/`
- [ ] API_BASE_URL secret added
- [ ] GA_MEASUREMENT_ID secret added (if using analytics)
- [ ] For signed Android: Keystore secrets added
- [ ] For iOS App Store: Certificate secrets added
- [ ] Workflows committed and pushed to GitHub
- [ ] First build triggered and completed successfully

---

**Last Updated:** January 16, 2026  
**Maintained by:** Sister's Promise Development Team
