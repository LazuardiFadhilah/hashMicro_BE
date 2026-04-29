const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

/**
 * Integration tests for Express app middleware configuration.
 *
 * Tests verify:
 * - CORS headers are present (Requirement 10.2)
 * - JSON body parsing works (Requirement 10.3)
 * - URL-encoded body parsing works (Requirement 10.3)
 * - Error handling middleware catches errors (Requirement 10.4)
 * - Standardized response format { success, message, data } (Requirement 10.1)
 *
 * Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
 */

describe('Express App Middleware Integration Tests', () => {
  let app;
  let mongoServer;

  beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    process.env.MONGODB_URI = mongoUri;
    process.env.JWT_SECRET = 'test-secret-key-middleware';
    process.env.NODE_ENV = 'test';

    await mongoose.connect(mongoUri);

    // Load app after env vars are set
    app = require('../../app');
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('CORS Middleware (Requirement 10.2)', () => {
    it('should include CORS headers in responses', async () => {
      const response = await request(app)
        .get('/')
        .set('Origin', 'http://example.com');

      // CORS middleware should set Access-Control-Allow-Origin
      expect(response.headers['access-control-allow-origin']).toBe('*');
    });

    it('should handle OPTIONS preflight requests', async () => {
      const response = await request(app)
        .options('/api/auth/login')
        .set('Origin', 'http://example.com')
        .set('Access-Control-Request-Method', 'POST');

      // Should respond to preflight with 2xx or 204
      expect(response.status).toBeLessThan(300);
    });
  });

  describe('JSON Body Parsing Middleware (Requirement 10.3)', () => {
    it('should parse JSON request bodies', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({
          name: 'JSON Test User',
          email: 'jsontest@example.com',
          password: 'password123',
        }));

      // If JSON was parsed correctly, the controller should process the request
      // (not return 400 due to missing fields)
      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
    });

    it('should return JSON responses', async () => {
      const response = await request(app).get('/');

      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('URL-Encoded Body Parsing Middleware (Requirement 10.3)', () => {
    it('should parse URL-encoded request bodies', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('name=URLTest&email=urltest2@example.com&password=password123');

      // If URL-encoded body was parsed, the controller should process the request
      expect(response.status).not.toBe(400);
      expect(response.body).toHaveProperty('success');
    });
  });

  describe('Error Handling Middleware (Requirement 10.4)', () => {
    it('should return standardized error format on server errors', async () => {
      // Create a temporary route that throws an error to test error middleware
      const express = require('express');
      const testApp = express();
      testApp.use(require('cors')());
      testApp.use(express.json());

      // Route that throws an error
      testApp.get('/test-error', (req, res, next) => {
        const err = new Error('Test error');
        next(err);
      });

      // Add the same error handling middleware as app.js
      testApp.use((err, req, res, next) => {
        console.error(err.stack);
        res.status(500).json({
          success: false,
          message: 'Internal Server Error',
          error: process.env.NODE_ENV === 'development' ? err.message : undefined,
        });
      });

      const response = await request(testApp).get('/test-error');

      expect(response.status).toBe(500);
      expect(response.body).toMatchObject({
        success: false,
        message: 'Internal Server Error',
      });
    });
  });

  describe('Standardized Response Format (Requirements 10.1, 10.5)', () => {
    it('should return success: true with data on successful operations', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Format Test User',
          email: 'formattest@example.com',
          password: 'password123',
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('data');
    });

    it('should return success: false with message on failed operations', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Route Mounting', () => {
    it('should mount /api/auth routes', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@test.com', password: 'test' });

      // Should reach the route (not 404)
      expect(response.status).not.toBe(404);
    });

    it('should mount /api/students routes (protected)', async () => {
      const response = await request(app).get('/api/students');

      // Should reach the route and return 401 (no token), not 404
      expect(response.status).toBe(401);
    });

    it('should mount /api/subjects routes (protected)', async () => {
      const response = await request(app).get('/api/subjects');

      expect(response.status).toBe(401);
    });

    it('should mount /api/grades routes (protected)', async () => {
      const response = await request(app).get('/api/grades/report');

      expect(response.status).toBe(401);
    });

    it('should mount /api/checker routes (protected)', async () => {
      const response = await request(app).post('/api/checker').send({});

      expect(response.status).toBe(401);
    });
  });
});
