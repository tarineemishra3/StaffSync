const path = require('path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const localBinaryPath = path.join(__dirname, '../node_modules/.cache/mongodb-memory-server/mongod-x64-win32-7.0.24.exe');
if (require('fs').existsSync(localBinaryPath)) {
  process.env.MONGOMS_SYSTEM_BINARY = localBinaryPath;
}

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
