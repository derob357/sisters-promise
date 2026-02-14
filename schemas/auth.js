const Joi = require('joi');

const registerSchema = Joi.object({
  email: Joi.string().email().max(255).required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().min(8).max(128).required()
    .messages({ 'string.min': 'Password must be at least 8 characters' }),
  firstName: Joi.string().trim().max(100).default(''),
  lastName: Joi.string().trim().max(100).default(''),
  recaptchaToken: Joi.string().allow('', null)
});

const loginSchema = Joi.object({
  email: Joi.string().email().max(255).required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  password: Joi.string().max(128).required(),
  recaptchaToken: Joi.string().allow('', null)
});

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).max(128).required()
    .messages({ 'string.min': 'New password must be at least 8 characters' })
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };
