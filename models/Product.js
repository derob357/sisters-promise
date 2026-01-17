/**
 * Product Model
 * MongoDB schema for Sisters Promise products
 */

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  price: { type: Number, required: true, min: 0 },
  category: { type: String, trim: true },
  
  // Image structure with full-size and thumbnail support
  images: [{
    url: { type: String, required: true },           // Full-size image URL
    thumbnailUrl: { type: String, required: true },  // Thumbnail URL
    alt: { type: String },                           // Alt text for accessibility
    isPrimary: { type: Boolean, default: false }     // Mark the main product image
  }],
  
  // Legacy field for backward compatibility
  imageUrl: { type: String },
  
  stockQuantity: { type: Number, default: 0, min: 0 },
  isActive: { type: Boolean, default: true },
  etsyListingId: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
