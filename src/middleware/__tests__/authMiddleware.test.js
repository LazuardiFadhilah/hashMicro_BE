const jwt = require('jsonwebtoken');
const authMiddleware = require('../authMiddleware');

// Mock environment variable
process.env.JWT_SECRET = 'test-secret-key';

describe('authMiddleware', () => {
  let req, res, next;

  beforeEach(() => {
    // Setup mock request, response, and next function
    req = {
      headers: {},
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
  });

  describe('Missing Token', () => {
    it('should return 401 when Authorization header is missing', () => {
      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is empty after Bearer prefix', () => {
      req.headers.authorization = 'Bearer ';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. No token provided.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token Format', () => {
    it('should return 401 when Authorization header does not start with Bearer', () => {
      req.headers.authorization = 'InvalidFormat token123';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when Authorization header is just a token without Bearer', () => {
      const token = jwt.sign({ userId: '123', email: 'test@example.com' }, process.env.JWT_SECRET);
      req.headers.authorization = token;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Invalid Token', () => {
    it('should return 401 when token is invalid', () => {
      req.headers.authorization = 'Bearer invalid.token.here';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is signed with wrong secret', () => {
      const token = jwt.sign({ userId: '123', email: 'test@example.com' }, 'wrong-secret');
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 when token is malformed', () => {
      req.headers.authorization = 'Bearer malformed-token';

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Expired Token', () => {
    it('should return 401 when token is expired', () => {
      // Create token that expired 1 hour ago
      const token = jwt.sign(
        { userId: '123', email: 'test@example.com' },
        process.env.JWT_SECRET,
        { expiresIn: '-1h' }
      );
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Token expired.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Valid Token', () => {
    it('should attach decoded user data to req.user and call next()', () => {
      const payload = { userId: '123', email: 'test@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(payload.userId);
      expect(req.user.email).toBe(payload.email);
      expect(req.user.iat).toBeDefined(); // Issued at timestamp
      expect(req.user.exp).toBeDefined(); // Expiration timestamp
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should work with different user payloads', () => {
      const payload = { userId: '456', email: 'another@example.com', role: 'admin' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer ${token}`;

      authMiddleware(req, res, next);

      expect(req.user.userId).toBe(payload.userId);
      expect(req.user.email).toBe(payload.email);
      expect(req.user.role).toBe(payload.role);
      expect(next).toHaveBeenCalled();
    });

    it('should reject tokens with extra whitespace in Bearer format', () => {
      const payload = { userId: '789', email: 'user@example.com' };
      const token = jwt.sign(payload, process.env.JWT_SECRET);
      req.headers.authorization = `Bearer  ${token}`; // Extra space

      authMiddleware(req, res, next);

      // Should fail because extra space makes token invalid
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('Case Sensitivity', () => {
    it('should be case-sensitive for Bearer keyword', () => {
      const token = jwt.sign({ userId: '123', email: 'test@example.com' }, process.env.JWT_SECRET);
      req.headers.authorization = `bearer ${token}`; // lowercase 'bearer'

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should be case-sensitive for BEARER keyword', () => {
      const token = jwt.sign({ userId: '123', email: 'test@example.com' }, process.env.JWT_SECRET);
      req.headers.authorization = `BEARER ${token}`; // uppercase 'BEARER'

      authMiddleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access denied. Invalid token format.',
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
