import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { PostgresAnalysisJobQueue } from '../services/postgresAnalysisJobQueue.js';
import { encodeAnalysisJobPayload } from '../services/analysisJobPayloadCodec.js';

const databaseUrl = process.env.DATABASE_URL;
const live = databaseUrl ? test : test.skip;

live('INF-SCALE-001.2B live PostgreSQL certifies duplicate suppression and single distributed claim', async () => {
  const queueA = new PostgresAnalysisJobQueue();
  const queueB = new PostgresAnalysisJobQueue();
  const analysisId = crypto.randomUUID();
  const userId = `infscale-0012b-${Date.now()}`;
  const payload = encodeAnalysisJobPayload({
    images: [{ fieldname: 'image', originalname: 'cert.png', mimetype: 'image/png', buffer: Buffer.from([1,2,3]), size: 3 }],
    analysisSource: 'ai_visual',
  });

  try {
    await Promise.all([queueA.ensureSchema(), queueB.ensureSchema()]);
    const enqueues = await Promise.all(
      Array.from({ length: 12 }, (_, i) => (i % 2 ? queueA : queueB).enqueue({ analysisId, userId, payload })),
    );
    assert.equal(new Set(enqueues.map((entry) => entry.job.jobId)).size, 1);

    const claims = await Promise.all(
      Array.from({ length: 12 }, (_, i) => (i % 2 ? queueA : queueB).claimNext({ workerId: `cert-${i}`, analysisId })),
    );
    const acquired = claims.filter((entry) => entry.acquired && entry.job?.analysisId === analysisId);
    assert.equal(acquired.length, 1);
    await queueA.markCompleted(acquired[0].job.jobId, acquired[0].leaseToken);

    const observedA = await queueA.getByAnalysisId(analysisId);
    const observedB = await queueB.getByAnalysisId(analysisId);
    assert.equal(observedA.status, 'COMPLETED');
    assert.equal(observedB.status, 'COMPLETED');
    assert.equal(observedA.jobId, observedB.jobId);
  } finally {
    // Certification rows are intentionally retained only if cleanup fails; use the queue table directly.
    try { await queueA.pool.query('DELETE FROM cellcount_analysis_jobs WHERE analysis_id=$1::uuid', [analysisId]); } catch {}
    await Promise.allSettled([queueA.close(), queueB.close()]);
  }
});
