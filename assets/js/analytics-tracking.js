/**
 * Analytics Tracking Service
 * Tracks user interactions with Google Analytics 4 and Apple Analytics
 * 
 * Usage:
 *   AnalyticsService.trackEvent('purchase', { value: 99.99, currency: 'USD' })
 *   AnalyticsService.trackPageView('/shop')
 *   AnalyticsService.setUserProperties({ userType: 'subscriber' })
 */

class AnalyticsService {
  constructor() {
    this.ga4Initialized = false;
    this.appleAnalyticsInitialized = false;
    this.sessionId = this.generateSessionId();
    this.init();
  }

  /**
   * Initialize analytics trackers
   */
  init() {
    this.initGA4();
    this.initAppleAnalytics();
  }

  /**
   * Initialize Google Analytics 4
   */
  initGA4() {
    if (!window.GA_MEASUREMENT_ID) {
      console.warn('GA_MEASUREMENT_ID not configured');
      return;
    }

    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${window.GA_MEASUREMENT_ID}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    function gtag() {
      window.dataLayer.push(arguments);
    }
    window.gtag = gtag;
    gtag('js', new Date());
    gtag('config', window.GA_MEASUREMENT_ID, {
      page_path: window.location.pathname,
      anonymize_ip: true,
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
    });

    this.ga4Initialized = true;
    console.log('✓ Google Analytics 4 initialized');
  }

  /**
   * Initialize Apple Analytics (App Measurement)
   */
  initAppleAnalytics() {
    // Apple Analytics via MTT (Mobile App Tracking)
    // This is handled through native app tracking for iOS/macOS
    if (window.webkit && window.webkit.messageHandlers) {
      window.appleAnalyticsAvailable = true;
      this.appleAnalyticsInitialized = true;
      console.log('✓ Apple Analytics initialized (via WebKit)');
    } else if (navigator.userAgent.includes('iPhone') || navigator.userAgent.includes('iPad')) {
      // For web version on iOS, use same GA4 which Apple can track
      console.log('✓ Apple Analytics enabled via GA4 tracking');
    }
  }

  /**
   * Track custom event
   * @param {string} eventName - Name of the event
   * @param {object} eventData - Event parameters
   */
  trackEvent(eventName, eventData = {}) {
    try {
      // Google Analytics 4
      if (this.ga4Initialized && window.gtag) {
        window.gtag('event', eventName, {
          ...eventData,
          session_id: this.sessionId,
          timestamp: new Date().toISOString(),
        });
      }

      // Apple Analytics
      if (this.appleAnalyticsInitialized) {
        this.sendToAppleAnalytics(eventName, eventData);
      }

      // Local logging
      console.log(`📊 Event tracked: ${eventName}`, eventData);
    } catch (error) {
      console.error('Error tracking event:', error);
    }
  }

  /**
   * Track page view
   * @param {string} pagePath - Page path (e.g., '/shop')
   * @param {string} pageTitle - Page title (optional)
   */
  trackPageView(pagePath, pageTitle = '') {
    try {
      if (this.ga4Initialized && window.gtag) {
        window.gtag('event', 'page_view', {
          page_path: pagePath,
          page_title: pageTitle || document.title,
          session_id: this.sessionId,
        });
      }

      console.log(`📄 Page view tracked: ${pagePath}`);
    } catch (error) {
      console.error('Error tracking page view:', error);
    }
  }

  /**
   * Track e-commerce purchase
   * @param {object} purchaseData - { items, value, currency, transaction_id }
   */
  trackPurchase(purchaseData) {
    const {
      items = [],
      value = 0,
      currency = 'USD',
      transaction_id = this.generateSessionId(),
    } = purchaseData;

    try {
      if (this.ga4Initialized && window.gtag) {
        window.gtag('event', 'purchase', {
          transaction_id,
          value,
          currency,
          items: items.map(item => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category,
            price: item.price,
            quantity: item.quantity,
          })),
          session_id: this.sessionId,
        });
      }

      console.log(`💳 Purchase tracked: $${value} ${currency}`);
    } catch (error) {
      console.error('Error tracking purchase:', error);
    }
  }

  /**
   * Track user engagement
   */
  trackUserEngagement(action, details = {}) {
    const engagementEvents = {
      'view_item': 'item_viewed',
      'add_to_cart': 'add_to_cart',
      'remove_from_cart': 'remove_from_cart',
      'view_cart': 'view_cart',
      'begin_checkout': 'begin_checkout',
      'add_payment_info': 'add_payment_info',
      'add_shipping_info': 'add_shipping_info',
      'search': 'search',
      'view_promotion': 'view_promotion',
      'select_promotion': 'select_promotion',
    };

    const eventName = engagementEvents[action] || action;
    this.trackEvent(eventName, details);
  }

  /**
   * Set user properties for analytics
   * @param {object} properties - User properties
   */
  setUserProperties(properties) {
    try {
      if (this.ga4Initialized && window.gtag) {
        window.gtag('set', {
          user_id: properties.userId,
          user_properties: {
            user_type: properties.userType,
            subscription_status: properties.subscriptionStatus,
            lifetime_value: properties.lifetimeValue,
          },
        });
      }

      console.log('👤 User properties set:', properties);
    } catch (error) {
      console.error('Error setting user properties:', error);
    }
  }

  /**
   * Track error
   * @param {string} errorMessage - Error message
   * @param {string} errorCategory - Error category
   */
  trackError(errorMessage, errorCategory = 'general') {
    this.trackEvent('exception', {
      description: errorMessage,
      fatal: false,
      category: errorCategory,
    });
  }

  /**
   * Send event to Apple Analytics via WebKit
   */
  sendToAppleAnalytics(eventName, eventData) {
    try {
      if (window.webkit && window.webkit.messageHandlers) {
        window.webkit.messageHandlers.analyticsEvent.postMessage({
          event: eventName,
          data: eventData,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.debug('Apple Analytics not available in this context');
    }
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session ID
   */
  getSessionId() {
    return this.sessionId;
  }

  /**
   * Set consent mode
   * @param {object} consentSettings - { analytics, marketing, personalization }
   */
  setConsentMode(consentSettings) {
    try {
      if (this.ga4Initialized && window.gtag) {
        window.gtag('consent', 'update', {
          analytics_storage: consentSettings.analytics ? 'granted' : 'denied',
          ad_storage: consentSettings.marketing ? 'granted' : 'denied',
          ad_personalization_storage: consentSettings.personalization ? 'granted' : 'denied',
        });
      }

      console.log('🔒 Consent mode updated:', consentSettings);
    } catch (error) {
      console.error('Error setting consent mode:', error);
    }
  }
}

// Initialize globally
const analyticsService = new AnalyticsService();

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AnalyticsService;
}
