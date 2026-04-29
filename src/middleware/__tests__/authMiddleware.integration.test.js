const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const authMiddleware = require('../authMiddleware');

// Mock environment variable
process.env.JWT_SECRET = 'test-secret-key';

describe('authMiddleware Integration Tests', () => {
  let app;

  beforeEach(() => {
    // Create a simple Express app for testing
    app = express();
    app.use(express.json());

    // Public route (no auth required)
    app.get('/api/public', (req, res) => {
      res.json({ success: true, message: 'Public endpoint' });
    });

    // Protected route (auth required)
    app.get('/api/protected', authMiddleware, (req, res) => {
      res.json({
        success: true,
        message: 'Protected endpoint',
        user: req.user,
      });
    });

    // Another protected route
    app.post('/api/protected/data', authMiddleware, (req, res) => {
      res.json({
        success: true,
        message: 'Data created',
        userId: req.user.userId,
      });
    });
  });

  describe('Public Endpoints', () => {
    it('should access public endpoint without token', async () => {
      const response = await request(app).get('/api/public');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Public endpoint');
    });
  });

  describe('Protected Endpoints - No Token', () => {
    it('should return 401 when accessing protected endpoint without token', async () => {
      const response = await request(app).get('/api/protected');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. No token provided.');
    });

    it('should return 401 for POST request without token', async () => {
      const response = await request(app)
        .post('/api/protected/data')
        .send({ data: 'test' });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Protected Endpoints - Invalid Token', () => {
    it('should return 401 with invalid token format', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'InvalidFormat token123');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Invalid token format.');
    });

    it('should return 401 with malformed token', async () => {
      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', 'Bearer invalid.token.here');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Invalid token.');
    });

    it('should return 401 with expired token', async () => {
      const expiredToken = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${expiredToken}`);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toBe('Access denied. Token expired.');
    });
  });

  describe('Protected Endpoints - Valid Token', () => {
    it('should access protected endpoint with valid token', async () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Protected endpoint');
      expect(response.body.user.userId).toBe(payload.userId);
      expect(response.body.user.email).toBe(payload.email);
    });

    it('should access protected POST endpoint with valid token', async () => {
      const payload = { userId: '456', email: 'user@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });

      const response = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: 'test data' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Data created');
      expect(response.body.userId).toBe(payload.userId);
    });

    it('should work with different user payloads', async () => {
      const payload = {
        userId: '789',
        email: 'admin@example.com',
        role: 'admin',
        name: 'Admin User',
      };
      const token = jwt.sign(payload, process.env.JWT_SECRET);

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body.user.userId).toBe(payload.userId);
      expect(response.body.user.email).toBe(payload.email);
      expect(response.body.user.role).toBe(payload.role);
      expect(response.body.user.name).toBe(payload.name);
    });
  });

  describe('Multiple Protected Routes', () => {
    it('should protect multiple routes with same middleware', async () => {
      const payload = { userId: '999', email: 'multi@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);

      // Test first protected route
      const response1 = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response1.status).toBe(200);
      expect(response1.body.user.userId).toBe(payload.userId);

      // Test second protected route
      const response2 = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: 'test' });

      expect(response2.status).toBe(200);
      expect(response2.body.userId).toBe(payload.userId);
    });
  });

  describe('Token Reuse', () => {
    it('should allow same token to be used for multiple requests', async () => {
      const payload = { userId: '111', email: 'reuse@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

      // First request
      const response1 = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response1.status).toBe(200);

      // Second request with same token
      const response2 = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${token}`);

      expect(response2.status).toBe(200);

      // Third request with same token
      const response3 = await request(app)
        .post('/api/protected/data')
        .set('Authorization', `Bearer ${token}`)
        .send({ data: 'test' });

      expect(response3.status).toBe(200);
    });
  });
});
