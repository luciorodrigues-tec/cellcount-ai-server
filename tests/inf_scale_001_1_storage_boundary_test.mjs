import assert from 'node:assert/strict';
import test from 'node:test';
import {
  INF_SCALE_001_1_VERSION,
  createAnalysisSessionStore,
  resolveAnalysisSessionStorageConfig,
} from '../services/analysisSessionStoreFactory.js';

test('INF-SCALE-001.1 keeps filesystem provider compatible with 006.x', async () => {
  const store = createAnalysisSessionStore({
    env: {
      NODE_ENV: 'test',
      ANALYSIS_SESSION_STORAGE_PROVIDER: 'filesystem',
      ANALYSIS_SESSION_ROOT_DIR: '/tmp/cellcount-inf-scale-001-1',
    },
  });
  assert.equal(store.scalabilityMetadata.architectureVersion, INF_SCALE_001_1_VERSION);
  assert.equal(store.scalabilityMetadata.provider, 'filesystem');
  assert.equal(store.scalabilityMetadata.distributed, false);
});

test('INF-SCALE-001.1 refuses unsafe multi-instance production filesystem', () => {
  assert.throws(
    () => resolveAnalysisSessionStorageConfig({
      NODE_ENV: 'production',
      WEB_CONCURRENCY: '2',
      ANALYSIS_SESSION_STORAGE_PROVIDER: 'filesystem',
    }),
    /horizontal production scale requires distributed analysis-session storage/i,
  );
});

test('INF-SCALE-001.1 recognizes PostgreSQL as distributed target without silent fallback', () => {
  const config = resolveAnalysisSessionStorageConfig({
    NODE_ENV: 'production',
    WEB_CONCURRENCY: '4',
    ANALYSIS_SESSION_STORAGE_PROVIDER: 'postgres',
  });
  assert.equal(config.distributed, true);
  assert.throws(
    () => createAnalysisSessionStore({ env: {
      NODE_ENV: 'production',
      WEB_CONCURRENCY: '4',
      ANALYSIS_SESSION_STORAGE_PROVIDER: 'postgres',
    }}),
    /adapter is not installed yet/i,
  );
});
