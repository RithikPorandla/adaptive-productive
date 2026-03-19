'use strict';

const db = require('../db');

function computeUserProfile(userId) {
  const logs = db.prepare(
    `SELECT * FROM behavior_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT 200`
  ).all(userId);

  if (logs.length < 3) return null;

  // ── Peak hours ──────────────────────────────────────────
  const hourBuckets = Array(24).fill(0);
  logs.filter(l => l.action === 'completed').forEach(l => {
    const h = new Date(l.timestamp).getHours();
    hourBuckets[h]++;
  });
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));
  const peakPeriod =
    peakHour < 12 ? 'morning' :
    peakHour < 17 ? 'afternoon' : 'evening';

  // ── Time overrun per subject ────────────────────────────
  const completions = logs.filter(
    l => l.action === 'completed' && l.duration_minutes && l.scheduled_minutes
  );
  const overrunBySubject = {};
  completions.forEach(l => {
    if (!l.course_code) return;
    if (!overrunBySubject[l.course_code]) {
      overrunBySubject[l.course_code] = { total: 0, count: 0 };
    }
    const overrun = (l.duration_minutes - l.scheduled_minutes) / l.scheduled_minutes;
    overrunBySubject[l.course_code].total += overrun;
    overrunBySubject[l.course_code].count++;
  });
  const subjectDifficulty = {};
  Object.entries(overrunBySubject).forEach(([code, { total, count }]) => {
    subjectDifficulty[code] = Math.round((total / count) * 100);
  });

  // ── Procrastination index ───────────────────────────────
  const tasksWithDue = db.prepare(
    `SELECT t.due_date, bl.timestamp FROM behavior_log bl
     JOIN tasks t ON bl.task_id = t.id
     WHERE bl.user_id = ? AND bl.action = 'completed' AND t.due_date IS NOT NULL`
  ).all(userId);
  let lastMinuteCount = 0;
  tasksWithDue.forEach(({ due_date, timestamp }) => {
    const hoursBeforeDue = (new Date(due_date) - new Date(timestamp)) / 36e5;
    if (hoursBeforeDue < 24) lastMinuteCount++;
  });
  const procrastinationIndex = tasksWithDue.length > 0
    ? Math.round((lastMinuteCount / tasksWithDue.length) * 100) / 100
    : null;

  // ── Skip streaks ────────────────────────────────────────
  const recentSkips = db.prepare(
    `SELECT course_code, COUNT(*) as skips FROM behavior_log
     WHERE user_id = ? AND action = 'skipped'
     AND timestamp > datetime('now', '-21 days')
     GROUP BY course_code HAVING skips >= 2`
  ).all(userId);

  // ── Completion rate ─────────────────────────────────────
  const total = db.prepare(
    `SELECT COUNT(*) as n FROM tasks WHERE user_id = ?`
  ).get(userId).n;
  const done = db.prepare(
    `SELECT COUNT(*) as n FROM tasks WHERE user_id = ? AND status = 'completed'`
  ).get(userId).n;
  const completionRate = total > 0 ? Math.round((done / total) * 100) / 100 : 0;

  // ── Strong / weak subjects ──────────────────────────────
  const subjectCompletion = db.prepare(
    `SELECT course_code,
       SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) * 1.0 / COUNT(*) as rate
     FROM tasks WHERE user_id = ? AND course_code IS NOT NULL
     GROUP BY course_code`
  ).all(userId);
  const sorted = subjectCompletion.sort((a, b) => b.rate - a.rate);
  const strongSubject = sorted[0]?.course_code ?? null;
  const weakSubject = sorted[sorted.length - 1]?.course_code ?? null;

  // ── Heatmap (18 time slots × 7 days, Mon=0…Sun=6) ───────
  const heatmap = Array.from({ length: 18 }, () => Array(7).fill(0));
  logs.filter(l => l.action === 'completed').forEach(l => {
    const d = new Date(l.timestamp);
    const hour = d.getHours();
    const dow = (d.getDay() + 6) % 7;
    const slot = Math.max(0, Math.min(17, hour - 6));
    heatmap[slot][dow] = Math.min(3, heatmap[slot][dow] + 1);
  });

  // ── Streak calculation ──────────────────────────────────
  const recentCompletions = db.prepare(
    `SELECT DISTINCT date(timestamp) as day FROM behavior_log
     WHERE user_id = ? AND action = 'completed'
     ORDER BY day DESC LIMIT 30`
  ).all(userId);
  let streakDays = 0;
  const today = new Date();
  for (let i = 0; i < recentCompletions.length; i++) {
    const expected = new Date(today);
    expected.setDate(today.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (recentCompletions[i].day === expectedStr) {
      streakDays++;
    } else {
      break;
    }
  }

  const profile = {
    peakHour,
    peakPeriod,
    subjectDifficulty,
    procrastinationIndex,
    recentSkipSubjects: recentSkips.map(r => r.course_code),
    completionRate,
    strongSubject,
    weakSubject,
    heatmap,
    streakDays,
    computedAt: new Date().toISOString(),
    dataPoints: logs.length,
  };

  db.prepare(
    `UPDATE users SET behavior_profile = ?, profile_updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(JSON.stringify(profile), userId);

  return profile;
}

function shouldRecompute(userId) {
  const user = db.prepare('SELECT profile_updated_at FROM users WHERE id = ?').get(userId);
  if (!user || !user.profile_updated_at) return true;
  const age = Date.now() - new Date(user.profile_updated_at).getTime();
  return age > 60 * 60 * 1000; // 1 hour
}

module.exports = { computeUserProfile, shouldRecompute };
