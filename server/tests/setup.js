const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

let mongoServer;

/**
 * Connect to the in-memory database before running tests.
 */
const connectTestDB = async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
};

/**
 * Clear all collections between test cases for isolation.
 */
const clearTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
};

/**
 * Disconnect and stop the in-memory database after tests complete.
 */
const closeTestDB = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = {
  connectTestDB,
  clearTestDB,
  closeTestDB
};
