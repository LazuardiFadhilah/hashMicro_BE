const jwt = require('jsonwebtoken');
const { register, login } = require('../authController');
const User = require('../../models/UserModel');

// Mock the User model
jest.mock('../../models/UserModel');

// Mock environment variables
process.env.JWT_SECRET = 'test-secret-key';

describe('authController', () => {
  let req, res;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    // Mock request and response objects
    req = {
      body: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('register', () => {
    it('should register a new user and return token', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      User.findOne.mockResolvedValue(null); // No existing user
      User.create.mockResolvedValue(mockUser);

      // Act
      await register(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(User.create).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'User registered successfully',
          data: expect.objectContaining({
            token: expect.any(String),
            user: expect.objectContaining({
              id: 'user123',
              name: 'John Doe',
              email: 'john@example.com',
            }),
          }),
        })
      );
    });

    it('should return 409 when email already exists', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue({ email: 'existing@example.com' });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
      });
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        // Missing name and password
      };

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name, email, and password are required',
      });
    });

    it('should handle validation errors', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue({
        name: 'ValidationError',
        message: 'Please provide a valid email address',
      });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Please provide a valid email address',
      });
    });

    it('should handle duplicate key errors from MongoDB', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockRejectedValue({
        code: 11000, // MongoDB duplicate key error
      });

      // Act
      await register(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'User with this email already exists',
      });
    });
  });

  describe('login', () => {
    it('should login user with valid credentials and return token', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        comparePassword: jest.fn().mockResolvedValue(true),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Act
      await login(req, res);

      // Assert
      expect(User.findOne).toHaveBeenCalledWith({ email: 'john@example.com' });
      expect(mockUser.comparePassword).toHaveBeenCalledWith('password123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Login successful',
          data: expect.objectContaining({
            token: expect.any(String),
            user: expect.objectContaining({
              id: 'user123',
              name: 'John Doe',
              email: 'john@example.com',
            }),
          }),
        })
      );
    });

    it('should return 401 when user does not exist', async () => {
      // Arrange
      req.body = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 401 when password is invalid', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        password: 'wrongpassword',
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUser),
      });

      // Act
      await login(req, res);

      // Assert
      expect(mockUser.comparePassword).toHaveBeenCalledWith('wrongpassword');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid email or password',
      });
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      req.body = {
        email: 'john@example.com',
        // Missing password
      };

      // Act
      await login(req, res);

      // Assert
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Email and password are required',
      });
    });
  });

  describe('JWT token generation', () => {
    it('should generate valid JWT token with correct payload', async () => {
      // Arrange
      req.body = {
        name: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
      };

      const mockUser = {
        _id: 'user123',
        name: 'John Doe',
        email: 'john@example.com',
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      // Act
      await register(req, res);

      // Assert
      const response = res.json.mock.calls[0][0];
      const token = response.data.token;

      // Verify token can be decoded
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      expect(decoded).toMatchObject({
        userId: 'user123',
        email: 'john@example.com',
      });
      expect(decoded.exp).toBeDefined();
      expect(decoded.iat).toBeDefined();
    });
  });
});
