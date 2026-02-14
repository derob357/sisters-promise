const Joi = require('joi');

const squareCheckoutSchema = Joi.object({
  items: Joi.array().min(1).max(50).items(
    Joi.object({
      variationId: Joi.string().trim().min(1).max(200).required(),
      quantity: Joi.number().integer().min(1).max(100).required()
    })
  ).required()
});

const directCheckoutSchema = Joi.object({
  sourceId: Joi.string().trim().min(5).max(500).required(),
  amount: Joi.number().min(1).max(999999).required(),
  currency: Joi.string().valid('USD').default('USD'),
  note: Joi.string().trim().max(500).default('')
});

const orderSchema = Joi.object({
  items: Joi.array().min(1).items(
    Joi.object({
      productId: Joi.string().required(),
      name: Joi.string().max(200).required(),
      price: Joi.number().min(0).required(),
      quantity: Joi.number().integer().min(1).required()
    }).unknown(true)
  ).required(),
  total: Joi.number().greater(0).required(),
  email: Joi.string().email().required(),
  firstName: Joi.string().trim().max(100).default(''),
  lastName: Joi.string().trim().max(100).default(''),
  phone: Joi.string().trim().max(20).default(''),
  address: Joi.string().trim().max(200).default(''),
  city: Joi.string().trim().max(100).default(''),
  state: Joi.string().trim().max(50).default(''),
  zip: Joi.string().trim().max(20).default('')
});

module.exports = { squareCheckoutSchema, directCheckoutSchema, orderSchema };
