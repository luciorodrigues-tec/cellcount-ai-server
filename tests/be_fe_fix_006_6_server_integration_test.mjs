import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const server = await readFile(
  new URL('../server.js', import.meta.url),
  'utf8',
);

test('006.6 server exposes read-only recovery orchestration endpoint', () => {
  assert.match(server, /"\/analysis-sessions\/:analysisId\/recovery"/);
  assert.match(server, /analysisSessionStore\.getRecoverySnapshot/);
  assert.match(server, /ANALYSIS_RECOVERY_ORCHESTRATION_VERSION/);
  assert.match(server, /analysisRecoveryOrchestrationVersion/);
});

test('006.6 recovery endpoint is distinct from retry and analyze execution', () => {
  const recoveryRoute = server.indexOf(
    '"/analysis-sessions/:analysisId/recovery"',
  );
  const retryRoute = server.indexOf(
    '"/analysis-sessions/:analysisId/retry"',
  );
  const analyzeRoute = server.indexOf('"/analyze-slide"');

  assert.ok(recoveryRoute >= 0);
  assert.ok(retryRoute >= 0);
  assert.ok(analyzeRoute >= 0);
  assert.notEqual(recoveryRoute, retryRoute);
  assert.notEqual(recoveryRoute, analyzeRoute);
});
