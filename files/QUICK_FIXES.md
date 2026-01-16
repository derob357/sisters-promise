# Quick Fixes for Critical Issues

This file contains ready-to-use code fixes for the critical issues found in the code analysis.

---

## 🔴 FIX #1: Add Missing UUID Dependency

**Issue:** Analytics service imports `uuid` but it's not in package.json

### Fix Command:
```bash
npm install uuid --save
# or for React Native specific:
npm install react-native-get-random-values --save
```

### Update analyticsService.js:
If using `react-native-get-random-values`:
```javascript
// At the top of src/services/analyticsService.js
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
```

---

## 🔴 FIX #2: Fix Axios Configuration

**File:** `src/services/api.js`

### Replace lines 14-21 with:
```javascript
// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  // Note: httpsAgent doesn't work in React Native
  // For development with self-signed certs, configure at native level
});
```

### Remove or comment out lines 30-33:
```javascript
// Remove this - URL is already in baseURL
// if (config.url && !config.url.startsWith('https')) {
//   config.url = config.url.replace(/^http:/, 'https:');
// }
```

---

## 🔴 FIX #3: Stop Tracking PII (Email Addresses)

### File: `src/context/AuthContext.js`

**Line 46 - Change:**
```javascript
// BEFORE
await analyticsService.trackEvent('user_login', { email });

// AFTER
await analyticsService.trackEvent('user_login', { userId: response.user.id });
```

**Line 60 - Change:**
```javascript
// BEFORE
await analyticsService.trackSignup(email, 'standard');

// AFTER
await analyticsService.trackSignup(response.user.id, 'standard');
```

### File: `src/services/analyticsService.js`

**Lines 21-25 - Replace:**
```javascript
// BEFORE
analyticsService.setUserProperties({
  userId: user.id,
  userEmail: user.email,  // ❌ Remove this
  userType: user.role,
});

// AFTER
analyticsService.setUserProperties({
  userId: user.id,
  userType: user.role,
});
```

**Lines 62-67 - Update function signature:**
```javascript
// BEFORE
trackSignup: async (email, userType = 'standard') => {
  try {
    await api.post('/analytics/signup', {
      email,
      userType,
    });

// AFTER
trackSignup: async (userId, userType = 'standard') => {
  try {
    await api.post('/analytics/signup', {
      userId,  // Use userId instead of email
      userType,
    });
```

**Lines 139-145 - Update function:**
```javascript
// BEFORE
trackEmailSubscription: async (email, subscriptionType = 'newsletter') => {
  try {
    await api.post('/analytics/email-subscription', {
      email,
      subscriptionType,
    });

// AFTER
trackEmailSubscription: async (subscriptionId, subscriptionType = 'newsletter') => {
  try {
    await api.post('/analytics/email-subscription', {
      subscriptionId,  // Backend should track by ID, not email
      subscriptionType,
    });
```

---

## 🟠 FIX #4: Add Input Validation

### File: `src/screens/LoginScreen.js`

Add validation helper at the top:
```javascript
// Add after imports
const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};
```

Update handleLogin function (lines 25-39):
```javascript
const handleLogin = async () => {
  // Trim whitespace
  const trimmedEmail = email.trim();
  const trimmedPassword = password.trim();

  // Check for empty fields
  if (!trimmedEmail || !trimmedPassword) {
    setError('Please fill in all fields');
    return;
  }

  // Validate email format
  if (!validateEmail(trimmedEmail)) {
    setError('Please enter a valid email address');
    return;
  }

  // Validate password length
  if (!validatePassword(trimmedPassword)) {
    setError('Password must be at least 8 characters');
    return;
  }

  setLoading(true);
  setError('');
  const result = await login(trimmedEmail, trimmedPassword);

  if (!result.success) {
    setError(result.error);
    setLoading(false);
  }
};
```

### File: `src/screens/RegisterScreen.js`

Add the same validation and update accordingly.

---

## 🟠 FIX #5: Create Logger Utility

### Create new file: `src/utils/logger.js`
```javascript
/**
 * Logger Utility
 * Only logs in development mode
 */

const isDevelopment = __DEV__;

const logger = {
  log: (...args) => {
    if (isDevelopment) {
      console.log(...args);
    }
  },
  
  error: (...args) => {
    if (isDevelopment) {
      console.error(...args);
    }
  },
  
  warn: (...args) => {
    if (isDevelopment) {
      console.warn(...args);
    }
  },
  
  info: (...args) => {
    if (isDevelopment) {
      console.info(...args);
    }
  },
  
  debug: (...args) => {
    if (isDevelopment) {
      console.debug(...args);
    }
  },
};

export default logger;
```

### Replace all console.log in these files:

**File: `src/context/AuthContext.js`**
```javascript
// Add at top
import logger from '../utils/logger';

// Replace line 27
logger.log('Bootstrap error:', error);

// Replace line 75
logger.log('Logout error:', error);
```

**File: `src/context/CartContext.js`**
```javascript
// Add at top
import logger from '../utils/logger';

// Replace lines 30, 52, 60, 68
logger.log('Load cart error:', error);
logger.log('Remove from cart error:', error);
logger.log('Update quantity error:', error);
logger.log('Clear cart error:', error);
```

**File: `src/services/analyticsService.js`**
```javascript
// Add at top
import logger from '../utils/logger';

// Replace all console.log with logger.log
logger.log('Analytics init error:', error);
logger.log('Analytics event error:', error);
// ... etc for all 16 instances
```

---

## 🟠 FIX #6: Add Error State to CartContext

### File: `src/context/CartContext.js`

