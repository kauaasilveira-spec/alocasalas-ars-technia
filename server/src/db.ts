import Database from 'better-sqlite3';
import { config } from './config.js';

export type DB = Database.Database;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('professor','gestao')),
  last_access TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  setor TEXT NOT NULL DEFAULT '',
  floor TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  computers INTEGER NOT NULL DEFAULT 0,
  has_projector INTEGER NOT NULL DEFAULT 0,
  has_ac INTEGER NOT NULL DEFAULT 1,
  has_tv INTEGER NOT NULL DEFAULT 0,
  accessible INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'ativa' CHECK (status IN ('ativa','manutencao','inativa')),
  status_note TEXT NOT NULL DEFAULT '',
  parent_id INTEGER REFERENCES rooms(id) ON DELETE SET NULL,
  image TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS classes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  professor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  course TEXT NOT NULL DEFAULT '',
  student_count INTEGER NOT NULL CHECK (student_count > 0),
  needs_computers INTEGER NOT NULL DEFAULT 0,
  needs_projector INTEGER NOT NULL DEFAULT 0,
  needs_accessibility INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  class_id INTEGER REFERENCES classes(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  type TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  attendees INTEGER NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente','aprovada','recusada','cancelada')),
  review_note TEXT NOT NULL DEFAULT '',
  reviewed_by INTEGER REFERENCES users(id),
  reviewed_at TEXT,
  recommendation TEXT,
  series_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_room_date ON bookings(room_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);

CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;

export function openDb(path = config.dbPath): DB {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(SCHEMA);
  return db;
}

export function logAction(
  db: DB,
  userId: number | null,
  action: string,
  entity: string,
  entityId: number | null,
  details = '',
) {
  db.prepare(
    'INSERT INTO audit_log (user_id, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)',
  ).run(userId, action, entity, entityId, details);
}
