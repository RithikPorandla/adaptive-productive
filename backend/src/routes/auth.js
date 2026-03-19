'use strict';

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = db.prepare(
    'INSERT INTO users (email, password_hash, name) VALUES (?, ?, ?)'
  ).run(email, passwordHash, name || null);

  const id = result.lastInsertRowid;
  const token = jwt.sign({ id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });

  return res.status(201).json({
    user: { id, name: name || null, email },
    token,
  });
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return res.json({
    user: { id: user.id, name: user.name, email: user.email },
    token,
  });
});

// PATCH /api/auth/profile — update university/major after onboarding
router.patch('/profile', auth, (req, res) => {
  const { name, university, major } = req.body;
  db.prepare(
    'UPDATE users SET name = COALESCE(?, name), university = COALESCE(?, university), major = COALESCE(?, major) WHERE id = ?'
  ).run(name || null, university || null, major || null, req.user.id);

  const user = db.prepare('SELECT id, name, email, university, major FROM users WHERE id = ?').get(req.user.id);
  return res.json({ user });
});

module.exports = router;
