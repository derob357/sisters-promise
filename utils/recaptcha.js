/**
 * reCAPTCHA v3 Verification Utilities
 */
const axios = require('axios');

/**
 * Verify a reCAPTCHA v3 token with Google's API
 * @param {string} token - The reCAPTCHA token from the client
 * @param {string} expectedAction - The expected action name (e.g. 'login', 'register')
 * @returns {Promise<number|null>} The score (0.0-1.0) or null on failure
 */
async function verifyRecaptchaV3(token, expectedAction = 'submit') {
  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY;

    if (!secretKey) {
      console.error('Missing RECAPTCHA_SECRET_KEY configuration');
      return null;
    }

    const response = await axios.post(
      'https://www.google.com/recaptcha/api/siteverify',
      null,
      {
        params: {
          secret: secretKey,
          response: token
        }
      }
    );

    const data = response.data;

    if (!data.success) {
      console.log('reCAPTCHA verification failed:', data['error-codes']);
      return null;
    }

    // Check action matches (v3 includes action in response)
    if (data.action && data.action !== expectedAction) {
      console.log(`Action mismatch: expected ${expectedAction}, got ${data.action}`);
      return null;
    }

    console.log(`reCAPTCHA v3 score: ${data.score}, action: ${data.action}`);
    return data.score;
  } catch (error) {
    console.error('reCAPTCHA verification error:', error.message);
    return null;
  }
}

/**
 * Interpret a reCAPTCHA score into risk levels
 * @param {number} score - The reCAPTCHA score (0.0-1.0)
 * @returns {object} Risk assessment with level, action, and description
 */
function interpretRecaptchaScore(score) {
  if (score >= 0.9) return { level: 'VERY_LOW_RISK', action: 'allow', description: 'Definitely legitimate' };
  if (score >= 0.7) return { level: 'LOW_RISK', action: 'allow', description: 'Likely legitimate' };
  if (score >= 0.5) return { level: 'MEDIUM_RISK', action: 'allow', description: 'May be suspicious' };
  if (score >= 0.3) return { level: 'HIGH_RISK', action: 'review', description: 'Likely suspicious' };
  return { level: 'VERY_HIGH_RISK', action: 'block', description: 'Definitely suspicious' };
}

module.exports = { verifyRecaptchaV3, interpretRecaptchaScore };
