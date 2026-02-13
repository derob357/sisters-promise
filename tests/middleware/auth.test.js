/**
 * Auth Middleware Tests
 */
const jwt = require('jsonwebtoken');

// Mock User model before requiring auth
jest.mock('../../models/User', () => ({
  findOne: jest.fn(),
}));

const User = require('../../models/User');
const { authenticate, authorize, generateToken, requirePermission, JWT_SECRET } = require('../../middleware/auth');

// Helper to create mock req/res/next
const mockReq = (overrides = {}) => ({
  headers: {},
  ...overrides,
});

const mockRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

const mockNext = () => jest.fn();

describe('Auth Middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticate', () => {
    it('should return 401 if no token provided', async () => {
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'No authentication token provided' })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      const req = mockReq({ headers: { authorization: 'Bearer invalid-token' } });
      const res = mockRes();
      const next = mockNext();

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, error: 'Invalid or expired token' })
      );
    });

    it('should return 401 if user not found', async () => {
      const token = jwt.sign({ userId: 'test-user-id' }, JWT_SECRET);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = mockNext();

      User.findOne.mockResolvedValue(null);

      await authenticate(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'User not found or account inactive' })
      );
    });

    it('should attach user to req and call next on valid token', async () => {
      const token = jwt.sign({ userId: 'test-user-id' }, JWT_SECRET);
      const req = mockReq({ headers: { authorization: `Bearer ${token}` } });
      const res = mockRes();
      const next = mockNext();

      const fakeUser = { id: 'test-user-id', email: 'test@test.com', role: 'standard' };
      User.findOne.mockResolvedValue(fakeUser);

      await authenticate(req, res, next);

      expect(req.user).toEqual(fakeUser);
      expect(req.token).toBe(token);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('authorize', () => {
    it('should return 401 if no user on request', () => {
      const middleware = authorize('admin');
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 if user role not in allowed roles', () => {
      const middleware = authorize('admin', 'owner');
      const req = mockReq({ user: { role: 'standard' } });
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: 'Insufficient permissions' })
      );
    });

    it('should call next if user has allowed role', () => {
      const middleware = authorize('admin', 'owner');
      const req = mockReq({ user: { role: 'admin' } });
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('requirePermission', () => {
    it('should return 401 if no user', () => {
      const middleware = requirePermission('manageUsers');
      const req = mockReq();
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('should return 403 if user lacks permission', () => {
      const middleware = requirePermission('manageUsers');
      const req = mockReq({ user: { permissions: { manageUsers: false } } });
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('should call next if user has permission', () => {
      const middleware = requirePermission('manageUsers');
      const req = mockReq({ user: { permissions: { manageUsers: true } } });
      const res = mockRes();
      const next = mockNext();

      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });

  describe('generateToken', () => {
    it('should generate a valid JWT token', () => {
      const token = generateToken('user-123');
      const decoded = jwt.verify(token, JWT_SECRET);

      expect(decoded.userId).toBe('user-123');
      expect(decoded.exp).toBeDefined();
    });

    it('should generate different tokens for different users', () => {
      const token1 = generateToken('user-1');
      const token2 = generateToken('user-2');

      expect(token1).not.toBe(token2);
    });
  });
});
