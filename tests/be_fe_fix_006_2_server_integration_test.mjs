import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const server = await readFile(
  new URL('../server.js', import.meta.url),
  'utf8',
);

test('006.2 server uses atomic execution claim before OpenAI analysis', () => {
  assert.match(server, /analysisSessionStore\.claimExecution/);
  assert.match(server, /ANALYSIS_SESSION_IN_PROGRESS/);
  assert.match(server, /status\(202\)/);
  assert.match(server, /activeAnalysisExecutionLeaseToken/);

  const claimIndex = server.indexOf('analysisSessionStore.claimExecution');
  const aiIndex = server.indexOf('await analyzeWithOpenAI', claimIndex);
  assert.ok(claimIndex >= 0);
  assert.ok(aiIndex > claimIndex);
});

test('006.2 terminal persistence is lease-protected', () => {
  assert.match(
    server,
    /markCompleted\([\s\S]*leaseToken:\s*activeAnalysisExecutionLeaseToken/,
  );
  assert.match(
    server,
    /markFailed\([\s\S]*leaseToken:\s*activeAnalysisExecutionLeaseToken/,
  );
});

test('006.2 runtime fingerprint is exported through the session contract', () => {
  assert.match(server, /resilientAnalysisSessionContractVersion/);
  assert.match(server, /ANALYSIS_SESSION_CONTRACT_VERSION/);
});
