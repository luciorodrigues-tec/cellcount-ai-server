import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAnalysisSessionPostgresSchemaSql,
  PostgresAnalysisSessionStore,
  INF_SCALE_001_1B_VERSION,
} from '../services/postgresAnalysisSessionStore.js';
import {
  createAnalysisSessionStore,
  resolveAnalysisSessionStorageConfig,
} from '../services/analysisSessionStoreFactory.js';

test('INF-SCALE-001.1B schema has durable idempotency uniqueness and JSONB authority', () => {
  const sql = buildAnalysisSessionPostgresSchemaSql();
  assert.match(sql, /UNIQUE\s*\(user_id, idempotency_key\)/i);
  assert.match(sql, /session\s+jsonb\s+NOT NULL/i);
  assert.match(sql, /analysis_id\s+uuid\s+PRIMARY KEY/i);
  assert.equal(INF_SCALE_001_1B_VERSION, 'INF-SCALE-001.1B');
});

test('INF-SCALE-001.1B PostgreSQL instantiation requires DATABASE_URL and never silently falls back', () => {
  const config = resolveAnalysisSessionStorageConfig({
    NODE_ENV: 'production',
    ANALYSIS_SESSION_STORAGE_PROVIDER: 'postgres',
  });
  assert.equal(config.provider, 'postgres');
  assert.equal(config.distributed, true);
  assert.throws(
    () => createAnalysisSessionStore({
      env: { NODE_ENV: 'production', ANALYSIS_SESSION_STORAGE_PROVIDER: 'postgres' },
    }),
    /DATABASE_URL/,
  );
});

test('INF-SCALE-001.1B marks PostgreSQL store as horizontally safe distributed authority', () => {
  const fakePool = {
    query: async () => ({ rows: [], rowCount: 0 }),
    connect: async () => { throw new Error('not used in factory test'); },
  };
  const store = createAnalysisSessionStore({
    env: {
      NODE_ENV: 'production',
      ANALYSIS_SESSION_STORAGE_PROVIDER: 'postgres',
      DATABASE_URL: 'postgresql://cellcount:secret@db.example/cellcount',
      WEB_CONCURRENCY: '8',
    },
    postgresPool: fakePool,
  });
  assert.ok(store instanceof PostgresAnalysisSessionStore);
  assert.equal(store.scalabilityMetadata.distributed, true);
  assert.equal(store.scalabilityMetadata.horizontalScaleSafe, true);
  assert.equal(store.scalabilityMetadata.transactionalLeaseAuthority, true);
});

test('INF-SCALE-001.1B filesystem remains available for local/test compatibility', () => {
  const store = createAnalysisSessionStore({
    env: { NODE_ENV: 'test', ANALYSIS_SESSION_STORAGE_PROVIDER: 'filesystem' },
  });
  assert.equal(store.scalabilityMetadata.provider, 'filesystem');
  assert.equal(store.scalabilityMetadata.distributed, false);
});
