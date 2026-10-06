const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI;

    if (mongoUri && mongoUri.trim() !== '') {
      console.log('Connecting to configured MongoDB URI...');
      const conn = await mongoose.connect(mongoUri);
      console.log(` MongoDB Connected: ${conn.connection.host}`);
      return conn;
    }

    // Try connecting to default local MongoDB instance first
    try {
      const localUri = 'mongodb://127.0.0.1:27017/teamflow';
      const conn = await mongoose.connect(localUri, { serverSelectionTimeoutMS: 2500 });
      console.log(` Local MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (localErr) {
      console.log(' Local MongoDB service not available. Starting in-memory MongoDB instance for zero-friction local development...');
    }

    // Fallback: Start in-memory MongoDB server
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const memoryUri = memoryServer.getUri();
    const conn = await mongoose.connect(memoryUri);
    console.log(` In-Memory MongoDB Server running at: ${memoryUri}`);
    return conn;
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
