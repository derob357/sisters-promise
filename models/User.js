/**
 * User Schema for MongoDB
 * Defines role-based user structure with owner, admin, subscriber, and standard roles
 */

const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');

/**
 * User Schema - Manages user accounts with role-based access control
 */
const userSchema = new mongoose.Schema(
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
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false, // Exclude password by default
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'subscriber', 'standard'],
      default: 'standard',
      index: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'suspended', 'deleted'],
      default: 'active',
      index: true,
    },
    permissions: {
      // Admin-level permissions
      manageUsers: { type: Boolean, default: false },
      manageSubscribers: { type: Boolean, default: false },
      manageCampaigns: { type: Boolean, default: false },
      viewAnalytics: { type: Boolean, default: false },
      managePayments: { type: Boolean, default: false },
      
      // Owner-level permissions
      systemSettings: { type: Boolean, default: false },
      viewAuditLogs: { type: Boolean, default: false },
      
      // Subscriber/Standard permissions
      viewOwnProfile: { type: Boolean, default: true },
      updateOwnProfile: { type: Boolean, default: true },
      viewProducts: { type: Boolean, default: true },
      makePurchases: { type: Boolean, default: true },
    },
    profileImage: String,
    phone: String,
    lastLogin: Date,
    loginAttempts: {
      count: { type: Number, default: 0 },
      lastAttempt: Date,
      locked: { type: Boolean, default: false },
      lockedUntil: Date,
    },
    metadata: mongoose.Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcryptjs.genSalt(10);
    this.password = await bcryptjs.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (passwordToCheck) {
  return bcryptjs.compare(passwordToCheck, this.password);
};

// Method to set permissions based on role
userSchema.methods.setPermissionsByRole = function () {
  const permissionsByRole = {
    owner: {
      manageUsers: true,
      manageSubscribers: true,
      manageCampaigns: true,
      viewAnalytics: true,
      managePayments: true,
      systemSettings: true,
      viewAuditLogs: true,
      viewOwnProfile: true,
      updateOwnProfile: true,
      viewProducts: true,
      makePurchases: true,
    },
    admin: {
      manageUsers: true,
      manageSubscribers: true,
      manageCampaigns: true,
      viewAnalytics: true,
      managePayments: true,
      systemSettings: false,
      viewAuditLogs: false,
      viewOwnProfile: true,
      updateOwnProfile: true,
      viewProducts: true,
      makePurchases: true,
    },
    subscriber: {
      manageUsers: false,
      manageSubscribers: false,
      manageCampaigns: false,
      viewAnalytics: false,
      managePayments: false,
      systemSettings: false,
      viewAuditLogs: false,
      viewOwnProfile: true,
      updateOwnProfile: true,
      viewProducts: true,
      makePurchases: true,
    },
    standard: {
      manageUsers: false,
      manageSubscribers: false,
      manageCampaigns: false,
      viewAnalytics: false,
      managePayments: false,
      systemSettings: false,
      viewAuditLogs: false,
      viewOwnProfile: true,
      updateOwnProfile: true,
      viewProducts: true,
      makePurchases: true,
    },
  };

  this.permissions = permissionsByRole[this.role] || permissionsByRole.standard;
};

// Create indexes for common queries
userSchema.index({ email: 1, status: 1 });
userSchema.index({ role: 1, status: 1 });
userSchema.index({ createdAt: -1 });

// Create User model
const User = mongoose.model('User', userSchema);

module.exports = User;
