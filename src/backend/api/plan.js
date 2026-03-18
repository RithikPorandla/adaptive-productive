import { Router } from "express";
import { getDb } from "../db/index.js";

export const planRouter = Router();

// GET /api/plan/today?user_id=X
// Combines today's class schedule + pending/in-progress tasks into a timeline.
planRouter.get("/today", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  const db = getDb();
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun … 6=Sat
  const todayStr = today.toISOString().slice(0, 10); // YYYY-MM-DD

  const classes = db
    .prepare(
      `SELECT id, title, start_time, end_time, location, color, 'class' as type
       FROM schedules
       WHERE user_id = ? AND day_of_week = ?
       ORDER BY start_time ASC`
    )
    .all(user_id, dayOfWeek);

  const tasks = db
    .prepare(
      `SELECT id, title, description, due_date, estimated_minutes, status, priority,
              parent_task_id, 'task' as type
       FROM tasks
       WHERE user_id = ? AND status IN ('pending','in_progress')
         AND parent_task_id IS NULL
       ORDER BY
         CASE priority WHEN 'high' THEN 0 WHEN 'medium' THEN 1 WHEN 'low' THEN 2 END,
         due_date ASC NULLS LAST`
    )
    .all(user_id);

  // Enrich tasks that are due today
  const dueTodayIds = new Set();
  for (const t of tasks) {
    if (t.due_date && t.due_date.startsWith(todayStr)) {
      dueTodayIds.add(t.id);
    }
  }

  // Build the timeline: classes are fixed time blocks, tasks fill the gaps
  const timeline = [];
  for (const c of classes) {
    timeline.push({ ...c, sortKey: c.start_time });
  }
  for (const t of tasks) {
    timeline.push({
      ...t,
      due_today: dueTodayIds.has(t.id),
      sortKey: t.due_date ? "99:99" : "99:99", // tasks after classes unless due today
    });
  }

  res.json({
    date: todayStr,
    day_of_week: dayOfWeek,
    classes,
    tasks,
    summary: {
      total_classes: classes.length,
      total_tasks: tasks.length,
      due_today: dueTodayIds.size,
    },
  });
});
