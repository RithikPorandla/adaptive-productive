'use strict';

const express = require('express');
const db = require('../db');
const { buildUserContext } = require('../services/profile');
const { computeUserProfile } = require('../services/behaviorEngine');
const { runObservationEngine } = require('../services/observationEngine');
const { generateBriefing, parseSyllabus, decomposeTask } = require('../services/claude');

const router = express.Router();

// POST /api/ada/briefing
router.post('/briefing', async (req, res) => {
  const userId = req.user.id;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);

  const tasks = db.prepare(
    `SELECT * FROM tasks WHERE user_id = ? AND status != 'completed' AND due_date IS NOT NULL
     ORDER BY due_date ASC`
  ).all(userId);

  // Cache check — 6h TTL + task count change
  const taskCount = tasks.length;
  const cachedAt = user.briefing_cached_at ? new Date(user.briefing_cached_at) : null;
  const cacheAge = cachedAt ? Date.now() - cachedAt.getTime() : Infinity;
  const cacheValid =
    cacheAge < 6 * 60 * 60 * 1000 &&
    user.briefing_cache_tasks_count === taskCount &&
    user.briefing_cache;

  if (cacheValid) {
    try {
      return res.json(JSON.parse(user.briefing_cache));
    } catch {
      // Cache corrupted — fall through to regenerate
    }
  }

  const context = buildUserContext(userId);
  const briefing = await generateBriefing(user, tasks, context);

  // Persist cache
  db.prepare(
    `UPDATE users SET briefing_cache = ?, briefing_cached_at = CURRENT_TIMESTAMP, briefing_cache_tasks_count = ? WHERE id = ?`
  ).run(JSON.stringify(briefing), taskCount, userId);

  return res.json(briefing);
});

// POST /api/ada/parse-syllabus
router.post('/parse-syllabus', async (req, res) => {
  const { pdf_base64, course_id, course_code } = req.body;
  if (!pdf_base64) return res.status(400).json({ error: 'pdf_base64 required' });

  let parsedTasks;
  try {
    parsedTasks = await parseSyllabus(pdf_base64, course_code || '', req.user.id);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

  const insertStmt = db.prepare(
    `INSERT INTO tasks (user_id, course_id, course_code, title, type, priority, due_date, estimated_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  );

  const insertMany = db.transaction((tasks) => {
    const ids = [];
    for (const t of tasks) {
      const r = insertStmt.run(
        req.user.id,
        course_id || null,
        course_code || null,
        t.title,
        t.type || 'assignment',
        t.priority || 'medium',
        t.due_date || null,
        t.estimated_hours || null
      );
      ids.push(r.lastInsertRowid);
    }
    return ids;
  });

  const ids = insertMany(parsedTasks);
  const inserted = ids.map(id => db.prepare('SELECT * FROM tasks WHERE id = ?').get(id));

  return res.status(201).json({ tasks: inserted });
});

// POST /api/ada/decompose/:taskId
router.post('/decompose/:taskId', async (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.taskId);
  if (!task || task.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  const context = buildUserContext(req.user.id);
  const subtasks = await decomposeTask(task, context);
  return res.json({ subtasks });
});

// GET /api/ada/profile?user_id=X
router.get('/profile', (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  if (req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
  let profile = null;
  try {
    profile = user.behavior_profile ? JSON.parse(user.behavior_profile) : null;
  } catch {
    profile = null;
  }

  const stale =
    !user.profile_updated_at ||
    Date.now() - new Date(user.profile_updated_at).getTime() > 6 * 60 * 60 * 1000;

  if (stale || !profile) {
    profile = computeUserProfile(userId);
  }

  const observations = runObservationEngine(userId, profile);
  const nextUnlockAt = profile ? Math.max(0, 10 - (profile.dataPoints || 0)) : 10;

  return res.json({ profile, observations, nextUnlockAt });
});

module.exports = router;
