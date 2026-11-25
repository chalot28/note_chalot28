import { sqlite } from '@/core/db/client';
import { setupFts5 } from '@/core/db/fts.setup';

const CURRENT_SCHEMA_VERSION = 1;

const BASE_DDL_STATEMENTS: readonly string[] = [
  `CREATE TABLE IF NOT EXISTS schema_migrations (
    version INTEGER PRIMARY KEY,
    applied_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL DEFAULT '',
    content_json TEXT NOT NULL DEFAULT '{}',
    plain_text TEXT NOT NULL DEFAULT '',
    excerpt TEXT NOT NULL DEFAULT '',
    tags_json TEXT NOT NULL DEFAULT '[]',
    backlinks_json TEXT NOT NULL DEFAULT '[]',
    is_pinned INTEGER NOT NULL DEFAULT 0,
    is_archived INTEGER NOT NULL DEFAULT 0,
    linked_date TEXT,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS spreadsheets (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL DEFAULT 'Bảng tính mới',
    note_id TEXT,
    data_json TEXT NOT NULL DEFAULT '{}',
    column_meta_json TEXT NOT NULL DEFAULT '{}',
    row_count INTEGER NOT NULL DEFAULT 20,
    col_count INTEGER NOT NULL DEFAULT 8,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    notes TEXT NOT NULL DEFAULT '',
    group_name TEXT NOT NULL DEFAULT 'Chung',
    priority TEXT NOT NULL DEFAULT 'medium',
    due_date TEXT,
    reminder_at INTEGER,
    recurrence TEXT NOT NULL DEFAULT 'none',
    notification_id TEXT,
    is_completed INTEGER NOT NULL DEFAULT 0,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS vault_items (
    id TEXT PRIMARY KEY NOT NULL,
    kind TEXT NOT NULL DEFAULT 'note',
    title_cipher TEXT NOT NULL,
    title_iv TEXT NOT NULL,
    title_tag TEXT NOT NULL,
    payload_cipher TEXT NOT NULL,
    payload_iv TEXT NOT NULL,
    payload_tag TEXT NOT NULL,
    is_pinned INTEGER NOT NULL DEFAULT 0,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS totp_accounts (
    id TEXT PRIMARY KEY NOT NULL,
    issuer TEXT NOT NULL DEFAULT '',
    account_label TEXT NOT NULL,
    secret_cipher TEXT NOT NULL,
    secret_iv TEXT NOT NULL,
    secret_tag TEXT NOT NULL,
    algorithm TEXT NOT NULL DEFAULT 'SHA1',
    digits INTEGER NOT NULL DEFAULT 6,
    period INTEGER NOT NULL DEFAULT 30,
    counter INTEGER NOT NULL DEFAULT 0,
    kind TEXT NOT NULL DEFAULT 'totp',
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
  );`,
  `CREATE INDEX IF NOT EXISTS idx_notes_updated ON notes(is_pinned DESC, updated_at DESC);`,
  `CREATE INDEX IF NOT EXISTS idx_notes_linked_date ON notes(linked_date);`,
  `CREATE INDEX IF NOT EXISTS idx_sheets_note_id ON spreadsheets(note_id);`,
  `CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date, is_completed);`,
];

let migrated = false;

export function runMigrations(): void {
  if (migrated) return;

  sqlite.executeSync('BEGIN IMMEDIATE;');
  try {
    for (const statement of BASE_DDL_STATEMENTS) {
      sqlite.executeSync(statement);
    }
    setupFts5(sqlite);
    sqlite.executeSync(
      'INSERT OR IGNORE INTO schema_migrations(version, applied_at) VALUES (?, ?);',
      [CURRENT_SCHEMA_VERSION, Date.now()],
    );
    sqlite.executeSync('COMMIT;');
    migrated = true;
  } catch (error) {
    sqlite.executeSync('ROLLBACK;');
    throw error;
  }
}
