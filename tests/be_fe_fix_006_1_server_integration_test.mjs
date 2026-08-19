import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const server = await readFile(new URL('../server.js', import.meta.url), 'utf8');

test('006.1 server exposes persistent session endpoints and runtime fingerprint', () => {
  assert.match(server, /"\/analysis-sessions"/);
  assert.match(server, /"\/analysis-sessions\/:analysisId"/);
  assert.match(server, /resilientAnalysisSessionContractVersion/);
  assert.match(server, /analysisSessionStore\.markCompleted/);
  assert.match(server, /analysisSessionStore\.markFailed/);
});
