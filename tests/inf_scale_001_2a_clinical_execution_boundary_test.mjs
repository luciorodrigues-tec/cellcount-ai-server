import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CLINICAL_ANALYSIS_EXECUTION_BOUNDARY_VERSION,
  ClinicalAnalysisExecutionBoundary,
  createClinicalAnalysisExecutionBoundary,
} from '../services/clinicalAnalysisExecutionBoundary.js';

test('INF-SCALE-001.2A preserves clinical input and result semantics', async () => {
  const input = { images: [{ originalname: 'field-1.jpg', buffer: Buffer.from('abc') }], analysisSource: 'ai_visual', analysisType: 'bone_marrow', specimenType: 'bone_marrow', manualCounts: { blast: 0 } };
  const authoritativeResult = { success: true, analysis: { summary: 'unchanged-clinical-result' } };
  let receivedInput;
  const boundary = createClinicalAnalysisExecutionBoundary({ executor: async (value) => { receivedInput = value; return authoritativeResult; } });
  const result = await boundary.execute({ input, context: { analysisId: 'analysis-001', userId: 'user-001', attempt: 1, leaseToken: 'secret-lease-token' } });
  assert.equal(receivedInput, input);
  assert.equal(result, authoritativeResult);
  assert.equal(boundary.version, CLINICAL_ANALYSIS_EXECUTION_BOUNDARY_VERSION);
  assert.equal(boundary.scalabilityMetadata.clinicalMutation, false);
  assert.equal(boundary.scalabilityMetadata.workerReusable, true);
});

test('INF-SCALE-001.2A propagates executor failure unchanged for 006.x governance', async () => {
  const expected = Object.assign(new Error('upstream timeout'), { code: 'OPENAI_TIMEOUT', statusCode: 504 });
  const boundary = new ClinicalAnalysisExecutionBoundary({ executor: async () => { throw expected; } });
  await assert.rejects(() => boundary.execute({ input: { images: [] } }), (error) => {
    assert.equal(error, expected);
    assert.equal(error.code, 'OPENAI_TIMEOUT');
    assert.equal(error.statusCode, 504);
    return true;
  });
});

test('INF-SCALE-001.2A telemetry never exposes execution lease token', async () => {
  const events = [];
  const boundary = createClinicalAnalysisExecutionBoundary({ executor: async () => ({ ok: true }), onStart: async (event) => events.push(event), onFinish: async (event) => events.push(event) });
  await boundary.execute({ input: {}, context: { analysisId: 'analysis-telemetry', leaseToken: 'DO-NOT-EXPOSE' } });
  assert.equal(events.length, 2);
  assert.equal(events[0].context.leaseTokenPresent, true);
  assert.equal(JSON.stringify(events).includes('DO-NOT-EXPOSE'), false);
});

test('INF-SCALE-001.2A boundary is stateless across concurrent executions', async () => {
  const boundary = createClinicalAnalysisExecutionBoundary({ executor: async ({ value }) => { await new Promise((resolve) => setTimeout(resolve, 2)); return { value }; } });
  const results = await Promise.all(Array.from({ length: 32 }, (_, index) => boundary.execute({ input: { value: index }, context: { analysisId: `analysis-${index}` } })));
  assert.deepEqual(results.map((item) => item.value), Array.from({ length: 32 }, (_, index) => index));
});
