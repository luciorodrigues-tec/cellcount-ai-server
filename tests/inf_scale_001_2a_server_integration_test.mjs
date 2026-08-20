import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
const serverSource = await readFile(new URL('../server.js', import.meta.url), 'utf8');
test('INF-SCALE-001.2A server invokes heavy analysis through execution boundary', () => {
  assert.match(serverSource, /createClinicalAnalysisExecutionBoundary\(\{[\s\S]*executor:\s*analyzeWithOpenAI/);
  assert.match(serverSource, /await clinicalAnalysisExecutionBoundary\.execute\(\{[\s\S]*source:\s*"analyze-slide"/);
});
test('INF-SCALE-001.2A runtime exposes worker-ready non-mutating boundary metadata', () => {
  assert.match(serverSource, /clinicalAnalysisExecutionBoundaryVersion/);
  assert.match(serverSource, /clinicalAnalysisExecutionBoundary\.scalabilityMetadata/);
});
