const Joi = require('joi');

const contactSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required()
    .messages({ 'string.min': 'Name must be at least 2 characters' }),
  email: Joi.string().email().max(100).required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  message: Joi.string().trim().min(10).max(1000).required()
    .messages({ 'string.min': 'Message must be at least 10 characters' }),
  recaptchaToken: Joi.string().required()
    .messages({ 'any.required': 'reCAPTCHA verification is required' })
});

const emailSubscribeSchema = Joi.object({
  email: Joi.string().email().max(255).required()
    .messages({ 'string.email': 'Please provide a valid email address' }),
  firstName: Joi.string().trim().max(100).default(''),
  lastName: Joi.string().trim().max(100).default(''),
  preferences: Joi.object().default({}),
  recaptchaToken: Joi.string().allow('', null)
});

module.exports = { contactSchema, emailSubscribeSchema };
