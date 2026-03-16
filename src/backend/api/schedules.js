import { Router } from "express";
import { getDb } from "../db/index.js";

export const schedulesRouter = Router();

// POST /api/schedules
schedulesRouter.post("/", (req, res) => {
  const { user_id, title, day_of_week, start_time, end_time, location, color } = req.body;
  if (!user_id || !title || day_of_week === undefined || !start_time || !end_time) {
    return res.status(400).json({ error: "user_id, title, day_of_week, start_time, and end_time are required" });
  }
  try {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO schedules (user_id, title, day_of_week, start_time, end_time, location, color)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      )
      .run(user_id, title, day_of_week, start_time, end_time, location ?? null, color ?? null);
    const schedule = db.prepare("SELECT * FROM schedules WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(schedule);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/schedules?user_id=X&day_of_week=Y
schedulesRouter.get("/", (req, res) => {
  const { user_id, day_of_week } = req.query;
  let sql = "SELECT * FROM schedules WHERE 1=1";
  const params = [];

  if (user_id) { sql += " AND user_id = ?"; params.push(user_id); }
  if (day_of_week !== undefined) { sql += " AND day_of_week = ?"; params.push(day_of_week); }
  sql += " ORDER BY start_time ASC";

  const schedules = getDb().prepare(sql).all(...params);
  res.json(schedules);
});

// GET /api/schedules/:id
schedulesRouter.get("/:id", (req, res) => {
  const schedule = getDb().prepare("SELECT * FROM schedules WHERE id = ?").get(req.params.id);
  if (!schedule) return res.status(404).json({ error: "Schedule not found" });
  res.json(schedule);
});

// PUT /api/schedules/:id
schedulesRouter.put("/:id", (req, res) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM schedules WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Schedule not found" });

  const { title, day_of_week, start_time, end_time, location, color } = req.body;

  db.prepare(
    `UPDATE schedules
     SET title = ?, day_of_week = ?, start_time = ?, end_time = ?,
         location = ?, color = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    day_of_week ?? existing.day_of_week,
    start_time ?? existing.start_time,
    end_time ?? existing.end_time,
    location ?? existing.location,
    color ?? existing.color,
    req.params.id
  );

  const schedule = db.prepare("SELECT * FROM schedules WHERE id = ?").get(req.params.id);
  res.json(schedule);
});

// DELETE /api/schedules/:id
schedulesRouter.delete("/:id", (req, res) => {
  const result = getDb().prepare("DELETE FROM schedules WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Schedule not found" });
  res.json({ deleted: true });
});
