const express = require('express');
const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const authRoutes = require('../authRoutes');
const User = require('../../models/UserModel');
const connectDB = require('../../config/database');

/**
 * Integration tests for authRoutes.
 * 
 * These tests verify that the auth routes work correctly with a real
 * database connection (in-memory MongoDB) and the actual controllers.
 * 
 * Requirements: 1.1, 1.2, 1.3
 */

describe('authRoutes Integration Tests', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    // Set environment variables
    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = 'test-secret-key-for-integration';
    
    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Clear the database before each test
    await User.deleteMany({});
  });

  describe('POST /api/auth/register', () => {
    it('should register a new user and return JWT token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        success: true,
        message: 'User registered successfully',
        data: {
          token: expect.any(String),
          user: {
            id: expect.any(String),
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      });

      // Verify user was created in database
      const user = await User.findOne({ email: 'john@example.com' });
      expect(user).toBeTruthy();
      expect(user.name).toBe('John Doe');
      expect(user.password).not.toBe('password123'); // Password should be hashed
    });

    it('should return 409 when registering with duplicate email', async () => {
      // Arrange - Create a user first
      await User.create({
        name: 'Existing User',
        email: 'existing@example.com',
        password: 'password123',
      });

      // Act - Try to register with same email
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'New User',
          email: 'existing@example.com',
          password: 'newpassword',
        });

      // Assert
      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        success: false,
        message: 'User with this email already exists',
      });
    });

    it('should return 400 when required fields are missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'john@example.com',
          // Missing name and password
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });

    it('should validate email format', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'invalid-email',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.stringContaining('email'),
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user before each login test
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    });

    it('should login with valid credentials and return JWT token', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        success: true,
        message: 'Login successful',
        data: {
          token: expect.any(String),
          user: {
            id: expect.any(String),
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      });
    });

    it('should return 401 with invalid email', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'password123',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 401 with invalid password', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        });

      // Assert
      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 400 when required fields are missing', async () => {
      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          // Missing password
        });

      // Assert
      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        success: false,
        message: expect.any(String),
      });
    });
  });

  describe('Public access', () => {
    it('should allow registration without authentication', async () => {
      // Act - No Authorization header
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Public User',
          email: 'public@example.com',
          password: 'password123',
        });

      // Assert - Should succeed without auth
      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
    });

    it('should allow login without authentication', async () => {
      // Arrange - Create a user
      await User.create({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });

      // Act - No Authorization header
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      // Assert - Should succeed without auth
      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
