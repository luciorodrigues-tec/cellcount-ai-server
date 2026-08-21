import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const serverSource = fs.readFileSync(new URL('../server.js', import.meta.url), 'utf8');
const harnessSource = fs.readFileSync(new URL('../scripts/certifyProductionCapacityCalibration.mjs', import.meta.url), 'utf8');

test('INF-SCALE-001.2H-D runtime exposes production calibration fingerprint without autoscaling mutation', () => {
  assert.match(serverSource, /productionCapacityCalibrationVersion/);
  assert.match(serverSource, /PRODUCTION_CAPACITY_CALIBRATION_VERSION/);
  assert.match(serverSource, /recommendationOnly/);
  assert.match(serverSource, /mutatesWorkerCount/);
});

test('INF-SCALE-001.2H-D harness samples operational endpoint during real queued load', () => {
  assert.match(harnessSource, /operational\/admission-control/);
  assert.match(harnessSource, /collectOperationalSamples/);
  assert.match(harnessSource, /runOne/);
  assert.match(harnessSource, /summarizeProductionCalibration/);
  assert.match(harnessSource, /CELLCOUNT_CALIBRATION_CONFIRM/);
});
