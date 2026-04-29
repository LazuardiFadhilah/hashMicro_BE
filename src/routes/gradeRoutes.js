const express = require('express');
const router = express.Router();
const { createGrade, generateReport } = require('../controllers/gradeController');

/**
 * gradeRoutes - Protected grade management endpoints.
 *
 * All routes in this module require a valid JWT token via authMiddleware,
 * which is applied at the app level when mounting these routes.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1
 *
 * @example
 * // Assign a grade to a student for a subject
 * POST /api/grades
 * Body: { studentId: "<ObjectId>", subjectId: "<ObjectId>", score: 85, attendance: 90 }
 *
 * // Generate grade report for all students
 * GET /api/grades/report
 */

/**
 * GET /api/grades/report
 * Generate a comprehensive grade report for all non-deleted students.
 *
 * IMPORTANT: This route is defined BEFORE /:id to prevent Express from
 * treating "report" as a dynamic :id parameter.
 *
 * Requirement 7.1: Generate report for all students across all subjects
 *
 * @route GET /api/grades/report
 * @access Protected (requires JWT)
 * @returns {Object} 200 - { success: true, message, data: { report: [...] } }
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.get('/report', generateReport);

/**
 * POST /api/grades
 * Assign a grade to a student for a specific subject.
 *
 * Requirement 6.1: Create a Grade record when POST request with valid data
 * Requirement 6.2: Validate score is within 0-100 range
 * Requirement 6.3: Validate attendance is within 0-100 range
 * Requirement 6.4: Validate studentId references an existing Student
 * Requirement 6.5: Validate subjectId references an existing Subject
 *
 * @route POST /api/grades
 * @access Protected (requires JWT)
 * @body {string} studentId - MongoDB ObjectId of the student
 * @body {string} subjectId - MongoDB ObjectId of the subject
 * @body {number} score - Student's score (0-100)
 * @body {number} attendance - Student's attendance percentage (0-100)
 * @returns {Object} 201 - { success: true, message, data: { grade } }
 * @returns {Object} 400 - { success: false, message } - Validation error or invalid reference
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.post('/', createGrade);

module.exports = router;
