import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

export const CERTIFICATION_VERSION = 'INF-SCALE-001.2F.2';
export const DEFAULT_POLL_REQUEST_TIMEOUT_MS = 15_000;
export const FINAL_RECONCILIATION_ATTEMPTS = 3;
export const HIGH_VOLUME_CONFIRMATION = 'I_UNDERSTAND_REAL_CLINICAL_LOAD';
export const DEFAULT_SCALE_EFFICIENCY_GATE = 0.70;

export function percentile(values, p) {
  if (!Array.isArray(values) || values.length === 0) return null;
  const sorted = [...values].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const rank = Math.ceil((Math.max(0, Math.min(100, Number(p))) / 100) * sorted.length) - 1;
  return sorted[Math.max(0, rank)];
}

export function parseLevels(value, expectedWorkers) {
  if (!String(value || '').trim()) return expectedWorkers <= 2 ? [5, 10] : [10, 25];
  const levels = [...new Set(String(value).split(',').map((v) => Number(v.trim())).filter((v) => Number.isInteger(v) && v > 0))];
  if (!levels.length) throw new Error('CELLCOUNT_SCALE_LEVELS must contain positive integers');
  return levels.sort((a, b) => a - b);
}

export function assertHighVolumeUnlocked(levels, confirmation) {
  const max = Math.max(...levels);
  if (max > 10 && String(confirmation || '').trim() !== HIGH_VOLUME_CONFIRMATION) {
    throw new Error(`Levels above 10 execute real clinical analyses. Set CELLCOUNT_SCALE_HIGH_VOLUME_CONFIRM=${HIGH_VOLUME_CONFIRMATION} to continue.`);
  }
  if (max > 25) throw new Error('INF-SCALE-001.2F caps a single horizontal-scaling stage at 25 concurrent submissions.');
}

export function evaluateScale({ baselineWorkers = 1, baselineThroughputPerMinute, observedWorkers, observedThroughputPerMinute, efficiencyGate = DEFAULT_SCALE_EFFICIENCY_GATE }) {
  const bw = Number(baselineWorkers);
  const bt = Number(baselineThroughputPerMinute);
  const ow = Number(observedWorkers);
  const ot = Number(observedThroughputPerMinute);
  assert.ok(Number.isFinite(bw) && bw > 0, 'baselineWorkers must be > 0');
  assert.ok(Number.isFinite(bt) && bt > 0, 'baselineThroughputPerMinute must be > 0');
  assert.ok(Number.isFinite(ow) && ow > bw, 'observedWorkers must exceed baselineWorkers');
  assert.ok(Number.isFinite(ot) && ot >= 0, 'observedThroughputPerMinute must be >= 0');
  const idealScaleFactor = ow / bw;
  const observedScaleFactor = ot / bt;
  const efficiency = observedScaleFactor / idealScaleFactor;
  return {
    baselineWorkers: bw,
    baselineThroughputPerMinute: bt,
    observedWorkers: ow,
    observedThroughputPerMinute: ot,
    idealScaleFactor: Number(idealScaleFactor.toFixed(3)),
    observedScaleFactor: Number(observedScaleFactor.toFixed(3)),
    efficiency: Number(efficiency.toFixed(3)),
    efficiencyGate: Number(efficiencyGate),
    pass: efficiency >= Number(efficiencyGate),
  };
}

export function summarizeStage({ level, startedAt, endedAt, records }) {
  const accepted = records.filter((r) => r.submitAccepted);
  const completed = records.filter((r) => r.finalStatus === 'COMPLETED');
  const failed = records.filter((r) => r.finalStatus === 'FAILED' || r.finalStatus === 'EXPIRED' || r.finalStatus === 'TIMEOUT' || r.error);
  const backpressured = records.filter((r) => r.httpStatus === 503 || r.errorCode === 'ANALYSIS_QUEUE_BACKPRESSURE');
  const analysisIds = accepted.map((r) => r.analysisId).filter(Boolean);
  const duplicateAnalysisIds = analysisIds.length - new Set(analysisIds).size;
  const attempts = completed.map((r) => Number(r.attempts)).filter(Number.isFinite);
  const durationMs = Math.max(1, endedAt - startedAt);
  const submitLatency = accepted.map((r) => r.submitLatencyMs).filter(Number.isFinite);
  const e2eLatency = completed.map((r) => r.e2eLatencyMs).filter(Number.isFinite);
  return {
    level,
    durationMs,
    submitted: records.length,
    accepted: accepted.length,
    completed: completed.length,
    failed: failed.length,
    backpressured: backpressured.length,
    duplicateAnalysisIds,
    maxAttempts: attempts.length ? Math.max(...attempts) : null,
    submitLatencyMs: {
      p50: percentile(submitLatency, 50), p95: percentile(submitLatency, 95), p99: percentile(submitLatency, 99), max: submitLatency.length ? Math.max(...submitLatency) : null,
    },
    e2eLatencyMs: {
      p50: percentile(e2eLatency, 50), p95: percentile(e2eLatency, 95), p99: percentile(e2eLatency, 99), max: e2eLatency.length ? Math.max(...e2eLatency) : null,
    },
    throughputCompletedPerMinute: Number(((completed.length / durationMs) * 60_000).toFixed(3)),
    pass: failed.length === 0 && duplicateAnalysisIds === 0 && completed.length === accepted.length && attempts.every((v) => v === 1),
  };
}

function required(name) {
  const value = String(process.env[name] || '').trim();
  if (!value) throw new Error(`${name} is required`);
  return value;
}
function positiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min) return fallback;
  return Math.min(parsed, max);
}
function numberInRange(value, fallback, { min, max }) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= min && parsed <= max ? parsed : fallback;
}
function mimeFor(filename) {
  const ext = path.extname(filename).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.tif' || ext === '.tiff') return 'image/tiff';
  return 'image/jpeg';
}
function normalizedBaseUrl(value) { return String(value || 'https://api.rodrigueslucio.com').trim().replace(/\/+$/, ''); }
async function parseJsonResponse(response, label) {
  const text = await response.text();
  let json = {};
  try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`${label}: HTTP ${response.status} returned non-JSON`); }
  if (!response.ok) {
    const error = new Error(`${label}: HTTP ${response.status}: ${json?.error || json?.errorCode || 'request failed'}`);
    error.httpStatus = response.status;
    error.errorCode = json?.errorCode || json?.code || null;
    error.response = json;
    throw error;
  }
  return json;
}
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithObservationTimeout(url, options = {}, { timeoutMs = DEFAULT_POLL_REQUEST_TIMEOUT_MS, label = 'request' } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new Error(`${label}: observation request timed out after ${timeoutMs}ms`)), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    const wrapped = new Error(`${label}: ${error?.name === 'AbortError' ? 'POLL_TRANSPORT_TIMEOUT' : 'POLL_TRANSPORT_ERROR'}: ${error?.message || error}`);
    wrapped.code = error?.name === 'AbortError' ? 'POLL_TRANSPORT_TIMEOUT' : 'POLL_TRANSPORT_ERROR';
    wrapped.cause = error;
    throw wrapped;
  } finally {
    clearTimeout(timer);
  }
}

function applyTerminalSession(record, session, submitStartedAt, { recoveredBy = 'recovery' } = {}) {
  const status = String(session?.status || 'UNKNOWN');
  if (!['COMPLETED', 'FAILED', 'EXPIRED'].includes(status)) return false;
  record.finalStatus = status;
  record.attempts = Number(session?.attempt);
  const persistedCompletedMs = Date.parse(String(session?.completedAt || session?.failedAt || ''));
  record.e2eLatencyMs = Number.isFinite(persistedCompletedMs)
    ? Math.max(0, persistedCompletedMs - submitStartedAt)
    : Date.now() - submitStartedAt;
  record.resultVisible = status === 'COMPLETED' ? Boolean(session?.result && typeof session.result === 'object') : false;
  record.recoveredBy = recoveredBy;
  return true;
}

