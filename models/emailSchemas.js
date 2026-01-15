/**
 * Email Schemas for MongoDB
 * Defines Mongoose schemas for subscribers, campaigns, and email logs
 */

const mongoose = require('mongoose');

/**
 * Subscriber Schema - Stores email subscriber information
 */
const subscriberSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
      match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    },
    firstName: {
      type: String,
      trim: true,
      default: '',
    },
    lastName: {
      type: String,
      trim: true,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'unsubscribed', 'bounced', 'complained'],
      default: 'active',
      index: true,
    },
    preferences: {
      newsletters: { type: Boolean, default: true },
      promotions: { type: Boolean, default: true },
      productUpdates: { type: Boolean, default: true },
    },
    unsubscribeToken: {
      type: String,
      unique: true,
      sparse: true,
    },
    subscriptionDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    lastEngaged: {
      type: Date,
      default: Date.now,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

/**
 * Campaign Schema - Stores email campaign information
 */
const campaignSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    templateName: {
      type: String,
      required: true,
      enum: ['welcome', 'newsletter', 'promotion', 'order-confirmation', 'abandoned-cart', 'custom'],
    },
    content: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'scheduled', 'sending', 'sent', 'cancelled'],
      default: 'draft',
      index: true,
    },
    recipientCount: {
      type: Number,
      default: 0,
    },
    sentCount: {
      type: Number,
      default: 0,
    },
    openCount: {
      type: Number,
      default: 0,
    },
    clickCount: {
      type: Number,
      default: 0,
    },
    bounceCount: {
      type: Number,
      default: 0,
    },
    complaintCount: {
      type: Number,
      default: 0,
    },
    scheduledDate: Date,
    sentDate: Date,
    createdBy: String,
    variables: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

/**
 * Email Log Schema - Stores email sending history and activity
 */
const emailLogSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      unique: true,
      required: true,
      index: true,
    },
    subscriberId: {
      type: String,
      required: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      index: true,
    },
    campaignId: {
      type: String,
      index: true,
    },
    type: {
      type: String,
      enum: ['newsletter', 'promotion', 'order-confirmation', 'abandoned-cart', 'welcome', 'custom'],
      required: true,
      index: true,
    },
    subject: String,
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained'],
      default: 'queued',
      index: true,
    },
    errorMessage: String,
    openedAt: Date,
    clickedAt: Date,
    bouncedAt: Date,
    complaintDate: Date,
    action: {
      type: String,
      enum: ['subscribe', 'unsubscribe', 'update', 'send', 'bounce', 'complaint', 'open', 'click'],
    },
    details: mongoose.Schema.Types.Mixed,
    sentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for common queries
subscriberSchema.index({ status: 1, subscriptionDate: -1 });
subscriberSchema.index({ email: 1, status: 1 });
campaignSchema.index({ status: 1, sentDate: -1 });
emailLogSchema.index({ email: 1, sentDate: -1 });
emailLogSchema.index({ campaignId: 1, status: 1 });

// Create models
const Subscriber = mongoose.model('Subscriber', subscriberSchema);
const Campaign = mongoose.model('Campaign', campaignSchema);
const EmailLog = mongoose.model('EmailLog', emailLogSchema);

module.exports = {
  Subscriber,
  Campaign,
  EmailLog,
};
