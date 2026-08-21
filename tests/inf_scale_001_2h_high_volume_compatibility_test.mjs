import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ADMISSION_CONTROL_CLASSES,
  classifyAdmissionControlResponse,
} from '../scripts/certifyHighVolumeBackpressure.mjs';

test('INF-SCALE-001.2H high-volume harness recognizes adaptive defer without calling it queue saturation', () => {
  const out = classifyAdmissionControlResponse({
    status: 503,
    body: {
      errorCode: 'ANALYSIS_ADMISSION_DEFERRED',
      error: 'Capacidade de análise temporariamente sob pressão.',
    },
  });
  assert.equal(out.controlled, true);
  assert.equal(out.admissionClass, ADMISSION_CONTROL_CLASSES.adaptiveDefer);
  assert.equal(out.queueBackpressured, false);
  assert.equal(out.rateLimited, true);
});
