import mongoose from 'mongoose';

const MONGODB_URI = process.env.DATABASE_URL!;

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

    cached.promise = mongoose
      .connect(MONGODB_URI!, opts)
      .then((mongoose) => {
        return mongoose;
      })
      .catch((error) => {
        // Reset so the next request can retry instead of replaying this failure forever
        cached.promise = null;
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }
  return cached.conn;
}

export default dbConnect;

/**
 * Returns the active MongoDB `Db` handle, non-nullable.
 * Safe to call anywhere `dbConnect()` has already run (i.e. inside any
 * `apiHandler`-wrapped route) — throws instead of silently returning
 * `undefined` if called before a connection exists.
 */
export function getDb() {
  const db = mongoose.connection.db;
  if (!db) {
    throw new Error('Database not connected — dbConnect() must run first.');
  }
  return db;
}
