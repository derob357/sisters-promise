/**
 * Rewards Model
 * Manages customer loyalty rewards, points, and special offers
 */

const mongoose = require('mongoose');

// User Rewards Schema - tracks individual user's rewards
const userRewardsSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true,
  },
  points: {
    type: Number,
    default: 0,
    min: 0,
  },
  lifetimePoints: {
    type: Number,
    default: 0,
    min: 0,
  },
  totalPurchases: {
    type: Number,
    default: 0,
    min: 0,
  },
  freeGiftsEarned: {
    type: Number,
    default: 0,
    min: 0,
  },
  freeGiftsRedeemed: {
    type: Number,
    default: 0,
    min: 0,
  },
  tier: {
    type: String,
    enum: ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM'],
    default: 'BRONZE',
  },
  lastPurchaseDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Special Offers Schema - BOGO deals and discounts
const specialOfferSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['bogo', 'discount', 'freeShipping', 'bundle'],
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  productCategory: {
    type: String,
    default: 'All',
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  discountPercent: {
    type: Number,
    min: 0,
    max: 100,
  },
  minQuantity: {
    type: Number,
    default: 1,
    min: 1,
  },
  minPurchaseAmount: {
    type: Number,
    default: 0,
  },
  code: {
    type: String,
    uppercase: true,
  },
  usageLimit: {
    type: Number,
  },
  usageCount: {
    type: Number,
    default: 0,
  },
  validFrom: {
    type: Date,
    default: Date.now,
  },
  validUntil: {
    type: Date,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Bundle Schema - Product bundles with discounts
const bundleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  items: [{
    productId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
    },
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    originalPrice: {
      type: Number,
      required: true,
    },
  }],
  originalPrice: {
    type: Number,
    required: true,
  },
  bundlePrice: {
    type: Number,
    required: true,
  },
  savings: {
    type: Number,
    required: true,
  },
  savingsPercent: {
    type: Number,
    required: true,
  },
  image: {
    type: String,
  },
  isCustomizable: {
    type: Boolean,
    default: false,
  },
  maxCustomItems: {
    type: Number,
  },
  active: {
    type: Boolean,
    default: true,
  },
  featured: {
    type: Boolean,
    default: false,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Rewards History Schema - track all reward transactions
const rewardsHistorySchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    enum: ['earned', 'redeemed', 'expired', 'bonus', 'gift_earned', 'gift_redeemed'],
    required: true,
  },
  points: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ManualOrder',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Free Gift Options Schema
const freeGiftSchema = new mongoose.Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
  },
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
  },
  value: {
    type: Number,
    required: true,
  },
  active: {
    type: Boolean,
    default: true,
  },
  sortOrder: {
    type: Number,
    default: 0,
  },
});

// Update timestamps
userRewardsSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

bundleSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create indexes
userRewardsSchema.index({ userId: 1 });
specialOfferSchema.index({ active: 1, validUntil: 1 });
bundleSchema.index({ active: 1, sortOrder: 1 });
rewardsHistorySchema.index({ userId: 1, createdAt: -1 });

// Create models
const UserRewards = mongoose.model('UserRewards', userRewardsSchema);
const SpecialOffer = mongoose.model('SpecialOffer', specialOfferSchema);
const Bundle = mongoose.model('Bundle', bundleSchema);
const RewardsHistory = mongoose.model('RewardsHistory', rewardsHistorySchema);
const FreeGift = mongoose.model('FreeGift', freeGiftSchema);

module.exports = {
  UserRewards,
  SpecialOffer,
  Bundle,
  RewardsHistory,
  FreeGift,
};
