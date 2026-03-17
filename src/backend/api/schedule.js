import { Router } from "express";
import { getDb } from "../db/index.js";

const router = Router();
const userId = "default-user";

router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { day } = req.query;
    let sql = "SELECT * FROM schedule_items WHERE user_id = ?";
    const params = [userId];
    if (day !== undefined) {
      sql += " AND day_of_week = ?";
      params.push(parseInt(day, 10));
    }
    sql += " ORDER BY day_of_week, start_time";
    const items = db.prepare(sql).all(...params);
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  try {
    const db = getDb();
    const { title, day_of_week, start_time, end_time, location, color } = req.body;
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO schedule_items (id, user_id, title, day_of_week, start_time, end_time, location, color)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(id, userId, title || "Event", day_of_week ?? 0, start_time || "09:00", end_time || "10:00", location || null, color || null);
    const item = db.prepare("SELECT * FROM schedule_items WHERE id = ?").get(id);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = db.prepare("DELETE FROM schedule_items WHERE id = ? AND user_id = ?").run(id, userId);
    if (result.changes === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const scheduleRouter = router;
