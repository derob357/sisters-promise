/**
 * UserService Tests
 */
jest.mock('../../models/User');
jest.mock('../../middleware/auth', () => ({
  generateToken: jest.fn().mockReturnValue('mock-jwt-token'),
}));

const User = require('../../models/User');
const UserService = require('../../services/UserService');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createUser', () => {
    it('should throw if user already exists', async () => {
      User.findOne.mockResolvedValue({ email: 'existing@test.com' });

      await expect(
        UserService.createUser('existing@test.com', 'Test', 'User', 'password123')
      ).rejects.toThrow('User with this email already exists');
    });

    it('should throw on invalid role', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        UserService.createUser('new@test.com', 'Test', 'User', 'password123', 'superadmin')
      ).rejects.toThrow('Invalid role');
    });

    it('should throw if password is too short', async () => {
      User.findOne.mockResolvedValue(null);

      await expect(
        UserService.createUser('new@test.com', 'Test', 'User', 'short')
      ).rejects.toThrow('Password must be at least 8 characters');
    });

    it('should create user successfully', async () => {
      User.findOne.mockResolvedValue(null);

      const mockUser = {
        id: 'test-id',
        email: 'new@test.com',
        firstName: 'Test',
        lastName: 'User',
        role: 'standard',
        setPermissionsByRole: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({
          id: 'test-id',
          email: 'new@test.com',
          firstName: 'Test',
          lastName: 'User',
          role: 'standard',
        }),
      };

      User.mockImplementation(() => mockUser);

      const result = await UserService.createUser('new@test.com', 'Test', 'User', 'password123');

      expect(result.email).toBe('new@test.com');
      expect(result.password).toBeUndefined();
      expect(mockUser.setPermissionsByRole).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('getUserByEmail', () => {
    it('should return null if user not found', async () => {
      User.findOne.mockResolvedValue(null);

      const result = await UserService.getUserByEmail('nonexistent@test.com');
      expect(result).toBeNull();
    });

    it('should return sanitized user', async () => {
      const mockUser = {
        email: 'test@test.com',
        password: 'hashed-password',
        toObject: jest.fn().mockReturnValue({
          email: 'test@test.com',
          password: 'hashed-password',
        }),
      };
      User.findOne.mockResolvedValue(mockUser);

      const result = await UserService.getUserByEmail('test@test.com');
      expect(result.email).toBe('test@test.com');
      expect(result.password).toBeUndefined();
    });
  });

  describe('authenticateUser', () => {
    const mockSelectChain = (user) => ({
      select: jest.fn().mockResolvedValue(user),
    });

    it('should throw if user not found', async () => {
      User.findOne.mockReturnValue(mockSelectChain(null));

      await expect(
        UserService.authenticateUser('nobody@test.com', 'password')
      ).rejects.toThrow('User not found');
    });

    it('should throw if account is suspended', async () => {
      User.findOne.mockReturnValue(mockSelectChain({
        status: 'suspended',
        email: 'test@test.com',
      }));

      await expect(
        UserService.authenticateUser('test@test.com', 'password')
      ).rejects.toThrow('Account is suspended');
    });

    it('should throw if account is inactive', async () => {
      User.findOne.mockReturnValue(mockSelectChain({
        status: 'inactive',
        email: 'test@test.com',
      }));

      await expect(
        UserService.authenticateUser('test@test.com', 'password')
      ).rejects.toThrow('Account is inactive');
    });

    it('should throw on invalid password and increment attempts', async () => {
      const mockUser = {
        status: 'active',
        email: 'test@test.com',
        loginAttempts: { count: 0, lastAttempt: null, locked: false, lockedUntil: null },
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue(mockSelectChain(mockUser));

      await expect(
        UserService.authenticateUser('test@test.com', 'wrong-password')
      ).rejects.toThrow('Invalid credentials');

      expect(mockUser.loginAttempts.count).toBe(1);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it('should lock account after 5 failed attempts', async () => {
      const mockUser = {
        status: 'active',
        email: 'test@test.com',
        loginAttempts: { count: 4, lastAttempt: null, locked: false, lockedUntil: null },
        comparePassword: jest.fn().mockResolvedValue(false),
        save: jest.fn().mockResolvedValue(true),
      };
      User.findOne.mockReturnValue(mockSelectChain(mockUser));

      await expect(
        UserService.authenticateUser('test@test.com', 'wrong-password')
      ).rejects.toThrow('Account locked');

      expect(mockUser.loginAttempts.locked).toBe(true);
    });

    it('should return token and user on successful auth', async () => {
      const mockUser = {
        id: 'user-123',
        status: 'active',
        email: 'test@test.com',
        loginAttempts: { count: 0, lastAttempt: null, locked: false, lockedUntil: null },
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ id: 'user-123', email: 'test@test.com' }),
      };
      User.findOne.mockReturnValue(mockSelectChain(mockUser));

      const result = await UserService.authenticateUser('test@test.com', 'correct-password');

      expect(result.token).toBe('mock-jwt-token');
      expect(result.user.email).toBe('test@test.com');
      expect(mockUser.loginAttempts.count).toBe(0);
    });
  });

  describe('updateUser', () => {
    it('should throw if user not found', async () => {
      User.findOneAndUpdate.mockResolvedValue(null);

      await expect(
        UserService.updateUser('nonexistent', { firstName: 'New' })
      ).rejects.toThrow('User not found');
    });

    it('should update allowed fields only', async () => {
      const mockUser = {
        email: 'test@test.com',
        firstName: 'Updated',
        toObject: jest.fn().mockReturnValue({ email: 'test@test.com', firstName: 'Updated' }),
      };
      User.findOneAndUpdate.mockResolvedValue(mockUser);

      const result = await UserService.updateUser('user-123', {
        firstName: 'Updated',
        role: 'admin', // should be ignored
      });

      expect(User.findOneAndUpdate).toHaveBeenCalledWith(
        { id: 'user-123' },
        { firstName: 'Updated' },
        { new: true }
      );
    });
  });

  describe('assignRole', () => {
    it('should throw on invalid role', async () => {
      await expect(
        UserService.assignRole('user-123', 'superadmin')
      ).rejects.toThrow('Invalid role');
    });

    it('should assign role and update permissions', async () => {
      const mockUser = {
        email: 'test@test.com',
        role: 'admin',
        setPermissionsByRole: jest.fn(),
        save: jest.fn().mockResolvedValue(true),
        toObject: jest.fn().mockReturnValue({ email: 'test@test.com', role: 'admin' }),
      };
      User.findOneAndUpdate.mockResolvedValue(mockUser);

      const result = await UserService.assignRole('user-123', 'admin');

      expect(mockUser.setPermissionsByRole).toHaveBeenCalled();
      expect(mockUser.save).toHaveBeenCalled();
    });
  });

  describe('deleteUser', () => {
    it('should throw if user not found', async () => {
      User.findOneAndDelete.mockResolvedValue(null);

      await expect(UserService.deleteUser('nonexistent')).rejects.toThrow('User not found');
    });

    it('should delete user successfully', async () => {
      User.findOneAndDelete.mockResolvedValue({ email: 'deleted@test.com' });

      const result = await UserService.deleteUser('user-123');
      expect(result.success).toBe(true);
    });
  });

  describe('sanitizeUser', () => {
    it('should remove password from user object', () => {
      const result = UserService.sanitizeUser({
        toObject: () => ({ email: 'test@test.com', password: 'secret' }),
      });

      expect(result.email).toBe('test@test.com');
      expect(result.password).toBeUndefined();
    });

    it('should handle plain objects without toObject', () => {
      const result = UserService.sanitizeUser({ email: 'test@test.com', password: 'secret' });

      expect(result.email).toBe('test@test.com');
      expect(result.password).toBeUndefined();
    });
  });
});
