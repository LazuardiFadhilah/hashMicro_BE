const mongoose = require('mongoose');

/**
 * Database connection module with connection caching for serverless optimization.
 * This pattern reuses existing connections to avoid cold start penalties in Vercel.
 */

// Cache the mongoose connection globally to persist across serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

/**
 * Connect to MongoDB with connection reuse for serverless environments.
 * @returns {Promise<typeof mongoose>} Mongoose connection instance
 */
async function connectDB() {
  // Return cached connection if it exists
  if (cached.conn) {
    return cached.conn;
  }

  // If no connection promise exists, create one
  if (!cached.promise) {
    const opts = {
      bufferCommands: false, // Disable buffering for serverless (fail fast if not connected)
    };

    // Validate that MONGODB_URI is provided
    if (!process.env.MONGODB_URI) {
      throw new Error('MONGODB_URI environment variable is not defined');
    }

    // Create connection promise
    cached.promise = mongoose.connect(process.env.MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('MongoDB connected successfully');
        return mongoose;
      })
      .catch((error) => {
        // Clear the promise on error so next call will retry
        cached.promise = null;
        console.error('MongoDB connection error:', error.message);
        throw error;
      });
  }

  // Wait for the connection promise to resolve
  cached.conn = await cached.promise;
  return cached.conn;
}

module.exports = connectDB;
