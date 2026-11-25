import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildExcerpt,
  detectActiveBacklinkQuery,
  detectTrailingSlashCommand,
  extractBacklinks,
  stripHtmlToPlainText,
} from '../src/features/notes/services/backlink.parser.ts';
import { extractHashtags, suggestTagsFromContent } from '../src/features/notes/services/autoTag.service.ts';
import {
  mapDrizzleNoteRow,
  mapRawFtsNoteRow,
  parseNotePayload,
  parseStringArray,
} from '../src/features/notes/services/note.mapper.ts';
import {
  convertSolar2Lunar,
  formatLunarShort,
  getDayFullInfo,
  parseIsoDate,
} from '../src/features/planner/services/lunar.calendar.ts';
import { formatRelativeTime, formatTimeShort, toIsoDateKey } from '../src/shared/utils/date.utils.ts';
import { createId } from '../src/shared/utils/id.utils.ts';

test('backlink.parser strips HTML, decodes entities, builds excerpts, and parses backlinks/commands', () => {
  const html = '<h1>Tiêu đề</h1><p>Nội dung &amp; &lt;tag&gt; &quot;quoted&quot; &#39;s&#39;&nbsp;ok</p><br/><p>[[Dự án A]] và [[Dự án A]] và [[Ghi chú B]]</p>';
  const plain = stripHtmlToPlainText(html);
  assert.equal(plain, 'Tiêu đề\nNội dung & <tag> "quoted" \'s\' ok\n\n[[Dự án A]] và [[Dự án A]] và [[Ghi chú B]]');

  assert.equal(buildExcerpt('   Hello    world   ', 20), 'Hello world');
  assert.equal(buildExcerpt('1234567890', 6), '12345…');

  assert.deepEqual(extractBacklinks(plain), ['Dự án A', 'Ghi chú B']);
  assert.equal(detectActiveBacklinkQuery('Xem thêm [[Ghi'), 'Ghi');
  assert.equal(detectActiveBacklinkQuery('Xem thêm [[Ghi]]'), null);
  assert.equal(detectTrailingSlashCommand('Gõ /todo'), 'todo');
  assert.equal(detectTrailingSlashCommand('https://example.com/path'), null);
});

test('autoTag.service extracts Unicode hashtags and suggests scored tags', () => {
  const text = 'Họp #công-việc với team #Sprint_1 và #tài-chính về ngân sách dự án deadline gấp';
  assert.deepEqual(extractHashtags(text), ['công-việc', 'sprint_1', 'tài-chính']);
  // Ensure global regex lastIndex resets properly across consecutive calls
  assert.deepEqual(extractHashtags('#Alpha #beta'), ['alpha', 'beta']);

  const suggested = suggestTagsFromContent(text, ['công-việc'], 2);
  assert.equal(suggested.length, 2);
  assert.equal(suggested.includes('công-việc'), false);
  assert.ok(suggested.includes('tài-chính'));
});

test('note.mapper handles valid and malformed JSON payloads gracefully', () => {
  assert.deepEqual(parseNotePayload('{"html":"<p>Hi</p>","embeddedSheetIds":["s1",123]}'), {
    html: '<p>Hi</p>',
    embeddedSheetIds: ['s1'],
  });
  assert.deepEqual(parseNotePayload('not-json'), { html: 'not-json', embeddedSheetIds: [] });
  assert.deepEqual(parseStringArray('["a", 42, "b"]'), ['a', 'b']);
  assert.deepEqual(parseStringArray('{bad'), []);

  const mappedDrizzle = mapDrizzleNoteRow({
    id: 'n1',
    title: 'Test',
    contentJson: '{"html":"<p>Body</p>","embeddedSheetIds":["sh1"]}',
    plainText: 'Body',
    excerpt: 'Body',
    tagsJson: '["tag1"]',
    backlinksJson: '["link1"]',
    isPinned: true,
    isArchived: false,
    linkedDate: '2026-11-25',
    createdAt: 1000,
    updatedAt: 2000,
  });
  assert.equal(mappedDrizzle.id, 'n1');
  assert.deepEqual(mappedDrizzle.tags, ['tag1']);
  assert.deepEqual(mappedDrizzle.embeddedSheetIds, ['sh1']);

  const mappedFts = mapRawFtsNoteRow({
    id: 'n2',
    title: 'FTS',
    content_json: '{"html":"<p>X</p>"}',
    plain_text: 'X',
    excerpt: 'X',
    tags_json: '["t"]',
    backlinks_json: '[]',
    is_pinned: 1,
    is_archived: 0,
    linked_date: null,
    created_at: 500,
    updated_at: 600,
  });
  assert.equal(mappedFts.isPinned, true);
  assert.equal(mappedFts.isArchived, false);
  assert.equal(mappedFts.linkedDate, null);
});

test('lunar.calendar converts known Vietnamese Solar-Lunar dates, leap months, Can Chi, and holidays', () => {
  // Mùng 1 Tết Giáp Thìn: 2024-02-10 -> 1/1/2024
  const tet2024 = convertSolar2Lunar(10, 2, 2024, 7);
  assert.equal(tet2024.day, 1);
  assert.equal(tet2024.month, 1);
  assert.equal(tet2024.year, 2024);
  assert.equal(tet2024.leap, false);
  assert.equal(formatLunarShort(tet2024), '1/1');

  // Mùng 1 Tết Ất Tỵ: 2025-01-29 -> 1/1/2025
  const tet2025 = convertSolar2Lunar(29, 1, 2025, 7);
  assert.equal(tet2025.day, 1);
  assert.equal(tet2025.month, 1);
  assert.equal(tet2025.year, 2025);

  // Tháng 6 Nhuận 2025: 2025-07-25 -> 1/6(Nhuận)/2025
  const leap2025 = convertSolar2Lunar(25, 7, 2025, 7);
  assert.equal(leap2025.day, 1);
  assert.equal(leap2025.month, 6);
  assert.equal(leap2025.leap, true);
  assert.equal(formatLunarShort(leap2025), '1/6N');

  const fullTet2024 = getDayFullInfo('2024-02-10');
  assert.equal(fullTet2024.canChi.year, 'Giáp Thìn');
  assert.equal(fullTet2024.gioHoangDao.length, 6);
  assert.ok(fullTet2024.holidays.includes('Mùng 1 Tết Nguyên Đán'));
  assert.ok(['Ngày Hoàng Đạo', 'Ngày Hắc Đạo'].includes(fullTet2024.dayQuality.label));

  const nationalDay = getDayFullInfo('2026-09-02');
  assert.ok(nationalDay.holidays.includes('Quốc khánh Việt Nam'));

  const fallbackDate = parseIsoDate('invalid-date');
  assert.ok(fallbackDate.year >= 2024);
});

test('date.utils and id.utils format dates and generate unique IDs', () => {
  const sampleDate = new Date(2026, 10, 25, 9, 5, 0);
  assert.equal(toIsoDateKey(sampleDate), '2026-11-25');
  assert.equal(formatTimeShort(sampleDate.getTime()), '09:05');

  const now = Date.now();
  assert.equal(formatRelativeTime(now - 10_000), 'Vừa xong');
  assert.equal(formatRelativeTime(now - 5 * 60_000), '5 phút trước');
  assert.equal(formatRelativeTime(now - 3 * 3_600_000), '3 giờ trước');
  assert.equal(formatRelativeTime(now - 26 * 3_600_000), 'Hôm qua');

  const ids = new Set();
  for (let i = 0; i < 500; i += 1) {
    const id = createId('note');
    assert.ok(id.startsWith('note_'));
    assert.equal(ids.has(id), false);
    ids.add(id);
  }
});
