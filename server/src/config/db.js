const mongoose = require('mongoose');

/**
 * Safely masks MongoDB connection URI for logging (hides username/password).
 */
const maskURI = (uri) => {
  if (!uri) return 'undefined';
  return uri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@');
};

/**
 * Connects to MongoDB using the configured MONGODB_URI or a provided URI.
 */
const connectDB = async (customUri) => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = customUri || process.env.MONGODB_URI || 'mongodb://localhost:27017/staffsync';

  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host} (${maskURI(uri)})`);
    return conn;
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB at ${maskURI(uri)}: ${error.message}`);
    console.warn('[Database Warning] Set a valid MONGODB_URI in server/.env (e.g. MongoDB Atlas cluster URI) for persistent cloud storage.');
    return null;
  }
};

/**
 * Disconnects from MongoDB cleanly (useful for test teardown and graceful shutdown).
 */
const disconnectDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
};

module.exports = { connectDB, disconnectDB };