export async function reconcileAuthoritativeSession({ baseUrl, headers, analysisId, ordinal, submitStartedAt, requestTimeoutMs, attempts = FINAL_RECONCILIATION_ATTEMPTS }) {
  let lastError = null;
  for (let i = 1; i <= attempts; i += 1) {
    try {
      const response = await fetchWithObservationTimeout(
        `${baseUrl}/analysis-sessions/${encodeURIComponent(analysisId)}`,
        { headers },
        { timeoutMs: requestTimeoutMs, label: `direct-read[${ordinal}]#${i}` },
      );
      const direct = await parseJsonResponse(response, `direct-read[${ordinal}]#${i}`);
      const session = direct?.session;
      if (session) {
        return { observed: true, terminal: ['COMPLETED', 'FAILED', 'EXPIRED'].includes(String(session.status)), session, error: null };
      }
    } catch (error) {
      lastError = error;
    }
    if (i < attempts) await sleep(250 * i);
  }
  return { observed: false, terminal: false, session: null, error: lastError };
}

async function runOne({ baseUrl, apiToken, image, imagePath, specimenType, pollMs, timeoutMs, pollRequestTimeoutMs, stageId, ordinal }) {
  const userId = `inf-scale-001-2f-${stageId}-${ordinal}-${crypto.randomUUID()}`;
  const idempotencyKey = `inf-scale-001.2f-${stageId}-${ordinal}-${crypto.randomUUID()}`;
  const headers = { Authorization: `Bearer ${apiToken}`, 'x-user-id': userId };
  const record = {
    ordinal, userId, idempotencyKey, submitAccepted: false, analysisId: null, jobId: null,
    finalStatus: null, attempts: null, error: null, errorCode: null,
    pollTransportErrors: 0, observationRecovered: false, recoveredBy: null,
  };
  try {
    const created = await parseJsonResponse(await fetch(`${baseUrl}/analysis-sessions`, {
      method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ idempotencyKey, analysisSource: 'ai_visual', specimenType, imageCount: 1, clientCreatedAt: new Date().toISOString() }),
    }), `create[${ordinal}]`);
    record.analysisId = created?.session?.analysisId;
    assert.ok(record.analysisId);

    const form = new FormData();
    form.append('analysisId', record.analysisId);
    form.append('idempotencyKey', idempotencyKey);
    form.append('analysisSource', 'ai_visual');
    form.append('specimenType', specimenType);
    form.append('specimenDecision', JSON.stringify({ status: 'accepted', effectiveType: specimenType, confidence: 1, source: CERTIFICATION_VERSION }));
    form.append('manualCounts', '{}');
    form.append('image', new Blob([image], { type: mimeFor(imagePath) }), path.basename(imagePath));

    const submitStartedAt = Date.now();
    const submitResponse = await fetch(`${baseUrl}/analyze-slide`, { method: 'POST', headers, body: form });
    record.httpStatus = submitResponse.status;
    const submit = await parseJsonResponse(submitResponse, `submit[${ordinal}]`);
    record.submitLatencyMs = Date.now() - submitStartedAt;
    record.submitAccepted = true;
    record.jobId = submit?.job?.jobId || null;
    assert.equal(submit.analysisId, record.analysisId);
    assert.equal(submit.queued, true);

    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const response = await fetchWithObservationTimeout(
          `${baseUrl}/analysis-sessions/${encodeURIComponent(record.analysisId)}/recovery`,
          { headers },
          { timeoutMs: pollRequestTimeoutMs, label: `recovery[${ordinal}]` },
        );
        const recovery = await parseJsonResponse(response, `recovery[${ordinal}]`);
        const session = recovery?.recovery?.session;
        if (applyTerminalSession(record, session, submitStartedAt, { recoveredBy: 'recovery' })) return record;
      } catch (error) {
        if (error?.httpStatus === 401 || error?.httpStatus === 403 || error?.httpStatus === 404) throw error;
        record.pollTransportErrors += 1;
        record.lastPollObservationError = String(error?.message || error);
      }
      await sleep(pollMs);
    }

    // INF-SCALE-001.2F.2: TIMEOUT can only be declared after a direct authoritative
    // session read. This prevents an observation/polling gap from being misclassified
    // as a clinical execution stall.
    const reconciliation = await reconcileAuthoritativeSession({
      baseUrl, headers, analysisId: record.analysisId, ordinal, submitStartedAt,
      requestTimeoutMs: pollRequestTimeoutMs,
    });
    if (reconciliation.observed) {
      if (applyTerminalSession(record, reconciliation.session, submitStartedAt, { recoveredBy: 'authoritative_direct_read' })) {
        record.observationRecovered = true;
        return record;
      }
      record.finalStatus = 'CLINICAL_EXECUTION_TIMEOUT';
      record.attempts = Number(reconciliation.session?.attempt);
      record.errorCode = 'CLINICAL_EXECUTION_TIMEOUT';
      record.error = `Authoritative session remained ${reconciliation.session?.status || 'non-terminal'} after ${timeoutMs}ms`;
      return record;
    }

    record.finalStatus = 'HARNESS_OBSERVATION_TIMEOUT';
    record.errorCode = 'HARNESS_OBSERVATION_TIMEOUT';
    record.error = `Could not observe authoritative session after ${timeoutMs}ms; last=${reconciliation.error?.message || record.lastPollObservationError || 'unknown'}`;
    return record;
  } catch (error) {
    record.httpStatus = error?.httpStatus || record.httpStatus || null;
    record.errorCode = error?.errorCode || error?.response?.errorCode || error?.code || null;
    record.error = String(error?.message || error);
    return record;
  }
}

