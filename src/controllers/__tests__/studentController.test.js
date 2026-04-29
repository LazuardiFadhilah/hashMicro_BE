const {
  getStudents,
  createStudent,
  updateStudent,
  deleteStudent,
} = require('../studentController');
const Student = require('../../models/StudentModel');

// Mock the Student model
jest.mock('../../models/StudentModel');

describe('studentController', () => {
  let req, res;

  beforeEach(() => {
    jest.clearAllMocks();

    req = {
      body: {},
      params: {},
      query: {},
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  // ─── getStudents ────────────────────────────────────────────────────────────

  describe('getStudents', () => {
    it('should return paginated students with default page and limit', async () => {
      const mockStudents = [
        { _id: 'id1', name: 'Alice', studentId: 'STU001', class: '10A', age: 16 },
        { _id: 'id2', name: 'Bob', studentId: 'STU002', class: '10B', age: 17 },
      ];

      Student.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue(mockStudents),
      });
      Student.countDocuments.mockResolvedValue(2);

      await getStudents(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Students retrieved successfully',
          data: expect.objectContaining({
            students: mockStudents,
            total: 2,
            page: 1,
            pages: 1,
          }),
        })
      );
    });

    it('should apply pagination parameters from query string', async () => {
      req.query = { page: '2', limit: '5' };

      const mockStudents = [
        { _id: 'id6', name: 'Frank', studentId: 'STU006', class: '11A', age: 17 },
      ];

      const skipMock = jest.fn().mockReturnThis();
      const limitMock = jest.fn().mockResolvedValue(mockStudents);
      Student.find.mockReturnValue({ skip: skipMock, limit: limitMock });
      Student.countDocuments.mockResolvedValue(6);

      await getStudents(req, res);

      // page=2, limit=5 → skip=5
      expect(skipMock).toHaveBeenCalledWith(5);
      expect(limitMock).toHaveBeenCalledWith(5);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            page: 2,
            pages: 2,
            total: 6,
          }),
        })
      );
    });

    it('should return 500 on database error', async () => {
      Student.find.mockReturnValue({
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockRejectedValue(new Error('DB error')),
      });
      Student.countDocuments.mockResolvedValue(0);

      await getStudents(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error retrieving students',
      });
    });
  });

  // ─── createStudent ──────────────────────────────────────────────────────────

  describe('createStudent', () => {
    it('should create a student with valid data and return 201', async () => {
      req.body = { name: 'Alice', studentId: 'STU001', class: '10A', age: 16 };

      const mockStudent = { _id: 'id1', ...req.body };
      Student.findOne.mockResolvedValue(null); // no duplicate
      Student.create.mockResolvedValue(mockStudent);

      await createStudent(req, res);

      expect(Student.findOne).toHaveBeenCalledWith({ studentId: 'STU001' });
      expect(Student.create).toHaveBeenCalledWith({
        name: 'Alice',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Student created successfully',
          data: { student: mockStudent },
        })
      );
    });

    it('should return 400 when required fields are missing', async () => {
      req.body = { name: 'Alice', studentId: 'STU001' }; // missing class and age

      await createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name, studentId, class, and age are required',
      });
    });

    it('should return 409 when studentId already exists', async () => {
      req.body = { name: 'Alice', studentId: 'STU001', class: '10A', age: 16 };

      Student.findOne.mockResolvedValue({ studentId: 'STU001' }); // duplicate found

      await createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student with this studentId already exists',
      });
    });

    it('should return 409 on MongoDB duplicate key error (race condition)', async () => {
      req.body = { name: 'Alice', studentId: 'STU001', class: '10A', age: 16 };

      Student.findOne.mockResolvedValue(null);
      Student.create.mockRejectedValue({ code: 11000 });

      await createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student with this studentId already exists',
      });
    });

    it('should return 400 on Mongoose validation error', async () => {
      req.body = { name: 'Alice', studentId: 'STU001', class: '10A', age: -1 };

      Student.findOne.mockResolvedValue(null);
      Student.create.mockRejectedValue({
        name: 'ValidationError',
        message: 'Age must be a positive number',
      });

      await createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Age must be a positive number',
      });
    });

    it('should return 500 on unexpected database error', async () => {
      req.body = { name: 'Alice', studentId: 'STU001', class: '10A', age: 16 };

      Student.findOne.mockResolvedValue(null);
      Student.create.mockRejectedValue(new Error('Unexpected error'));

      await createStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating student',
      });
    });
  });

  // ─── updateStudent ──────────────────────────────────────────────────────────

  describe('updateStudent', () => {
    it('should update specified fields and return 200', async () => {
      req.params = { id: 'id1' };
      req.body = { name: 'Alice Updated', age: 17 };

      const mockUpdated = {
        _id: 'id1',
        name: 'Alice Updated',
        studentId: 'STU001',
        class: '10A',
        age: 17,
      };

      Student.findByIdAndUpdate.mockResolvedValue(mockUpdated);

      await updateStudent(req, res);

      expect(Student.findByIdAndUpdate).toHaveBeenCalledWith(
        'id1',
        { name: 'Alice Updated', age: 17 },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Student updated successfully',
          data: { student: mockUpdated },
        })
      );
    });

    it('should return 400 when no fields are provided', async () => {
      req.params = { id: 'id1' };
      req.body = {};

      await updateStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No fields provided for update',
      });
    });

    it('should return 404 when student is not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { name: 'Ghost' };

      Student.findByIdAndUpdate.mockResolvedValue(null);

      await updateStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student not found',
      });
    });

    it('should return 409 when updating studentId to a duplicate value', async () => {
      req.params = { id: 'id1' };
      req.body = { studentId: 'STU002' }; // already taken by another student

      Student.findOne.mockResolvedValue({ _id: 'id2', studentId: 'STU002' });

      await updateStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student with this studentId already exists',
      });
    });

    it('should return 400 on Mongoose validation error during update', async () => {
      req.params = { id: 'id1' };
      req.body = { age: -5 };

      Student.findByIdAndUpdate.mockRejectedValue({
        name: 'ValidationError',
        message: 'Age must be a positive number',
      });

      await updateStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Age must be a positive number',
      });
    });

    it('should return 404 on CastError (invalid ObjectId)', async () => {
      req.params = { id: 'invalid-id' };
      req.body = { name: 'Alice' };

      Student.findByIdAndUpdate.mockRejectedValue({ name: 'CastError' });

      await updateStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student not found',
      });
    });
  });

  // ─── deleteStudent ──────────────────────────────────────────────────────────

  describe('deleteStudent', () => {
    it('should perform soft delete and return 200', async () => {
      req.params = { id: 'id1' };

      const mockDeleted = {
        _id: 'id1',
        name: 'Alice',
        studentId: 'STU001',
        isDeleted: true,
      };

      Student.softDelete.mockResolvedValue(mockDeleted);

      await deleteStudent(req, res);

      expect(Student.softDelete).toHaveBeenCalledWith('id1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Student deleted successfully',
      });
    });

    it('should return 404 when student is not found', async () => {
      req.params = { id: 'nonexistent' };

      Student.softDelete.mockResolvedValue(null);

      await deleteStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student not found',
      });
    });

    it('should return 404 on CastError (invalid ObjectId)', async () => {
      req.params = { id: 'bad-id' };

      Student.softDelete.mockRejectedValue({ name: 'CastError' });

      await deleteStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Student not found',
      });
    });

    it('should return 500 on unexpected error', async () => {
      req.params = { id: 'id1' };

      Student.softDelete.mockRejectedValue(new Error('DB failure'));

      await deleteStudent(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error deleting student',
      });
    });
  });
});
