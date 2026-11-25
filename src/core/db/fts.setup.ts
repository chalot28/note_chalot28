import type { DB } from '@op-engineering/op-sqlite';

const FTS_STATEMENTS: readonly string[] = [
  `CREATE VIRTUAL TABLE IF NOT EXISTS notes_fts USING fts5(
    note_id UNINDEXED,
    title,
    plain_text,
    tags_json,
    tokenize='unicode61 remove_diacritics 2'
  );`,
  `CREATE TRIGGER IF NOT EXISTS notes_fts_ai AFTER INSERT ON notes BEGIN
    INSERT INTO notes_fts(note_id, title, plain_text, tags_json)
    VALUES (new.id, new.title, new.plain_text, new.tags_json);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS notes_fts_au AFTER UPDATE ON notes BEGIN
    DELETE FROM notes_fts WHERE note_id = old.id;
    INSERT INTO notes_fts(note_id, title, plain_text, tags_json)
    VALUES (new.id, new.title, new.plain_text, new.tags_json);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS notes_fts_ad AFTER DELETE ON notes BEGIN
    DELETE FROM notes_fts WHERE note_id = old.id;
  END;`,
  `CREATE VIRTUAL TABLE IF NOT EXISTS tasks_fts USING fts5(
    task_id UNINDEXED,
    title,
    notes,
    group_name,
    tokenize='unicode61 remove_diacritics 2'
  );`,
  `CREATE TRIGGER IF NOT EXISTS tasks_fts_ai AFTER INSERT ON tasks BEGIN
    INSERT INTO tasks_fts(task_id, title, notes, group_name)
    VALUES (new.id, new.title, new.notes, new.group_name);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS tasks_fts_au AFTER UPDATE ON tasks BEGIN
    DELETE FROM tasks_fts WHERE task_id = old.id;
    INSERT INTO tasks_fts(task_id, title, notes, group_name)
    VALUES (new.id, new.title, new.notes, new.group_name);
  END;`,
  `CREATE TRIGGER IF NOT EXISTS tasks_fts_ad AFTER DELETE ON tasks BEGIN
    DELETE FROM tasks_fts WHERE task_id = old.id;
  END;`,
];

export function setupFts5(sqlite: DB): void {
  for (const sql of FTS_STATEMENTS) {
    sqlite.executeSync(sql);
  }
}

export function rebuildFtsIndexes(sqlite: DB): void {
  sqlite.executeSync('DELETE FROM notes_fts;');
  sqlite.executeSync(
    'INSERT INTO notes_fts(note_id, title, plain_text, tags_json) SELECT id, title, plain_text, tags_json FROM notes;',
  );
  sqlite.executeSync('DELETE FROM tasks_fts;');
  sqlite.executeSync(
    'INSERT INTO tasks_fts(task_id, title, notes, group_name) SELECT id, title, notes, group_name FROM tasks;',
  );
}
