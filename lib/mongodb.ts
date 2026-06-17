// lib/mongodb.ts
import { MongoClient } from "mongodb";

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGO_URI || ""; // Default to empty string to avoid build crash
const options = {};

let client: MongoClient;
let clientPromise: Promise<MongoClient>;

if (!process.env.MONGO_URI) {
    console.warn('MONGO_URI is missing. Please ensure it is set in your Vercel/Render environment variables.');
    // Delay throwing so that some static pages can build if they don't use DB,
    // but if NextAuth awaits this, it will throw a clear error instead of a null crash.
    clientPromise = Promise.reject(new Error("MONGO_URI is not defined."));
} else {
    if (process.env.NODE_ENV === "development") {
        // In development mode, use a global variable so that the value
        // is preserved across module reloads caused by HMR (Hot Module Replacement).
        if (!global._mongoClientPromise) {
            client = new MongoClient(uri, options);
            global._mongoClientPromise = client.connect();
        }
        clientPromise = global._mongoClientPromise!;
    } else {
        // In production mode, it's best to not use a global variable.
        client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
}

// Export a module-scoped MongoClient promise. By doing this in a
// separate module, the client can be shared across functions.
export default clientPromise;
