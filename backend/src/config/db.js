import mongoose from 'mongoose';

/**
 * Connect to MongoDB with connection pooling and event listeners.
 * Gracefully falls back to local MongoDB if remote Atlas is unreachable or IP blocked.
 */
const connectDB = async () => {
  const primaryURI =
    process.env.MONGODB_URI ||
    process.env.MONGO_URI ||
    'mongodb://127.0.0.1:27017/hirenex';
  const fallbackURI = 'mongodb://127.0.0.1:27017/hirenex';

  try {
    const conn = await mongoose.connect(primaryURI, {
      serverSelectionTimeoutMS: 5000, // Fail fast after 5s if primary instance is unreachable
    });

    console.log(`✅ [MongoDB] Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.warn(`⚠️  [MongoDB] Primary connection failure: ${error.message}`);

    // If primary was a remote cluster and it failed, try local MongoDB fallback
    if (primaryURI !== fallbackURI) {
      console.log('🔄 [MongoDB] Attempting fallback to local MongoDB instance...');
      try {
        const fallbackConn = await mongoose.connect(fallbackURI, {
          serverSelectionTimeoutMS: 3000,
        });
        console.log(`✅ [MongoDB] Connected via local fallback: ${fallbackConn.connection.host}`);
        return fallbackConn;
      } catch (fallbackError) {
        console.error(`❌ [MongoDB] Local fallback also failed: ${fallbackError.message}`);
      }
    }

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
