import mongoose from 'mongoose';

const MONGODB_URI =
  process.env.DATABASE_URL || 'mongodb://localhost:27017/alpha-cms';

/**
 * Global interface for Mongoose caching in Next.js development
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Access the global object safely
const globalWithMongoose = global as unknown as { mongoose: MongooseCache };

let cached = globalWithMongoose.mongoose;

if (!cached) {
  cached = globalWithMongoose.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI!, opts).then((mongoose) => {
      return mongoose;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
