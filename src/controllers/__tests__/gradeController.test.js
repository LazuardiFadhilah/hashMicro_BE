const { createGrade, generateReport } = require('../gradeController');
const Grade = require('../../models/GradeModel');
const Student = require('../../models/StudentModel');
const Subject = require('../../models/SubjectModel');
const { generateStudentReport } = require('../../utils/gradeCalculator');

// Mock the models
jest.mock('../../models/GradeModel');
jest.mock('../../models/StudentModel');
jest.mock('../../models/SubjectModel');
// Mock gradeCalculator to avoid pulling in unrelated logic
jest.mock('../../utils/gradeCalculator', () => ({
  generateStudentReport: jest.fn(),
}));

describe('gradeController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ─── createGrade ─────────────────────────────────────────────────────────────

  describe('createGrade', () => {
    const validStudentId = '507f1f77bcf86cd799439011';
    const validSubjectId = '507f1f77bcf86cd799439012';

    it('should create a grade with valid data and return 201', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 85,
        attendance: 90,
      };

      const mockStudent = { _id: validStudentId, name: 'Alice' };
      const mockSubject = { _id: validSubjectId, name: 'Mathematics' };
      const mockGrade = { _id: 'gradeId1', ...req.body };

      Student.findById.mockResolvedValue(mockStudent);
      Subject.findById.mockResolvedValue(mockSubject);
      Grade.create.mockResolvedValue(mockGrade);

      await createGrade(req, res);

      expect(Student.findById).toHaveBeenCalledWith(validStudentId);
      expect(Subject.findById).toHaveBeenCalledWith(validSubjectId);
      expect(Grade.create).toHaveBeenCalledWith({
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 85,
        attendance: 90,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Grade assigned successfully',
          data: { grade: mockGrade },
        })
      );
    });

    // ─── Requirement 6.2: score range validation ────────────────────────────

    it('should return 400 when score is below 0', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: -1,
        attendance: 80,
      };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Score must be a number between 0 and 100',
      });
      expect(Grade.create).not.toHaveBeenCalled();
    });

    it('should return 400 when score is above 100', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 101,
        attendance: 80,
      };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Score must be a number between 0 and 100',
      });
      expect(Grade.create).not.toHaveBeenCalled();
    });

    it('should accept score at boundary value 0', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 0,
        attendance: 50,
      };

      const mockStudent = { _id: validStudentId };
      const mockSubject = { _id: validSubjectId };
      const mockGrade = { _id: 'gradeId2', ...req.body };

      Student.findById.mockResolvedValue(mockStudent);
      Subject.findById.mockResolvedValue(mockSubject);
      Grade.create.mockResolvedValue(mockGrade);

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should accept score at boundary value 100', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 100,
        attendance: 50,
      };

      const mockStudent = { _id: validStudentId };
      const mockSubject = { _id: validSubjectId };
      const mockGrade = { _id: 'gradeId3', ...req.body };

      Student.findById.mockResolvedValue(mockStudent);
      Subject.findById.mockResolvedValue(mockSubject);
      Grade.create.mockResolvedValue(mockGrade);

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when score is not a number', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 'high',
        attendance: 80,
      };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Score must be a number between 0 and 100',
      });
    });

    // ─── Requirement 6.3: attendance range validation ───────────────────────

    it('should return 400 when attendance is below 0', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 80,
        attendance: -5,
      };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Attendance must be a number between 0 and 100',
      });
      expect(Grade.create).not.toHaveBeenCalled();
    });

    it('should return 400 when attendance is above 100', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 80,
        attendance: 105,
      };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Attendance must be a number between 0 and 100',
      });
      expect(Grade.create).not.toHaveBeenCalled();
    });

    it('should accept attendance at boundary value 0', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 75,
        attendance: 0,
      };

      const mockStudent = { _id: validStudentId };
      const mockSubject = { _id: validSubjectId };
      const mockGrade = { _id: 'gradeId4', ...req.body };

      Student.findById.mockResolvedValue(mockStudent);
      Subject.findById.mockResolvedValue(mockSubject);
      Grade.create.mockResolvedValue(mockGrade);

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should accept attendance at boundary value 100', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 75,
        attendance: 100,
      };

      const mockStudent = { _id: validStudentId };
      const mockSubject = { _id: validSubjectId };
      const mockGrade = { _id: 'gradeId5', ...req.body };

      Student.findById.mockResolvedValue(mockStudent);
      Subject.findById.mockResolvedValue(mockSubject);
      Grade.create.mockResolvedValue(mockGrade);

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when attendance is not a number', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 80,
        attendance: 'always',
      };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Attendance must be a number between 0 and 100',
      });
    });

    // ─── Requirement 6.4: studentId reference validation ────────────────────

    it('should return 400 when studentId does not reference an existing Student', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 80,
        attendance: 90,
      };

      Student.findById.mockResolvedValue(null); // student not found

      await createGrade(req, res);

      expect(Student.findById).toHaveBeenCalledWith(validStudentId);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student not found with the provided studentId',
      });
      expect(Grade.create).not.toHaveBeenCalled();
    });

    // ─── Requirement 6.5: subjectId reference validation ────────────────────

    it('should return 400 when subjectId does not reference an existing Subject', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 80,
        attendance: 90,
      };

      Student.findById.mockResolvedValue({ _id: validStudentId }); // student found
      Subject.findById.mockResolvedValue(null); // subject not found

      await createGrade(req, res);

      expect(Subject.findById).toHaveBeenCalledWith(validSubjectId);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject not found with the provided subjectId',
      });
      expect(Grade.create).not.toHaveBeenCalled();
    });

    // ─── Missing required fields ─────────────────────────────────────────────

    it('should return 400 when required fields are missing', async () => {
      req.body = { studentId: validStudentId, subjectId: validSubjectId }; // missing score and attendance

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'studentId, subjectId, score, and attendance are required',
      });
    });

    it('should return 400 when studentId is missing', async () => {
      req.body = { subjectId: validSubjectId, score: 80, attendance: 90 };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'studentId, subjectId, score, and attendance are required',
      });
    });

    it('should return 400 when subjectId is missing', async () => {
      req.body = { studentId: validStudentId, score: 80, attendance: 90 };

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'studentId, subjectId, score, and attendance are required',
      });
    });

    // ─── Error handling ──────────────────────────────────────────────────────

    it('should return 400 on Mongoose ValidationError', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 80,
        attendance: 90,
      };

      Student.findById.mockResolvedValue({ _id: validStudentId });
      Subject.findById.mockResolvedValue({ _id: validSubjectId });
      Grade.create.mockRejectedValue({
        name: 'ValidationError',
        message: 'Score must be at most 100',
      });

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Score must be at most 100',
      });
    });

    it('should return 400 on CastError (invalid ObjectId format)', async () => {
      req.body = {
        studentId: 'invalid-id',
        subjectId: validSubjectId,
        score: 80,
        attendance: 90,
      };

      Student.findById.mockRejectedValue({ name: 'CastError' });

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Invalid studentId or subjectId format',
      });
    });

    it('should return 500 on unexpected database error', async () => {
      req.body = {
        studentId: validStudentId,
        subjectId: validSubjectId,
        score: 80,
        attendance: 90,
      };

      Student.findById.mockResolvedValue({ _id: validStudentId });
      Subject.findById.mockResolvedValue({ _id: validSubjectId });
      Grade.create.mockRejectedValue(new Error('Unexpected DB error'));

      await createGrade(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error assigning grade',
      });
    });
  });

  // ─── generateReport ───────────────────────────────────────────────────────

  describe('generateReport', () => {
    // Requirement 7.1: Generate report for all students across all subjects

    it('should return 200 with a report array for all non-deleted students', async () => {
      const mockStudents = [
        { _id: 'student1', name: 'Alice', studentId: 'STU001', class: '10A' },
        { _id: 'student2', name: 'Bob', studentId: 'STU002', class: '10B' },
      ];

      const mockGradesAlice = [
        {
          score: 85,
          attendance: 90,
          subjectId: { name: 'Math', code: 'MATH101' },
        },
      ];
      const mockGradesBob = [
        {
          score: 55,
          attendance: 70,
          subjectId: { name: 'Science', code: 'SCI101' },
        },
      ];

      const mockReportAlice = {
        studentId: 'STU001',
        studentName: 'Alice',
        class: '10A',
        subjects: [
          {
            subjectName: 'Math',
            subjectCode: 'MATH101',
            score: 85,
            attendance: 90,
            finalScore: 90,
            gradeLetter: 'A',
          },
        ],
        averageScore: 90,
        passRate: 100,
        status: 'pass',
      };

      const mockReportBob = {
        studentId: 'STU002',
        studentName: 'Bob',
        class: '10B',
        subjects: [
          {
            subjectName: 'Science',
            subjectCode: 'SCI101',
            score: 55,
            attendance: 70,
            finalScore: 55,
            gradeLetter: 'D',
          },
        ],
        averageScore: 55,
        passRate: 0,
        status: 'fail',
      };

      Student.find.mockResolvedValue(mockStudents);

      // Grade.find returns a chainable object with .populate()
      Grade.find.mockImplementation(({ studentId }) => ({
        populate: jest.fn().mockResolvedValue(
          studentId === 'student1' ? mockGradesAlice : mockGradesBob
        ),
      }));

      generateStudentReport
        .mockReturnValueOnce(mockReportAlice)
        .mockReturnValueOnce(mockReportBob);

      await generateReport(req, res);

      // Requirement 7.1: fetches all non-deleted students
      expect(Student.find).toHaveBeenCalledWith({ isDeleted: false });

      // Requirement 7.1: fetches grades for each student with populated subject info
      expect(Grade.find).toHaveBeenCalledTimes(2);
      expect(Grade.find).toHaveBeenCalledWith({
        studentId: 'student1',
        isDeleted: false,
      });
      expect(Grade.find).toHaveBeenCalledWith({
        studentId: 'student2',
        isDeleted: false,
      });

      // Requirement 7.6: uses generateStudentReport for each student
      expect(generateStudentReport).toHaveBeenCalledTimes(2);
      expect(generateStudentReport).toHaveBeenCalledWith(
        mockStudents[0],
        mockGradesAlice
      );
      expect(generateStudentReport).toHaveBeenCalledWith(
        mockStudents[1],
        mockGradesBob
      );

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Grade report generated successfully',
        data: {
          report: [mockReportAlice, mockReportBob],
        },
      });
    });

    it('should return an empty report array when there are no students', async () => {
      // Requirement 7.1: handles case with no students
      Student.find.mockResolvedValue([]);

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Grade report generated successfully',
        data: { report: [] },
      });
      expect(Grade.find).not.toHaveBeenCalled();
    });

    it('should include per-student summary with subjects, grade letters, average, and status', async () => {
      // Requirements 7.2, 7.3, 7.4, 7.5, 7.6, 7.7
      const mockStudent = {
        _id: 'student1',
        name: 'Carol',
        studentId: 'STU003',
        class: '11A',
      };

      const mockGrades = [
        {
          score: 70,
          attendance: 85,
          subjectId: { name: 'History', code: 'HIST101' },
        },
        {
          score: 45,
          attendance: 60,
          subjectId: { name: 'Art', code: 'ART101' },
        },
      ];

      // finalScore for History: 70 + 5 (attendance bonus) = 75 → B
      // finalScore for Art: 45 (no bonus) → E
      // averageScore of finalScores: (75 + 45) / 2 = 60 → pass
      // passRate: 1 out of 2 original scores >= 60 → 50%
      const mockReport = {
        studentId: 'STU003',
        studentName: 'Carol',
        class: '11A',
        subjects: [
          {
            subjectName: 'History',
            subjectCode: 'HIST101',
            score: 70,
            attendance: 85,
            finalScore: 75,
            gradeLetter: 'B',
          },
          {
            subjectName: 'Art',
            subjectCode: 'ART101',
            score: 45,
            attendance: 60,
            finalScore: 45,
            gradeLetter: 'E',
          },
        ],
        averageScore: 60,
        passRate: 50,
        status: 'pass',
      };

      Student.find.mockResolvedValue([mockStudent]);
      Grade.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockGrades),
      });
      generateStudentReport.mockReturnValue(mockReport);

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseBody = res.json.mock.calls[0][0];
      const studentReport = responseBody.data.report[0];

      // Requirement 7.6: per-student summary includes subjects, averageScore, passRate, status
      expect(studentReport).toHaveProperty('subjects');
      expect(studentReport).toHaveProperty('averageScore');
      expect(studentReport).toHaveProperty('passRate');
      expect(studentReport).toHaveProperty('status');

      // Requirement 7.7: status is "pass" when averageScore >= 60
      expect(studentReport.status).toBe('pass');
      expect(studentReport.averageScore).toBe(60);
    });

    it('should mark status as "fail" when student average is below 60', async () => {
      // Requirement 7.7: status is "fail" when averageScore < 60
      const mockStudent = {
        _id: 'student1',
        name: 'Dave',
        studentId: 'STU004',
        class: '11B',
      };

      const mockReport = {
        studentId: 'STU004',
        studentName: 'Dave',
        class: '11B',
        subjects: [
          {
            subjectName: 'Physics',
            subjectCode: 'PHY101',
            score: 40,
            attendance: 50,
            finalScore: 40,
            gradeLetter: 'E',
          },
        ],
        averageScore: 40,
        passRate: 0,
        status: 'fail',
      };

      Student.find.mockResolvedValue([mockStudent]);
      Grade.find.mockReturnValue({
        populate: jest.fn().mockResolvedValue([
          { score: 40, attendance: 50, subjectId: { name: 'Physics', code: 'PHY101' } },
        ]),
      });
      generateStudentReport.mockReturnValue(mockReport);

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      const responseBody = res.json.mock.calls[0][0];
      expect(responseBody.data.report[0].status).toBe('fail');
    });

    it('should populate subject info when fetching grades', async () => {
      // Requirement 7.1: grades are fetched with populated subject info
      const mockStudent = {
        _id: 'student1',
        name: 'Eve',
        studentId: 'STU005',
        class: '12A',
      };

      const populateMock = jest.fn().mockResolvedValue([]);
      Grade.find.mockReturnValue({ populate: populateMock });
      Student.find.mockResolvedValue([mockStudent]);
      generateStudentReport.mockReturnValue({
        studentId: 'STU005',
        studentName: 'Eve',
        class: '12A',
        subjects: [],
        averageScore: 0,
        passRate: 0,
        status: 'fail',
      });

      await generateReport(req, res);

      // Verify populate was called with 'subjectId' to get subject details
      expect(populateMock).toHaveBeenCalledWith('subjectId');
    });

    it('should return 500 when database query fails', async () => {
      // Requirement 10.4: return success: false on error
      Student.find.mockRejectedValue(new Error('Database connection error'));

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error generating grade report',
      });
    });

    it('should return 500 when grade fetch fails for a student', async () => {
      const mockStudent = {
        _id: 'student1',
        name: 'Frank',
        studentId: 'STU006',
        class: '12B',
      };

      Student.find.mockResolvedValue([mockStudent]);
      Grade.find.mockReturnValue({
        populate: jest.fn().mockRejectedValue(new Error('Grade fetch error')),
      });

      await generateReport(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error generating grade report',
      });
    });
  });
});
