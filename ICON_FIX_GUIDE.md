# Fix Missing Menu Icons (Question Mark in Box)

## Problem
Bottom tab navigation shows "❓" (question mark in box) instead of home, cart, and profile icons.

## Root Cause
`react-native-vector-icons` package is installed but the Ionicons font files are not properly linked to the native build (iOS/Android).

---

## Solution

### Step 1: Automatic Linking (Recommended)

Run the linking script:
```bash
cd /Users/drob/Documents/SistersPromise/SistersPromiseMobile
chmod +x link-vector-icons.sh
./link-vector-icons.sh
```

This automatically:
- ✅ Updates iOS Podfile with vector icons support
- ✅ Creates Android fonts directory
- ✅ Copies Ionicons.ttf font file
- ✅ Runs `pod install` on iOS

### Step 2: Manual Verification

**iOS:**
1. Check `ios/Podfile` - should include RNVectorIcons support (already done)
2. Verify `Pods/` directory exists
3. Rebuild: `npm run ios`

**Android:**
1. Check fonts exist: `android/app/src/main/assets/fonts/Ionicons.ttf`
2. Rebuild: `npm run android`

### Step 3: Clean Build

If icons still don't appear after rebuilding:

**iOS:**
```bash
cd SistersPromiseMobile/ios
rm -rf Pods Podfile.lock
pod install
cd ..
npm run ios
```

**Android:**
```bash
cd SistersPromiseMobile/android
./gradlew clean
cd ..
npm run android
```

---

## Files Modified

1. **react-native.config.js** (NEW)
   - Configuration for vector icons linking

2. **ios/Podfile** (UPDATED)
   - Added RNVectorIcons pod configuration

3. **link-vector-icons.sh** (NEW)
   - Bash script to automate font linking

4. **android/app/src/main/assets/fonts/** (NEW DIRECTORY)
   - Ionicons.ttf font file copied here

---

## Icon Names Available

The app currently uses these icons from Ionicons:
- `home` / `home-outline` - Shop tab
- `cart` / `cart-outline` - Cart tab  
- `person` / `person-outline` - Profile tab

Other icons available: search, settings, person-circle, basket, menu, close, arrow-back, etc.

---

## Verification

After rebuild, check if:
- ✅ Bottom tabs show home, cart, and person icons
- ✅ Icons change when tab is focused (green when selected)
- ✅ No console warnings about missing fonts
- ✅ No question marks or placeholder icons

---

## If Icons Still Don't Work

1. **Check console for errors:**
   ```
   [Ionicons] font file not found
   Invalid image URI  
   ```

2. **Verify package is installed:**
   ```bash
   npm list react-native-vector-icons
   # Should show: react-native-vector-icons@10.3.0
   ```

3. **Clear caches and reinstall:**
   ```bash
   # Remove all cached builds
   rm -rf node_modules ios/Pods android/.gradle
   
   # Reinstall everything
   npm install
   cd ios && pod install && cd ..
   
   # Clean rebuild
   npm run ios  # or npm run android
   ```

---

## Important Notes

- ⚠️ Must rebuild native app, not just reload JS
- ⚠️ iOS and Android need separate linking process
- ⚠️ Font files must be exactly 10.3.0 version to match package
- ✅ This is a one-time setup - works after first rebuild

---

## Deployment

After fixing locally:
1. Commit changes to git
2. iOS app will have icons automatically (via Podfile)
3. Android app will have icons automatically (via fonts directory)
4. No additional build configuration needed

