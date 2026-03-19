'use strict';

const express = require('express');
const db = require('../db');
const { updateUserStats } = require('../services/profile');

const router = express.Router();

// POST /api/behavior/log
router.post('/log', (req, res) => {
  const {
    task_id,
    action,
    course_code,
    duration_minutes,
    scheduled_minutes,
    metadata,
    timestamp,
  } = req.body;

  if (!action) return res.status(400).json({ error: 'action required' });

  db.prepare(
    `INSERT INTO behavior_log (user_id, task_id, action, course_code, duration_minutes, scheduled_minutes, metadata, timestamp)
     VALUES (?, ?, ?, ?, ?, ?, ?, COALESCE(?, CURRENT_TIMESTAMP))`
  ).run(
    req.user.id,
    task_id || null,
    action,
    course_code || null,
    duration_minutes || null,
    scheduled_minutes || null,
    metadata ? JSON.stringify(metadata) : null,
    timestamp || null
  );

  // Update behavioral stats (debounced via shouldRecompute in updateUserStats)
  updateUserStats(req.user.id);

  return res.json({ ok: true });
});

// GET /api/behavior/log?user_id=X&limit=50
router.get('/log', (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  if (req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });

  const limit = parseInt(req.query.limit, 10) || 50;
  const logs = db.prepare(
    'SELECT * FROM behavior_log WHERE user_id = ? ORDER BY timestamp DESC LIMIT ?'
  ).all(userId, limit);

  return res.json({ logs });
});

module.exports = router;
