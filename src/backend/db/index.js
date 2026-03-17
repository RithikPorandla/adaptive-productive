/**
 * Database layer
 *
 * Uses SQLite for local dev (zero config). Production will use PostgreSQL
 * with the same schema - we'll add a migration layer later.
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db = null;

export function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_URL || join(__dirname, "../../../data/app.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
  }
  return db;
}

import { runMigrations } from "./schema.js";

export async function initDb() {
  const database = getDb();
  runMigrations(database);
  return database;
}
