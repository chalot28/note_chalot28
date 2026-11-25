import assert from 'node:assert/strict';
import test from 'node:test';
import { cleanupOldReleases, selectReleasesToDelete } from '../scripts/cleanup-releases.mjs';

test('selectReleasesToDelete keeps up to keepCount newest non-draft releases', () => {
  const releases = [
    { id: 1, tag_name: 'v1.0.0', published_at: '2026-01-01T00:00:00Z' },
    { id: 2, tag_name: 'v1.0.1', published_at: '2026-01-02T00:00:00Z' },
    { id: 3, tag_name: 'v1.0.2', published_at: '2026-01-03T00:00:00Z' },
    { id: 4, tag_name: 'v1.0.3', published_at: '2026-01-04T00:00:00Z' },
    { id: 5, tag_name: 'v1.0.4', published_at: '2026-01-05T00:00:00Z' },
    { id: 6, tag_name: 'v1.0.5', published_at: '2026-01-06T00:00:00Z' },
    { id: 7, tag_name: 'v1.0.6-draft', draft: true, published_at: '2026-01-07T00:00:00Z' },
  ];

  const toDelete = selectReleasesToDelete(releases, 5);
  assert.deepEqual(
    toDelete.map((r) => r.tag_name),
    ['v1.0.0'],
  );
});

test('selectReleasesToDelete returns empty when total releases <= keepCount', () => {
  const releases = [
    { id: 1, tag_name: 'v1.0.0', published_at: '2026-01-01T00:00:00Z' },
    { id: 2, tag_name: 'v1.0.1', published_at: '2026-01-02T00:00:00Z' },
  ];
  assert.deepEqual(selectReleasesToDelete(releases, 5), []);
});

test('cleanupOldReleases deletes older releases and their git tags via GitHub API', async () => {
  const calls = [];
  const mockReleases = Array.from({ length: 7 }, (_, i) => ({
    id: 100 + i,
    tag_name: `v1.0.${i}`,
    published_at: `2026-01-0${i + 1}T00:00:00Z`,
  }));

  const mockFetch = async (url, init = {}) => {
    calls.push({ method: init.method ?? 'GET', url });
    if (url.includes('/releases?per_page=100')) {
      return new Response(JSON.stringify(mockReleases), { status: 200 });
    }
    if (init.method === 'DELETE') {
      return new Response(null, { status: 204 });
    }
    return new Response('Unexpected', { status: 400 });
  };

  const result = await cleanupOldReleases({
    repo: 'chalot28/note_chalot28',
    token: 'test-token',
    keepCount: 5,
    fetchImpl: mockFetch,
  });

  assert.equal(result.keptCount, 5);
  assert.deepEqual(result.deletedTags, ['v1.0.1', 'v1.0.0']);
  assert.deepEqual(result.errors, []);
  assert.equal(calls.filter((c) => c.method === 'DELETE').length, 4);
});
