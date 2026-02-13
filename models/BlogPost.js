const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  voteType: { type: String, enum: ['up', 'down'], required: true },
  votedAt: { type: Date, default: Date.now }
}, { _id: false });

const commentSchema = new mongoose.Schema({
  id: { type: String, required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  userRole: {
    type: String,
    enum: ['owner', 'admin', 'subscriber', 'standard'],
    required: true
  },
  content: { type: String, required: true, maxlength: 5000 },
  votes: [voteSchema],
  score: { type: Number, default: 0 },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

const blogPostSchema = new mongoose.Schema({
  id: { type: String, unique: true, required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 200 },
  slug: { type: String, unique: true, required: true, index: true },
  content: { type: String, required: true },
  excerpt: { type: String, trim: true, maxlength: 500 },
  coverImage: { type: String },
  author: {
    userId: { type: String, required: true },
    userName: { type: String, required: true },
    userRole: { type: String, required: true }
  },
  tags: [{ type: String, trim: true }],
  category: { type: String, trim: true },
  votes: [voteSchema],
  score: { type: Number, default: 0 },
  comments: [commentSchema],
  commentCount: { type: Number, default: 0 },
  viewCount: { type: Number, default: 0 },
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  isFeatured: { type: Boolean, default: false },
  isDeleted: { type: Boolean, default: false },
  deletedAt: Date,
  deletedBy: String,
}, { timestamps: true });

blogPostSchema.index({ isPublished: 1, publishedAt: -1 });
blogPostSchema.index({ isFeatured: 1, isPublished: 1 });
blogPostSchema.index({ score: -1, publishedAt: -1 });
blogPostSchema.index({ 'author.userId': 1 });
blogPostSchema.index({ tags: 1 });

module.exports = mongoose.model('BlogPost', blogPostSchema);
