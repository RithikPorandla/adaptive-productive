import { Router } from "express";
import { getDb } from "../db/index.js";

export const usersRouter = Router();

// POST /api/users — create a user
usersRouter.post("/", (req, res) => {
  const { email, name, avatar_url, auth_provider, auth_id } = req.body;
  if (!email || !name) {
    return res.status(400).json({ error: "email and name are required" });
  }
  try {
    const db = getDb();
    const info = db
      .prepare(
        `INSERT INTO users (email, name, avatar_url, auth_provider, auth_id)
         VALUES (?, ?, ?, ?, ?)`
      )
      .run(email, name, avatar_url ?? null, auth_provider ?? "local", auth_id ?? null);
    const user = db.prepare("SELECT * FROM users WHERE id = ?").get(info.lastInsertRowid);
    res.status(201).json(user);
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users — list all users
usersRouter.get("/", (_req, res) => {
  const users = getDb().prepare("SELECT * FROM users ORDER BY created_at DESC").all();
  res.json(users);
});

// GET /api/users/:id
usersRouter.get("/:id", (req, res) => {
  const user = getDb().prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

// PUT /api/users/:id
usersRouter.put("/:id", (req, res) => {
  const { name, avatar_url } = req.body;
  const db = getDb();
  const existing = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  if (!existing) return res.status(404).json({ error: "User not found" });

  db.prepare(
    `UPDATE users SET name = ?, avatar_url = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(name ?? existing.name, avatar_url ?? existing.avatar_url, req.params.id);

  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(req.params.id);
  res.json(user);
});

// DELETE /api/users/:id
usersRouter.delete("/:id", (req, res) => {
  const result = getDb().prepare("DELETE FROM users WHERE id = ?").run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: "User not found" });
  res.json({ deleted: true });
});
