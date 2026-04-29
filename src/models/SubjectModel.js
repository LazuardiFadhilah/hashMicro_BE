const mongoose = require('mongoose');
const createBaseSchema = require('./BaseModel');

/**
 * SubjectModel - Subject entity model for academic subjects.
 *
 * This model represents academic subjects with a unique code identifier.
 * Each subject has a name, a unique code, and an optional description.
 *
 * Requirements: 5.5, 9.3
 *
 * @example
 * // Create a new subject
 * const subject = await Subject.create({
 *   name: 'Mathematics',
 *   code: 'MATH101',
 *   description: 'Introduction to Mathematics'
 * });
 *
 * // Query subjects (automatically excludes soft-deleted)
 * const subjects = await Subject.find({});
 *
 * // Soft delete a subject
 * await Subject.softDelete(subjectId);
 */

// Create subject-specific schema
const subjectSchema = new mongoose.Schema({
  // Subject's full name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },

  // Unique subject code identifier
  // Requirement 5.5: Enforce uniqueness on the code field
  code: {
    type: String,
    required: [true, 'Code is required'],
    unique: true,
    trim: true,
  },

  // Optional description of the subject
  description: {
    type: String,
    trim: true,
  },
});

// Add BaseModel fields (createdAt, updatedAt, isDeleted)
const baseSchema = createBaseSchema();
subjectSchema.add(baseSchema);

// Requirement 5.5: Add unique index on code for efficient lookups and uniqueness enforcement
subjectSchema.index({ code: 1 }, { unique: true });

// Create and export the Subject model
const Subject = mongoose.model('Subject', subjectSchema);

module.exports = Subject;
