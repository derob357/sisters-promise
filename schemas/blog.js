const Joi = require('joi');

const createPostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300).required(),
  content: Joi.string().min(1).required(),
  excerpt: Joi.string().trim().max(500).default(''),
  coverImage: Joi.string().uri().allow('').default(''),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10).default([]),
  category: Joi.string().trim().max(100).default(''),
  isPublished: Joi.boolean().default(false),
  isFeatured: Joi.boolean().default(false)
});

const updatePostSchema = Joi.object({
  title: Joi.string().trim().min(1).max(300),
  content: Joi.string().min(1),
  excerpt: Joi.string().trim().max(500),
  coverImage: Joi.string().uri().allow(''),
  tags: Joi.array().items(Joi.string().trim().max(50)).max(10),
  category: Joi.string().trim().max(100),
  isPublished: Joi.boolean(),
  isFeatured: Joi.boolean()
}).min(1);

const voteSchema = Joi.object({
  voteType: Joi.string().valid('up', 'down').required()
});

const commentSchema = Joi.object({
  content: Joi.string().trim().min(1).max(5000).required()
    .messages({ 'string.max': 'Comment must be 5000 characters or less' })
});

module.exports = { createPostSchema, updatePostSchema, voteSchema, commentSchema };
