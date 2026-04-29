const Student = require('../models/StudentModel');

/**
 * studentController - Handles CRUD operations for student records.
 *
 * This controller provides endpoints for listing, creating, updating,
 * and soft-deleting student records. All endpoints require authentication.
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 10.1, 10.4, 10.5
 *
 * @example
 * // Get paginated students
 * GET /api/students?page=1&limit=10
 * Response: { success: true, message, data: { students, total, page, pages } }
 *
 * // Create a student
 * POST /api/students
 * Body: { name: "Jane Smith", studentId: "STU001", class: "10A", age: 16 }
 * Response: { success: true, message, data: { student } }
 *
 * // Update a student
 * PUT /api/students/:id
 * Body: { name: "Jane Smith Updated" }
 * Response: { success: true, message, data: { student } }
 *
 * // Soft delete a student
 * DELETE /api/students/:id
 * Response: { success: true, message }
 */

/**
 * Get all students with pagination support.
 *
 * Requirements:
 * - 4.1: Return all non-deleted students with pagination support
 * - 4.2: Return the corresponding page of results when pagination params provided
 * - 10.1: Return standardized response format
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.query - Query parameters
 * @param {number} [req.query.page=1] - Page number (1-indexed)
 * @param {number} [req.query.limit=10] - Number of records per page
 * @param {Object} res - Express response object
 * @returns {Object} Response with paginated students list
 */
const getStudents = async (req, res) => {
  try {
    // Parse pagination parameters with defaults
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const skip = (page - 1) * limit;

    // Fetch students and total count in parallel
    const [students, total] = await Promise.all([
      Student.find({}).skip(skip).limit(limit),
      Student.countDocuments({}),
    ]);

    const pages = Math.ceil(total / limit);

    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(200).json({
      success: true,
      message: 'Students retrieved successfully',
      data: {
        students,
        total,
        page,
        pages,
      },
    });
  } catch (error) {
    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error retrieving students',
    });
  }
};

/**
 * Create a new student record.
 *
 * Requirements:
 * - 4.3: Create a Student record when POST request with valid data
 * - 4.6: Handle duplicate studentId errors (409)
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.name - Student's full name
 * @param {string} req.body.studentId - Unique student identifier
 * @param {string} req.body.class - Student's class or grade level
 * @param {number} req.body.age - Student's age (must be positive integer)
 * @param {Object} res - Express response object
 * @returns {Object} Response with created student data
 */
const createStudent = async (req, res) => {
  try {
    const { name, studentId, class: studentClass, age } = req.body;

    // Validate required fields
    if (!name || !studentId || !studentClass || age === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, studentId, class, and age are required',
      });
    }

    // Check for duplicate studentId before creation
    const existingStudent = await Student.findOne({ studentId });
    if (existingStudent) {
      // Requirement 4.6: Handle duplicate studentId errors (409)
      return res.status(409).json({
        success: false,
        message: 'Student with this studentId already exists',
      });
    }

    // Create new student record
    const student = await Student.create({
      name,
      studentId,
      class: studentClass,
      age,
    });

    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(201).json({
      success: true,
      message: 'Student created successfully',
      data: {
        student,
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
        message: 'Student with this studentId already exists',
      });
    }

    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error creating student',
    });
  }
};

/**
 * Update an existing student record by MongoDB _id.
 *
 * Requirements:
 * - 4.4: Update the specified Student record when PUT request with valid data
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Student MongoDB _id
 * @param {Object} req.body - Fields to update (name, studentId, class, age)
 * @param {Object} res - Express response object
 * @returns {Object} Response with updated student data
 */
const updateStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, studentId, class: studentClass, age } = req.body;

    // Build update object with only provided fields
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (studentId !== undefined) updateData.studentId = studentId;
    if (studentClass !== undefined) updateData.class = studentClass;
    if (age !== undefined) updateData.age = age;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided for update',
      });
    }

    // If studentId is being updated, check for duplicates
    if (studentId !== undefined) {
      const existingStudent = await Student.findOne({ studentId, _id: { $ne: id } });
      if (existingStudent) {
        return res.status(409).json({
          success: false,
          message: 'Student with this studentId already exists',
        });
      }
    }

    // Find and update the student
    const student = await Student.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(200).json({
      success: true,
      message: 'Student updated successfully',
      data: {
        student,
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
        message: 'Student with this studentId already exists',
      });
    }

    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error updating student',
    });
  }
};

/**
 * Soft delete a student record by MongoDB _id.
 *
 * Requirements:
 * - 4.5: Perform a soft delete on the specified Student record
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.params - Route parameters
 * @param {string} req.params.id - Student MongoDB _id
 * @param {Object} res - Express response object
 * @returns {Object} Response with success message
 */
const deleteStudent = async (req, res) => {
  try {
    const { id } = req.params;

    // Perform soft delete using BaseModel's softDelete static method
    const student = await Student.softDelete(id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Requirement 10.1, 10.5: Return { success, message }
    return res.status(200).json({
      success: true,
      message: 'Student deleted successfully',
    });
  } catch (error) {
    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error deleting student',
    });
  }
};

module.exports = {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
};
