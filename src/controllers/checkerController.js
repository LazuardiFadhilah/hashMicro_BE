const { checkCharacters } = require('../utils/characterChecker');

/**
 * checkerController - Handles character comparison requests.
 *
 * This controller provides an endpoint for comparing unique characters
 * between two strings with optional case sensitivity.
 *
 * Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 10.1, 10.4, 10.5
 *
 * @example
 * // Case-insensitive comparison
 * POST /api/checker
 * Body: { input1: "ABBCD", input2: "Gallant Duck", type: "insensitive" }
 * Response: {
 *   success: true,
 *   message: "Character check completed successfully",
 *   data: { input1: "ABBCD", input2: "Gallant Duck", type: "insensitive", matched: 3, total: 5, percentage: 60.00 }
 * }
 */

/**
 * Check character overlap between two strings.
 *
 * Requirements:
 * - 8.1: Extract unique characters from input1
 * - 8.2: Count matches with exact case when type is "sensitive"
 * - 8.3: Convert both inputs to lowercase when type is "insensitive"
 * - 8.4: Return matched count, total count, and percentage
 * - 8.5: Return response with input1, input2, type, matched, total, percentage
 * - 8.6: Calculate percentage as (matched / total) * 100 rounded to 2 decimals
 * - 10.1: Return standardized response format { success, message, data }
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.input1 - Source string to extract unique characters from
 * @param {string} req.body.input2 - Target string to search for matches
 * @param {string} req.body.type - Comparison type: "sensitive" or "insensitive"
 * @param {Object} res - Express response object
 * @returns {Object} Response with character comparison result
 */
const checkCharactersHandler = (req, res) => {
  try {
    const { input1, input2, type } = req.body;

    // Validate required fields are present
    if (input1 === undefined || input1 === null || input1 === '') {
      return res.status(400).json({
        success: false,
        message: 'input1 is required',
      });
    }

    if (input2 === undefined || input2 === null || input2 === '') {
      return res.status(400).json({
        success: false,
        message: 'input2 is required',
      });
    }

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'type is required',
      });
    }

    // Validate type value
    if (type !== 'sensitive' && type !== 'insensitive') {
      return res.status(400).json({
        success: false,
        message: 'type must be "sensitive" or "insensitive"',
      });
    }

    // Validate input types are strings
    if (typeof input1 !== 'string' || typeof input2 !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'input1 and input2 must be strings',
      });
    }

    // Call characterChecker utility
    const result = checkCharacters(input1, input2, type);

    // Requirement 10.1, 10.5: Return standardized success response
    return res.status(200).json({
      success: true,
      message: 'Character check completed successfully',
      data: result,
    });
  } catch (error) {
    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error performing character check',
    });
  }
};

module.exports = {
  checkCharactersHandler,
};
