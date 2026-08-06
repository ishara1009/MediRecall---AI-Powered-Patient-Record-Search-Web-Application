const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

const primaryUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/medirecall';
const fallbackUri = 'mongodb://127.0.0.1:27017/medirecall';

const connectDB = async () => {
  const uris = [primaryUri, fallbackUri].filter((uri, index, arr) => arr.indexOf(uri) === index);

  for (const uri of uris) {
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 8000,
      });
      console.log(`MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (error) {
      console.warn(`MongoDB connection failed for ${uri}: ${error.message}`);
    }
  }

  throw new Error('MongoDB connection failed. Check your MONGODB_URI or start a local MongoDB instance.');
};

module.exports = { connect: connectDB };
