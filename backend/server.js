// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import {
  applyMongoDnsHints,
  getMongoClientOptions,
} from "./mongoConnectOptions.js";
import cors from "cors";         // ⭐ IMPORTANT
import fixtureRoutes from "./routes/fixtureRoutes.js";
import { startDailyScheduler } from "./services/dailyUpdateService.js";
import { startLiveService } from "./services/liveScoreService.js";
// import { startStandingsPoller } from "./services/standingsPollingService.js";


dotenv.config();

const app = express();

// ⭐ Enable CORS for frontend
app.use(cors());

// Body parser
app.use(express.json());

// ⏱️ Request Timer Middleware
app.use((req, res, next) => {
  const start = Date.now();
  console.log(`➡️ [REQ] ${req.method} ${req.url}`);

  res.on("finish", () => {
    const duration = Date.now() - start;
    console.log(`⬅️ [RES] ${req.method} ${req.url} took ${duration}ms`);
  });

  next();
});

const PORT = process.env.PORT || 5000;

// Test route (no DB — useful for process-up checks)
app.get("/", (req, res) => {
  res.send("Backend running with CORS enabled");
});

// All /api/* needs a live Mongo connection (must run BEFORE route handlers)
app.use("/api", (req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    return res.status(503).json({ error: "Database temporarily unavailable" });
  }
  next();
});

// ---------------------------------------------
// ROUTES
// ---------------------------------------------
app.use("/api/fixtures", fixtureRoutes);
// app.use("/api/webhooks", webhookRoutes); // Webhooks disabled due to payment removal

// ---------------------------------------------
// START: Mongo FIRST — then HTTP (fixes buffering timeouts on cold start)
// ---------------------------------------------
/**
 * Atlas + Node 20+ OpenSSL: TLS "alert number 80" often comes from happy-eyeballs / IP-family
 * selection (IPv4 vs IPv6). Use autoSelectFamily: false (MongoDB driver / community fix).
 * Avoid `family: 4` here — it has caused TLS internal_error on some PaaS→Atlas paths.
 */
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 45_000,
  socketTimeoutMS: 60_000,
  maxPoolSize: 10,
  retryWrites: true,
  autoSelectFamily: false,
};

const MONGO_CONNECT_MAX_ATTEMPTS = Math.max(
  1,
  Number(process.env.MONGO_CONNECT_MAX_ATTEMPTS) || 12
);
const MONGO_CONNECT_RETRY_DELAY_MS = Math.max(
  1000,
  Number(process.env.MONGO_CONNECT_RETRY_DELAY_MS) || 5000
);

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function connectMongoWithRetry(uri) {
  let lastErr;
  for (let attempt = 1; attempt <= MONGO_CONNECT_MAX_ATTEMPTS; attempt++) {
    try {
      if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
      }
    } catch {
      // ignore cleanup errors
    }

    try {
      await mongoose.connect(uri, MONGO_OPTIONS);
      if (attempt > 1) {
        console.log(`✅ MongoDB connected (attempt ${attempt}/${MONGO_CONNECT_MAX_ATTEMPTS})`);
      }
      return;
    } catch (err) {
      lastErr = err;
      console.warn(
        `⚠️ Mongo connect attempt ${attempt}/${MONGO_CONNECT_MAX_ATTEMPTS}: ${err.message}`
      );
      if (attempt < MONGO_CONNECT_MAX_ATTEMPTS) {
        await sleep(MONGO_CONNECT_RETRY_DELAY_MS);
      }
    }
  }
  throw lastErr;
}

async function startServer() {
  applyMongoDnsHints();

  if (!process.env.MONGO_URI) {
    console.error("❌ MONGO_URI is not set");
    process.exit(1);
  }

  mongoose.connection.on("error", (err) => {
    console.error("❌ MongoDB driver error:", err.message);
  });
  mongoose.connection.on("disconnected", () => {
    console.warn("⚠️ MongoDB disconnected");
  });

  try {
    await connectMongoWithRetry(process.env.MONGO_URI);
    console.log("✅ MongoDB connected");

    startLiveService();
    startDailyScheduler();

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server listening on port ${PORT} (Mongo ready before accept)`);
    });
  } catch (err) {
    console.error(
      "❌ MongoDB connection failed after all retries (HTTP not started):",
      err.message
    );
    process.exit(1);
  }
}

startServer();
