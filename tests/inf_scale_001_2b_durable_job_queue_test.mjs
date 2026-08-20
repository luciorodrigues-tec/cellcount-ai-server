import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAnalysisJobQueueSchemaSql,
  INF_SCALE_001_2B_VERSION,
  ANALYSIS_JOB_QUEUE_SCHEMA_ADVISORY_LOCK_KEY,
  PostgresAnalysisJobQueue,
} from '../services/postgresAnalysisJobQueue.js';
import {
  ANALYSIS_EXECUTION_MODES,
  resolveAnalysisJobQueueConfig,
} from '../services/analysisJobQueueFactory.js';
import {
  encodeAnalysisJobPayload,
  decodeAnalysisJobPayload,
} from '../services/analysisJobPayloadCodec.js';

test('INF-SCALE-001.2B schema makes analysisId the durable duplicate-job authority', () => {
  const sql = buildAnalysisJobQueueSchemaSql();
  assert.match(sql, /UNIQUE\s*\(analysis_id\)/i);
  assert.match(sql, /payload\s+jsonb\s+NOT NULL/i);
  assert.match(sql, /status, available_at, created_at/i);
  assert.equal(INF_SCALE_001_2B_VERSION, 'INF-SCALE-001.2B.2');
});

test('INF-SCALE-001.2B queue claim uses distributed SKIP LOCKED and migration advisory lock', async () => {
  const source = PostgresAnalysisJobQueue.prototype.claimNext.toString();
  assert.match(source, /FOR UPDATE SKIP LOCKED/i);
  assert.equal(ANALYSIS_JOB_QUEUE_SCHEMA_ADVISORY_LOCK_KEY, 510001002);
});



test('INF-SCALE-001.2B.1 optional analysisId claim scope isolates certification without changing worker default', () => {
  const source = PostgresAnalysisJobQueue.prototype.claimNext.toString();
  assert.match(source, /analysisId\s*=\s*null/);
  assert.match(source, /analysis_id\s*=\s*\$1::uuid/i);
  assert.match(source, /FOR UPDATE SKIP LOCKED/i);
});


test('INF-SCALE-001.2B.2 immediate enqueue uses PostgreSQL clock to prevent cross-host clock skew starvation', () => {
  const source = PostgresAnalysisJobQueue.prototype.enqueue.toString();
  assert.match(source, /availableAt\s*=\s*null/);
  assert.match(source, /COALESCE\(\$7::timestamptz, NOW\(\)\)/i);
  assert.match(source, /NOW\(\), NOW\(\), \$8/i);
});

test('INF-SCALE-001.2B stays inline by default and queued mode is explicit opt-in', () => {
  const defaultConfig = resolveAnalysisJobQueueConfig({});
  assert.equal(defaultConfig.executionMode, ANALYSIS_EXECUTION_MODES.inline);
  assert.equal(defaultConfig.queueEnabled, false);
  assert.equal(defaultConfig.productionActivationReady, false);

  const queued = resolveAnalysisJobQueueConfig({ ANALYSIS_EXECUTION_MODE: 'queued' });
  assert.equal(queued.queueEnabled, true);
  assert.equal(queued.workerRequired, true);
  assert.equal(queued.productionActivationReady, false);
});

test('INF-SCALE-001.2B payload codec preserves exact binary images and clinical execution input', () => {
  const input = {
    images: [
      {
        fieldname: 'image', originalname: 'field-1.png', encoding: '7bit',
        mimetype: 'image/png', buffer: Buffer.from([0, 1, 2, 250, 255]), size: 5,
      },
    ],
    analysisSource: 'ai_visual',
    manualCounts: { blast: 2 },
    analysisType: 'bone_marrow',
    specimenType: 'bone_marrow',
    specimenDecision: { accepted: true },
    specimenReviewRequired: false,
  };
  const encoded = encodeAnalysisJobPayload(input);
  const decoded = decodeAnalysisJobPayload(encoded);
  assert.deepEqual([...decoded.images[0].buffer], [0, 1, 2, 250, 255]);
  assert.equal(decoded.images[0].mimetype, 'image/png');
  assert.deepEqual(decoded.manualCounts, { blast: 2 });
  assert.deepEqual(decoded.specimenDecision, { accepted: true });
  assert.equal(decoded.analysisType, 'bone_marrow');
});

test('INF-SCALE-001.2B payload codec blocks oversized durable payload before database insertion', () => {
  assert.throws(
    () => encodeAnalysisJobPayload({
      images: [{ buffer: Buffer.alloc(11), size: 11 }],
    }, { maxPayloadBytes: 10 }),
    (error) => error?.code === 'ANALYSIS_JOB_PAYLOAD_TOO_LARGE' && error?.statusCode === 413,
  );
});
