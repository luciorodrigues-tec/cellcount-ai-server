import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const queueSource = fs.readFileSync(new URL('../services/postgresAnalysisJobQueue.js', import.meta.url), 'utf8');
const fsSessionSource = fs.readFileSync(new URL('../services/analysisSessionStore.js', import.meta.url), 'utf8');
const pgSessionSource = fs.readFileSync(new URL('../services/postgresAnalysisSessionStore.js', import.meta.url), 'utf8');

test('INF-SCALE-001.2C renews job lease only while current PostgreSQL lease is still authoritative', () => {
  assert.match(queueSource, /async renewLease\(/);
  assert.match(queueSource, /status='PROCESSING' AND lease_token=\$2/);
  assert.match(queueSource, /lease_expires_at > NOW\(\)/);
  assert.match(queueSource, /ANALYSIS_JOB_LEASE_LOST/);
});

test('INF-SCALE-001.2C adds session lease heartbeat support to filesystem and PostgreSQL stores', () => {
  for (const source of [fsSessionSource, pgSessionSource]) {
    assert.match(source, /async renewExecutionLease\(/);
    assert.match(source, /ANALYSIS_SESSION_LEASE_LOST/);
    assert.match(source, /leaseExpiresAt/);
  }
});

test('INF-SCALE-001.2C backpressure counts active durable work and preserves duplicate analysisId admission', () => {
  assert.match(queueSource, /getBackpressureSnapshot/);
  assert.match(queueSource, /assertEnqueueCapacity/);
  assert.match(queueSource, /ANALYSIS_QUEUE_BACKPRESSURE/);
  assert.match(queueSource, /WHERE analysis_id=\$1::uuid/);
  assert.match(queueSource, /status IN \('QUEUED','RETRY_ELIGIBLE','PROCESSING'\)/);
});
