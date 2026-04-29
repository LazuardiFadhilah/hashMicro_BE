const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const createBaseSchema = require('./BaseModel');

/**
 * UserModel - User authentication model with password hashing.
 * 
 * This model stores user credentials for authentication with JWT tokens.
 * Passwords are automatically hashed using bcrypt before saving.
 * 
 * Requirements: 1.1, 1.5, 1.6, 9.1
 * 
 * @example
 * // Create a new user
 * const user = await User.create({
 *   name: 'John Doe',
 *   email: 'john@example.com',
 *   password: 'plainPassword123'
 * });
 * 
 * // Compare password
 * const isMatch = await user.comparePassword('plainPassword123');
 * 
 * // Password field is excluded from JSON responses
 * res.json(user); // password field will not be included
 */

// Email validation regex pattern
// Validates: local-part@domain.tld format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Create user-specific schema
const userSchema = new mongoose.Schema({
  // User's full name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  
  // User's email address (unique identifier)
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(email) {
        // Requirement 1.5: Validate email format using regex pattern
        return EMAIL_REGEX.test(email);
      },
      message: 'Please provide a valid email address',
    },
  },
  
  // User's password (will be hashed before saving)
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters long'],
  },
});

// Add BaseModel fields (createdAt, updatedAt, isDeleted)
const baseSchema = createBaseSchema();
userSchema.add(baseSchema);

/**
 * Pre-save hook to hash password before saving to database.
 * Only hashes if password is new or modified.
 * 
 * Requirements 1.1, 1.6: Hash password using bcrypt with salt rounds of 10
 */
userSchema.pre('save', async function(next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }
  
  try {
    // Requirement 1.6: Use bcrypt hashing with salt rounds of 10
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

/**
 * Instance method to compare a candidate password with the hashed password.
 * 
 * @param {string} candidatePassword - The plain text password to compare
 * @returns {Promise<boolean>} True if passwords match, false otherwise
 */
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    return false;
  }
};

/**
 * Exclude password field from JSON responses.
 * This ensures password hashes are never sent to clients.
 */
userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Create and export the User model
const User = mongoose.model('User', userSchema);

module.exports = User;
