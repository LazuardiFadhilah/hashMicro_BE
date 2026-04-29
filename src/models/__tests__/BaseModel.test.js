const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const createBaseSchema = require('../BaseModel');

/**
 * Test suite for BaseModel functionality
 * Tests Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

describe('BaseModel', () => {
  let mongoServer;
  let TestModel;

  // Set up in-memory MongoDB and test model before all tests
  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);

    // Create a test model that extends BaseModel
    const baseSchema = createBaseSchema();
    const testSchema = new mongoose.Schema({
      name: { type: String, required: true },
      value: { type: Number },
    });

    // Add base schema fields to test schema
    testSchema.add(baseSchema);

    TestModel = mongoose.model('TestModel', testSchema);
  });

  // Clean up after all tests
  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  // Clear test data before each test
  beforeEach(async () => {
    await TestModel.deleteMany({});
  });

  describe('Timestamp fields (Requirement 3.1, 3.2)', () => {
    it('should automatically add createdAt and updatedAt fields', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });

      expect(doc.createdAt).toBeDefined();
      expect(doc.createdAt).toBeInstanceOf(Date);
      expect(doc.updatedAt).toBeDefined();
      expect(doc.updatedAt).toBeInstanceOf(Date);
    });

    it('should update updatedAt when document is modified', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });
      const originalUpdatedAt = doc.updatedAt;

      // Wait a bit to ensure timestamp difference
      await new Promise(resolve => setTimeout(resolve, 10));

      doc.value = 100;
      await doc.save();

      expect(doc.updatedAt.getTime()).toBeGreaterThan(originalUpdatedAt.getTime());
    });
  });

  describe('isDeleted field (Requirement 3.1)', () => {
    it('should have isDeleted field with default value false', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });

      expect(doc.isDeleted).toBeDefined();
      expect(doc.isDeleted).toBe(false);
    });
  });

  describe('Soft delete method (Requirements 3.3, 3.4)', () => {
    it('should set isDeleted to true without removing the record', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });
      const docId = doc._id;

      // Perform soft delete
      const deletedDoc = await TestModel.softDelete(docId);

      expect(deletedDoc).not.toBeNull();
      expect(deletedDoc.isDeleted).toBe(true);
      expect(deletedDoc.name).toBe('Test');
      expect(deletedDoc.value).toBe(42);

      // Verify record still exists in database (bypass query middleware)
      const rawDoc = await TestModel.findOne({ _id: docId, isDeleted: true });
      expect(rawDoc).not.toBeNull();
      expect(rawDoc.isDeleted).toBe(true);
    });

    it('should preserve all other fields when soft deleting', async () => {
      const doc = await TestModel.create({ name: 'Important Data', value: 999 });
      const originalCreatedAt = doc.createdAt;
      const docId = doc._id;

      await TestModel.softDelete(docId);

      // Query with isDeleted explicitly to bypass middleware
      const deletedDoc = await TestModel.findOne({ _id: docId, isDeleted: true });

      expect(deletedDoc.name).toBe('Important Data');
      expect(deletedDoc.value).toBe(999);
      expect(deletedDoc.createdAt.getTime()).toBe(originalCreatedAt.getTime());
    });

    it('should return null when soft deleting non-existent record', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await TestModel.softDelete(fakeId);

      expect(result).toBeNull();
    });
  });

  describe('Query middleware for soft delete filtering (Requirement 3.5)', () => {
    it('should automatically exclude soft-deleted records from find queries', async () => {
      // Create multiple records
      const doc1 = await TestModel.create({ name: 'Active 1', value: 1 });
      const doc2 = await TestModel.create({ name: 'Active 2', value: 2 });
      const doc3 = await TestModel.create({ name: 'To Delete', value: 3 });

      // Soft delete one record
      await TestModel.softDelete(doc3._id);

      // Query all records (should exclude soft-deleted)
      const results = await TestModel.find({});

      expect(results).toHaveLength(2);
      expect(results.map(r => r.name)).toContain('Active 1');
      expect(results.map(r => r.name)).toContain('Active 2');
      expect(results.map(r => r.name)).not.toContain('To Delete');
    });

    it('should automatically exclude soft-deleted records from findOne queries', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });
      await TestModel.softDelete(doc._id);

      const result = await TestModel.findOne({ name: 'Test' });

      expect(result).toBeNull();
    });

    it('should automatically exclude soft-deleted records from findById queries', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });
      const docId = doc._id;

      await TestModel.softDelete(docId);

      const result = await TestModel.findById(docId);

      expect(result).toBeNull();
    });

    it('should allow explicit queries for soft-deleted records', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });
      await TestModel.softDelete(doc._id);

      // Explicitly query for deleted records
      const deletedRecords = await TestModel.find({ isDeleted: true });

      expect(deletedRecords).toHaveLength(1);
      expect(deletedRecords[0].name).toBe('Test');
    });

    it('should return both active and deleted records when isDeleted is explicitly queried', async () => {
      await TestModel.create({ name: 'Active', value: 1 });
      const doc2 = await TestModel.create({ name: 'Deleted', value: 2 });
      await TestModel.softDelete(doc2._id);

      // Query active records
      const activeRecords = await TestModel.find({ isDeleted: false });
      expect(activeRecords).toHaveLength(1);
      expect(activeRecords[0].name).toBe('Active');

      // Query deleted records
      const deletedRecords = await TestModel.find({ isDeleted: true });
      expect(deletedRecords).toHaveLength(1);
      expect(deletedRecords[0].name).toBe('Deleted');

      // Total should be 2
      expect(activeRecords.length + deletedRecords.length).toBe(2);
    });
  });

  describe('Integration tests', () => {
    it('should work correctly with multiple soft deletes', async () => {
      // Create 5 records
      const docs = await TestModel.create([
        { name: 'Doc 1', value: 1 },
        { name: 'Doc 2', value: 2 },
        { name: 'Doc 3', value: 3 },
        { name: 'Doc 4', value: 4 },
        { name: 'Doc 5', value: 5 },
      ]);

      // Soft delete 3 of them
      await TestModel.softDelete(docs[1]._id);
      await TestModel.softDelete(docs[2]._id);
      await TestModel.softDelete(docs[4]._id);

      // Query active records
      const activeRecords = await TestModel.find({});
      expect(activeRecords).toHaveLength(2);
      expect(activeRecords.map(r => r.name)).toContain('Doc 1');
      expect(activeRecords.map(r => r.name)).toContain('Doc 4');

      // Query deleted records
      const deletedRecords = await TestModel.find({ isDeleted: true });
      expect(deletedRecords).toHaveLength(3);
    });

    it('should maintain soft delete state across updates', async () => {
      const doc = await TestModel.create({ name: 'Test', value: 42 });
      await TestModel.softDelete(doc._id);

      // Update the soft-deleted record
      await TestModel.findOneAndUpdate(
        { _id: doc._id, isDeleted: true },
        { value: 100 },
        { new: true }
      );

      // Verify it's still soft-deleted
      const updatedDoc = await TestModel.findOne({ _id: doc._id, isDeleted: true });
      expect(updatedDoc.isDeleted).toBe(true);
      expect(updatedDoc.value).toBe(100);

      // Verify it's still excluded from normal queries
      const normalQuery = await TestModel.findById(doc._id);
      expect(normalQuery).toBeNull();
    });
  });
});
