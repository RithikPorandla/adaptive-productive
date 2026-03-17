/**
 * Database schema - Users, Tasks, Schedules
 * PostgreSQL-compatible SQL (SQLite for local dev)
 */

export function runMigrations(db) {
  db.exec("PRAGMA foreign_keys = ON");
  db.exec(`
    -- Users (simplified for MVP; OAuth later)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE,
      name TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    -- Schedule items (classes, fixed events)
    CREATE TABLE IF NOT EXISTS schedule_items (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      day_of_week INTEGER NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      location TEXT,
      color TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Tasks (assignments, to-dos)
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      due_date TEXT,
      estimated_minutes INTEGER,
      completed INTEGER DEFAULT 0,
      parent_task_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (parent_task_id) REFERENCES tasks(id)
    );

    -- Study sessions (focus timer logs)
    CREATE TABLE IF NOT EXISTS study_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      task_id TEXT,
      duration_minutes INTEGER NOT NULL,
      completed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (task_id) REFERENCES tasks(id)
    );

    CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date);
    CREATE INDEX IF NOT EXISTS idx_schedule_user_day ON schedule_items(user_id, day_of_week);
    CREATE INDEX IF NOT EXISTS idx_study_sessions_user ON study_sessions(user_id, completed_at);
  `);
  // Seed default user for MVP
  db.prepare(
    "INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)"
  ).run("default-user", "demo@adaptive.app", "Demo User");
}
