/**
 * Database layer
 *
 * Uses SQLite for local dev (zero config). Production will use PostgreSQL
 * with the same schema - we'll add a migration layer later.
 */

import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createSchema } from "./schema.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

let db = null;

export function getDb() {
  if (!db) {
    const dbPath = process.env.DATABASE_URL || join(__dirname, "../../../data/app.db");
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    db.pragma("foreign_keys = ON");
  }
  return db;
}

export async function initDb() {
  const database = getDb();
  createSchema(database);
  console.log("Database initialized with schema");
  return database;
}
