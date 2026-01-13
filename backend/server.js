// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";         // ⭐ IMPORTANT
import fixtureRoutes from "./routes/fixtureRoutes.js";
// import "./services/live.js"; // <-- DISABLED OLD SERVICE
import { startLiveService } from "./services/liveScoreService.js";

import { startLineupPoller } from "./services/lineupPollingService.js";
import { startDailyScheduler } from "./services/dailyUpdateService.js";
import { startStatsPoller } from "./services/statsPollingService.js";
import { startStandingsPoller } from "./services/standingsPollingService.js";

import leagueRoutes from "./routes/leagueRoutes.js";
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

// ---------------------------------------------
// MONGO CONNECTION
// ---------------------------------------------
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    // startLiveService(); // 🚀 Start the global 60s poller (Scores + Events)
    // startLineupPoller(); // 🕵️ Start targeted lineup poller
    // startStatsPoller();  // 📊 Start statistics poller
    // startStandingsPoller(); // 🏆 Start active standings poller
    // startDailyScheduler(); // ⏰ Start daily fixture update
  })
  .catch((err) => console.error("❌ MongoDB connection error:", err.message));

// ---------------------------------------------
// ROUTES
// ---------------------------------------------
app.use("/api/fixtures", fixtureRoutes);
app.use("/api/leagues", leagueRoutes);
// app.use("/api/webhooks", webhookRoutes); // Webhooks disabled due to payment removal
app.use("/api/user", userRoutes);
app.use("/api/payment", paymentRoutes); // New Manual Payments


// Test route
app.get("/", (req, res) => {
  res.send("Backend running with CORS enabled");
});

// ---------------------------------------------
// START SERVER
// ---------------------------------------------
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
