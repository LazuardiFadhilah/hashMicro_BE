const express = require('express');
const router = express.Router();
const { checkCharactersHandler } = require('../controllers/checkerController');

/**
 * checkerRoutes - Protected character checker endpoint.
 *
 * All routes in this module require a valid JWT token via authMiddleware,
 * which is applied at the app level when mounting these routes.
 *
 * Requirements: 8.1
 *
 * @example
 * // Compare character overlap between two strings
 * POST /api/checker
 * Body: { input1: "ABBCD", input2: "Gallant Duck", type: "insensitive" }
 */

/**
 * POST /api/checker
 * Compare unique characters from input1 against input2.
 *
 * Requirement 8.1: Extract unique characters from input1 and check against input2
 *
 * @route POST /api/checker
 * @access Protected (requires JWT)
 * @body {string} input1 - Source string to extract unique characters from
 * @body {string} input2 - Target string to search for matches
 * @body {string} type - "sensitive" or "insensitive"
 * @returns {Object} 200 - { success: true, message, data: { input1, input2, type, matched, total, percentage } }
 * @returns {Object} 400 - { success: false, message } - Validation error
 * @returns {Object} 401 - { success: false, message } - Unauthorized
 * @returns {Object} 500 - { success: false, message } - Server error
 */
router.post('/', checkCharactersHandler);

module.exports = router;
