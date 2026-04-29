const express = require('express');
const router = express.Router();
const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../controllers/studentController');

/**
 * studentRoutes - Protected student management endpoints.
 *
 * All routes in this module require a valid JWT token via authMiddleware,
 * which is applied at the app level when mounting these routes.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 *
 * @example
 * // List students with pagination
 * GET /api/students?page=1&limit=10
 *
 * // Create a student
 * POST /api/students
 * Body: { name: "Jane Smith", studentId: "STU001", class: "10A", age: 16 }
 *
 * // Update a student
 * PUT /api/students/:id
 * Body: { name: "Jane Smith Updated" }
 *
 * // Soft delete a student
 * DELETE /api/students/:id
 */

/**
 * GET /api/students
 * Retrieve all non-deleted students with pagination.
 *
 * Requirement 4.1: Return all non-deleted students with pagination support
 * Requirement 4.2: Return the corresponding page when pagination params provided
 *
 * @route GET /api/students
 * @access Protected (requires JWT)
 * @query {number} [page=1] - Page number (1-indexed)
 * @query {number} [limit=10] - Number of records per page
 * @returns {Object} 200 - { success: true, message, data: { students, total, page, pages } }
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.get('/', getStudents);

/**
 * POST /api/students
 * Create a new student record.
 *
 * Requirement 4.3: Create a Student record when POST request with valid data
 *
 * @route POST /api/students
 * @access Protected (requires JWT)
 * @body {string} name - Student's full name
 * @body {string} studentId - Unique student identifier
 * @body {string} class - Student's class or grade level
 * @body {number} age - Student's age (positive integer)
 * @returns {Object} 201 - { success: true, message, data: { student } }
 * @returns {Object} 400 - { success: false, message } - Validation error
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 409 - { success: false, message } - Duplicate studentId
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.post('/', createStudent);

/**
 * PUT /api/students/:id
 * Update an existing student record.
 *
 * Requirement 4.4: Update the specified Student record when PUT request with valid data
 *
 * @route PUT /api/students/:id
 * @access Protected (requires JWT)
 * @param {string} id - Student MongoDB _id
 * @body {string} [name] - Student's full name
 * @body {string} [studentId] - Unique student identifier
 * @body {string} [class] - Student's class or grade level
 * @body {number} [age] - Student's age (positive integer)
 * @returns {Object} 200 - { success: true, message, data: { student } }
 * @returns {Object} 400 - { success: false, message } - Validation error
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 404 - { success: false, message } - Student not found
 * @returns {Object} 409 - { success: false, message } - Duplicate studentId
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.put('/:id', updateStudent);

/**
 * DELETE /api/students/:id
 * Soft delete a student record (sets isDeleted: true).
 *
 * Requirement 4.5: Perform a soft delete on the specified Student record
 *
 * @route DELETE /api/students/:id
 * @access Protected (requires JWT)
 * @param {string} id - Student MongoDB _id
 * @returns {Object} 200 - { success: true, message }
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 404 - { success: false, message } - Student not found
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.delete('/:id', deleteStudent);

module.exports = router;
