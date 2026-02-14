/**
 * Joi Validation Middleware Factory
 * Usage: app.post('/route', validate(schema), handler)
 */
function validate(schema, property = 'body') {
  return (req, res, next) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false,
      stripUnknown: true,
      allowUnknown: false
    });

    if (error) {
      const details = error.details.map(d => d.message);
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details
      });
    }

    req[property] = value;
    next();
  };
}

module.exports = validate;
