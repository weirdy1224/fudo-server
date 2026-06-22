const mongoose = require('mongoose');

// Cache connection across serverless invocations to avoid exhausting
// the MongoDB Atlas connection pool on cold starts.
let cached = global._mongooseCache;
if (!cached) {
  cached = global._mongooseCache = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
    console.log(`✅ MongoDB Connected: ${cached.conn.connection.host}`);
  } catch (err) {
    cached.promise = null; // Allow retry on next invocation
    console.error('❌ MongoDB connection error:', err.message);
    throw err; // Let the calling handler return a 500 gracefully
  }

  return cached.conn;
};

module.exports = connectDB;
