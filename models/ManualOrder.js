/**
 * Manual Order Model
 * Stores orders created manually by admin/owner staff
 */

const mongoose = require('mongoose');

const manualOrderSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  customerName: {
    type: String,
    required: true,
  },
  customerEmail: {
    type: String,
    required: true,
    lowercase: true,
  },
  customerPhone: String,
  orderDate: {
    type: Date,
    default: Date.now,
  },
  shippingAddress: {
    street: String,
    city: String,
    state: String,
    zip: String,
    country: String,
  },
  products: [{
    name: {
      type: String,
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
  }],
  paymentMethod: {
    type: String,
    enum: ['cash', 'card', 'check', 'venmo', 'paypal', 'other'],
    required: true,
  },
  paymentReference: String,
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  shipping: {
    type: Number,
    default: 0,
    min: 0,
  },
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  notes: String,
  paymentStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed', 'refunded'],
    default: 'pending',
  },
  orderStatus: {
    type: String,
    enum: ['confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'confirmed',
  },
  createdBy: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Indexes for performance
manualOrderSchema.index({ customerEmail: 1 });
manualOrderSchema.index({ paymentStatus: 1 });
manualOrderSchema.index({ orderStatus: 1 });
manualOrderSchema.index({ createdAt: -1 });

module.exports = mongoose.model('ManualOrder', manualOrderSchema, 'manual_orders');
