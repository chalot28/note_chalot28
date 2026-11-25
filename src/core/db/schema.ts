import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const notes = sqliteTable('notes', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default(''),
  contentJson: text('content_json').notNull().default('{}'),
  plainText: text('plain_text').notNull().default(''),
  excerpt: text('excerpt').notNull().default(''),
  tagsJson: text('tags_json').notNull().default('[]'),
  backlinksJson: text('backlinks_json').notNull().default('[]'),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  isArchived: integer('is_archived', { mode: 'boolean' }).notNull().default(false),
  linkedDate: text('linked_date'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const spreadsheets = sqliteTable('spreadsheets', {
  id: text('id').primaryKey(),
  title: text('title').notNull().default('Bảng tính mới'),
  noteId: text('note_id'),
  dataJson: text('data_json').notNull().default('{}'),
  columnMetaJson: text('column_meta_json').notNull().default('{}'),
  rowCount: integer('row_count').notNull().default(20),
  colCount: integer('col_count').notNull().default(8),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const tasks = sqliteTable('tasks', {
  id: text('id').primaryKey(),
  title: text('title').notNull(),
  notes: text('notes').notNull().default(''),
  groupName: text('group_name').notNull().default('Chung'),
  priority: text('priority', { enum: ['low', 'medium', 'high'] }).notNull().default('medium'),
  dueDate: text('due_date'),
  reminderAt: integer('reminder_at'),
  recurrence: text('recurrence', { enum: ['none', 'daily', 'weekly', 'monthly'] })
    .notNull()
    .default('none'),
  notificationId: text('notification_id'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).notNull().default(false),
  completedAt: integer('completed_at'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const vaultItems = sqliteTable('vault_items', {
  id: text('id').primaryKey(),
  kind: text('kind', { enum: ['note', 'secret'] }).notNull().default('note'),
  titleCipher: text('title_cipher').notNull(),
  titleIv: text('title_iv').notNull(),
  titleTag: text('title_tag').notNull(),
  payloadCipher: text('payload_cipher').notNull(),
  payloadIv: text('payload_iv').notNull(),
  payloadTag: text('payload_tag').notNull(),
  isPinned: integer('is_pinned', { mode: 'boolean' }).notNull().default(false),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

export const totpAccounts = sqliteTable('totp_accounts', {
  id: text('id').primaryKey(),
  issuer: text('issuer').notNull().default(''),
  accountLabel: text('account_label').notNull(),
  secretCipher: text('secret_cipher').notNull(),
  secretIv: text('secret_iv').notNull(),
  secretTag: text('secret_tag').notNull(),
  algorithm: text('algorithm').notNull().default('SHA1'),
  digits: integer('digits').notNull().default(6),
  period: integer('period').notNull().default(30),
  counter: integer('counter').notNull().default(0),
  kind: text('kind', { enum: ['totp', 'hotp'] }).notNull().default('totp'),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});
