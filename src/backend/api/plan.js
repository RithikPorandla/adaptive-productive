import { Router } from "express";
import { getDb } from "../db/index.js";

const router = Router();
const userId = "default-user";

/**
 * GET /api/plan/today
 * Returns today's plan: schedule items + tasks for the given date.
 * Day 0=Sunday, 1=Monday, ... 6=Saturday
 */
router.get("/today", (req, res) => {
  try {
    const db = getDb();
    const date = req.query.date || new Date().toISOString().slice(0, 10);
    const d = new Date(date);
    const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon, ...

    const schedule = db.prepare(
      "SELECT * FROM schedule_items WHERE user_id = ? AND day_of_week = ? ORDER BY start_time"
    ).all(userId, dayOfWeek);

    const tasks = db.prepare(
      "SELECT * FROM tasks WHERE user_id = ? AND due_date = ? AND completed = 0 ORDER BY created_at"
    ).all(userId, date);

    const completedTasks = db.prepare(
      "SELECT * FROM tasks WHERE user_id = ? AND due_date = ? AND completed = 1 ORDER BY updated_at DESC"
    ).all(userId, date);

    res.json({
      date,
      dayOfWeek,
      schedule,
      tasks,
      completedTasks,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const planRouter = router;
