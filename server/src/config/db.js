import mongoose from 'mongoose';

/**
 * Connects to MongoDB Atlas using the MONGODB_URI environment variable.
 * Exits the process if the connection fails — no point running without a DB.
 */
export async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`[db] connected to ${conn.connection.host}`);
  } catch (err) {
    console.error('[db] connection failed:', err.message);
    process.exit(1);
  }
}