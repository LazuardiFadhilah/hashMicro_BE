const express = require('express');
const router = express.Router();
const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../controllers/subjectController');

/**
 * subjectRoutes - Protected subject management endpoints.
 *
 * All routes in this module require a valid JWT token via authMiddleware,
 * which is applied at the app level when mounting these routes.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4
 *
 * @example
 * // List all subjects
 * GET /api/subjects
 *
 * // Create a subject
 * POST /api/subjects
 * Body: { name: "Mathematics", code: "MATH101", description: "Introduction to Mathematics" }
 *
 * // Update a subject
 * PUT /api/subjects/:id
 * Body: { name: "Advanced Mathematics" }
 *
 * // Soft delete a subject
 * DELETE /api/subjects/:id
 */

/**
 * GET /api/subjects
 * Retrieve all non-deleted subjects.
 *
 * Requirement 5.1: Return all non-deleted subjects
 *
 * @route GET /api/subjects
 * @access Protected (requires JWT)
 * @returns {Object} 200 - { success: true, message, data: { subjects } }
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.get('/', getSubjects);

/**
 * POST /api/subjects
 * Create a new subject record.
 *
 * Requirement 5.2: Create a Subject record when POST request with valid data
 *
 * @route POST /api/subjects
 * @access Protected (requires JWT)
 * @body {string} name - Subject's full name
 * @body {string} code - Unique subject code
 * @body {string} [description] - Optional description
 * @returns {Object} 201 - { success: true, message, data: { subject } }
 * @returns {Object} 400 - { success: false, message } - Validation error
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 409 - { success: false, message } - Duplicate code
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.post('/', createSubject);

/**
 * PUT /api/subjects/:id
 * Update an existing subject record.
 *
 * Requirement 5.3: Update the specified Subject record when PUT request with valid data
 *
 * @route PUT /api/subjects/:id
 * @access Protected (requires JWT)
 * @param {string} id - Subject MongoDB _id
 * @body {string} [name] - Subject's full name
 * @body {string} [code] - Unique subject code
 * @body {string} [description] - Optional description
 * @returns {Object} 200 - { success: true, message, data: { subject } }
 * @returns {Object} 400 - { success: false, message } - Validation error
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 404 - { success: false, message } - Subject not found
 * @returns {Object} 409 - { success: false, message } - Duplicate code
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.put('/:id', updateSubject);

/**
 * DELETE /api/subjects/:id
 * Soft delete a subject record (sets isDeleted: true).
 *
 * Requirement 5.4: Perform a soft delete on the specified Subject record
 *
 * @route DELETE /api/subjects/:id
 * @access Protected (requires JWT)
 * @param {string} id - Subject MongoDB _id
 * @returns {Object} 200 - { success: true, message }
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 404 - { success: false, message } - Subject not found
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.delete('/:id', deleteSubject);

module.exports = router;
