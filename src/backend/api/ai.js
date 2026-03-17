import { Router } from "express";
import { getDb } from "../db/index.js";
import { decomposeTask, parseTaskInput, generateStudyTip, suggestNextTask } from "../services/ai.js";

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

// POST /api/ai/parse-task — Parse natural-language input into structured task fields
aiRouter.post("/parse-task", async (req, res) => {
  try {
    const { input } = req.body;
    if (!input) return res.status(400).json({ error: "input is required" });
    const parsed = await parseTaskInput(input);
    res.json({ ...parsed, engine: process.env.OPENAI_API_KEY ? "openai" : "heuristic" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai/insights?user_id=X — Study tip + next-task suggestion
aiRouter.get("/insights", async (req, res) => {
  try {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ error: "user_id is required" });

    const db = getDb();
    const tasks = db.prepare(
      "SELECT * FROM tasks WHERE user_id = ? AND parent_task_id IS NULL ORDER BY created_at DESC"
    ).all(user_id);

    const today = new Date();
    const dayOfWeek = today.getDay();
    const classes = db.prepare(
      "SELECT * FROM schedules WHERE user_id = ? AND day_of_week = ? ORDER BY start_time"
    ).all(user_id, dayOfWeek);

    const tip = await generateStudyTip(tasks, classes);
    const next = suggestNextTask(tasks);

    res.json({
      tip,
      next_task: next,
      engine: process.env.OPENAI_API_KEY ? "openai" : "heuristic",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
