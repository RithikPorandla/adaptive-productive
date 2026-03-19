'use strict';

const express = require('express');
const db = require('../db');

const router = express.Router();

// GET /api/tasks?user_id=X
router.get('/', (req, res) => {
  const userId = parseInt(req.query.user_id, 10);
  if (req.user.id !== userId) return res.status(403).json({ error: 'Forbidden' });

  const tasks = db.prepare(`
    SELECT t.*, c.color as course_color, c.name as course_name
    FROM tasks t
    LEFT JOIN courses c ON t.course_id = c.id
    WHERE t.user_id = ?
    ORDER BY t.due_date ASC
  `).all(userId);

  return res.json({ tasks });
});

// POST /api/tasks
router.post('/', (req, res) => {
  const { title, course_id, course_code, type, priority, due_date, estimated_hours } = req.body;
  if (!title) return res.status(400).json({ error: 'title required' });

  const result = db.prepare(
    `INSERT INTO tasks (user_id, course_id, course_code, title, type, priority, due_date, estimated_hours)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(
    req.user.id,
    course_id || null,
    course_code || null,
    title,
    type || 'assignment',
    priority || 'medium',
    due_date || null,
    estimated_hours || null
  );

  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
  return res.status(201).json({ task });
});

// PUT /api/tasks/:id/status
router.put('/:id/status', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task || task.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  const { status, actual_hours } = req.body;
  if (!status) return res.status(400).json({ error: 'status required' });

  db.prepare(
    `UPDATE tasks SET status = ?, actual_hours = COALESCE(?, actual_hours), updated_at = CURRENT_TIMESTAMP WHERE id = ?`
  ).run(status, actual_hours || null, task.id);

  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id);
  return res.json({ task: updated });
});

// PUT /api/tasks/:id
router.put('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task || task.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  const { title, priority, due_date, estimated_hours, ada_note } = req.body;
  db.prepare(
    `UPDATE tasks SET
       title = COALESCE(?, title),
       priority = COALESCE(?, priority),
       due_date = COALESCE(?, due_date),
       estimated_hours = COALESCE(?, estimated_hours),
       ada_note = COALESCE(?, ada_note),
       updated_at = CURRENT_TIMESTAMP
     WHERE id = ?`
  ).run(title || null, priority || null, due_date || null, estimated_hours || null, ada_note || null, task.id);

  return res.json({ task: db.prepare('SELECT * FROM tasks WHERE id = ?').get(task.id) });
});

// DELETE /api/tasks/:id
router.delete('/:id', (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task || task.user_id !== req.user.id) return res.status(404).json({ error: 'Not found' });

  db.prepare('DELETE FROM tasks WHERE id = ?').run(task.id);
  return res.json({ ok: true });
});

module.exports = router;
