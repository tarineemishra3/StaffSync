const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/staffsync';
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[Database] MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.warn(`[Database Warning] Could not connect to MongoDB: ${error.message}`);
    console.warn('[Database Warning] Set a valid MONGODB_URI in server/.env (e.g. MongoDB Atlas URI) for persistence.');
  }
};

module.exports = connectDB;
