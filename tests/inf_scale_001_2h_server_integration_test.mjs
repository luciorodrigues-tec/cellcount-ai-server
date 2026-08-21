import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const serverSource = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');

test('INF-SCALE-001.2H server integrates adaptive admission before durable enqueue', () => {
  assert.match(serverSource, /createAdaptiveAnalysisAdmissionController/);
  assert.match(serverSource, /adaptiveAnalysisAdmissionController\.assess/);
  assert.match(serverSource, /ANALYSIS_ADMISSION_DEFERRED/);
  assert.match(serverSource, /ADMISSION_DECISIONS\.backpressure/);

  const adaptiveIndex = serverSource.indexOf('adaptiveAnalysisAdmissionController.assess');
  const atomicIndex = serverSource.indexOf('analysisJobQueue.assertEnqueueCapacity');
  const enqueueIndex = serverSource.indexOf('analysisJobQueue.enqueue');
  assert.ok(adaptiveIndex >= 0 && atomicIndex > adaptiveIndex && enqueueIndex > atomicIndex);
});

test('INF-SCALE-001.2H runtime and operational endpoint expose recommendation-only readiness', () => {
  assert.match(serverSource, /adaptiveAdmissionArchitectureVersion/);
  assert.match(serverSource, /autoscalingReadinessVersion/);
  assert.match(serverSource, /\/operational\/admission-control/);
  assert.match(serverSource, /recommendationOnly/);
});
