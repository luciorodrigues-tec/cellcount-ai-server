import { PostgresAnalysisJobQueue, INF_SCALE_001_2B_VERSION } from './postgresAnalysisJobQueue.js';

export const ANALYSIS_EXECUTION_MODES = Object.freeze({ inline: 'inline', queued: 'queued' });

export function resolveAnalysisJobQueueConfig(env = process.env) {
  const mode = String(env.ANALYSIS_EXECUTION_MODE || ANALYSIS_EXECUTION_MODES.inline).trim().toLowerCase();
  if (!Object.values(ANALYSIS_EXECUTION_MODES).includes(mode)) {
    throw new Error(`INF-SCALE-001.2B: unsupported ANALYSIS_EXECUTION_MODE=${mode}`);
  }
  return Object.freeze({
    architectureVersion: INF_SCALE_001_2B_VERSION,
    executionMode: mode,
    queueEnabled: mode === ANALYSIS_EXECUTION_MODES.queued,
    provider: 'postgres',
    workerRequired: mode === ANALYSIS_EXECUTION_MODES.queued,
    productionActivationReady: false,
  });
}

export function createAnalysisJobQueue({ env = process.env, postgresPool = null } = {}) {
  const config = resolveAnalysisJobQueueConfig(env);
  if (!config.queueEnabled) return null;
  if (!env.DATABASE_URL && !postgresPool) {
    throw new Error('INF-SCALE-001.2B: queued execution requires DATABASE_URL.');
  }
  return new PostgresAnalysisJobQueue({
    connectionString: env.DATABASE_URL,
    sslMode: env.DATABASE_SSL_MODE,
    pool: postgresPool,
  });
}
