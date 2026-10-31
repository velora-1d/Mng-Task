-- ============================================================
-- Mng-Task — Skema SQLite (referensi)
-- Versi: 1.0 · 31 Oktober 2026
--
-- Catatan:
-- - Sumber kebenaran implementasi: src/lib/server/db/schema.ts + migrasi Drizzle.
-- - File ini untuk dokumentasi, review, dan setup manual.
-- - Semua waktu disimpan TEXT ISO-8601 UTC.
-- - Semua tanggal (tanpa jam) disimpan TEXT 'YYYY-MM-DD' (WIB).
-- ============================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA busy_timeout = 5000;

-- ------------------------------------------------------------
-- users
-- ------------------------------------------------------------
CREATE TABLE users (
  id                    TEXT PRIMARY KEY,
  name                  TEXT NOT NULL,
  email                 TEXT NOT NULL COLLATE NOCASE,
  password_hash         TEXT NOT NULL,
  role                  TEXT NOT NULL DEFAULT 'USER'
                          CHECK (role IN ('OWNER', 'USER')),
  is_active             INTEGER NOT NULL DEFAULT 1
                          CHECK (is_active IN (0, 1)),
  must_change_password  INTEGER NOT NULL DEFAULT 0
                          CHECK (must_change_password IN (0, 1)),
  last_seen_at          TEXT,
  created_at            TEXT NOT NULL,
  updated_at            TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_users_email ON users (email);
CREATE INDEX idx_users_role_active ON users (role, is_active);

-- ------------------------------------------------------------
-- sessions
-- Token asli hanya ada di cookie; yang disimpan adalah SHA-256.
-- ------------------------------------------------------------
CREATE TABLE sessions (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  TEXT NOT NULL,
  expires_at  TEXT NOT NULL,
  ip          TEXT,
  user_agent  TEXT,
  created_at  TEXT NOT NULL
);

CREATE UNIQUE INDEX idx_sessions_token_hash ON sessions (token_hash);
CREATE INDEX idx_sessions_user ON sessions (user_id);
CREATE INDEX idx_sessions_expires ON sessions (expires_at);

-- ------------------------------------------------------------
-- tasks
-- ------------------------------------------------------------
CREATE TABLE tasks (
  id           TEXT PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT NOT NULL DEFAULT 'TODO'
                 CHECK (status IN ('TODO', 'IN_PROGRESS', 'BLOCKED', 'DONE')),
  priority     TEXT NOT NULL DEFAULT 'MEDIUM'
                 CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'URGENT')),
  due_date     TEXT,                                  -- YYYY-MM-DD (WIB)
  assignee_id  TEXT REFERENCES users(id) ON DELETE SET NULL,
  created_by   TEXT NOT NULL REFERENCES users(id),
  completed_at TEXT,
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  deleted_at   TEXT                                   -- soft delete (P1)
);

CREATE INDEX idx_tasks_assignee_status ON tasks (assignee_id, status);
CREATE INDEX idx_tasks_created_by ON tasks (created_by);
CREATE INDEX idx_tasks_due_date ON tasks (due_date);
CREATE INDEX idx_tasks_status_due ON tasks (status, due_date);
CREATE INDEX idx_tasks_deleted ON tasks (deleted_at);

-- ------------------------------------------------------------
-- reminders (manual; reminder otomatis dihitung dari tasks)
-- ------------------------------------------------------------
CREATE TABLE reminders (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  task_id    TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  note       TEXT,
  remind_at  TEXT NOT NULL,                           -- ISO-8601 UTC
  status     TEXT NOT NULL DEFAULT 'PENDING'
               CHECK (status IN ('PENDING', 'DONE')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX idx_reminders_user_status ON reminders (user_id, status);
CREATE INDEX idx_reminders_remind_at ON reminders (remind_at);
CREATE INDEX idx_reminders_task ON reminders (task_id);

-- ------------------------------------------------------------
-- reports (snapshot)
-- ------------------------------------------------------------
CREATE TABLE reports (
  id            TEXT PRIMARY KEY,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL
                  CHECK (type IN ('DAILY', 'WEEKLY', 'MONTHLY')),
  period_start  TEXT NOT NULL,                        -- YYYY-MM-DD
  period_end    TEXT NOT NULL,                        -- YYYY-MM-DD
  notes         TEXT,
  stats_json    TEXT NOT NULL,                        -- snapshot metrik
  generated_at  TEXT NOT NULL,
  created_at    TEXT NOT NULL
);

CREATE INDEX idx_reports_user_period ON reports (user_id, period_start);
CREATE INDEX idx_reports_type ON reports (type);

-- ------------------------------------------------------------
-- audit_logs
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
  id           TEXT PRIMARY KEY,
  actor_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
  action       TEXT NOT NULL,                         -- create/update/delete/...
  entity_type  TEXT NOT NULL,                         -- task/user/report/session/settings
  entity_id    TEXT,
  before_json  TEXT,
  after_json   TEXT,
  ip           TEXT,
  user_agent   TEXT,
  created_at   TEXT NOT NULL
);

CREATE INDEX idx_audit_entity ON audit_logs (entity_type, entity_id);
CREATE INDEX idx_audit_actor ON audit_logs (actor_id);
CREATE INDEX idx_audit_created ON audit_logs (created_at);

-- ------------------------------------------------------------
-- login_attempts (rate limiting)
-- ------------------------------------------------------------
CREATE TABLE login_attempts (
  id          TEXT PRIMARY KEY,
  email       TEXT NOT NULL COLLATE NOCASE,
  ip          TEXT,
  success     INTEGER NOT NULL DEFAULT 0
                CHECK (success IN (0, 1)),
  created_at  TEXT NOT NULL
);

CREATE INDEX idx_login_attempts_email_time ON login_attempts (email, created_at);
CREATE INDEX idx_login_attempts_ip_time ON login_attempts (ip, created_at);

-- ------------------------------------------------------------
-- settings (key/value)
-- ------------------------------------------------------------
CREATE TABLE settings (
  key         TEXT PRIMARY KEY,
  value_json  TEXT NOT NULL,
  updated_at  TEXT NOT NULL
);

-- ------------------------------------------------------------
-- Seed pengaturan awal (bukan seed user)
-- ------------------------------------------------------------
INSERT INTO settings (key, value_json, updated_at) VALUES
  ('org_name',          '"Mng-Task"',        '2026-10-31T00:00:00.000Z'),
  ('timezone',          '"Asia/Jakarta"',    '2026-10-31T00:00:00.000Z'),
  ('reminder_days',     '[3, 1, 0]',         '2026-10-31T00:00:00.000Z');

-- ------------------------------------------------------------
-- Catatan implementasi
-- ------------------------------------------------------------
-- 1. updated_at diisi aplikasi (atau trigger) setiap UPDATE.
-- 2. completed_at diisi saat status menjadi 'DONE', dikosongkan saat dibuka.
-- 3. Overdue tidak disimpan; dihitung: due_date < hari ini AND status <> 'DONE'.
-- 4. Reminder otomatis tidak punya baris di tabel reminders.
-- 5. Hapus user memakai is_active = 0; hapus permanen tidak diekspos di UI.
-- 6. Semua query wajib prepared statement (Drizzle).
