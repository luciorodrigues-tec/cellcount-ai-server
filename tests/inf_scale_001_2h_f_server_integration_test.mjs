import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const server = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('2H-F server imports controlled activation safety gate', () => {
  assert.match(
    server,
    /controlledAutoscalingActivation\.js/,
  );
  assert.match(
    server,
    /AUTOSCALING_ACTIVATION_SAFETY_GATE_VERSION/,
  );
});

test('2H-F server composes controlled activation with the real worker pool', () => {
  assert.match(
    server,
    /resolveControlledAutoscalingConfig\(process\.env,\s*analysisWorkerPoolConfig\)/,
  );
  assert.match(
    server,
    /createControlledAutoscalingActivation\(\{[\s\S]*?workerPool:\s*analysisWorkerPool,[\s\S]*?admissionController:\s*adaptiveAnalysisAdmissionController,[\s\S]*?config:\s*controlledAutoscalingConfig,/,
  );
  assert.match(
    server,
    /controlledAutoscalingActivation\.start\(\)/,
  );
});

test('2H-F exposes activation fingerprint in operational and runtime surfaces', () => {
  const versionCount =
    (server.match(/autoscalingActivationSafetyGateVersion:/g) || []).length;
  const metadataCount =
    (server.match(/controlledAutoscaling:/g) || []).length;
  const statusCount =
    (server.match(/controlledAutoscalingActivation\?\.status/g) || []).length;
  const allowedCount =
    (server.match(/controlledAutoscalingActivation\?\.automaticScalingAllowed/g) || []).length;

  assert.ok(versionCount >= 2, `expected >=2 activation version surfaces, got ${versionCount}`);
  assert.ok(metadataCount >= 2, `expected >=2 controlled autoscaling surfaces, got ${metadataCount}`);
  assert.ok(statusCount >= 2, `expected >=2 dynamic policy status surfaces, got ${statusCount}`);
  assert.ok(allowedCount >= 2, `expected >=2 dynamic automaticScalingAllowed surfaces, got ${allowedCount}`);
});

test('2H-F does not enable autoscaling by source-code default', () => {
  assert.doesNotMatch(
    server,
    /CELLCOUNT_AUTOSCALING_ENABLED\s*=\s*true/,
  );
});
