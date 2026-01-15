/**
 * Backend Analytics Service
 * Tracks server-side events and sends them to Google Analytics 4 via Measurement Protocol
 */

const axios = require('axios');
const crypto = require('crypto');

class BackendAnalyticsService {
  constructor() {
    this.gaEndpoint = 'https://www.google-analytics.com/mp/collect';
    this.debugEndpoint = 'https://www.google-analytics.com/mp/collect?measurement_id=G_DEBUG';
    this.measurementId = process.env.GA_MEASUREMENT_ID;
    this.apiSecret = process.env.GA_API_SECRET;
    this.clientId = this.generateClientId();
  }

  /**
   * Send event to Google Analytics via Measurement Protocol
   */
  async trackEvent(eventName, eventParams = {}, userId = null) {
    if (!this.measurementId || !this.apiSecret) {
      console.warn('GA_MEASUREMENT_ID or GA_API_SECRET not configured');
      return false;
    }

    try {
      const payload = {
        client_id: userId || this.clientId,
        timestamp_micros: (Date.now() * 1000).toString(),
        events: [
          {
            name: eventName,
            params: {
              ...eventParams,
              session_id: crypto.randomBytes(8).toString('hex'),
              timestamp: new Date().toISOString(),
            },
          },
        ],
      };

      const response = await axios.post(
        `${this.gaEndpoint}?measurement_id=${this.measurementId}&api_secret=${this.apiSecret}`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }
      );

      console.log(`✓ Event tracked (${eventName}):`, response.status === 204 ? 'Success' : 'Queued');
      return true;
    } catch (error) {
      console.error('Error tracking event:', error.message);
      return false;
    }
  }

  /**
   * Track user signup
   */
  async trackSignup(userEmail, userType = 'standard') {
    return this.trackEvent('sign_up', {
      method: 'email',
      user_type: userType,
      email: userEmail,
    }, userEmail);
  }

  /**
   * Track user login
   */
  async trackLogin(userEmail, method = 'email') {
    return this.trackEvent('login', {
      method,
      user_id: userEmail,
    }, userEmail);
  }

  /**
   * Track purchase
   */
  async trackPurchase(purchaseData) {
    const {
      userId,
      transactionId,
      value,
      currency = 'USD',
      items = [],
      paymentMethod = 'card',
    } = purchaseData;

    return this.trackEvent('purchase', {
      transaction_id: transactionId,
      value,
      currency,
      payment_method: paymentMethod,
      items: items.map(item => ({
        item_id: item.id,
        item_name: item.name,
        item_category: item.category,
        price: item.price,
        quantity: item.quantity,
      })),
    }, userId);
  }

  /**
   * Track email subscription
   */
  async trackEmailSubscription(email, subscriptionType = 'newsletter') {
    return this.trackEvent('email_subscription', {
      email,
      subscription_type: subscriptionType,
      source: 'website',
    }, email);
  }

  /**
   * Track email campaign sent
   */
  async trackCampaignSent(campaignId, campaignName, recipientCount) {
    return this.trackEvent('campaign_sent', {
      campaign_id: campaignId,
      campaign_name: campaignName,
      recipient_count: recipientCount,
    });
  }

  /**
   * Track email campaign opened
   */
  async trackCampaignOpened(campaignId, email) {
    return this.trackEvent('campaign_opened', {
      campaign_id: campaignId,
      email_hash: this.hashEmail(email),
    }, email);
  }

  /**
   * Track email campaign clicked
   */
  async trackCampaignClicked(campaignId, email, linkUrl) {
    return this.trackEvent('campaign_clicked', {
      campaign_id: campaignId,
      email_hash: this.hashEmail(email),
      link_url: linkUrl,
    }, email);
  }

  /**
   * Track product view
   */
  async trackProductView(productId, productName, category, price) {
    return this.trackEvent('view_item', {
      items: [
        {
          item_id: productId,
          item_name: productName,
          item_category: category,
          price,
        },
      ],
    });
  }

  /**
   * Track add to cart
   */
  async trackAddToCart(userId, productId, productName, price, quantity = 1) {
    return this.trackEvent('add_to_cart', {
      items: [
        {
          item_id: productId,
          item_name: productName,
          price,
          quantity,
        },
      ],
    }, userId);
  }

  /**
   * Track search
   */
  async trackSearch(searchQuery, resultCount) {
    return this.trackEvent('search', {
      search_term: searchQuery,
      number_of_results: resultCount,
    });
  }

  /**
   * Track form submission
   */
  async trackFormSubmission(formName, userId = null) {
    return this.trackEvent('form_submit', {
      form_name: formName,
      timestamp: new Date().toISOString(),
    }, userId);
  }

  /**
   * Track error event
   */
  async trackErrorEvent(errorMessage, errorCode, errorCategory = 'general') {
    return this.trackEvent('exception', {
      description: errorMessage,
      error_code: errorCode,
      category: errorCategory,
      fatal: false,
    });
  }

  /**
   * Hash email for privacy
   */
  hashEmail(email) {
    return crypto
      .createHash('sha256')
      .update(email.toLowerCase())
      .digest('hex')
      .substring(0, 16);
  }

  /**
   * Generate unique client ID
   */
  generateClientId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new BackendAnalyticsService();
