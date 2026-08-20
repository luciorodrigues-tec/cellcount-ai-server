import test from 'node:test';
import assert from 'node:assert/strict';
import {
  PostgresAnalysisSessionStore,
  INF_SCALE_001_1C_SCHEMA_LOCK_VERSION,
  ANALYSIS_SESSION_SCHEMA_ADVISORY_LOCK_KEY,
} from '../services/postgresAnalysisSessionStore.js';

test('INF-SCALE-001.1C.1 serializes schema bootstrap with a PostgreSQL transaction advisory lock', async () => {
  const calls = [];
  const client = {
    async query(sql, params = []) {
      calls.push({ sql: String(sql), params });
      return { rows: [], rowCount: 0 };
    },
    release() { calls.push({ sql: 'RELEASE', params: [] }); },
  };
  const pool = {
    async connect() { return client; },
    async end() {},
  };

  const store = new PostgresAnalysisSessionStore({ pool, autoMigrate: true });
  await store.ensureSchema();

  assert.equal(INF_SCALE_001_1C_SCHEMA_LOCK_VERSION, 'INF-SCALE-001.1C.1');
  assert.equal(Number.isInteger(ANALYSIS_SESSION_SCHEMA_ADVISORY_LOCK_KEY), true);
  assert.equal(calls[0].sql, 'BEGIN');
  assert.match(calls[1].sql, /pg_advisory_xact_lock/i);
  assert.deepEqual(calls[1].params, [ANALYSIS_SESSION_SCHEMA_ADVISORY_LOCK_KEY]);
  assert.match(calls[2].sql, /CREATE TABLE IF NOT EXISTS cellcount_analysis_sessions/i);
  assert.equal(calls[3].sql, 'COMMIT');
  assert.equal(calls[4].sql, 'RELEASE');
});

test('INF-SCALE-001.1C.1 rolls back schema bootstrap and allows a later retry', async () => {
  let fail = true;
  const calls = [];
  const pool = {
    async connect() {
      return {
        async query(sql) {
          calls.push(String(sql));
          if (/CREATE TABLE/i.test(String(sql)) && fail) {
            fail = false;
            throw new Error('synthetic migration failure');
          }
          return { rows: [], rowCount: 0 };
        },
        release() { calls.push('RELEASE'); },
      };
    },
    async end() {},
  };

  const store = new PostgresAnalysisSessionStore({ pool, autoMigrate: true });
  await assert.rejects(() => store.ensureSchema(), /synthetic migration failure/);
  assert.ok(calls.includes('ROLLBACK'));
  await store.ensureSchema();
  assert.ok(calls.includes('COMMIT'));
});
