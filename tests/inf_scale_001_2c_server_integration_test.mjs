import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('INF-SCALE-001.2C starts worker pool only when queued execution is explicitly enabled', () => {
  assert.match(server, /analysisJobQueueConfig\.executionMode === ANALYSIS_EXECUTION_MODES\.queued/);
  assert.match(server, /createAnalysisWorkerPool/);
  assert.match(server, /analysisWorkerPool\.start\(\)/);
});

test('INF-SCALE-001.2C applies queue backpressure before durable payload enqueue', () => {
  const capacity = server.indexOf('analysisJobQueue.assertEnqueueCapacity');
  const enqueue = server.indexOf('await analysisJobQueue.enqueue');
  assert.ok(capacity > 0);
  assert.ok(enqueue > capacity);
  assert.match(server, /res\.status\(503\)/);
  assert.match(server, /ANALYSIS_QUEUE_BACKPRESSURE/);
});

test('INF-SCALE-001.2C runtime exposes worker pool without pretending it runs in inline mode', () => {
  assert.match(server, /distributedAnalysisWorkerPoolVersion/);
  assert.match(server, /INF_SCALE_001_2C_VERSION/);
  assert.match(server, /activationMode: "queued_only"/);
  assert.match(server, /running: false/);
});
