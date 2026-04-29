const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');

/**
 * authController - Handles user registration and login.
 * 
 * This controller provides authentication endpoints for user registration
 * and login, generating JWT tokens for authenticated sessions.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4, 10.1, 10.4, 10.5
 * 
 * @example
 * // Register a new user
 * POST /api/auth/register
 * Body: { name: "John Doe", email: "john@example.com", password: "password123" }
 * Response: { success: true, message: "User registered successfully", data: { token, user } }
 * 
 * // Login existing user
 * POST /api/auth/login
 * Body: { email: "john@example.com", password: "password123" }
 * Response: { success: true, message: "Login successful", data: { token, user } }
 */

/**
 * Generate JWT token for authenticated user.
 * Token expires in 24 hours.
 * 
 * @param {Object} user - User object with _id and email
 * @returns {string} JWT token
 */
const generateToken = (user) => {
  const payload = {
    userId: user._id,
    email: user.email,
    name: user.name, // Add name to JWT payload
  };
  
  // Generate token with 24-hour expiration
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '24h' });
};

/**
 * Register a new user.
 * 
 * Requirements:
 * - 1.1: Hash password using bcrypt (handled by UserModel pre-save hook)
 * - 1.2: Create User record and return JWT token
 * - 1.5: Validate email format (handled by UserModel validation)
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - User's full name
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password (will be hashed)
 * @param {Object} res - Express response object
 * @returns {Object} Response with success status, message, and data (token, user)
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and password are required',
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      // Requirement: Handle duplicate email errors (409)
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }
    
    // Create new user (password will be hashed by pre-save hook)
    // Requirement 1.1: Hash password using bcrypt
    const user = await User.create({
      name,
      email,
      password,
    });
    
    // Generate JWT token
    // Requirement 1.2: Return JWT token
    const token = generateToken(user);
    
    // Return standardized response format
    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }
    
    // Handle duplicate key errors (MongoDB unique constraint)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists',
      });
    }
    
    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error registering user',
    });
  }
};

/**
 * Login existing user.
 * 
 * Requirements:
 * - 1.3: Return JWT token for valid credentials
 * - 1.4: Return authentication error for invalid credentials
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 * 
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.email - User's email address
 * @param {string} req.body.password - User's password
 * @param {Object} res - Express response object
 * @returns {Object} Response with success status, message, and data (token, user)
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }
    
    // Find user by email (need to explicitly select password field)
    const user = await User.findOne({ email }).select('+password');
    
    // Check if user exists
    if (!user) {
      // Requirement 1.4: Return authentication error for invalid credentials
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Compare password using UserModel's comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    
    if (!isPasswordValid) {
      // Requirement 1.4: Return authentication error for invalid credentials
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }
    
    // Generate JWT token
    // Requirement 1.3: Return JWT token for valid credentials
    const token = generateToken(user);
    
    // Return standardized response format
    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
    });
  } catch (error) {
    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error logging in',
    });
  }
};

module.exports = {
  register,
  login,
};
