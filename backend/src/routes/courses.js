'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/courses?user_id=X
router.get('/', (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  if (req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });

  const courses = db.prepare('SELECT * FROM courses WHERE user_id = ? ORDER BY created_at ASC').all(userId);
  return res.json({ courses });
});

// POST /api/courses
router.post('/', (req, res) => {
  const { code, name, color } = req.body;
  if (!code || !name) return res.status(400).json({ error: 'code and name required' });

  const result = db.prepare(
    'INSERT INTO courses (user_id, code, name, color) VALUES (?, ?, ?, ?)'
  ).run(req.user.id, code, name, color || '#7c5cfc');

  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ course });
});

// DELETE /api/courses/:id
router.delete('/:id', (req, res) => {
  const course = db.prepare('SELECT * FROM courses WHERE id = ?').get(req.params.id);
  if (!course || course.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM courses WHERE id = ?').run(req.params.id);
  return res.json({ ok: true });
});

module.exports = router;
