const express = require('express');
const request = require('supertest');
const authRoutes = require('../authRoutes');
const { register, login } = require('../../controllers/authController');

// Mock the auth controller
jest.mock('../../controllers/authController');

describe('authRoutes', () => {
  let app;

  beforeEach(() => {
    // Create a fresh Express app for each test
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    // Clear all mocks
    jest.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should call register controller', async () => {
      // Arrange
      register.mockImplementation((req, res) => {
        res.status(201).json({
          success: true,
          message: 'User registered successfully',
          data: {
            token: 'mock-token',
            user: {
              id: 'user123',
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        });
      });

      // Act
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      // Assert
      expect(register).toHaveBeenCalled();
      expect(response.status).toBe(201);
      expect(response.body).toEqual({
        success: true,
        message: 'User registered successfully',
        data: {
          token: 'mock-token',
          user: {
            id: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      });
    });

    it('should be accessible without authentication', async () => {
      // Arrange
      register.mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });

      // Act - No Authorization header provided
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'password123',
        });

      // Assert - Should not return 401 (public endpoint)
      expect(response.status).not.toBe(401);
      expect(register).toHaveBeenCalled();
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller', async () => {
      // Arrange
      login.mockImplementation((req, res) => {
        res.status(200).json({
          success: true,
          message: 'Login successful',
          data: {
            token: 'mock-token',
            user: {
              id: 'user123',
              name: 'John Doe',
              email: 'john@example.com',
            },
          },
        });
      });

      // Act
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      // Assert
      expect(login).toHaveBeenCalled();
      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        success: true,
        message: 'Login successful',
        data: {
          token: 'mock-token',
          user: {
            id: 'user123',
            name: 'John Doe',
            email: 'john@example.com',
          },
        },
      });
    });

    it('should be accessible without authentication', async () => {
      // Arrange
      login.mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });

      // Act - No Authorization header provided
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'john@example.com',
          password: 'password123',
        });

      // Assert - Should not return 401 (public endpoint)
      expect(response.status).not.toBe(401);
      expect(login).toHaveBeenCalled();
    });
  });

  describe('Route configuration', () => {
    it('should only accept POST requests for /register', async () => {
      // Act
      const getResponse = await request(app).get('/api/auth/register');
      const putResponse = await request(app).put('/api/auth/register');
      const deleteResponse = await request(app).delete('/api/auth/register');

      // Assert
      expect(getResponse.status).toBe(404);
      expect(putResponse.status).toBe(404);
      expect(deleteResponse.status).toBe(404);
    });

    it('should only accept POST requests for /login', async () => {
      // Act
      const getResponse = await request(app).get('/api/auth/login');
      const putResponse = await request(app).put('/api/auth/login');
      const deleteResponse = await request(app).delete('/api/auth/login');

      // Assert
      expect(getResponse.status).toBe(404);
      expect(putResponse.status).toBe(404);
      expect(deleteResponse.status).toBe(404);
    });
  });
});
