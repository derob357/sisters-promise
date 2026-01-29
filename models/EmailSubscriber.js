/**
 * EmailSubscriber Model - MongoDB Version
 * Manages customer email list, campaigns, and subscription preferences
 * Uses MongoDB for persistent storage with fallback to file-based storage
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Subscriber, Campaign, EmailLog } = require('./emailSchemas');

class EmailSubscriber {
  constructor(useMongoDB = true) {
    this.useMongoDB = useMongoDB;
    // Use /tmp for serverless environments (Vercel has read-only filesystem)
    const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
    this.dataDir = isServerless ? '/tmp/data' : path.join(__dirname, '../data');
    this.subscribersFile = path.join(this.dataDir, 'subscribers.json');
    this.campaignsFile = path.join(this.dataDir, 'campaigns.json');
    this.logsFile = path.join(this.dataDir, 'email-logs.json');

    // Load file-based data as fallback (skip if using MongoDB on serverless)
    if (!useMongoDB || !isServerless) {
      this.ensureDataDir();
    }
    this.subscribers = this.loadSubscribers();
    this.campaigns = this.loadCampaigns();
    this.logs = this.loadLogs();
  }

  /**
   * Ensure data directory exists for fallback storage
   */
  ensureDataDir() {
    try {
      if (!fs.existsSync(this.dataDir)) {
        fs.mkdirSync(this.dataDir, { recursive: true });
      }
    } catch (error) {
      // Silently fail on read-only filesystems (serverless)
      console.warn('Could not create data directory:', error.message);
    }
  }

  /**
   * Load subscribers from file (fallback)
   */
  loadSubscribers() {
    try {
      if (fs.existsSync(this.subscribersFile)) {
        const data = fs.readFileSync(this.subscribersFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading subscribers from file:', error.message);
    }
    return [];
  }

  /**
   * Load campaigns from file (fallback)
   */
  loadCampaigns() {
    try {
      if (fs.existsSync(this.campaignsFile)) {
        const data = fs.readFileSync(this.campaignsFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading campaigns from file:', error.message);
    }
    return [];
  }

  /**
   * Load email logs from file (fallback)
   */
  loadLogs() {
    try {
      if (fs.existsSync(this.logsFile)) {
        const data = fs.readFileSync(this.logsFile, 'utf-8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('Error loading logs from file:', error.message);
    }
    return [];
  }

  /**
   * Save subscribers to both MongoDB and file
   */
  async saveSubscribers() {
    const fileSaved = this._saveSubscribersToFile();
    
    if (this.useMongoDB && this.subscribers) {
      try {
        // Sync to MongoDB
        for (const subscriber of this.subscribers) {
          await Subscriber.findOneAndUpdate(
            { id: subscriber.id },
            subscriber,
            { upsert: true, new: true }
          );
        }
      } catch (error) {
        console.error('Error syncing subscribers to MongoDB:', error.message);
      }
    }
    
    return fileSaved;
  }

  /**
   * Save subscribers to file only (private)
   */
  _saveSubscribersToFile() {
    try {
      fs.writeFileSync(
        this.subscribersFile,
        JSON.stringify(this.subscribers, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Error saving subscribers to file:', error.message);
      return false;
    }
  }

  /**
   * Save campaigns to both MongoDB and file
   */
  async saveCampaigns() {
    const fileSaved = this._saveCampaignsToFile();
    
    if (this.useMongoDB && this.campaigns) {
      try {
        for (const campaign of this.campaigns) {
          await Campaign.findOneAndUpdate(
            { id: campaign.id },
            campaign,
            { upsert: true, new: true }
          );
        }
      } catch (error) {
        console.error('Error syncing campaigns to MongoDB:', error.message);
      }
    }
    
    return fileSaved;
  }

  /**
   * Save campaigns to file only (private)
   */
  _saveCampaignsToFile() {
    try {
      fs.writeFileSync(
        this.campaignsFile,
        JSON.stringify(this.campaigns, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Error saving campaigns to file:', error.message);
      return false;
    }
  }

  /**
   * Save email logs to both MongoDB and file
   */
  async saveLogs() {
    const fileSaved = this._saveLogsToFile();
    
    if (this.useMongoDB && this.logs) {
      try {
        for (const log of this.logs) {
          await EmailLog.create(log).catch(() => {
            // Log already exists, that's okay
          });
        }
      } catch (error) {
        console.error('Error syncing logs to MongoDB:', error.message);
      }
    }
    
    return fileSaved;
  }

  /**
   * Save email logs to file only (private)
   */
  _saveLogsToFile() {
    try {
      fs.writeFileSync(
        this.logsFile,
        JSON.stringify(this.logs, null, 2)
      );
      return true;
    } catch (error) {
      console.error('Error saving logs to file:', error.message);
      return false;
    }
  }

  /**
   * Add new subscriber (MongoDB primary)
   */
  async addSubscriber(email, firstName = '', lastName = '') {
    if (!this.validateEmail(email)) {
      throw new Error('Invalid email address');
    }

    try {
      const subscriber = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        firstName: firstName || '',
        lastName: lastName || '',
        status: 'active',
        preferences: {
          newsletters: true,
          promotions: true,
          productUpdates: true,
        },
        unsubscribeToken: crypto.randomBytes(32).toString('hex'),
        subscriptionDate: new Date(),
        lastEngaged: new Date(),
      };

      if (this.useMongoDB) {
        try {
          const dbSubscriber = await Subscriber.create(subscriber);
          console.log(`✓ Subscriber ${email} added to MongoDB`);
          return dbSubscriber;
        } catch (error) {
          if (error.code === 11000) {
            throw new Error('Email already subscribed');
          }
          throw error;
        }
      } else {
        // Fallback to file-based storage
        const existing = this.subscribers.find(s => s.email === email.toLowerCase());
        if (existing) {
          throw new Error('Email already subscribed');
        }
        this.subscribers.push(subscriber);
        await this.saveSubscribers();
        return subscriber;
      }
    } catch (error) {
      console.error('Error adding subscriber:', error.message);
      throw error;
    }
  }

  /**
   * Get subscriber by email (MongoDB primary)
   */
  async getSubscriber(email) {
    const normalizedEmail = email.toLowerCase();
    
    if (this.useMongoDB) {
      try {
        const subscriber = await Subscriber.findOne({ email: normalizedEmail });
        return subscriber;
      } catch (error) {
        console.error('Error fetching subscriber from MongoDB:', error.message);
      }
    }
    
    // Fallback to file-based storage
    return this.subscribers.find(s => s.email === normalizedEmail) || null;
  }

  /**
   * Update subscriber (MongoDB primary)
   */
  async updateSubscriber(email, updates) {
    const normalizedEmail = email.toLowerCase();
    
    if (this.useMongoDB) {
      try {
        const subscriber = await Subscriber.findOneAndUpdate(
          { email: normalizedEmail },
          updates,
          { new: true }
        );
        if (!subscriber) {
          throw new Error('Subscriber not found');
        }
        console.log(`✓ Subscriber ${email} updated in MongoDB`);
        return subscriber;
      } catch (error) {
        console.error('Error updating subscriber:', error.message);
        throw error;
      }
    }
    
    // Fallback to file-based storage
    const index = this.subscribers.findIndex(s => s.email === normalizedEmail);
    if (index === -1) {
      throw new Error('Subscriber not found');
    }
    this.subscribers[index] = { ...this.subscribers[index], ...updates };
    await this.saveSubscribers();
    return this.subscribers[index];
  }

  /**
   * Unsubscribe by email (MongoDB primary)
   */
  async unsubscribe(email) {
    return this.updateSubscriber(email, { status: 'unsubscribed' });
  }

  /**
   * Unsubscribe using token (MongoDB primary)
   */
  async unsubscribeByToken(token) {
    if (this.useMongoDB) {
      try {
        const subscriber = await Subscriber.findOneAndUpdate(
          { unsubscribeToken: token },
          { status: 'unsubscribed' },
          { new: true }
        );
        if (!subscriber) {
          throw new Error('Invalid unsubscribe token');
        }
        console.log(`✓ Subscriber unsubscribed via token`);
        return subscriber;
      } catch (error) {
        console.error('Error unsubscribing by token:', error.message);
        throw error;
      }
    }
    
    // Fallback to file-based storage
    const index = this.subscribers.findIndex(s => s.unsubscribeToken === token);
    if (index === -1) {
      throw new Error('Invalid unsubscribe token');
    }
    this.subscribers[index].status = 'unsubscribed';
    await this.saveSubscribers();
    return this.subscribers[index];
  }

  /**
   * Create campaign (MongoDB primary)
   */
  async createCampaign(name, subject, templateName, content) {
    try {
      const campaign = {
        id: crypto.randomUUID(),
        name,
        subject,
        templateName,
        content,
        status: 'draft',
        recipientCount: 0,
        sentCount: 0,
        openCount: 0,
        clickCount: 0,
        bounceCount: 0,
        complaintCount: 0,
      };

      if (this.useMongoDB) {
        try {
          const dbCampaign = await Campaign.create(campaign);
          console.log(`✓ Campaign "${name}" created in MongoDB`);
          return dbCampaign;
        } catch (error) {
          throw error;
        }
      } else {
        this.campaigns.push(campaign);
        await this.saveCampaigns();
        return campaign;
      }
    } catch (error) {
      console.error('Error creating campaign:', error.message);
      throw error;
    }
  }

  /**
   * Get campaign by ID (MongoDB primary)
   */
  async getCampaign(campaignId) {
    if (this.useMongoDB) {
      try {
        const campaign = await Campaign.findOne({ id: campaignId });
        return campaign;
      } catch (error) {
        console.error('Error fetching campaign from MongoDB:', error.message);
      }
    }
    
    return this.campaigns.find(c => c.id === campaignId) || null;
  }

  /**
   * Update campaign (MongoDB primary)
   */
  async updateCampaign(campaignId, updates) {
    if (this.useMongoDB) {
      try {
        const campaign = await Campaign.findOneAndUpdate(
          { id: campaignId },
          updates,
          { new: true }
        );
        if (!campaign) {
          throw new Error('Campaign not found');
        }
        console.log(`✓ Campaign "${campaignId}" updated in MongoDB`);
        return campaign;
      } catch (error) {
        console.error('Error updating campaign:', error.message);
        throw error;
      }
    }
    
    const index = this.campaigns.findIndex(c => c.id === campaignId);
    if (index === -1) {
      throw new Error('Campaign not found');
    }
    this.campaigns[index] = { ...this.campaigns[index], ...updates };
    await this.saveCampaigns();
    return this.campaigns[index];
  }

  /**
   * Update campaign status (MongoDB primary)
   */
  async updateCampaignStatus(campaignId, status) {
    return this.updateCampaign(campaignId, { status });
  }

  /**
   * Get statistics (MongoDB primary)
   */
  async getStats() {
    if (this.useMongoDB) {
      try {
        const totalSubscribers = await Subscriber.countDocuments();
        const activeSubscribers = await Subscriber.countDocuments({ status: 'active' });
        const unsubscribed = await Subscriber.countDocuments({ status: 'unsubscribed' });
        const totalCampaigns = await Campaign.countDocuments();
        const sentCampaigns = await Campaign.countDocuments({ status: 'sent' });
        const totalEmails = await EmailLog.countDocuments();
        const deliveredEmails = await EmailLog.countDocuments({ status: 'delivered' });

        return {
          totalSubscribers,
          activeSubscribers,
          unsubscribed,
          totalCampaigns,
          sentCampaigns,
          totalEmails,
          deliveredEmails,
          lastUpdated: new Date(),
        };
      } catch (error) {
        console.error('Error fetching stats from MongoDB:', error.message);
      }
    }
    
    // Fallback to file-based calculation
    return {
      totalSubscribers: this.subscribers.length,
      activeSubscribers: this.subscribers.filter(s => s.status === 'active').length,
      unsubscribed: this.subscribers.filter(s => s.status === 'unsubscribed').length,
      totalCampaigns: this.campaigns.length,
      sentCampaigns: this.campaigns.filter(c => c.status === 'sent').length,
      totalEmails: this.logs.length,
      deliveredEmails: this.logs.filter(l => l.status === 'delivered').length,
      lastUpdated: new Date(),
    };
  }

  /**
   * Get active subscribers (MongoDB primary)
   */
  async getActiveSubscribers() {
    if (this.useMongoDB) {
      try {
        const subscribers = await Subscriber.find({ status: 'active' });
        return subscribers;
      } catch (error) {
        console.error('Error fetching active subscribers from MongoDB:', error.message);
      }
    }
    
    return this.subscribers.filter(s => s.status === 'active');
  }

  /**
   * Get active subscriber count (MongoDB primary)
   */
  async getActiveSubscriberCount() {
    if (this.useMongoDB) {
      try {
        const count = await Subscriber.countDocuments({ status: 'active' });
        return count;
      } catch (error) {
        console.error('Error counting active subscribers in MongoDB:', error.message);
      }
    }
    
    return this.subscribers.filter(s => s.status === 'active').length;
  }

  /**
   * Export subscribers as CSV (MongoDB primary)
   */
  async exportAsCSV() {
    let subscribers;
    
    if (this.useMongoDB) {
      try {
        subscribers = await Subscriber.find({ status: 'active' });
      } catch (error) {
        console.error('Error fetching subscribers for export:', error.message);
        subscribers = this.subscribers.filter(s => s.status === 'active');
      }
    } else {
      subscribers = this.subscribers.filter(s => s.status === 'active');
    }

    let csv = 'Email,First Name,Last Name,Subscription Date\n';
    subscribers.forEach(s => {
      csv += `${s.email},"${s.firstName || ''}","${s.lastName || ''}",${s.subscriptionDate || ''}\n`;
    });
    return csv;
  }

  /**
   * Log email action (MongoDB primary)
   */
  async logAction(subscriberId, email, type, action, details = {}) {
    const logEntry = {
      id: crypto.randomUUID(),
      subscriberId,
      email: email.toLowerCase(),
      type,
      action,
      details,
      sentDate: new Date(),
    };

    if (this.useMongoDB) {
      try {
        await EmailLog.create(logEntry);
      } catch (error) {
        console.error('Error logging action to MongoDB:', error.message);
      }
    }

    this.logs.push(logEntry);
    await this.saveLogs();
    return logEntry;
  }

  /**
   * Get logs (MongoDB primary)
   */
  async getLogs(limit = 100) {
    if (this.useMongoDB) {
      try {
        const logs = await EmailLog.find()
          .sort({ sentDate: -1 })
          .limit(limit);
        return logs;
      } catch (error) {
        console.error('Error fetching logs from MongoDB:', error.message);
      }
    }
    
    return this.logs.slice(-limit);
  }

  /**
   * Get campaigns stats (MongoDB primary)
   */
  async getCampaignsStats() {
    if (this.useMongoDB) {
      try {
        const campaigns = await Campaign.find();
        return campaigns.map(c => ({
          id: c.id,
          name: c.name,
          status: c.status,
          sentCount: c.sentCount,
          openCount: c.openCount,
          clickCount: c.clickCount,
        }));
      } catch (error) {
        console.error('Error fetching campaign stats:', error.message);
      }
    }
    
    return this.campaigns.map(c => ({
      id: c.id,
      name: c.name,
      status: c.status,
      sentCount: c.sentCount,
      openCount: c.openCount,
      clickCount: c.clickCount,
    }));
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

module.exports = EmailSubscriber;
