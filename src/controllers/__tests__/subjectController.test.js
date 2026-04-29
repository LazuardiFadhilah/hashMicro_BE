const {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
} = require('../subjectController');
const Subject = require('../../models/SubjectModel');

// Mock the Subject model
jest.mock('../../models/SubjectModel');

describe('subjectController', () => {
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

  // ─── getSubjects ─────────────────────────────────────────────────────────────

  describe('getSubjects', () => {
    it('should return all subjects with 200', async () => {
      const mockSubjects = [
        { _id: 'id1', name: 'Mathematics', code: 'MATH101', description: 'Intro to Math' },
        { _id: 'id2', name: 'Physics', code: 'PHYS101', description: 'Intro to Physics' },
      ];

      Subject.find.mockResolvedValue(mockSubjects);

      await getSubjects(req, res);

      expect(Subject.find).toHaveBeenCalledWith({});
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subjects retrieved successfully',
        data: { subjects: mockSubjects },
      });
    });

    it('should return 500 on database error', async () => {
      Subject.find.mockRejectedValue(new Error('DB error'));

      await getSubjects(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error retrieving subjects',
      });
    });
  });

  // ─── createSubject ────────────────────────────────────────────────────────────

  describe('createSubject', () => {
    it('should create a subject with valid data and return 201', async () => {
      req.body = { name: 'Mathematics', code: 'MATH101', description: 'Intro to Math' };

      const mockSubject = { _id: 'id1', ...req.body };
      Subject.findOne.mockResolvedValue(null); // no duplicate
      Subject.create.mockResolvedValue(mockSubject);

      await createSubject(req, res);

      expect(Subject.findOne).toHaveBeenCalledWith({ code: 'MATH101' });
      expect(Subject.create).toHaveBeenCalledWith({
        name: 'Mathematics',
        code: 'MATH101',
        description: 'Intro to Math',
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Subject created successfully',
          data: { subject: mockSubject },
        })
      );
    });

    it('should create a subject without description', async () => {
      req.body = { name: 'Mathematics', code: 'MATH101' };

      const mockSubject = { _id: 'id1', name: 'Mathematics', code: 'MATH101' };
      Subject.findOne.mockResolvedValue(null);
      Subject.create.mockResolvedValue(mockSubject);

      await createSubject(req, res);

      expect(Subject.create).toHaveBeenCalledWith({ name: 'Mathematics', code: 'MATH101' });
      expect(res.status).toHaveBeenCalledWith(201);
    });

    it('should return 400 when required fields are missing', async () => {
      req.body = { name: 'Mathematics' }; // missing code

      await createSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name and code are required',
      });
    });

    it('should return 400 when name is missing', async () => {
      req.body = { code: 'MATH101' }; // missing name

      await createSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name and code are required',
      });
    });

    it('should return 409 when code already exists', async () => {
      req.body = { name: 'Mathematics', code: 'MATH101' };

      Subject.findOne.mockResolvedValue({ code: 'MATH101' }); // duplicate found

      await createSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject with this code already exists',
      });
    });

    it('should return 409 on MongoDB duplicate key error (race condition)', async () => {
      req.body = { name: 'Mathematics', code: 'MATH101' };

      Subject.findOne.mockResolvedValue(null);
      Subject.create.mockRejectedValue({ code: 11000 });

      await createSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject with this code already exists',
      });
    });

    it('should return 400 on Mongoose validation error', async () => {
      req.body = { name: 'Mathematics', code: 'MATH101' };

      Subject.findOne.mockResolvedValue(null);
      Subject.create.mockRejectedValue({
        name: 'ValidationError',
        message: 'Name is required',
      });

      await createSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required',
      });
    });

    it('should return 500 on unexpected database error', async () => {
      req.body = { name: 'Mathematics', code: 'MATH101' };

      Subject.findOne.mockResolvedValue(null);
      Subject.create.mockRejectedValue(new Error('Unexpected error'));

      await createSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error creating subject',
      });
    });
  });

  // ─── updateSubject ────────────────────────────────────────────────────────────

  describe('updateSubject', () => {
    it('should update specified fields and return 200', async () => {
      req.params = { id: 'id1' };
      req.body = { name: 'Advanced Mathematics' };

      const mockUpdated = {
        _id: 'id1',
        name: 'Advanced Mathematics',
        code: 'MATH101',
      };

      Subject.findByIdAndUpdate.mockResolvedValue(mockUpdated);

      await updateSubject(req, res);

      expect(Subject.findByIdAndUpdate).toHaveBeenCalledWith(
        'id1',
        { name: 'Advanced Mathematics' },
        { new: true, runValidators: true }
      );
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: 'Subject updated successfully',
          data: { subject: mockUpdated },
        })
      );
    });

    it('should return 400 when no fields are provided', async () => {
      req.params = { id: 'id1' };
      req.body = {};

      await updateSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'No fields provided for update',
      });
    });

    it('should return 404 when subject is not found', async () => {
      req.params = { id: 'nonexistent' };
      req.body = { name: 'Ghost Subject' };

      Subject.findByIdAndUpdate.mockResolvedValue(null);

      await updateSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject not found',
      });
    });

    it('should return 409 when updating code to a duplicate value', async () => {
      req.params = { id: 'id1' };
      req.body = { code: 'PHYS101' }; // already taken by another subject

      Subject.findOne.mockResolvedValue({ _id: 'id2', code: 'PHYS101' });

      await updateSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject with this code already exists',
      });
    });

    it('should return 400 on Mongoose validation error during update', async () => {
      req.params = { id: 'id1' };
      req.body = { name: '' };

      Subject.findByIdAndUpdate.mockRejectedValue({
        name: 'ValidationError',
        message: 'Name is required',
      });

      await updateSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Name is required',
      });
    });

    it('should return 404 on CastError (invalid ObjectId)', async () => {
      req.params = { id: 'invalid-id' };
      req.body = { name: 'Mathematics' };

      Subject.findByIdAndUpdate.mockRejectedValue({ name: 'CastError' });

      await updateSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject not found',
      });
    });

    it('should return 409 on MongoDB duplicate key error during update', async () => {
      req.params = { id: 'id1' };
      req.body = { code: 'PHYS101' };

      Subject.findOne.mockResolvedValue(null); // no pre-check duplicate
      Subject.findByIdAndUpdate.mockRejectedValue({ code: 11000 });

      await updateSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject with this code already exists',
      });
    });
  });

  // ─── deleteSubject ────────────────────────────────────────────────────────────

  describe('deleteSubject', () => {
    it('should perform soft delete and return 200', async () => {
      req.params = { id: 'id1' };

      const mockDeleted = {
        _id: 'id1',
        name: 'Mathematics',
        code: 'MATH101',
        isDeleted: true,
      };

      Subject.softDelete.mockResolvedValue(mockDeleted);

      await deleteSubject(req, res);

      expect(Subject.softDelete).toHaveBeenCalledWith('id1');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        message: 'Subject deleted successfully',
      });
    });

    it('should return 404 when subject is not found', async () => {
      req.params = { id: 'nonexistent' };

      Subject.softDelete.mockResolvedValue(null);

      await deleteSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject not found',
      });
    });

    it('should return 404 on CastError (invalid ObjectId)', async () => {
      req.params = { id: 'bad-id' };

      Subject.softDelete.mockRejectedValue({ name: 'CastError' });

      await deleteSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Subject not found',
      });
    });

    it('should return 500 on unexpected error', async () => {
      req.params = { id: 'id1' };

      Subject.softDelete.mockRejectedValue(new Error('DB failure'));

      await deleteSubject(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Error deleting subject',
      });
    });
  });
});
