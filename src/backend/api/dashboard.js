import { Router } from "express";
import { getDb } from "../db/index.js";

export const dashboardRouter = Router();

// GET /api/dashboard?user_id=X
// Progress dashboard: task completion rate, study hours, streaks.
dashboardRouter.get("/", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  const db = getDb();

  const taskStats = db
    .prepare(
      `SELECT
         COUNT(*)                                       AS total_tasks,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
         SUM(CASE WHEN status = 'pending'   THEN 1 ELSE 0 END) AS pending_tasks,
         SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
         SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) AS cancelled_tasks
       FROM tasks
       WHERE user_id = ? AND parent_task_id IS NULL`
    )
    .get(user_id);

  const subtaskStats = db
    .prepare(
      `SELECT
         COUNT(*) AS total_subtasks,
         SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_subtasks
       FROM tasks
       WHERE user_id = ? AND parent_task_id IS NOT NULL`
    )
    .get(user_id);

  const focusStats = db
    .prepare(
      `SELECT
         COUNT(*)                    AS total_sessions,
         COALESCE(SUM(duration_minutes), 0) AS total_minutes
       FROM focus_sessions
       WHERE user_id = ? AND status = 'completed'`
    )
    .get(user_id);

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayFocus = db
    .prepare(
      `SELECT
         COUNT(*)                    AS sessions_today,
         COALESCE(SUM(duration_minutes), 0) AS minutes_today
       FROM focus_sessions
       WHERE user_id = ? AND status = 'completed'
         AND date(started_at) = ?`
    )
    .get(user_id, todayStr);

  const overdueTasks = db
    .prepare(
      `SELECT COUNT(*) AS overdue
       FROM tasks
       WHERE user_id = ? AND status IN ('pending','in_progress')
         AND due_date IS NOT NULL AND due_date < ?
         AND parent_task_id IS NULL`
    )
    .get(user_id, todayStr);

  const total = taskStats.total_tasks || 0;
  const completed = taskStats.completed_tasks || 0;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  res.json({
    tasks: {
      ...taskStats,
      completion_rate: completionRate,
      overdue: overdueTasks.overdue,
    },
    subtasks: subtaskStats,
    focus: {
      ...focusStats,
      total_hours: Math.round((focusStats.total_minutes / 60) * 10) / 10,
      today: todayFocus,
    },
  });
});
