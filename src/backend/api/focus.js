import { Router } from "express";
import { getDb } from "../db/index.js";

export const focusRouter = Router();

// POST /api/focus — start a focus session (Pomodoro or custom)
focusRouter.post("/", (req, res) => {
  const { user_id, task_id, duration_minutes } = req.body;
  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  try {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO focus_sessions (user_id, task_id, duration_minutes)
         VALUES (?, ?, ?)`
      )
      .run(user_id, task_id ?? null, duration_minutes ?? 25);
    const session = db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/focus?user_id=X
focusRouter.get("/", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  const sessions = getDb()
    .prepare(
      `SELECT fs.*, t.title as task_title
       FROM focus_sessions fs
       LEFT JOIN tasks t ON fs.task_id = t.id
       WHERE fs.user_id = ?
       ORDER BY fs.started_at DESC`
    )
    .all(user_id);
  res.json(sessions);
});

// PUT /api/focus/:id/complete — end a focus session
focusRouter.put("/:id/complete", (req, res) => {
  const db = getDb();
  const session = db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.status !== "active") {
    return res.status(400).json({ error: "Session is already " + session.status });
  }

  db.prepare(
    `UPDATE focus_sessions SET status = 'completed', ended_at = datetime('now') WHERE id = ?`
  ).run(req.params.id);

  const updated = db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get(req.params.id);
  res.json(updated);
});

// PUT /api/focus/:id/cancel
focusRouter.put("/:id/cancel", (req, res) => {
  const db = getDb();
  const session = db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get(req.params.id);
  if (!session) return res.status(404).json({ error: "Session not found" });
  if (session.status !== "active") {
    return res.status(400).json({ error: "Session is already " + session.status });
  }

  db.prepare(
    `UPDATE focus_sessions SET status = 'cancelled', ended_at = datetime('now') WHERE id = ?`
  ).run(req.params.id);

  const updated = db.prepare("SELECT * FROM focus_sessions WHERE id = ?").get(req.params.id);
  res.json(updated);
});
