// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";         // ⭐ IMPORTANT
import fixtureRoutes from "./routes/fixtureRoutes.js";
import { startDailyScheduler } from "./services/dailyUpdateService.js";
import { startLiveService } from "./services/liveScoreService.js";
// import { startStandingsPoller } from "./services/standingsPollingService.js";

import paymentRoutes from "./routes/paymentRoutes.js";
import userRoutes from "./routes/userRoutes.js";


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
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes); // New Manual Payments

// ---------------------------------------------
// START: Mongo FIRST — then HTTP (fixes buffering timeouts on cold start)
// ---------------------------------------------
const MONGO_OPTIONS = {
  serverSelectionTimeoutMS: 45_000,
  socketTimeoutMS: 60_000,
  maxPoolSize: 10,
  retryWrites: true,
};

async function startServer() {
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
    await mongoose.connect(process.env.MONGO_URI, MONGO_OPTIONS);
    console.log("✅ MongoDB connected");

    startLiveService();
    startDailyScheduler();

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on port ${PORT} (Mongo ready before accept)`);
    });
  } catch (err) {
    console.error("❌ MongoDB connection failed — refusing to start HTTP:", err.message);
    process.exit(1);
  }
}

startServer();