Update the entire file:
```javascript
/**
 * Cart Context - Global cart state management
 */

import React, { createContext, useState, useEffect } from 'react';
import cartService from '../services/cartService';
import logger from '../utils/logger';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const [error, setError] = useState(null);           // ✅ Added
  const [isLoading, setIsLoading] = useState(false);  // ✅ Added

  // Load cart on mount
  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Parallel loading for better performance
      const [cartData, count, total] = await Promise.all([
        cartService.getCart(),
        cartService.getCartCount(),
        cartService.getCartTotal()
      ]);

      setCart(cartData);
      setCartCount(count);
      setCartTotal(total);
    } catch (error) {
      setError('Failed to load cart');
      logger.error('Load cart error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cartContext = {
    cart,
    cartCount,
    cartTotal,
    error,        // ✅ Expose error
    isLoading,    // ✅ Expose loading
    clearError: () => setError(null),  // ✅ Helper to clear errors
    
    addToCart: async (product, quantity) => {
      try {
        setIsLoading(true);
        setError(null);
        await cartService.addToCart(product, quantity);
        await loadCart();
        return { success: true };
      } catch (error) {
        setError('Failed to add item to cart');
        return { success: false, error: 'Failed to add item to cart' };
      } finally {
        setIsLoading(false);
      }
    },
    
    removeFromCart: async (productId) => {
      try {
        setIsLoading(true);
        setError(null);
        await cartService.removeFromCart(productId);
        await loadCart();
      } catch (error) {
        setError('Failed to remove item from cart');
        logger.error('Remove from cart error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    
    updateQuantity: async (productId, quantity) => {
      try {
        setIsLoading(true);
        setError(null);
        await cartService.updateQuantity(productId, quantity);
        await loadCart();
      } catch (error) {
        setError('Failed to update quantity');
        logger.error('Update quantity error:', error);
      } finally {
        setIsLoading(false);
      }
    },
    
    clearCart: async () => {
      try {
        setIsLoading(true);
        setError(null);
        await cartService.clearCart();
        await loadCart();
      } catch (error) {
        setError('Failed to clear cart');
        logger.error('Clear cart error:', error);
      } finally {
        setIsLoading(false);
      }
    },
  };

  return <CartContext.Provider value={cartContext}>{children}</CartContext.Provider>;
};
```

---

## 🟠 FIX #7: Fix Production Keystore Config

### File: `android/app/build.gradle`

**Replace lines 88-107 with:**
```gradle
signingConfigs {
    debug {
        storeFile file('debug.keystore')
        storePassword 'android'
        keyAlias 'androiddebugkey'
        keyPassword 'android'
    }
    release {
        // Check if release keystore properties exist
        if (project.hasProperty('RELEASE_STORE_FILE')) {
            storeFile file(RELEASE_STORE_FILE)
            storePassword RELEASE_STORE_PASSWORD
            keyAlias RELEASE_KEY_ALIAS
            keyPassword RELEASE_KEY_PASSWORD
        } else {
            // Fallback to debug for local development
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }
}

buildTypes {
    debug {
        signingConfig signingConfigs.debug
    }
    release {
        signingConfig signingConfigs.release
        minifyEnabled true
        shrinkResources true
        proguardFiles getDefaultProguardFile("proguard-android-optimize.txt"), "proguard-rules.pro"
    }
}
```

### Create/Update `android/gradle.properties`:
Add these lines (use environment variables in CI):
```properties
# For local development, you can set these
# For CI/CD, pass as command line arguments: -PRELEASE_STORE_FILE=...
# RELEASE_STORE_FILE=release.keystore
# RELEASE_STORE_PASSWORD=your_password
# RELEASE_KEY_ALIAS=release
# RELEASE_KEY_PASSWORD=your_password
```

---

## 🟡 FIX #8: Add Environment Variables Support

### Install react-native-config:
```bash
npm install react-native-config --save
```

### Update: `src/services/api.js`
```javascript
// Add at top
import Config from 'react-native-config';

// Replace line 11
const API_BASE_URL = Config.API_BASE_URL || 'https://localhost:443/api';
```

### Update: `src/services/analyticsService.js`
```javascript
// Add at top
import Config from 'react-native-config';

// Use Config.GA_MEASUREMENT_ID, Config.GA_API_SECRET, etc.
```

---

## 🟡 FIX #9: Remove Unused Import

### File: `src/screens/LoginScreen.js`

**Line 13 - Remove:**
```javascript
// BEFORE
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,  // ❌ Remove this
} from 'react-native';

// AFTER
import {
  View,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
```

---

## 📋 Quick Application Checklist

Apply these fixes in order:

1. [ ] Run: `npm install uuid --save`
2. [ ] Fix `src/services/api.js` (Remove httpsAgent)
3. [ ] Create `src/utils/logger.js`
4. [ ] Replace all `console.log` with `logger.log`
5. [ ] Update `src/context/AuthContext.js` (Remove email tracking)
6. [ ] Update `src/services/analyticsService.js` (Remove email tracking)
7. [ ] Add validation to `src/screens/LoginScreen.js`
8. [ ] Update `src/context/CartContext.js` (Add error state)
9. [ ] Update `android/app/build.gradle` (Fix signing config)
10. [ ] Test the app locally
11. [ ] Commit changes
12. [ ] Push to GitHub and watch builds run!

---

## 🧪 Testing Your Fixes

### Test Locally:
```bash
# Clear cache
npm start -- --reset-cache

# Android
npm run android

# iOS
cd ios && pod install && cd ..
npm run ios
```

### Verify:
- [ ] App starts without crashes
- [ ] Login works
- [ ] Cart operations work
- [ ] No console.log in release build
- [ ] Analytics doesn't log emails

---

**Last Updated:** January 16, 2026  
**Priority:** Apply these fixes before running GitHub Actions builds
