const Grade = require('../models/GradeModel');
const Student = require('../models/StudentModel');
const Subject = require('../models/SubjectModel');
const { generateStudentReport } = require('../utils/gradeCalculator');

/**
 * gradeController - Handles grade assignment and reporting for students.
 *
 * This controller provides endpoints for creating grade records that link
 * students to subjects with score and attendance data, as well as generating
 * comprehensive grade reports for all students.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 10.1, 10.4, 10.5
 *
 * @example
 * // Assign a grade
 * POST /api/grades
 * Body: { studentId: "<ObjectId>", subjectId: "<ObjectId>", score: 85, attendance: 90 }
 * Response: { success: true, message, data: { grade } }
 *
 * // Generate grade report
 * GET /api/grades/report
 * Response: { success: true, message, data: { report: [...] } }
 */

/**
 * Create a new grade record linking a student to a subject.
 *
 * Requirements:
 * - 6.1: Create a Grade record when POST request with valid data
 * - 6.2: Validate score is within 0-100 range
 * - 6.3: Validate attendance is within 0-100 range
 * - 6.4: Validate studentId references an existing Student
 * - 6.5: Validate subjectId references an existing Subject
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} req.body - Request body
 * @param {string} req.body.studentId - MongoDB ObjectId of the student
 * @param {string} req.body.subjectId - MongoDB ObjectId of the subject
 * @param {number} req.body.score - Student's score (0-100)
 * @param {number} req.body.attendance - Student's attendance percentage (0-100)
 * @param {Object} res - Express response object
 * @returns {Object} Response with created grade data
 */
const createGrade = async (req, res) => {
  try {
    const { studentId, subjectId, score, attendance } = req.body;

    // Validate required fields are present
    if (!studentId || !subjectId || score === undefined || attendance === undefined) {
      return res.status(400).json({
        success: false,
        message: 'studentId, subjectId, score, and attendance are required',
      });
    }

    // Requirement 6.2: Validate score range (0-100)
    if (typeof score !== 'number' || score < 0 || score > 100) {
      return res.status(400).json({
        success: false,
        message: 'Score must be a number between 0 and 100',
      });
    }

    // Requirement 6.3: Validate attendance range (0-100)
    if (typeof attendance !== 'number' || attendance < 0 || attendance > 100) {
      return res.status(400).json({
        success: false,
        message: 'Attendance must be a number between 0 and 100',
      });
    }

    // Requirement 6.4: Validate studentId references an existing Student
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(400).json({
        success: false,
        message: 'Student not found with the provided studentId',
      });
    }

    // Requirement 6.5: Validate subjectId references an existing Subject
    const subject = await Subject.findById(subjectId);
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Subject not found with the provided subjectId',
      });
    }

    // Create the grade record
    const grade = await Grade.create({
      studentId,
      subjectId,
      score,
      attendance,
    });

    // Requirement 10.1, 10.5: Return { success, message, data }
    return res.status(201).json({
      success: true,
      message: 'Grade assigned successfully',
      data: {
        grade,
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

    // Handle invalid ObjectId format
    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: 'Invalid studentId or subjectId format',
      });
    }

    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error assigning grade',
    });
  }
};

/**
 * Generate a comprehensive grade report for all non-deleted students.
 *
 * For each student, fetches all their grade records (with populated subject info),
 * then uses the gradeCalculator utility to compute grade letters, final scores,
 * average score, pass rate, and overall pass/fail status.
 *
 * Requirements:
 * - 7.1: Generate report for all students across all subjects
 * - 7.2: Calculate grade letters (A/B/C/D/E) based on final score
 * - 7.3: Apply attendance bonus (+5 points if attendance >= 80, capped at 100)
 * - 7.4: Calculate average score across all subjects per student
 * - 7.5: Calculate pass rate as percentage of subjects with score >= 60
 * - 7.6: Return per-student summaries with subjects, grade letters, average, status
 * - 7.7: Mark status as "pass" when average >= 60, otherwise "fail"
 * - 10.1: Return standardized response format
 * - 10.4: Return success: false on error
 * - 10.5: Return success: true on success
 *
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @returns {Object} Response with report array containing per-student summaries
 */
const generateReport = async (req, res) => {
  try {
    // Requirement 7.1: Fetch all non-deleted students
    const students = await Student.find({ isDeleted: false });

    // Build report for each student
    const report = await Promise.all(
      students.map(async (student) => {
        // Fetch all grades for this student, populating subject info
        const grades = await Grade.find({
          studentId: student._id,
          isDeleted: false,
        }).populate('subjectId');

        // Use gradeCalculator to compute the full student report
        // Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
        return generateStudentReport(student, grades);
      })
    );

    // Requirement 10.1, 10.5: Return standardized success response
    return res.status(200).json({
      success: true,
      message: 'Grade report generated successfully',
      data: {
        report,
      },
    });
  } catch (error) {
    // Requirement 10.4: Return success: false on error
    return res.status(500).json({
      success: false,
      message: 'Error generating grade report',
    });
  }
};

module.exports = {
  createGrade,
  generateReport,
};
