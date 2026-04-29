const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const Student = require('../StudentModel');

let mongoServer;

// Setup: Start in-memory MongoDB before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Teardown: Close connection and stop MongoDB after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
  await Student.deleteMany({});
});

describe('StudentModel', () => {
  describe('Schema Validation', () => {
    it('should create a student with valid data', async () => {
      const studentData = {
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      };

      const student = await Student.create(studentData);

      expect(student.name).toBe(studentData.name);
      expect(student.studentId).toBe(studentData.studentId);
      expect(student.class).toBe(studentData.class);
      expect(student.age).toBe(studentData.age);
      expect(student.createdAt).toBeDefined();
      expect(student.updatedAt).toBeDefined();
      expect(student.isDeleted).toBe(false);
    });

    it('should require name field', async () => {
      const studentData = {
        studentId: 'STU001',
        class: '10A',
        age: 16,
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });

    it('should require studentId field', async () => {
      const studentData = {
        name: 'Jane Smith',
        class: '10A',
        age: 16,
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });

    it('should require class field', async () => {
      const studentData = {
        name: 'Jane Smith',
        studentId: 'STU001',
        age: 16,
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });

    it('should require age field', async () => {
      const studentData = {
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });

    it('should enforce unique studentId constraint', async () => {
      const studentData = {
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      };

      await Student.create(studentData);
      
      // Try to create another student with the same studentId
      const duplicateData = {
        name: 'John Doe',
        studentId: 'STU001', // Same studentId
        class: '10B',
        age: 17,
      };

      await expect(Student.create(duplicateData)).rejects.toThrow();
    });

    it('should trim whitespace from string fields', async () => {
      const studentData = {
        name: '  Jane Smith  ',
        studentId: '  STU001  ',
        class: '  10A  ',
        age: 16,
      };

      const student = await Student.create(studentData);

      expect(student.name).toBe('Jane Smith');
      expect(student.studentId).toBe('STU001');
      expect(student.class).toBe('10A');
    });
  });

  describe('Age Validation', () => {
    it('should accept positive integer ages', async () => {
      const validAges = [1, 5, 10, 15, 18, 25, 100];

      for (const age of validAges) {
        const student = await Student.create({
          name: 'Test Student',
          studentId: `STU${age}`,
          class: '10A',
          age: age,
        });
        expect(student.age).toBe(age);
        await Student.deleteMany({});
      }
    });

    it('should reject zero age', async () => {
      const studentData = {
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 0,
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });

    it('should reject negative ages', async () => {
      const invalidAges = [-1, -5, -10];

      for (const age of invalidAges) {
        await expect(
          Student.create({
            name: 'Test Student',
            studentId: 'STU001',
            class: '10A',
            age: age,
          })
        ).rejects.toThrow();
      }
    });

    it('should reject non-integer ages', async () => {
      const invalidAges = [1.5, 10.7, 15.99];

      for (const age of invalidAges) {
        await expect(
          Student.create({
            name: 'Test Student',
            studentId: 'STU001',
            class: '10A',
            age: age,
          })
        ).rejects.toThrow();
      }
    });

    it('should reject non-numeric ages', async () => {
      const studentData = {
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 'sixteen',
      };

      await expect(Student.create(studentData)).rejects.toThrow();
    });
  });

  describe('StudentId Uniqueness', () => {
    it('should allow different students with different studentIds', async () => {
      const student1 = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      const student2 = await Student.create({
        name: 'John Doe',
        studentId: 'STU002',
        class: '10B',
        age: 17,
      });

      expect(student1.studentId).toBe('STU001');
      expect(student2.studentId).toBe('STU002');
    });

    it('should have unique index on studentId', async () => {
      const indexes = Student.schema.indexes();
      const studentIdIndex = indexes.find(
        (index) => index[0].studentId !== undefined
      );

      expect(studentIdIndex).toBeDefined();
      expect(studentIdIndex[1].unique).toBe(true);
    });
  });

  describe('BaseModel Integration', () => {
    it('should include BaseModel fields', async () => {
      const student = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      expect(student.createdAt).toBeInstanceOf(Date);
      expect(student.updatedAt).toBeInstanceOf(Date);
      expect(student.isDeleted).toBe(false);
    });

    it('should update updatedAt timestamp on modification', async () => {
      const student = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      const originalUpdatedAt = student.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise((resolve) => setTimeout(resolve, 10));

      student.age = 17;
      await student.save();

      expect(student.updatedAt.getTime()).toBeGreaterThan(
        originalUpdatedAt.getTime()
      );
    });

    it('should support soft delete', async () => {
      const student = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      const deletedStudent = await Student.softDelete(student._id);

      expect(deletedStudent.isDeleted).toBe(true);
      expect(deletedStudent.name).toBe('Jane Smith');
      expect(deletedStudent.studentId).toBe('STU001');
      expect(deletedStudent.class).toBe('10A');
      expect(deletedStudent.age).toBe(16);
    });

    it('should filter out soft-deleted students in queries', async () => {
      const student1 = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      const student2 = await Student.create({
        name: 'John Doe',
        studentId: 'STU002',
        class: '10B',
        age: 17,
      });

      // Soft delete student1
      await Student.softDelete(student1._id);

      // Query should only return non-deleted students
      const students = await Student.find({});
      expect(students.length).toBe(1);
      expect(students[0].studentId).toBe('STU002');
    });

    it('should allow querying soft-deleted students explicitly', async () => {
      const student = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      await Student.softDelete(student._id);

      // Explicitly query for deleted students
      const deletedStudents = await Student.find({ isDeleted: true });
      expect(deletedStudents.length).toBe(1);
      expect(deletedStudents[0].studentId).toBe('STU001');
    });
  });

  describe('Update Operations', () => {
    it('should allow updating student fields', async () => {
      const student = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      student.name = 'Jane Doe';
      student.class = '11A';
      student.age = 17;
      await student.save();

      const updatedStudent = await Student.findById(student._id);
      expect(updatedStudent.name).toBe('Jane Doe');
      expect(updatedStudent.class).toBe('11A');
      expect(updatedStudent.age).toBe(17);
    });

    it('should not allow updating studentId to duplicate value', async () => {
      const student1 = await Student.create({
        name: 'Jane Smith',
        studentId: 'STU001',
        class: '10A',
        age: 16,
      });

      const student2 = await Student.create({
        name: 'John Doe',
        studentId: 'STU002',
        class: '10B',
        age: 17,
      });

      student2.studentId = 'STU001'; // Try to use student1's ID
      await expect(student2.save()).rejects.toThrow();
    });
  });
});
