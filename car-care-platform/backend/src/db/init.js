import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/app.db');

export const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
CREATE TABLE IF NOT EXISTS locations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT,
  manager_id TEXT,
  contact TEXT,
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL,
  location_id TEXT,
  status TEXT DEFAULT 'Active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS feedback (
  id TEXT PRIMARY KEY,
  feedback_code TEXT UNIQUE NOT NULL,
  external_id TEXT UNIQUE,
  customer_id TEXT,
  customer_name TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  location_id TEXT,
  service_name TEXT,
  vehicle_make TEXT,
  vehicle_model TEXT,
  vehicle_registration TEXT,
  date_of_service TEXT,
  rating INTEGER,
  severity TEXT NOT NULL DEFAULT 'Positive',
  feedback_text TEXT,
  complaint TEXT,
  requested_resolution TEXT,
  source TEXT DEFAULT 'Website',
  status TEXT DEFAULT 'New',
  submitted_at TEXT DEFAULT (datetime('now')),
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (location_id) REFERENCES locations(id)
);

CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY,
  issue_code TEXT UNIQUE NOT NULL,
  feedback_id TEXT,
  customer_id TEXT,
  location_id TEXT,
  service_name TEXT,
  description TEXT,
  severity TEXT,
  priority TEXT DEFAULT 'Medium',
  assigned_manager_id TEXT,
  status TEXT DEFAULT 'New',
  resolution TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  closed_at TEXT,
  FOREIGN KEY (feedback_id) REFERENCES feedback(id),
  FOREIGN KEY (location_id) REFERENCES locations(id),
  FOREIGN KEY (assigned_manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  issue_id TEXT,
  parent_id TEXT,
  user_id TEXT,
  user_name TEXT,
  body TEXT NOT NULL,
  mentions TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (issue_id) REFERENCES issues(id)
);

CREATE TABLE IF NOT EXISTS internal_notes (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  note TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (issue_id) REFERENCES issues(id)
);

CREATE TABLE IF NOT EXISTS action_items (
  id TEXT PRIMARY KEY,
  issue_id TEXT,
  title TEXT NOT NULL,
  assigned_to TEXT,
  status TEXT DEFAULT 'Pending',
  due_date TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT,
  FOREIGN KEY (issue_id) REFERENCES issues(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  type TEXT,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_logs (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  action TEXT NOT NULL,
  actor_id TEXT,
  actor_name TEXT,
  description TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  feedback_id TEXT,
  customer_name TEXT,
  location_id TEXT,
  rating INTEGER,
  review_text TEXT,
  status TEXT DEFAULT 'Pending',
  featured INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (feedback_id) REFERENCES feedback(id)
);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  feedback_id TEXT,
  issue_id TEXT,
  filename TEXT,
  url TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
`);

export default db;
