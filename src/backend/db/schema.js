/**
 * Database schema for Student Productivity App
 *
 * Step 2: Core data model — Users, Tasks, Schedules.
 * Uses SQLite for local dev; schema is PostgreSQL-compatible where possible.
 */

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    email         TEXT    NOT NULL UNIQUE,
    name          TEXT    NOT NULL,
    avatar_url    TEXT,
    auth_provider TEXT    NOT NULL DEFAULT 'local',
    auth_id       TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id                INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id           INTEGER NOT NULL,
    title             TEXT    NOT NULL,
    description       TEXT,
    due_date          TEXT,
    estimated_minutes INTEGER,
    status            TEXT    NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending','in_progress','completed','cancelled')),
    priority          TEXT    NOT NULL DEFAULT 'medium'
                        CHECK (priority IN ('low','medium','high')),
    parent_task_id    INTEGER,
    position          INTEGER NOT NULL DEFAULT 0,
    created_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at        TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id)        REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_task_id) REFERENCES tasks(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS schedules (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id       INTEGER NOT NULL,
    title         TEXT    NOT NULL,
    day_of_week   INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time    TEXT    NOT NULL,
    end_time      TEXT    NOT NULL,
    location      TEXT,
    color         TEXT,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    updated_at    TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_tasks_user_id        ON tasks(user_id);
  CREATE INDEX IF NOT EXISTS idx_tasks_status          ON tasks(status);
  CREATE INDEX IF NOT EXISTS idx_tasks_due_date        ON tasks(due_date);
  CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id  ON tasks(parent_task_id);
  CREATE TABLE IF NOT EXISTS focus_sessions (
    id               INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id          INTEGER NOT NULL,
    task_id          INTEGER,
    duration_minutes INTEGER NOT NULL DEFAULT 25,
    status           TEXT    NOT NULL DEFAULT 'active'
                       CHECK (status IN ('active','completed','cancelled')),
    started_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    ended_at         TEXT,
    created_at       TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_schedules_user_id     ON schedules(user_id);
  CREATE INDEX IF NOT EXISTS idx_schedules_day         ON schedules(day_of_week);
  CREATE INDEX IF NOT EXISTS idx_focus_user_id          ON focus_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_focus_status            ON focus_sessions(status);
`;

/**
 * Run schema creation. Safe to call multiple times (IF NOT EXISTS).
 */
export function createSchema(db) {
  db.exec(SCHEMA_SQL);
}
