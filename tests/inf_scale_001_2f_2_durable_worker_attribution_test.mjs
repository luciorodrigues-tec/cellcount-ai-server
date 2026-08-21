import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';

const queueSource = fs.readFileSync(new URL('../services/postgresAnalysisJobQueue.js', import.meta.url), 'utf8');
const forensicSource = fs.readFileSync(new URL('../scripts/diagnoseFourWorkerStall.mjs', import.meta.url), 'utf8');

test('INF-SCALE-001.2F.2 schema preserves durable worker attribution independently of active lease fields', () => {
  for (const column of ['last_worker_id', 'last_leased_at', 'last_lease_expires_at', 'last_lease_released_at']) {
    assert.match(queueSource, new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`));
  }
  assert.match(queueSource, /last_worker_id=\$2/);
  assert.match(queueSource, /last_lease_released_at=NOW\(\)/);
});

test('INF-SCALE-001.2F.2 terminal transition clears active lease token while retaining attribution history', () => {
  assert.match(queueSource, /last_worker_id=COALESCE\(last_worker_id, worker_id\)/);
  assert.match(queueSource, /lease_token=NULL, worker_id=NULL, leased_at=NULL, lease_expires_at=NULL/);
});

test('INF-SCALE-001.2F.2 forensics prefers durable lastWorkerId after completion', () => {
  assert.match(forensicSource, /last_worker_id/);
  assert.match(forensicSource, /lastWorkerId/);
  assert.match(forensicSource, /record\.job\.lastWorkerId \|\| record\.job\.workerId/);
});
