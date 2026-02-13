/**
 * AnalyticsService Tests
 */
jest.mock('axios');

// Set env before requiring
process.env.GA_MEASUREMENT_ID = 'G-TEST123';
process.env.GA_API_SECRET = 'test-secret';

const axios = require('axios');
const analyticsService = require('../../services/AnalyticsService');

describe('BackendAnalyticsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.post.mockResolvedValue({ status: 204 });
  });

  describe('trackEvent', () => {
    it('should return false if GA not configured', async () => {
      const original = analyticsService.measurementId;
      analyticsService.measurementId = null;

      const result = await analyticsService.trackEvent('test_event');
      expect(result).toBe(false);

      analyticsService.measurementId = original;
    });

    it('should send event to GA endpoint', async () => {
      const result = await analyticsService.trackEvent('test_event', { key: 'value' });

      expect(result).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        expect.stringContaining('google-analytics.com'),
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({ name: 'test_event' }),
          ]),
        }),
        expect.any(Object)
      );
    });

    it('should return false on network error', async () => {
      axios.post.mockRejectedValue(new Error('Network error'));

      const result = await analyticsService.trackEvent('test_event');
      expect(result).toBe(false);
    });

    it('should include userId when provided', async () => {
      await analyticsService.trackEvent('test_event', {}, 'user-123');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ client_id: 'user-123' }),
        expect.any(Object)
      );
    });
  });

  describe('trackSignup', () => {
    it('should track signup event with email', async () => {
      await analyticsService.trackSignup('new@test.com', 'standard');

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              name: 'sign_up',
              params: expect.objectContaining({ method: 'email' }),
            }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });

  describe('trackPurchase', () => {
    it('should track purchase with transaction details', async () => {
      await analyticsService.trackPurchase({
        userId: 'user-1',
        transactionId: 'txn-123',
        value: 49.99,
        items: [{ id: 'p1', name: 'Soap', category: 'skincare', price: 12.50, quantity: 2 }],
      });

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          events: expect.arrayContaining([
            expect.objectContaining({
              name: 'purchase',
              params: expect.objectContaining({ transaction_id: 'txn-123', value: 49.99 }),
            }),
          ]),
        }),
        expect.any(Object)
      );
    });
  });

  describe('hashEmail', () => {
    it('should return a 16-char hex hash', () => {
      const hash = analyticsService.hashEmail('test@test.com');
      expect(hash).toHaveLength(16);
      expect(hash).toMatch(/^[a-f0-9]+$/);
    });

    it('should produce same hash for same email regardless of case', () => {
      const hash1 = analyticsService.hashEmail('Test@Test.com');
      const hash2 = analyticsService.hashEmail('test@test.com');
      expect(hash1).toBe(hash2);
    });
  });

  describe('generateClientId', () => {
    it('should generate a non-empty string', () => {
      const id = analyticsService.generateClientId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });
  });
});
