import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const server = await readFile(
  new URL('../server.js', import.meta.url),
  'utf8',
);

test('006.5 server exposes retry governance route and runtime fingerprint', () => {
  assert.match(server, /"\/analysis-sessions\/:analysisId\/retry"/);
  assert.match(server, /analysisSessionStore\.prepareRetry/);
  assert.match(server, /resilientAnalysisSessionContractVersion/);
  assert.match(server, /ANALYSIS_SESSION_CONTRACT_VERSION/);
});

test('006.5 server distinguishes expiration and retry-safe states', () => {
  assert.match(server, /ANALYSIS_SESSION_EXPIRED/);
  assert.match(server, /ANALYSIS_SESSION_MAX_ATTEMPTS_EXHAUSTED/);
  assert.match(server, /RETRY_ELIGIBLE/);
  assert.match(server, /claimExecution/);
});
