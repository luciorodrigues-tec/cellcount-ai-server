import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('INF-SCALE-001.2B server enqueues durable payload before 006.2 execution claim in queued mode', () => {
  const branch = server.indexOf('INF-SCALE-001.2B — DURABLE JOB ENQUEUE');
  const enqueue = server.indexOf('await analysisJobQueue.enqueue', branch);
  const claim = server.indexOf('await analysisSessionStore.claimExecution', branch);
  assert.ok(branch > 0);
  assert.ok(enqueue > branch);
  assert.ok(claim > enqueue, 'queued mode must return before HTTP handler acquires clinical execution lease');
  assert.match(server, /return res\.status\(202\)\.json\(/);
});

test('INF-SCALE-001.2B runtime declares durable queue but does not claim production activation before worker sprint', () => {
  assert.match(server, /durableAnalysisJobQueueVersion/);
  assert.match(server, /INF_SCALE_001_2B_VERSION/);
  assert.match(server, /productionActivationReady:\s*false/);
  assert.match(server, /analysisExecutionMode/);
});

test('INF-SCALE-001.2B queued HTTP response never exposes binary payload or lease token', () => {
  const start = server.indexOf('INF-SCALE-001.2B — DURABLE JOB ENQUEUE');
  const end = server.indexOf('BE\/FE-FIX-006.2', start);
  const block = server.slice(start, end > start ? end : start + 7000);
  assert.doesNotMatch(block, /dataBase64\s*:/);
  assert.doesNotMatch(block, /leaseToken\s*:/);
  assert.match(block, /jobId:\s*queued\.job\.jobId/);
});
