/**
 * reCAPTCHA Verification Tests
 */
const axios = require('axios');

jest.mock('axios');

const { verifyRecaptchaV3, interpretRecaptchaScore } = require('../../utils/recaptcha');

describe('reCAPTCHA Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv, RECAPTCHA_SECRET_KEY: 'test-secret-key' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('verifyRecaptchaV3', () => {
    it('should return null if RECAPTCHA_SECRET_KEY is not set', async () => {
      delete process.env.RECAPTCHA_SECRET_KEY;
      const score = await verifyRecaptchaV3('some-token', 'login');
      expect(score).toBeNull();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should return score on successful verification', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, score: 0.9, action: 'login' }
      });

      const score = await verifyRecaptchaV3('valid-token', 'login');

      expect(score).toBe(0.9);
      expect(axios.post).toHaveBeenCalledWith(
        'https://www.google.com/recaptcha/api/siteverify',
        null,
        { params: { secret: 'test-secret-key', response: 'valid-token' } }
      );
    });

    it('should return null if Google says verification failed', async () => {
      axios.post.mockResolvedValue({
        data: { success: false, 'error-codes': ['invalid-input-response'] }
      });

      const score = await verifyRecaptchaV3('bad-token', 'login');
      expect(score).toBeNull();
    });

    it('should return null on action mismatch', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, score: 0.8, action: 'register' }
      });

      const score = await verifyRecaptchaV3('valid-token', 'login');
      expect(score).toBeNull();
    });

    it('should return score when response has no action field', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, score: 0.7 }
      });

      const score = await verifyRecaptchaV3('valid-token', 'login');
      expect(score).toBe(0.7);
    });

    it('should return null on network error', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      const score = await verifyRecaptchaV3('valid-token', 'login');
      expect(score).toBeNull();
    });

    it('should return low score for bot-like tokens', async () => {
      axios.post.mockResolvedValue({
        data: { success: true, score: 0.1, action: 'register' }
      });

      const score = await verifyRecaptchaV3('bot-token', 'register');
      expect(score).toBe(0.1);
      expect(score).toBeLessThan(0.3);
    });
  });

  describe('interpretRecaptchaScore', () => {
    it('should return VERY_LOW_RISK for score >= 0.9', () => {
      const result = interpretRecaptchaScore(0.9);
      expect(result.level).toBe('VERY_LOW_RISK');
      expect(result.action).toBe('allow');
    });

    it('should return LOW_RISK for score >= 0.7', () => {
      const result = interpretRecaptchaScore(0.7);
      expect(result.level).toBe('LOW_RISK');
      expect(result.action).toBe('allow');
    });

    it('should return MEDIUM_RISK for score >= 0.5', () => {
      const result = interpretRecaptchaScore(0.5);
      expect(result.level).toBe('MEDIUM_RISK');
      expect(result.action).toBe('allow');
    });

    it('should return HIGH_RISK for score >= 0.3', () => {
      const result = interpretRecaptchaScore(0.3);
      expect(result.level).toBe('HIGH_RISK');
      expect(result.action).toBe('review');
    });

    it('should return VERY_HIGH_RISK for score < 0.3', () => {
      const result = interpretRecaptchaScore(0.1);
      expect(result.level).toBe('VERY_HIGH_RISK');
      expect(result.action).toBe('block');
    });

    it('should return VERY_HIGH_RISK for score of 0', () => {
      const result = interpretRecaptchaScore(0);
      expect(result.level).toBe('VERY_HIGH_RISK');
      expect(result.action).toBe('block');
    });

    it('should return VERY_LOW_RISK for perfect score of 1.0', () => {
      const result = interpretRecaptchaScore(1.0);
      expect(result.level).toBe('VERY_LOW_RISK');
      expect(result.action).toBe('allow');
    });
  });
});
