/**
 * EmailSubscriber Model
 * Manages customer email list and subscription preferences
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Simple file-based storage for email subscribers
// In production, replace with MongoDB, PostgreSQL, or similar
class EmailSubscriber {
  constructor() {
    this.dataDir = path.join(__dirname, '../data');
    this.subscribersFile = path.join(this.dataDir, 'subscribers.json');
    this.campaignsFile = path.join(this.dataDir, 'campaigns.json');
    this.logsFile = path.join(this.dataDir, 'email-logs.json');
    
    this.ensureDataDir();
    this.subscribers = this.loadSubscribers();
    this.campaigns = this.loadCampaigns();
    this.logs = this.loadLogs();
  }

  /**
   * Ensure data directory exists
   */
  ensureDataDir() {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  /**
   * Load subscribers from file
   */
  loadSubscribers() {
    try {
      if (fs.existsSync(this.subscribersFile)) {
        const data = fs.readFileSync(this.subscribersFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading subscribers:', error.message);
    }
    return [];
  }

  /**
   * Load campaigns from file
   */
  loadCampaigns() {
    try {
      if (fs.existsSync(this.campaignsFile)) {
        const data = fs.readFileSync(this.campaignsFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error.message);
    }
    return [];
  }

  /**
   * Load email logs from file
   */
  loadLogs() {
    try {
      if (fs.existsSync(this.logsFile)) {
        const data = fs.readFileSync(this.logsFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading logs:', error.message);
    }
    return [];
  }

  /**
   * Save subscribers to file
   */
  saveSubscribers() {
    try {
      fs.writeFileSync(
        this.subscribersFile,
        JSON.stringify(this.subscribers, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Error saving subscribers:', error.message);
      return false;
    }
  }

  /**
   * Save campaigns to file
   */
  saveCampaigns() {
    try {
      fs.writeFileSync(
        this.campaignsFile,
        JSON.stringify(this.campaigns, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Error saving campaigns:', error.message);
      return false;
    }
  }

  /**
   * Save email logs to file
   */
  saveLogs() {
    try {
      fs.writeFileSync(
        this.logsFile,
        JSON.stringify(this.logs, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Error saving logs:', error.message);
      return false;
    }
  }

  /**
   * Add a new email subscriber
   * @param {Object} subscriberData - { email, firstName, lastName, preferences, source }
   */
  addSubscriber(subscriberData) {
    const { email, firstName = '', lastName = '', preferences = {}, source = 'website' } = subscriberData;

    // Validate email
    if (!this.isValidEmail(email)) {
      throw new Error('Invalid email address');
    }

    // Check if already subscribed
    if (this.subscribers.some(s => s.email.toLowerCase() === email.toLowerCase())) {
      throw new Error('Email already subscribed');
    }

    const subscriber = {
      id: crypto.randomBytes(8).toString('hex'),
      email: email.toLowerCase(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      preferences: {
        marketing: preferences.marketing !== false,
        newsletter: preferences.newsletter !== false,
        promotions: preferences.promotions !== false,
        productUpdates: preferences.productUpdates !== false,
        ...preferences
      },
      source,
      subscriptionDate: new Date().toISOString(),
      lastUpdated: new Date().toISOString(),
      status: 'active',
      unsubscribeToken: crypto.randomBytes(16).toString('hex'),
      bounced: false,
      complained: false,
    };

    this.subscribers.push(subscriber);
    this.saveSubscribers();

    this.logAction('subscriber_added', email, { source });

    return subscriber;
  }

  /**
   * Get subscriber by email
   */
  getSubscriber(email) {
    return this.subscribers.find(s => s.email.toLowerCase() === email.toLowerCase());
  }

  /**
   * Get subscriber by ID
   */
  getSubscriberById(id) {
    return this.subscribers.find(s => s.id === id);
  }

  /**
   * Update subscriber preferences
   */
  updateSubscriber(email, updates) {
    const subscriber = this.getSubscriber(email);
    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    // Only allow updates to specific fields
    const allowedUpdates = ['firstName', 'lastName', 'preferences', 'status'];
    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        if (key === 'preferences') {
          subscriber.preferences = { ...subscriber.preferences, ...updates[key] };
        } else {
          subscriber[key] = updates[key];
        }
      }
    });

    subscriber.lastUpdated = new Date().toISOString();
    this.saveSubscribers();

    this.logAction('subscriber_updated', email, updates);

    return subscriber;
  }

  /**
   * Unsubscribe a subscriber
   */
  unsubscribe(email) {
    const subscriber = this.getSubscriber(email);
    if (!subscriber) {
      throw new Error('Subscriber not found');
    }

    subscriber.status = 'unsubscribed';
    subscriber.lastUpdated = new Date().toISOString();
    this.saveSubscribers();

    this.logAction('unsubscribed', email);

    return subscriber;
  }

  /**
   * Unsubscribe using token (for email links)
   */
  unsubscribeByToken(token) {
    const subscriber = this.subscribers.find(s => s.unsubscribeToken === token);
    if (!subscriber) {
      throw new Error('Invalid unsubscribe token');
    }

    return this.unsubscribe(subscriber.email);
  }

  /**
   * Get active subscribers for a campaign type
   */
  getActiveSubscribers(campaignType = 'newsletter') {
    return this.subscribers.filter(s => 
      s.status === 'active' && 
      !s.bounced &&
      s.preferences[campaignType] !== false
    );
  }

  /**
   * Get all active subscribers
   */
  getAllActiveSubscribers() {
    return this.subscribers.filter(s => 
      s.status === 'active' && 
      !s.bounced
    );
  }

  /**
   * Mark email as bounced
   */
  markBounced(email) {
    const subscriber = this.getSubscriber(email);
    if (subscriber) {
      subscriber.bounced = true;
      subscriber.lastUpdated = new Date().toISOString();
      this.saveSubscribers();
      this.logAction('email_bounced', email);
    }
  }

  /**
   * Mark email as complained (spam)
   */
  markComplained(email) {
    const subscriber = this.getSubscriber(email);
    if (subscriber) {
      subscriber.complained = true;
      subscriber.status = 'inactive';
      subscriber.lastUpdated = new Date().toISOString();
      this.saveSubscribers();
      this.logAction('complaint_received', email);
    }
  }

  /**
   * Validate email format
   */
  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Get subscriber count
   */
  getSubscriberCount() {
    return this.subscribers.length;
  }

  /**
   * Get active subscriber count
   */
  getActiveSubscriberCount() {
    return this.getActiveSubscribers().length;
  }

  /**
   * Get subscriber statistics
   */
  getStats() {
    const total = this.subscribers.length;
    const active = this.getActiveSubscribers().length;
    const unsubscribed = this.subscribers.filter(s => s.status === 'unsubscribed').length;
    const bounced = this.subscribers.filter(s => s.bounced).length;
    const complained = this.subscribers.filter(s => s.complained).length;

    return {
      total,
      active,
      unsubscribed,
      bounced,
      complained,
      subscriptionRate: total > 0 ? ((active / total) * 100).toFixed(2) + '%' : '0%',
    };
  }

  /**
   * Create a new marketing campaign
   */
  createCampaign(campaignData) {
    const { name, subject, templateId, type = 'newsletter', scheduleTime = null } = campaignData;

    if (!name || !subject || !templateId) {
      throw new Error('Missing required campaign fields');
    }

    const campaign = {
      id: crypto.randomBytes(8).toString('hex'),
      name: name.trim(),
      subject: subject.trim(),
      templateId,
      type,
      status: scheduleTime ? 'scheduled' : 'draft',
      scheduleTime: scheduleTime ? new Date(scheduleTime).toISOString() : null,
      createdAt: new Date().toISOString(),
      sentAt: null,
      recipientCount: 0,
      openCount: 0,
      clickCount: 0,
      bounceCount: 0,
      complaintCount: 0,
      unsubscribeCount: 0,
    };

    this.campaigns.push(campaign);
    this.saveCampaigns();

    this.logAction('campaign_created', campaign.id, { name, type });

    return campaign;
  }

  /**
   * Get campaign by ID
   */
  getCampaign(campaignId) {
    return this.campaigns.find(c => c.id === campaignId);
  }

  /**
   * Update campaign status
   */
  updateCampaignStatus(campaignId, status) {
    const campaign = this.getCampaign(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }

    campaign.status = status;
    if (status === 'sent') {
      campaign.sentAt = new Date().toISOString();
    }
    this.saveCampaigns();

    this.logAction('campaign_updated', campaignId, { status });

    return campaign;
  }

  /**
   * Record email open
   */
  recordOpen(campaignId, email) {
    const campaign = this.getCampaign(campaignId);
    if (campaign) {
      campaign.openCount = (campaign.openCount || 0) + 1;
      this.saveCampaigns();
      this.logAction('email_opened', email, { campaignId });
    }
  }

  /**
   * Record email click
   */
  recordClick(campaignId, email, link) {
    const campaign = this.getCampaign(campaignId);
    if (campaign) {
      campaign.clickCount = (campaign.clickCount || 0) + 1;
      this.saveCampaigns();
      this.logAction('email_clicked', email, { campaignId, link });
    }
  }

  /**
   * Log an action
   */
  logAction(action, email, metadata = {}) {
    const log = {
      timestamp: new Date().toISOString(),
      action,
      email,
      ...metadata,
    };

    this.logs.push(log);
    
    // Keep only last 10000 logs
    if (this.logs.length > 10000) {
      this.logs = this.logs.slice(-10000);
    }

    this.saveLogs();
  }

  /**
   * Get recent logs
   */
  getLogs(limit = 100) {
    return this.logs.slice(-limit).reverse();
  }

  /**
   * Export subscribers as CSV
   */
  exportAsCSV() {
    const headers = ['Email', 'First Name', 'Last Name', 'Status', 'Subscription Date', 'Marketing', 'Newsletter', 'Promotions'];
    const rows = this.subscribers.map(s => [
      s.email,
      s.firstName,
      s.lastName,
      s.status,
      s.subscriptionDate,
      s.preferences.marketing ? 'Yes' : 'No',
      s.preferences.newsletter ? 'Yes' : 'No',
      s.preferences.promotions ? 'Yes' : 'No',
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(field => `"${field}"`).join(','))
    ].join('\n');

    return csv;
  }

  /**
   * Get campaigns statistics
   */
  getCampaignsStats() {
    const totalCampaigns = this.campaigns.length;
    const sentCampaigns = this.campaigns.filter(c => c.status === 'sent').length;
    const draftCampaigns = this.campaigns.filter(c => c.status === 'draft').length;
    const scheduledCampaigns = this.campaigns.filter(c => c.status === 'scheduled').length;

    const totalOpens = this.campaigns.reduce((sum, c) => sum + (c.openCount || 0), 0);
    const totalClicks = this.campaigns.reduce((sum, c) => sum + (c.clickCount || 0), 0);
    const avgOpenRate = sentCampaigns > 0 ? (totalOpens / sentCampaigns).toFixed(2) : '0';
    const avgClickRate = sentCampaigns > 0 ? (totalClicks / sentCampaigns).toFixed(2) : '0';

    return {
      totalCampaigns,
      sentCampaigns,
      draftCampaigns,
      scheduledCampaigns,
      totalOpens,
      totalClicks,
      avgOpenRate,
      avgClickRate,
    };
  }
}

module.exports = EmailSubscriber;
