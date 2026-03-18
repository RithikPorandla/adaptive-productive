/**
 * Health check endpoint
 *
 * Used by load balancers, monitoring, and to verify the API is up.
 */

import { Router } from "express";
import { getDb } from "../db/index.js";

export const healthRouter = Router();

healthRouter.get("/", (req, res) => {
  try {
    const db = getDb();
    db.prepare("SELECT 1").run();
    res.json({
      status: "ok",
      service: "adaptive-productive-api",
      timestamp: new Date().toISOString(),
      db: "connected",
    });
  } catch (err) {
    res.status(503).json({
      status: "error",
      db: "disconnected",
      error: err.message,
    });
  }
});
