import { Router } from "express";
import { getDb } from "../db/index.js";
import { decomposeTask } from "../services/ai.js";

export const aiRouter = Router();

// POST /api/tasks/:id/decompose
// Uses AI (or heuristic fallback) to break a task into subtasks.
aiRouter.post("/tasks/:id/decompose", async (req, res) => {
  try {
    const db = getDb();
    const task = db.prepare("SELECT * FROM tasks WHERE id = ?").get(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });

    // Don't decompose subtasks
    if (task.parent_task_id) {
      return res.status(400).json({ error: "Cannot decompose a subtask" });
    }

    // Remove existing subtasks before re-decomposing
    db.prepare("DELETE FROM tasks WHERE parent_task_id = ?").run(task.id);

    const subtaskDefs = await decomposeTask(task.title, task.description, task.estimated_minutes);

    const insert = db.prepare(
      `INSERT INTO tasks (user_id, title, estimated_minutes, parent_task_id, position)
       VALUES (?, ?, ?, ?, ?)`
    );

    const created = [];
    const insertMany = db.transaction(() => {
      for (let i = 0; i < subtaskDefs.length; i++) {
        const info = insert.run(
          task.user_id,
          subtaskDefs[i].title,
          subtaskDefs[i].estimated_minutes,
          task.id,
          i + 1
        );
        created.push(db.prepare("SELECT * FROM tasks WHERE id = ?").get(info.lastInsertRowid));
      }
    });
    insertMany();

    res.status(201).json({
      parent_task_id: task.id,
      engine: process.env.OPENAI_API_KEY ? "openai" : "heuristic",
      subtasks: created,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
