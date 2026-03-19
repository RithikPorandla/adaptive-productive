'use strict';

const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const { runMigrations } = require('./schema');

const dbPath = process.env.DATABASE_PATH || './data/adaptive.db';
const resolvedPath = path.resolve(dbPath);

// Ensure the data directory exists
fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });

const db = new Database(resolvedPath);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

runMigrations(db);

module.exports = db;
