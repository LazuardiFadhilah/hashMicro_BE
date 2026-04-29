const mongoose = require('mongoose');
const createBaseSchema = require('./BaseModel');

/**
 * GradeModel - Grade entity model linking students to subjects with scores.
 *
 * This model represents academic grade records that associate a student with
 * a subject, storing their score and attendance percentage.
 *
 * Requirements: 6.2, 6.3, 6.4, 6.5, 9.4, 9.5, 9.6
 *
 * @example
 * // Create a new grade record
 * const grade = await Grade.create({
 *   studentId: student._id,
 *   subjectId: subject._id,
 *   score: 85,
 *   attendance: 90
 * });
 *
 * // Query grades for a student (automatically excludes soft-deleted)
 * const grades = await Grade.find({ studentId: student._id }).populate('subjectId');
 *
 * // Soft delete a grade
 * await Grade.softDelete(gradeId);
 */

// Create grade-specific schema
const gradeSchema = new mongoose.Schema({
  // Reference to the Student document
  // Requirement 9.4: studentId references the Student collection
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: [true, 'Student ID is required'],
  },

  // Reference to the Subject document
  // Requirement 9.5: subjectId references the Subject collection
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: [true, 'Subject ID is required'],
  },

  // Student's score for the subject
  // Requirement 6.2: Score must be between 0 and 100 inclusive
  score: {
    type: Number,
    required: [true, 'Score is required'],
    min: [0, 'Score must be at least 0'],
    max: [100, 'Score must be at most 100'],
  },

  // Student's attendance percentage for the subject
  // Requirement 6.3: Attendance must be between 0 and 100 inclusive
  attendance: {
    type: Number,
    required: [true, 'Attendance is required'],
    min: [0, 'Attendance must be at least 0'],
    max: [100, 'Attendance must be at most 100'],
  },
});

// Add BaseModel fields (createdAt, updatedAt, isDeleted)
const baseSchema = createBaseSchema();
gradeSchema.add(baseSchema);

// Requirement 9.6: Compound index on studentId + subjectId for efficient lookups
gradeSchema.index({ studentId: 1, subjectId: 1 });

// Create and export the Grade model
const Grade = mongoose.model('Grade', gradeSchema);

module.exports = Grade;
