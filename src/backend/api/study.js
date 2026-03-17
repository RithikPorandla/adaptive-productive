import { Router } from "express";
import { getDb } from "../db/index.js";

const router = Router();
const userId = "default-user";

router.post("/sessions", (req, res) => {
  try {
    const db = getDb();
    const { task_id, duration_minutes } = req.body;
    const id = crypto.randomUUID();
    db.prepare(
      "INSERT INTO study_sessions (id, user_id, task_id, duration_minutes) VALUES (?, ?, ?, ?)"
    ).run(id, userId, task_id || null, duration_minutes || 25);
    const session = db.prepare("SELECT * FROM study_sessions WHERE id = ?").get(id);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/stats", (req, res) => {
  try {
    const db = getDb();
    const { from, to } = req.query;
    const fromDate = from || new Date().toISOString().slice(0, 10);
    const toDate = to || fromDate;

    const sessions = db.prepare(
      `SELECT * FROM study_sessions 
       WHERE user_id = ? AND date(completed_at) >= ? AND date(completed_at) <= ?
       ORDER BY completed_at DESC`
    ).all(userId, fromDate, toDate);

    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration_minutes, 0);

    res.json({
      sessions,
      totalMinutes,
      totalSessions: sessions.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const studyRouter = router;
