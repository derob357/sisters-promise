/**
 * User Management Service
 * Handles user CRUD, role assignment, and permission management
 */

const crypto = require('crypto');
const User = require('../models/User');
const { generateToken } = require('../middleware/auth');

class UserService {
  /**
   * Create a new user
   */
  static async createUser(email, firstName, lastName, password, role = 'standard') {
    try {
      // Check if user already exists
      const existingUser = await User.findOne({ email: email.toLowerCase() });
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Validate role
      const validRoles = ['owner', 'admin', 'subscriber', 'standard'];
      if (!validRoles.includes(role)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      // Validate password strength
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters');
      }

      const user = new User({
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        firstName: firstName || '',
        lastName: lastName || '',
        password,
        role,
        status: 'active',
      });

      // Set permissions based on role
      user.setPermissionsByRole();

      await user.save();
      console.log(`✓ User created: ${email} (${role})`);

      // Return user without password
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error creating user:', error.message);
      throw error;
    }
  }

  /**
   * Initialize default users (Owner and Admin)
   */
  static async initializeDefaultUsers() {
    try {
      const defaultUsers = [
        {
          email: 'denise@sisterspromise.com',
          firstName: 'Denise',
          lastName: 'Robinson',
          role: 'owner',
          password: process.env.OWNER_PASSWORD || '***REMOVED***',
        },
        {
          email: 'deric.robinson71@gmail.com',
          firstName: 'Deric',
          lastName: 'Robinson',
          role: 'admin',
          password: process.env.ADMIN_PASSWORD || '***REMOVED***',
        },
      ];

      for (const userData of defaultUsers) {
        const existingUser = await User.findOne({ email: userData.email });
        if (!existingUser) {
          await this.createUser(
            userData.email,
            userData.firstName,
            userData.lastName,
            userData.password,
            userData.role
          );
        } else {
          console.log(`✓ User already exists: ${userData.email} (${userData.role})`);
        }
      }

      return true;
    } catch (error) {
      console.error('Error initializing default users:', error.message);
      throw error;
    }
  }

  /**
   * Get user by email
   */
  static async getUserByEmail(email) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() });
      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      console.error('Error fetching user:', error.message);
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  static async getUserById(userId) {
    try {
      const user = await User.findOne({ id: userId });
      return user ? this.sanitizeUser(user) : null;
    } catch (error) {
      console.error('Error fetching user:', error.message);
      throw error;
    }
  }

  /**
   * Authenticate user and return token
   */
  static async authenticateUser(email, password) {
    try {
      const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      if (user.status === 'suspended') {
        throw new Error('Account is suspended');
      }

      if (user.status === 'inactive') {
        throw new Error('Account is inactive');
      }

      // Check password
      const isPasswordValid = await user.comparePassword(password);
      if (!isPasswordValid) {
        // Track failed login attempts
        user.loginAttempts.count += 1;
        user.loginAttempts.lastAttempt = new Date();

        // Lock account after 5 failed attempts
        if (user.loginAttempts.count >= 5) {
          user.loginAttempts.locked = true;
          user.loginAttempts.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
          await user.save();
          throw new Error('Account locked due to too many failed login attempts');
        }

        await user.save();
        throw new Error('Invalid credentials');
      }

      // Reset login attempts on successful login
      user.loginAttempts = {
        count: 0,
        lastAttempt: null,
        locked: false,
        lockedUntil: null,
      };
      user.lastLogin = new Date();
      await user.save();

      const token = generateToken(user.id);
      return {
        token,
        user: this.sanitizeUser(user),
      };
    } catch (error) {
      console.error('Authentication error:', error.message);
      throw error;
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId, updates) {
    try {
      const allowedUpdates = ['firstName', 'lastName', 'phone', 'profileImage', 'metadata'];
      const updateObj = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          updateObj[key] = updates[key];
        }
      }

      const user = await User.findOneAndUpdate({ id: userId }, updateObj, { new: true });

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`✓ User updated: ${user.email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error updating user:', error.message);
      throw error;
    }
  }

  /**
   * Change user password
   */
  static async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findOne({ id: userId }).select('+password');

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.comparePassword(currentPassword);
      if (!isPasswordValid) {
        throw new Error('Current password is incorrect');
      }

      if (newPassword.length < 8) {
        throw new Error('New password must be at least 8 characters');
      }

      user.password = newPassword;
      await user.save();

      console.log(`✓ Password changed for user: ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('Error changing password:', error.message);
      throw error;
    }
  }

  /**
   * Assign role to user (Admin/Owner only)
   */
  static async assignRole(userId, newRole) {
    try {
      const validRoles = ['owner', 'admin', 'subscriber', 'standard'];
      if (!validRoles.includes(newRole)) {
        throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
      }

      const user = await User.findOneAndUpdate(
        { id: userId },
        { role: newRole },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      // Update permissions based on new role
      user.setPermissionsByRole();
      await user.save();

      console.log(`✓ Role assigned to user ${user.email}: ${newRole}`);
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error assigning role:', error.message);
      throw error;
    }
  }

  /**
   * Suspend user account
   */
  static async suspendUser(userId, reason = '') {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        { status: 'suspended' },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`✓ User suspended: ${user.email} (Reason: ${reason || 'None provided'})`);
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error suspending user:', error.message);
      throw error;
    }
  }

  /**
   * Deactivate user account
   */
  static async deactivateUser(userId) {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        { status: 'inactive' },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`✓ User deactivated: ${user.email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error deactivating user:', error.message);
      throw error;
    }
  }

  /**
   * Reactivate user account
   */
  static async reactivateUser(userId) {
    try {
      const user = await User.findOneAndUpdate(
        { id: userId },
        { status: 'active' },
        { new: true }
      );

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`✓ User reactivated: ${user.email}`);
      return this.sanitizeUser(user);
    } catch (error) {
      console.error('Error reactivating user:', error.message);
      throw error;
    }
  }

  /**
   * Get all users (filtered by role and status)
   */
  static async getAllUsers(role = null, status = 'active') {
    try {
      const query = { status };
      if (role) {
        query.role = role;
      }

      const users = await User.find(query).select('-password');
      return users.map(user => this.sanitizeUser(user));
    } catch (error) {
      console.error('Error fetching users:', error.message);
      throw error;
    }
  }

  /**
   * Delete user (hard delete)
   */
  static async deleteUser(userId) {
    try {
      const user = await User.findOneAndDelete({ id: userId });

      if (!user) {
        throw new Error('User not found');
      }

      console.log(`✓ User deleted: ${user.email}`);
      return { success: true };
    } catch (error) {
      console.error('Error deleting user:', error.message);
      throw error;
    }
  }

  /**
   * Remove password from user object
   */
  static sanitizeUser(user) {
    const userObj = user.toObject ? user.toObject() : user;
    delete userObj.password;
    return userObj;
  }
}

module.exports = UserService;