export async function main() {
  const baseUrl = normalizedBaseUrl(process.env.CELLCOUNT_SCALE_BASE_URL);
  const apiToken = required('CELLCOUNT_SCALE_API_TOKEN');
  const imagePath = path.resolve(required('CELLCOUNT_SCALE_IMAGE'));
  const specimenType = String(process.env.CELLCOUNT_SCALE_SPECIMEN_TYPE || 'PERIPHERAL_BLOOD').trim().toUpperCase();
  const expectedWorkers = positiveInt(required('CELLCOUNT_SCALE_EXPECTED_WORKERS'), 0, { min: 2, max: 16 });
  if (![2, 4].includes(expectedWorkers)) throw new Error('INF-SCALE-001.2F certification currently allows expected workers 2 or 4 only.');
  const baselineWorkers = positiveInt(process.env.CELLCOUNT_SCALE_BASELINE_WORKERS, 1, { min: 1, max: 16 });
  const baselineThroughputPerMinute = Number(required('CELLCOUNT_SCALE_BASELINE_THROUGHPUT_PER_MIN'));
  if (!Number.isFinite(baselineThroughputPerMinute) || baselineThroughputPerMinute <= 0) throw new Error('CELLCOUNT_SCALE_BASELINE_THROUGHPUT_PER_MIN must be > 0');
  const efficiencyGate = numberInRange(process.env.CELLCOUNT_SCALE_EFFICIENCY_GATE, DEFAULT_SCALE_EFFICIENCY_GATE, { min: 0.4, max: 1.1 });
  const levels = parseLevels(process.env.CELLCOUNT_SCALE_LEVELS, expectedWorkers);
  assertHighVolumeUnlocked(levels, process.env.CELLCOUNT_SCALE_HIGH_VOLUME_CONFIRM);
  const pollMs = positiveInt(process.env.CELLCOUNT_SCALE_POLL_MS, 1000, { min: 250, max: 10_000 });
  const pollRequestTimeoutMs = positiveInt(process.env.CELLCOUNT_SCALE_POLL_REQUEST_TIMEOUT_MS, DEFAULT_POLL_REQUEST_TIMEOUT_MS, { min: 1000, max: 60_000 });
  const timeoutMs = positiveInt(process.env.CELLCOUNT_SCALE_STAGE_TIMEOUT_MS, 900_000, { min: 60_000, max: 7_200_000 });
  const cooldownMs = positiveInt(process.env.CELLCOUNT_SCALE_COOLDOWN_MS, 5000, { min: 0, max: 120_000 });
  const image = await fs.readFile(imagePath);
  assert.ok(image.length > 0);

  const runtime = await parseJsonResponse(await fetch(`${baseUrl}/runtime-version`), 'runtime-version');
  assert.equal(runtime.analysisExecutionMode, 'queued');
  assert.equal(runtime.analysisSessionStorage?.provider, 'postgres');
  assert.equal(runtime.distributedAnalysisWorkerPool?.running, true);
  const observedWorkers = Number(runtime.distributedAnalysisWorkerPool?.concurrency || 0);
  assert.equal(observedWorkers, expectedWorkers, `Runtime worker concurrency ${observedWorkers} does not match expected ${expectedWorkers}`);
  const maxQueueDepth = Number(runtime.distributedAnalysisWorkerPool?.maxQueueDepth || 0);

  console.log(`[${CERTIFICATION_VERSION}] target=${baseUrl}`);
  console.log(`[${CERTIFICATION_VERSION}] specimenType=${specimenType} image=${path.basename(imagePath)} bytes=${image.length}`);
  console.log(`[${CERTIFICATION_VERSION}] workers=${observedWorkers} levels=${levels.join(',')} baseline=${baselineWorkers}w@${baselineThroughputPerMinute}/min efficiencyGate=${efficiencyGate} pollRequestTimeoutMs=${pollRequestTimeoutMs}`);

  const stageSummaries = [];
  for (const level of levels) {
    const stageId = `${Date.now()}-${observedWorkers}w-${level}`;
    console.log(`[${CERTIFICATION_VERSION}] STAGE workers=${observedWorkers} level=${level} starting`);
    const startedAt = Date.now();
    const records = await Promise.all(Array.from({ length: level }, (_, i) => runOne({ baseUrl, apiToken, image, imagePath, specimenType, pollMs, timeoutMs, pollRequestTimeoutMs, stageId, ordinal: i + 1 })));
    const endedAt = Date.now();
    const summary = summarizeStage({ level, startedAt, endedAt, records });
    stageSummaries.push(summary);
    console.log(JSON.stringify({ stage: summary, failures: records.filter((r) => r.error || (r.finalStatus && r.finalStatus !== 'COMPLETED')).map((r) => ({ ordinal: r.ordinal, httpStatus: r.httpStatus, errorCode: r.errorCode, finalStatus: r.finalStatus, pollTransportErrors: r.pollTransportErrors, observationRecovered: r.observationRecovered, recoveredBy: r.recoveredBy, error: r.error })) }, null, 2));
    if (cooldownMs > 0 && level !== levels.at(-1)) await sleep(cooldownMs);
  }

  const saturationStage = stageSummaries.at(-1);
  const scale = evaluateScale({ baselineWorkers, baselineThroughputPerMinute, observedWorkers, observedThroughputPerMinute: saturationStage.throughputCompletedPerMinute, efficiencyGate });
  const certification = {
    certificationVersion: CERTIFICATION_VERSION,
    success: stageSummaries.every((s) => s.pass) && scale.pass,
    runtime: { workerConcurrency: observedWorkers, maxQueueDepth, executionMode: runtime.analysisExecutionMode },
    baseline: { workerConcurrency: baselineWorkers, throughputCompletedPerMinute: baselineThroughputPerMinute },
    levels,
    stages: stageSummaries,
    scaling: scale,
    gates: {
      zeroDuplicateAnalysisIds: stageSummaries.every((s) => s.duplicateAnalysisIds === 0),
      noTerminalFailures: stageSummaries.every((s) => s.failed === 0),
      allAcceptedComplete: stageSummaries.every((s) => s.completed === s.accepted),
      singleAttemptCleanPath: stageSummaries.every((s) => s.maxAttempts === 1),
      horizontalScaleEfficiency: scale.pass,
    },
  };
  console.log(JSON.stringify(certification, null, 2));
  if (!certification.success) process.exitCode = 1;
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntrypoint) main().catch((error) => { console.error(`[${CERTIFICATION_VERSION}] FATAL`, error); process.exitCode = 1; });
