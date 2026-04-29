const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

/**
 * authRoutes - Public authentication endpoints.
 * 
 * These routes handle user registration and login. They are public
 * (no authentication middleware) since users need to register and
 * login before they can access protected endpoints.
 * 
 * Requirements: 1.1, 1.2, 1.3
 * 
 * @example
 * // Register a new user
 * POST /api/auth/register
 * Body: { name: "John Doe", email: "john@example.com", password: "password123" }
 * 
 * // Login existing user
 * POST /api/auth/login
 * Body: { email: "john@example.com", password: "password123" }
 */

/**
 * POST /api/auth/register
 * Register a new user account.
 * 
 * Requirement 1.1: Hash password using bcrypt
 * Requirement 1.2: Create User record and return JWT token
 * 
 * @route POST /api/auth/register
 * @access Public
 * @body {string} name - User's full name
 * @body {string} email - User's email address
 * @body {string} password - User's password (will be hashed)
 * @returns {Object} 201 - { success: true, message, data: { token, user } }
 * @returns {Object} 400 - { success: false, message } - Validation error
 * @returns {Object} 409 - { success: false, message } - Duplicate email
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.post('/register', register);

/**
 * POST /api/auth/login
 * Login with existing user credentials.
 * 
 * Requirement 1.3: Return JWT token for valid credentials
 * 
 * @route POST /api/auth/login
 * @access Public
 * @body {string} email - User's email address
 * @body {string} password - User's password
 * @returns {Object} 200 - { success: true, message, data: { token, user } }
 * @returns {Object} 400 - { success: false, message } - Missing fields
 * @returns {Object} 401 - { success: false, message } - Invalid credentials
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.post('/login', login);

module.exports = router;
