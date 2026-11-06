import mongoose from 'mongoose';

/**
 * Connect to MongoDB with connection pooling and event listeners.
 */
const connectDB = async () => {
  const mongoURI = process.env.MONGO_URI;

  if (!mongoURI) {
    console.warn('⚠️  [MongoDB] Warning: MONGO_URI is not set in environment variables.');
    return;
  }

  try {
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000, // Fail fast after 5s if MongoDB instance is unreachable
    });

    console.log(`✅ [MongoDB] Connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ [MongoDB] Connection failure: ${error.message}`);
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  [MongoDB] Disconnected from database.');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 [MongoDB] Reconnected to database.');
});

export default connectDB;
