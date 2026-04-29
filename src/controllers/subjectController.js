const Subject = require('../models/SubjectModel');

/**
 * subjectController - Handles CRUD operations for subject records.
 *
 * This controller provides endpoints for listing, creating, updating,
 * and soft-deleting subject records. All endpoints require authentication.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 10.1, 10.4, 10.5
 *
 * @example
 * // Get all subjects
 * GET /api/subjects
 * Response: { success: true, message, data: { subjects } }
 *
 * // Create a subject
 * POST /api/subjects
 * Body: { name: "Mathematics", code: "MATH101", description: "Introduction to Mathematics" }
 * Response: { success: true, message, data: { subject } }
 *
 * // Update a subject
 * PUT /api/subjects/:id
 * Body: { name: "Advanced Mathematics" }
 * Response: { success: true, message, data: { subject } }
 *
 * // Soft delete a subject
 * DELETE /api/subjects/:id
 * Response: { success: true, message }
 */

/**
 * Get all subjects (non-deleted).
 *
 * Requirements:
 * - 5.1: Return all non-deleted subjects
 * - 10.1: Return standardized response format
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with subjects list
 */
const getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({});

    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(200).json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: {
        subjects,
      },
    });
  } catch (error) {
    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error retrieving subjects',
    });
  }
};

/**
 * Create a new subject record.
 *
 * Requirements:
 * - 5.2: Create a Subject record when POST request with valid data
 * - 5.5: Handle duplicate code errors (409)
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - Subject's full name
 * @param {string} req.body.code - Unique subject code
 * @param {string} [req.body.description] - Optional description
 * @param {Object} res - Express response object
 * @returns {Object} Response with created subject data
 */
const createSubject = async (req, res) => {
  try {
    const { name, code, description } = req.body;

    // Validate required fields
    if (!name || !code) {
      return res.status(400).json({
        success: false,
        message: 'Name and code are required',
      });
    }

    // Check for duplicate code before creation
    const existingSubject = await Subject.findOne({ code });
    if (existingSubject) {
      // Requirement 5.5: Handle duplicate code errors (409)
      return res.status(409).json({
        success: false,
        message: 'Subject with this code already exists',
      });
    }

    // Build subject data object
    const subjectData = { name, code };
    if (description !== undefined) subjectData.description = description;

    // Create new subject record
    const subject = await Subject.create(subjectData);

    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: {
        subject,
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle MongoDB duplicate key errors (race condition fallback)
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Subject with this code already exists',
      });
    }

    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error creating subject',
    });
  }
};

/**
 * Update an existing subject record by MongoDB _id.
 *
 * Requirements:
 * - 5.3: Update the specified Subject record when PUT request with valid data
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Subject MongoDB _id
 * @param {Object} req.body - Fields to update (name, code, description)
 * @param {Object} res - Express response object
 * @returns {Object} Response with updated subject data
 */
const updateSubject = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (code !== undefined) updateData.code = code;
    if (description !== undefined) updateData.description = description;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update',
      });
    }

    // If code is being updated, check for duplicates
    if (code !== undefined) {
      const existingSubject = await Subject.findOne({ code, _id: { $ne: id } });
      if (existingSubject) {
        return res.status(409).json({
          success: false,
          message: 'Subject with this code already exists',
        });
      }
    }

    // Find and update the subject
    const subject = await Subject.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(200).json({
      success: true,
      message: 'Subject updated successfully',
      data: {
        subject,
      },
    });
  } catch (error) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Handle MongoDB duplicate key errors
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'Subject with this code already exists',
      });
    }

    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error updating subject',
    });
  }
};

/**
 * Soft delete a subject record by MongoDB _id.
 *
 * Requirements:
 * - 5.4: Perform a soft delete on the specified Subject record
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Subject MongoDB _id
 * @param {Object} res - Express response object
 * @returns {Object} Response with success message
 */
const deleteSubject = async (req, res) => {
  try {
    const { id } = req.params;

    // Perform soft delete using BaseModel's softDelete static method
    const subject = await Subject.softDelete(id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Requirement 10.1, 10.5: Return { success, message }
    return res.status(200).json({
      success: true,
      message: 'Subject deleted successfully',
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Subject not found',
      });
    }

    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error deleting subject',
    });
  }
};

module.exports = {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
};
