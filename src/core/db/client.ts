import { open } from '@op-engineering/op-sqlite';
import { drizzle } from 'drizzle-orm/op-sqlite';
import * as schema from '@/core/db/schema';

export const DATABASE_NAME = 'liquid_notes.db';

export const sqlite = open({
  name: DATABASE_NAME,
});

sqlite.executeSync('PRAGMA journal_mode = WAL;');
sqlite.executeSync('PRAGMA synchronous = NORMAL;');
sqlite.executeSync('PRAGMA foreign_keys = ON;');
sqlite.executeSync('PRAGMA temp_store = MEMORY;');

export const db = drizzle(sqlite, { schema });

export type AppDatabase = typeof db;
