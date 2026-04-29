const mongoose = require('mongoose');

/**
 * BaseModel - Abstract base schema providing common fields and soft delete functionality.
 * 
 * This schema should be extended by all models in the system to provide:
 * - Automatic timestamp management (createdAt, updatedAt)
 * - Soft delete functionality (isDeleted field)
 * - Automatic filtering of soft-deleted records in queries
 * 
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 * 
 * @example
 * // How to use BaseModel in other models:
 * const mongoose = require('mongoose');
 * const createBaseSchema = require('./BaseModel');
 * 
 * // Create your model schema
 * const userSchema = new mongoose.Schema({
 *   name: { type: String, required: true },
 *   email: { type: String, required: true, unique: true }
 * });
 * 
 * // Add BaseModel fields and functionality
 * const baseSchema = createBaseSchema();
 * userSchema.add(baseSchema);
 * 
 * // Create the model
 * const User = mongoose.model('User', userSchema);
 * 
 * // Usage:
 * // - Create: const user = await User.create({ name: 'John', email: 'john@example.com' });
 * // - Soft delete: await User.softDelete(userId);
 * // - Query (auto-filters deleted): const users = await User.find({});
 * // - Query deleted: const deleted = await User.find({ isDeleted: true });
 */

/**
 * Creates a base schema with common fields and soft delete functionality.
 * @returns {mongoose.Schema} Base schema to be extended by other models
 */
function createBaseSchema() {
  const baseSchema = new mongoose.Schema(
    {
      // Soft delete flag - when true, record is logically deleted but preserved in database
      isDeleted: {
        type: Boolean,
        default: false,
        index: true, // Index for efficient filtering of deleted records
      },
    },
    {
      // Automatically manage createdAt and updatedAt timestamps
      timestamps: true,
      // Ensure virtuals are included when converting to JSON
      toJSON: { virtuals: true },
      toObject: { virtuals: true },
    }
  );

  /**
   * Query middleware to automatically filter out soft-deleted records.
   * Applies to all find operations (find, findOne, findById, etc.)
   * 
   * Requirement 3.5: Automatically exclude records where isDeleted is true
   */
  baseSchema.pre(/^find/, function (next) {
    // Only filter if isDeleted hasn't been explicitly set in the query
    if (this.getQuery().isDeleted === undefined) {
      this.where({ isDeleted: { $ne: true } });
    }
    next();
  });

  /**
   * Static method to perform soft delete on a record.
   * Sets isDeleted to true without removing the record from the database.
   * 
   * Requirements 3.3, 3.4: Soft delete sets isDeleted to true and preserves the record
   * 
   * @param {string|mongoose.Types.ObjectId} id - The ID of the record to soft delete
   * @returns {Promise<Document|null>} The updated document or null if not found
   */
  baseSchema.statics.softDelete = async function (id) {
    return this.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true } // Return the updated document
    );
  };

  return baseSchema;
}

module.exports = createBaseSchema;
