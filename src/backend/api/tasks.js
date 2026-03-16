import { Router } from "express";
import { getDb } from "../db/index.js";

export const tasksRouter = Router();

// POST /api/tasks
tasksRouter.post("/", (req, res) => {
  const { user_id, title, description, due_date, estimated_minutes, status, priority, parent_task_id, position } = req.body;
  if (!user_id || !title) {
    return res.status(400).json({ error: "user_id and title are required" });
  }
  try {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO tasks (user_id, title, description, due_date, estimated_minutes, status, priority, parent_task_id, position)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        user_id,
        title,
        description ?? null,
        due_date ?? null,
        estimated_minutes ?? null,
        status ?? "pending",
        priority ?? "medium",
        parent_task_id ?? null,
        position ?? 0
      );
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks?user_id=X&status=Y
tasksRouter.get("/", (req, res) => {
  const { user_id, status, parent_task_id } = req.query;
  let sql = "SELECT * FROM tasks WHERE 1=1";
  const params = [];

  if (user_id) { sql += " AND user_id = ?"; params.push(user_id); }
  if (status) { sql += " AND status = ?"; params.push(status); }
  if (parent_task_id !== undefined) {
    if (parent_task_id === "null") {
      sql += " AND parent_task_id IS NULL";
    } else {
      sql += " AND parent_task_id = ?";
      params.push(parent_task_id);
    }
  }
  sql += " ORDER BY position ASC, created_at DESC";

  const tasks = getDb().prepare(sql).all(...params);
  res.json(tasks);
});

// GET /api/tasks/:id (includes subtasks)
tasksRouter.get("/:id", (req, res) => {
  const db = getDb();
  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!task) return res.status(404).json({ error: "Task not found" });

  const subtasks = db
    .prepare("SELECT * FROM tasks WHERE parent_task_id = ? ORDER BY position ASC")
    .all(req.params.id);

  res.json({ ...task, subtasks });
});

// PUT /api/tasks/:id
tasksRouter.put("/:id", (req, res) => {
  const db = getDb();
  const existing = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "Task not found" });

  const { title, description, due_date, estimated_minutes, status, priority, position } = req.body;

  db.prepare(
    `UPDATE tasks
     SET title = ?, description = ?, due_date = ?, estimated_minutes = ?,
         status = ?, priority = ?, position = ?, updated_at = datetime('now')
     WHERE id = ?`
  ).run(
    title ?? existing.title,
    description ?? existing.description,
    due_date ?? existing.due_date,
    estimated_minutes ?? existing.estimated_minutes,
    status ?? existing.status,
    priority ?? existing.priority,
    position ?? existing.position,
    req.params.id
  );

  const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
  res.json(task);
});

// DELETE /api/tasks/:id
tasksRouter.delete("/:id", (req, res) => {
  const result = getDb().prepare("DELETE FROM tasks WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "Task not found" });
  res.json({ deleted: true });
});
