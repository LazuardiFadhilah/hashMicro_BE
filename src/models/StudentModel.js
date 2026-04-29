const mongoose = require('mongoose');
const createBaseSchema = require('./BaseModel');

/**
 * StudentModel - Student entity model with personal information.
 * 
 * This model represents learner entities with personal information and academic records.
 * Each student has a unique studentId that serves as their identifier.
 * 
 * Requirements: 4.6, 4.7, 9.2
 * 
 * @example
 * // Create a new student
 * const student = await Student.create({
 *   name: 'Jane Smith',
 *   studentId: 'STU001',
 *   class: '10A',
 *   age: 16
 * });
 * 
 * // Query students (automatically excludes soft-deleted)
 * const students = await Student.find({});
 * 
 * // Soft delete a student
 * await Student.softDelete(studentId);
 */

// Create student-specific schema
const studentSchema = new mongoose.Schema({
  // Student's full name
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
  },
  
  // Unique student identifier
  // Requirement 4.6: Enforce uniqueness on the studentId field
  studentId: {
    type: String,
    required: [true, 'Student ID is required'],
    unique: true,
    trim: true,
  },
  
  // Student's class or grade level
  class: {
    type: String,
    required: [true, 'Class is required'],
    trim: true,
  },
  
  // Student's age
  // Requirement 4.7: Validate that age is a positive number
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: [1, 'Age must be a positive number (minimum 1)'],
    validate: {
      validator: function(value) {
        // Ensure age is a positive integer
        return Number.isInteger(value) && value > 0;
      },
      message: 'Age must be a positive integer',
    },
  },
});

// Add BaseModel fields (createdAt, updatedAt, isDeleted)
const baseSchema = createBaseSchema();
studentSchema.add(baseSchema);

// Requirement 4.6: Add unique index on studentId for efficient lookups and uniqueness enforcement
studentSchema.index({ studentId: 1 }, { unique: true });

// Create and export the Student model
const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
