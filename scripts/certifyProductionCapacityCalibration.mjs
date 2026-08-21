import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  runOne,
  summarizeStage,
} from './certifyHighVolumeBackpressure.mjs';
import {
  PRODUCTION_CAPACITY_CALIBRATION_VERSION,
  summarizeProductionCalibration,
} from '../services/productionCapacityCalibration.js';

export const CALIBRATION_CONFIRMATION = 'I_UNDERSTAND_PRODUCTION_CAPACITY_CALIBRATION';
export const ALLOWED_LEVELS = Object.freeze([25, 50, 100]);

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function positiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const n = Number(value);
  return Number.isInteger(n) && n >= min ? Math.min(n, max) : fallback;
}
function normalizedBaseUrl(value) { return String(value || 'https://api.rodrigueslucio.com').trim().replace(/\/+$/, ''); }
function parseLevel(value) {
  const level = Number(value || 25);
  if (!ALLOWED_LEVELS.includes(level)) throw new Error('INF-SCALE-001.2H-D only certifies levels 25, 50 or 100.');
  return level;
}
function assertUnlocked(value) {
  if (String(value || '').trim() !== CALIBRATION_CONFIRMATION) {
    throw new Error(`INF-SCALE-001.2H-D executes real clinical analyses. Set CELLCOUNT_CALIBRATION_CONFIRM=${CALIBRATION_CONFIRMATION} to continue.`);
  }
}
async function parseJsonResponse(response, label) {
  const text = await response.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`${label}: HTTP ${response.status} returned non-JSON`); }
  if (!response.ok) {
    const error = new Error(`${label}: HTTP ${response.status}: ${json?.error || json?.errorCode || 'request failed'}`);
    error.httpStatus = response.status;
    throw error;
  }
  return json;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function collectOperationalSamples({ baseUrl, apiToken, intervalMs, stopSignal }) {
  const samples = [];
  let transportErrors = 0;
  while (!stopSignal.stopped) {
    const observedAtMs = Date.now();
    try {
      const response = await fetch(`${baseUrl}/operational/admission-control`, {
        headers: { Authorization: `Bearer ${apiToken}` },
      });
      const json = await parseJsonResponse(response, 'operational/admission-control');
      samples.push({ ...json, observedAtMs });
    } catch {
      transportErrors += 1;
    }
    await sleep(intervalMs);
  }
  return { samples, transportErrors };
}

export async function main() {
  const baseUrl = normalizedBaseUrl(process.env.CELLCOUNT_CALIBRATION_BASE_URL);
  const apiToken = required('CELLCOUNT_CALIBRATION_API_TOKEN');
  const imagePath = path.resolve(required('CELLCOUNT_CALIBRATION_IMAGE'));
  const specimenType = String(process.env.CELLCOUNT_CALIBRATION_SPECIMEN_TYPE || 'PERIPHERAL_BLOOD').trim().toUpperCase();
  const level = parseLevel(process.env.CELLCOUNT_CALIBRATION_LEVEL);
  assertUnlocked(process.env.CELLCOUNT_CALIBRATION_CONFIRM);
  const expectedWorkers = positiveInt(process.env.CELLCOUNT_CALIBRATION_EXPECTED_WORKERS, 4, { min: 1, max: 32 });
  const sampleIntervalMs = positiveInt(process.env.CELLCOUNT_CALIBRATION_SAMPLE_INTERVAL_MS, 1500, { min: 500, max: 10_000 });
  const pollMs = positiveInt(process.env.CELLCOUNT_CALIBRATION_POLL_MS, 1500, { min: 500, max: 10_000 });
  const pollRequestTimeoutMs = positiveInt(process.env.CELLCOUNT_CALIBRATION_POLL_REQUEST_TIMEOUT_MS, 15_000, { min: 1000, max: 60_000 });
  const timeoutMs = positiveInt(process.env.CELLCOUNT_CALIBRATION_STAGE_TIMEOUT_MS, 1_800_000, { min: 60_000, max: 7_200_000 });
  const image = await fs.readFile(imagePath);
  assert.ok(image.length > 0);

  const runtime = await parseJsonResponse(await fetch(`${baseUrl}/runtime-version`), 'runtime-version');
  assert.equal(runtime.analysisExecutionMode, 'queued');
  assert.equal(runtime.analysisSessionStorage?.provider, 'postgres');
  assert.equal(runtime.distributedAnalysisWorkerPool?.running, true);
  assert.equal(Number(runtime.distributedAnalysisWorkerPool?.concurrency || 0), expectedWorkers);
  assert.equal(runtime.capacityEnvelopeCertificationVersion, 'INF-SCALE-001.2H-C');
  assert.equal(runtime.adaptiveAdmissionControl?.recommendationOnly, true);
  assert.equal(runtime.adaptiveAdmissionControl?.mutatesWorkerCount, false);

  const maxQueueDepth = Number(runtime.distributedAnalysisWorkerPool?.maxQueueDepth || 100);
  console.log(`[${PRODUCTION_CAPACITY_CALIBRATION_VERSION}] target=${baseUrl}`);
  console.log(`[${PRODUCTION_CAPACITY_CALIBRATION_VERSION}] specimenType=${specimenType} image=${path.basename(imagePath)} bytes=${image.length}`);
  console.log(`[${PRODUCTION_CAPACITY_CALIBRATION_VERSION}] workers=${expectedWorkers} maxQueueDepth=${maxQueueDepth} level=${level} sampleIntervalMs=${sampleIntervalMs}`);

  const stopSignal = { stopped: false };
  const samplerPromise = collectOperationalSamples({ baseUrl, apiToken, intervalMs: sampleIntervalMs, stopSignal });
  const stageId = `${Date.now()}-${expectedWorkers}w-${level}`;
  const startedAtMs = Date.now();
  const records = await Promise.all(Array.from({ length: level }, (_, i) => runOne({
    baseUrl,
    apiToken,
    image,
    imagePath,
    specimenType,
    pollMs,
    timeoutMs,
    pollRequestTimeoutMs,
    stageId,
    ordinal: i + 1,
  })));
  const endedAtMs = Date.now();
  stopSignal.stopped = true;
  const telemetry = await samplerPromise;
  const stage = summarizeStage({ level, startedAt: startedAtMs, endedAt: endedAtMs, records, maxQueueDepth });
  const calibration = summarizeProductionCalibration({
    samples: telemetry.samples,
    startedAtMs,
    endedAtMs,
    accepted: stage.accepted,
    completed: stage.completed,
    admissionControlled: stage.admissionControlled,
    observedThroughputPerMinute: stage.throughputCompletedPerMinute,
    softQueuePressure: Number(runtime.adaptiveAdmissionControl?.softQueuePressure || 0.75),
  });

  const success = Boolean(stage.pass && calibration.pass);
  const result = {
    certificationVersion: PRODUCTION_CAPACITY_CALIBRATION_VERSION,
    success,
    level,
    runtime: {
      workerConcurrency: expectedWorkers,
      maxQueueDepth,
      recommendationOnly: runtime.adaptiveAdmissionControl?.recommendationOnly === true,
      mutatesWorkerCount: runtime.adaptiveAdmissionControl?.mutatesWorkerCount === true,
    },
    stage,
    telemetry: {
      sampleCount: telemetry.samples.length,
      transportErrors: telemetry.transportErrors,
    },
    calibration,
  };
  console.log(JSON.stringify(result, null, 2));
  if (!success) process.exitCode = 1;
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntrypoint) main().catch((error) => { console.error(`[${PRODUCTION_CAPACITY_CALIBRATION_VERSION}] FATAL`, error); process.exitCode = 1; });
