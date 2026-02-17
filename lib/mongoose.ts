import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGO_URI;

// Check removed from top-level to allow build without env vars

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if (!cached) {
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!MONGODB_URI) {
        throw new Error(
            'Please define the MONGO_URI environment variable inside .env.local'
        );
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log("Connecting to MongoDB via Mongoose...");
        cached.promise = mongoose.connect(MONGODB_URI as string, opts).then((mongoose) => {
            console.log("Mongoose Connected!");
            return mongoose;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("Mongoose connection failed:", e);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
