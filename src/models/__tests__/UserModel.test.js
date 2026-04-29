const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../UserModel');

let mongoServer;

// Setup: Start in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Teardown: Close connection and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
  await User.deleteMany({});
});

describe('UserModel', () => {
  describe('Schema Validation', () => {
    it('should create a user with valid data', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const user = await User.create(userData);

      expect(user.name).toBe(userData.name);
      expect(user.email).toBe(userData.email);
      expect(user.password).not.toBe(userData.password); // Password should be hashed
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
      expect(user.isDeleted).toBe(false);
    });

    it('should require name field', async () => {
      const userData = {
        email: 'john@example.com',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require email field', async () => {
      const userData = {
        name: 'John Doe',
        password: 'password123',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should require password field', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      await expect(User.create(userData)).rejects.toThrow();
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      await User.create(userData);
      await expect(User.create(userData)).rejects.toThrow();
    });
  });

  describe('Email Validation', () => {
    it('should accept valid email formats', async () => {
      const validEmails = [
        'user@example.com',
        'test.user@example.com',
        'user+tag@example.co.uk',
        'user123@test-domain.com',
      ];

      for (const email of validEmails) {
        const user = await User.create({
          name: 'Test User',
          email: email,
          password: 'password123',
        });
        expect(user.email).toBe(email.toLowerCase());
        await User.deleteMany({});
      }
    });

    it('should reject invalid email formats', async () => {
      const invalidEmails = [
        'notanemail',
        '@example.com',
        'user@',
        'user @example.com',
        'user@example',
      ];

      for (const email of invalidEmails) {
        await expect(
          User.create({
            name: 'Test User',
            email: email,
            password: 'password123',
          })
        ).rejects.toThrow();
      }
    });

    it('should convert email to lowercase', async () => {
      const user = await User.create({
        name: 'Test User',
        email: 'TEST@EXAMPLE.COM',
        password: 'password123',
      });

      expect(user.email).toBe('test@example.com');
    });
  });

  describe('Password Hashing', () => {
    it('should hash password before saving', async () => {
      const plainPassword = 'mySecretPassword123';
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: plainPassword,
      });

      // Password should be hashed (not equal to plain text)
      expect(user.password).not.toBe(plainPassword);
      // Hashed password should be longer than plain password
      expect(user.password.length).toBeGreaterThan(plainPassword.length);
      // Hashed password should start with bcrypt prefix
      expect(user.password).toMatch(/^\$2[aby]\$/);
    });

    it('should not rehash password if not modified', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const originalHash = user.password;
      
      // Update name without changing password
      user.name = 'Jane Doe';
      await user.save();

      // Password hash should remain the same
      expect(user.password).toBe(originalHash);
    });

    it('should rehash password when modified', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const originalHash = user.password;
      
      // Change password
      user.password = 'newPassword456';
      await user.save();

      // Password hash should be different
      expect(user.password).not.toBe(originalHash);
    });
  });

  describe('comparePassword Method', () => {
    it('should return true for correct password', async () => {
      const plainPassword = 'mySecretPassword123';
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: plainPassword,
      });

      const isMatch = await user.comparePassword(plainPassword);
      expect(isMatch).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'correctPassword',
      });

      const isMatch = await user.comparePassword('wrongPassword');
      expect(isMatch).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const isMatch = await user.comparePassword('');
      expect(isMatch).toBe(false);
    });
  });

  describe('JSON Serialization', () => {
    it('should exclude password from JSON response', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const userJSON = user.toJSON();

      expect(userJSON.password).toBeUndefined();
      expect(userJSON.name).toBe('John Doe');
      expect(userJSON.email).toBe('john@example.com');
    });

    it('should exclude password when converting to JSON string', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const jsonString = JSON.stringify(user);
      expect(jsonString).not.toContain('password');
      expect(jsonString).toContain('john@example.com');
    });
  });

  describe('BaseModel Integration', () => {
    it('should include BaseModel fields', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
      expect(user.isDeleted).toBe(false);
    });

    it('should support soft delete', async () => {
      const user = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const deletedUser = await User.softDelete(user._id);

      expect(deletedUser.isDeleted).toBe(true);
      expect(deletedUser.name).toBe('John Doe');
      expect(deletedUser.email).toBe('john@example.com');
    });

    it('should filter out soft-deleted users in queries', async () => {
      const user1 = await User.create({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });

      const user2 = await User.create({
        name: 'Jane Doe',
        email: 'jane@example.com',
        password: 'password123',
      });

      // Soft delete user1
      await User.softDelete(user1._id);

      // Query should only return non-deleted users
      const users = await User.find({});
      expect(users.length).toBe(1);
      expect(users[0].email).toBe('jane@example.com');
    });
  });
});
