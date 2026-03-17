import { Router } from "express";
import { getDb } from "../db/index.js";

const router = Router();
const userId = "default-user"; // MVP: single user; OAuth later

router.get("/", (req, res) => {
  try {
    const db = getDb();
    const { due_date } = req.query;
    let sql = "SELECT * FROM tasks WHERE user_id = ?";
    const params = [userId];
    if (due_date) {
      sql += " AND due_date = ?";
      params.push(due_date);
    }
    sql += " ORDER BY due_date ASC, created_at ASC";
    const tasks = db.prepare(sql).all(...params);
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/", (req, res) => {
  try {
    const db = getDb();
    const { title, due_date, estimated_minutes, parent_task_id } = req.body;
    const id = crypto.randomUUID();
    db.prepare(
      `INSERT INTO tasks (id, user_id, title, due_date, estimated_minutes, parent_task_id)
       VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, userId, title || "Untitled", due_date || null, estimated_minutes || null, parent_task_id || null);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch("/:id", (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const { title, due_date, estimated_minutes, completed } = req.body;
    const updates = [];
    const params = [];
    if (title !== undefined) { updates.push("title = ?"); params.push(title); }
    if (due_date !== undefined) { updates.push("due_date = ?"); params.push(due_date); }
    if (estimated_minutes !== undefined) { updates.push("estimated_minutes = ?"); params.push(estimated_minutes); }
    if (completed !== undefined) { updates.push("completed = ?"); params.push(completed ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ error: "No updates" });
    updates.push("updated_at = datetime('now')");
    params.push(id);
    db.prepare(`UPDATE tasks SET ${updates.join(", ")} WHERE id = ? AND user_id = ?`).run(...params, userId);
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(id);
    if (!task) return res.status(404).json({ error: "Not found" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/:id", (req, res) => {
  try {
    const db = getDb();
    const { id } = req.params;
    const result = db.prepare("DELETE FROM tasks WHERE id = ? AND user_id = ?").run(id, userId);
    if (result.changes === 0) return res.status(404).json({ error: "Not found" });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export const tasksRouter = router;
