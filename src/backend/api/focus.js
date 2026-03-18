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

// GET /api/focus/profile?user_id=X — adaptive focus intelligence
focusRouter.get("/profile", (req, res) => {
  const { user_id } = req.query;
  if (!user_id) return res.status(400).json({ error: "user_id is required" });

  const db = getDb();
  const all = db.prepare(
    `SELECT *, strftime('%H', started_at) as hour, date(started_at) as day
     FROM focus_sessions WHERE user_id = ? ORDER BY started_at DESC`
  ).all(user_id);

  const completed = all.filter(s => s.status === "completed");
  const cancelled = all.filter(s => s.status === "cancelled");
  const totalSessions = completed.length + cancelled.length;
  const completionRate = totalSessions > 0 ? Math.round((completed.length / totalSessions) * 100) : 0;

  // Optimal duration: find the duration with highest completion rate
  const byDuration = {};
  for (const s of all) {
    if (!byDuration[s.duration_minutes]) byDuration[s.duration_minutes] = { done: 0, total: 0 };
    byDuration[s.duration_minutes].total++;
    if (s.status === "completed") byDuration[s.duration_minutes].done++;
  }
  let optimalDuration = 25;
  let bestRate = 0;
  for (const [dur, d] of Object.entries(byDuration)) {
    const rate = d.total >= 2 ? d.done / d.total : 0;
    if (rate > bestRate) { bestRate = rate; optimalDuration = Number(dur); }
  }

  // Best hours (top 3 by completion rate, min 2 sessions)
  const byHour = {};
  for (const s of all) {
    const h = Number(s.hour);
    if (!byHour[h]) byHour[h] = { done: 0, total: 0 };
    byHour[h].total++;
    if (s.status === "completed") byHour[h].done++;
  }
  const bestHours = Object.entries(byHour)
    .filter(([, d]) => d.total >= 1)
    .map(([h, d]) => ({ hour: Number(h), rate: Math.round((d.done / d.total) * 100), sessions: d.total }))
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 3);

  // Streak calculation
  const days = [...new Set(completed.map(s => s.day))].sort().reverse();
  let streak = 0;
  const today = new Date().toISOString().slice(0, 10);
  let checkDate = new Date(today);
  for (let i = 0; i < 365; i++) {
    const d = checkDate.toISOString().slice(0, 10);
    if (days.includes(d)) { streak++; checkDate.setDate(checkDate.getDate() - 1); }
    else if (i === 0) { checkDate.setDate(checkDate.getDate() - 1); }
    else break;
  }

  // Weekly trend
  const thisWeekMin = completed
    .filter(s => { const d = new Date(s.day); const diff = (new Date(today) - d) / 86400000; return diff < 7; })
    .reduce((sum, s) => sum + s.duration_minutes, 0);
  const lastWeekMin = completed
    .filter(s => { const d = new Date(s.day); const diff = (new Date(today) - d) / 86400000; return diff >= 7 && diff < 14; })
    .reduce((sum, s) => sum + s.duration_minutes, 0);

  // Average session length
  const avgDuration = completed.length > 0
    ? Math.round(completed.reduce((s, c) => s + c.duration_minutes, 0) / completed.length)
    : 0;

  res.json({
    total_sessions: totalSessions,
    completed: completed.length,
    cancelled: cancelled.length,
    completion_rate: completionRate,
    avg_duration: avgDuration,
    optimal_duration: optimalDuration,
    best_hours: bestHours,
    streak,
    this_week_minutes: thisWeekMin,
    last_week_minutes: lastWeekMin,
    weekly_change: lastWeekMin > 0 ? Math.round(((thisWeekMin - lastWeekMin) / lastWeekMin) * 100) : null,
    suggested_duration: optimalDuration,
  });
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
