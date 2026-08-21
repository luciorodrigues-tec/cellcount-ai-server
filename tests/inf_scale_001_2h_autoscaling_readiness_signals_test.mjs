import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const queueSource = fs.readFileSync(new URL('../services/postgresAnalysisJobQueue.js', import.meta.url), 'utf8');
const workerSource = fs.readFileSync(new URL('../services/analysisWorkerPool.js', import.meta.url), 'utf8');

test('INF-SCALE-001.2H-B queue snapshot exposes oldest waiting age without schema mutation', () => {
  assert.match(queueSource, /oldest_waiting_at/);
  assert.match(queueSource, /oldest_waiting_age_ms/);
  assert.match(queueSource, /oldestWaitingAgeMs/);
  assert.match(queueSource, /COUNT\(\*\).*PROCESSING/s);
});

test('INF-SCALE-001.2H-B worker metadata exposes only aggregate operational counters', () => {
  assert.match(workerSource, /metrics: Object\.freeze/);
  assert.match(workerSource, /claimed: this\.metrics\.claimed/);
  assert.match(workerSource, /completed: this\.metrics\.completed/);
  assert.match(workerSource, /leaseRenewalFailures: this\.metrics\.leaseRenewalFailures/);
  assert.doesNotMatch(workerSource, /metrics: Object\.freeze\(\{[^}]*leaseToken/s);
});
