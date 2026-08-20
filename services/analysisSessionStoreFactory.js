import path from 'node:path';
import { AnalysisSessionStore } from './analysisSessionStore.js';
import {
  INF_SCALE_001_1B_VERSION,
  PostgresAnalysisSessionStore,
} from './postgresAnalysisSessionStore.js';

export const INF_SCALE_001_1_VERSION = INF_SCALE_001_1B_VERSION;
export const ANALYSIS_SESSION_STORAGE_PROVIDERS = Object.freeze({
  filesystem: 'filesystem',
  postgres: 'postgres',
});

function normalizeProvider(value) {
  const provider = String(value || ANALYSIS_SESSION_STORAGE_PROVIDERS.filesystem).trim().toLowerCase();
  if (provider === 'fs' || provider === 'file') return ANALYSIS_SESSION_STORAGE_PROVIDERS.filesystem;
  if (provider === 'postgresql' || provider === 'pg') return ANALYSIS_SESSION_STORAGE_PROVIDERS.postgres;
  return provider;
}

export function resolveAnalysisSessionStorageConfig(env = process.env) {
  const provider = normalizeProvider(env.ANALYSIS_SESSION_STORAGE_PROVIDER);
  const nodeEnv = String(env.NODE_ENV || 'development').toLowerCase();
  const horizontalScale = Number(env.WEB_CONCURRENCY || 1) > 1 || String(env.CELLCOUNT_HORIZONTAL_SCALE || '').toLowerCase() === 'true';

  const config = {
    architectureVersion: INF_SCALE_001_1B_VERSION,
    provider,
    distributed: provider === ANALYSIS_SESSION_STORAGE_PROVIDERS.postgres,
    horizontalScale,
    rootDir: env.ANALYSIS_SESSION_ROOT_DIR || path.join(process.cwd(), 'data', 'analysis-sessions'),
    connectionString: env.DATABASE_URL || '',
    sslMode: env.DATABASE_SSL_MODE || '',
  };

  if (horizontalScale && !config.distributed && nodeEnv === 'production') {
    throw new Error(
      'INF-SCALE-001.1B: horizontal production scale requires distributed analysis-session storage. ' +
      'Filesystem storage is single-instance only.',
    );
  }
  return config;
}

export function createAnalysisSessionStore({ env = process.env, postgresPool = null } = {}) {
  const config = resolveAnalysisSessionStorageConfig(env);

  if (config.provider === ANALYSIS_SESSION_STORAGE_PROVIDERS.filesystem) {
    const store = new AnalysisSessionStore({ rootDir: config.rootDir });
    Object.defineProperty(store, 'scalabilityMetadata', {
      value: Object.freeze({
        architectureVersion: config.architectureVersion,
        provider: config.provider,
        distributed: false,
        horizontalScaleSafe: false,
      }),
      enumerable: true,
    });
    return store;
  }

  if (config.provider === ANALYSIS_SESSION_STORAGE_PROVIDERS.postgres) {
    if (!config.connectionString && !postgresPool) {
      throw new Error(
        'INF-SCALE-001.1 compatibility: PostgreSQL adapter is not installed yet for an unconfigured runtime; ' +
        'INF-SCALE-001.1B requires DATABASE_URL before the distributed provider can be instantiated.',
      );
    }
    const store = new PostgresAnalysisSessionStore({
      connectionString: config.connectionString,
      sslMode: config.sslMode,
      pool: postgresPool,
    });
    Object.defineProperty(store, 'scalabilityMetadata', {
      value: Object.freeze({
        architectureVersion: config.architectureVersion,
        provider: config.provider,
        distributed: true,
        horizontalScaleSafe: true,
        transactionalLeaseAuthority: true,
        idempotencyUniquenessAuthority: 'postgres_unique_constraint',
      }),
      enumerable: true,
    });
    return store;
  }

  throw new Error(`INF-SCALE-001.1B: unsupported ANALYSIS_SESSION_STORAGE_PROVIDER=${config.provider}`);
}
