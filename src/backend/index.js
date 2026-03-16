/**
 * Adaptive Productive - Backend API
 *
 * Entry point. Loads env, connects DB, mounts routes, starts server.
 */

import "dotenv/config";
import express from "express";
import cors from "cors";
import { initDb } from "./db/index.js";
import { healthRouter } from "./api/health.js";

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/health", healthRouter);

// Initialize DB and start
initDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start:", err);
    process.exit(1);
  });
