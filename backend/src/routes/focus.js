'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

// POST /api/focus/start
router.post('/start', (req, res) => {
  const { task_id, planned_minutes } = req.body;

  const result = db.prepare(
    'INSERT INTO focus_sessions (user_id, task_id, planned_minutes) VALUES (?, ?, ?)'
  ).run(req.user.id, task_id || null, planned_minutes || 25);

  return res.status(201).json({ id: result.lastInsertRowid });
});

// POST /api/focus/:id/complete
router.post('/:id/complete', (req, res) => {
  const session = db.prepare('SELECT * FROM focus_sessions WHERE id = ?').get(req.params.id);
  if (!session || session.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  const { actual_minutes } = req.body;
  db.prepare(
    'UPDATE focus_sessions SET actual_minutes = ?, completed_at = CURRENT_TIMESTAMP WHERE id = ?'
  ).run(actual_minutes || session.planned_minutes, session.id);

  // Log a focus_session behavior entry
  db.prepare(
    `INSERT INTO behavior_log (user_id, task_id, action, duration_minutes, scheduled_minutes)
     VALUES (?, ?, 'focus_session', ?, ?)`
  ).run(req.user.id, session.task_id, actual_minutes || session.planned_minutes, session.planned_minutes);

  return res.json({ ok: true });
});

module.exports = router;
