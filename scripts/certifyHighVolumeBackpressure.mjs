import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import {
  fetchWithObservationTimeout,
  reconcileAuthoritativeSession,
} from './certifyHorizontalWorkerScaling.mjs';

export const CERTIFICATION_VERSION = 'INF-SCALE-001.2G.1';
export const DEFAULT_LEVELS = Object.freeze([25]);
export const FULL_LEVELS = Object.freeze([25, 50, 100]);
export const HIGH_VOLUME_CONFIRMATION = 'I_UNDERSTAND_25_50_100_REAL_CLINICAL_LOAD';
export const DEFAULT_POLL_REQUEST_TIMEOUT_MS = 15_000;

export const ADMISSION_CONTROL_CLASSES = Object.freeze({
  queueBackpressure: 'QUEUE_BACKPRESSURE',
  httpRateLimitThrottle: 'HTTP_RATE_LIMIT_THROTTLE',
  adaptiveDefer: 'ADAPTIVE_DEFER',
  unknown: 'UNKNOWN',
});

function normalizedText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function classifyAdmissionControlResponse({ status, body = {}, retryAfter = null } = {}) {
  const httpStatus = Number(status);
  const errorCode = String(body?.errorCode || body?.code || '').trim().toUpperCase();
  const message = normalizedText(body?.error || body?.message || body?.detail || '');
  const hasRetryAfter = retryAfter !== null && retryAfter !== undefined && String(retryAfter).trim().length > 0;

  if (httpStatus === 503 && errorCode === 'ANALYSIS_QUEUE_BACKPRESSURE') {
    return Object.freeze({ controlled: true, admissionClass: ADMISSION_CONTROL_CLASSES.queueBackpressure, queueBackpressured: true, rateLimited: false, errorCode: 'ANALYSIS_QUEUE_BACKPRESSURE' });
  }

  if (httpStatus === 503 && errorCode === 'ANALYSIS_ADMISSION_DEFERRED') {
    return Object.freeze({ controlled: true, admissionClass: ADMISSION_CONTROL_CLASSES.adaptiveDefer, queueBackpressured: false, rateLimited: true, errorCode: 'ANALYSIS_ADMISSION_DEFERRED' });
  }

  const recognized429 = httpStatus === 429 && (
    hasRetryAfter ||
    ['RATE_LIMIT','RATE_LIMITED','TOO_MANY_REQUESTS','HTTP_RATE_LIMIT','HTTP_RATE_LIMIT_THROTTLE'].includes(errorCode) ||
    message.includes('muitas requisicoes') ||
    message.includes('too many requests') ||
    message.includes('rate limit')
  );

  if (recognized429) {
    return Object.freeze({ controlled: true, admissionClass: ADMISSION_CONTROL_CLASSES.httpRateLimitThrottle, queueBackpressured: false, rateLimited: true, errorCode: errorCode || 'HTTP_RATE_LIMIT_THROTTLE' });
  }

  return Object.freeze({ controlled: false, admissionClass: ADMISSION_CONTROL_CLASSES.unknown, queueBackpressured: false, rateLimited: false, errorCode: errorCode || null });
}

export function percentile(values, p) {
  const sorted = [...(values || [])].map(Number).filter(Number.isFinite).sort((a, b) => a - b);
  if (!sorted.length) return null;
  const rank = Math.ceil((Math.max(0, Math.min(100, Number(p))) / 100) * sorted.length) - 1;
  return sorted[Math.max(0, rank)];
}

export function parseLevels(value) {
  if (!String(value || '').trim()) return [...DEFAULT_LEVELS];
  const levels = [...new Set(String(value).split(',').map((v) => Number(v.trim())).filter((v) => Number.isInteger(v) && v > 0))].sort((a, b) => a - b);
  if (!levels.length) throw new Error('CELLCOUNT_VOLUME_LEVELS must contain positive integers');
  if (levels.some((v) => !FULL_LEVELS.includes(v))) throw new Error('INF-SCALE-001.2G only certifies levels 25, 50 and 100.');
  return levels;
}

export function assertHighVolumeUnlocked(levels, confirmation) {
  if (String(confirmation || '').trim() !== HIGH_VOLUME_CONFIRMATION) {
    throw new Error(`INF-SCALE-001.2G executes real clinical analyses. Set CELLCOUNT_VOLUME_CONFIRM=${HIGH_VOLUME_CONFIRMATION} to continue.`);
  }
  if (Math.max(...levels) > 100) throw new Error('INF-SCALE-001.2G caps certification at 100 concurrent submissions.');
}

export function summarizeStage({ level, startedAt, endedAt, records, maxQueueDepth }) {
  const accepted = records.filter((r) => r.submitAccepted);
  const queueBackpressured = records.filter((r) => r.queueBackpressured === true);
  const rateLimited = records.filter((r) => r.rateLimited === true);
  const admissionControlled = records.filter((r) => r.queueBackpressured === true || r.rateLimited === true);
  const completed = records.filter((r) => r.finalStatus === 'COMPLETED');
  const terminalFailures = records.filter((r) => ['FAILED', 'EXPIRED', 'CLINICAL_EXECUTION_TIMEOUT', 'HARNESS_OBSERVATION_TIMEOUT'].includes(r.finalStatus));
  const unexpectedErrors = records.filter((r) => r.error && r.queueBackpressured !== true && r.rateLimited !== true);
  const ids = accepted.map((r) => r.analysisId).filter(Boolean);
  const duplicateAnalysisIds = ids.length - new Set(ids).size;
  const attempts = completed.map((r) => Number(r.attempts)).filter(Number.isFinite);
  const durationMs = Math.max(1, endedAt - startedAt);
  const submitLatency = accepted.map((r) => r.submitLatencyMs).filter(Number.isFinite);
  const e2eLatency = completed.map((r) => r.e2eLatencyMs).filter(Number.isFinite);
  const recoveredObservations = completed.filter((r) => r.observationRecovered).length;
  const accounted = accepted.length + queueBackpressured.length + rateLimited.length;
  const backpressureExpected = Number(maxQueueDepth) > 0 && level >= Number(maxQueueDepth);
  const clean = terminalFailures.length === 0 && unexpectedErrors.length === 0 && duplicateAnalysisIds === 0 && completed.length === accepted.length && attempts.every((v) => v === 1) && accounted === records.length;
  return {
    level, durationMs, submitted: records.length, accepted: accepted.length, completed: completed.length,
    backpressured: queueBackpressured.length, queueBackpressured: queueBackpressured.length,
    rateLimited: rateLimited.length, admissionControlled: admissionControlled.length,
    terminalFailures: terminalFailures.length, unexpectedErrors: unexpectedErrors.length,
    accounted, duplicateAnalysisIds, maxAttempts: attempts.length ? Math.max(...attempts) : null,
    recoveredObservations, backpressureExpected,
    admissionControlBreakdown: { queueBackpressure: queueBackpressured.length, httpRateLimitThrottle: rateLimited.length },
    submitLatencyMs: { p50: percentile(submitLatency, 50), p95: percentile(submitLatency, 95), p99: percentile(submitLatency, 99), max: submitLatency.length ? Math.max(...submitLatency) : null },
    e2eLatencyMs: { p50: percentile(e2eLatency, 50), p95: percentile(e2eLatency, 95), p99: percentile(e2eLatency, 99), max: e2eLatency.length ? Math.max(...e2eLatency) : null },
    throughputCompletedPerMinute: Number(((completed.length / durationMs) * 60_000).toFixed(3)),
    pass: clean,
  };
}

export function shouldContinueAfterStage(summary) { return Boolean(summary?.pass); }

function required(name) { const v = String(process.env[name] || '').trim(); if (!v) throw new Error(`${name} is required`); return v; }
function positiveInt(value, fallback, { min = 1, max = Number.MAX_SAFE_INTEGER } = {}) { const n = Number(value); return Number.isInteger(n) && n >= min ? Math.min(n, max) : fallback; }
function normalizedBaseUrl(value) { return String(value || 'https://api.rodrigueslucio.com').trim().replace(/\/+$/, ''); }
function mimeFor(filename) { const e = path.extname(filename).toLowerCase(); if (e === '.png') return 'image/png'; if (e === '.webp') return 'image/webp'; if (e === '.tif' || e === '.tiff') return 'image/tiff'; return 'image/jpeg'; }
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function parseJsonResponse(response, label) { const text = await response.text(); let json = {}; try { json = text ? JSON.parse(text) : {}; } catch { throw new Error(`${label}: HTTP ${response.status} returned non-JSON`); } if (!response.ok) { const e = new Error(`${label}: HTTP ${response.status}: ${json?.error || json?.errorCode || 'request failed'}`); e.httpStatus = response.status; e.errorCode = json?.errorCode || json?.code || null; e.response = json; throw e; } return json; }

function applyTerminal(record, session, submitStartedAt, recoveredBy) {
  const status = String(session?.status || 'UNKNOWN');
  if (!['COMPLETED', 'FAILED', 'EXPIRED'].includes(status)) return false;
  record.finalStatus = status; record.attempts = Number(session?.attempt); record.recoveredBy = recoveredBy;
  const persistedMs = Date.parse(String(session?.completedAt || session?.failedAt || ''));
  record.e2eLatencyMs = Number.isFinite(persistedMs) ? Math.max(0, persistedMs - submitStartedAt) : Date.now() - submitStartedAt;
  record.resultVisible = status === 'COMPLETED' ? Boolean(session?.result && typeof session.result === 'object') : false;
  return true;
}

export async function runOne({ baseUrl, apiToken, image, imagePath, specimenType, pollMs, timeoutMs, pollRequestTimeoutMs, stageId, ordinal }) {
  const userId = `inf-scale-001-2g-${stageId}-${ordinal}-${crypto.randomUUID()}`;
  const idempotencyKey = `inf-scale-001.2g-${stageId}-${ordinal}-${crypto.randomUUID()}`;
  const headers = { Authorization: `Bearer ${apiToken}`, 'x-user-id': userId };
  const record = { ordinal, submitAccepted: false, backpressured: false, queueBackpressured: false, rateLimited: false, admissionControlled: false, admissionClass: null, analysisId: null, jobId: null, finalStatus: null, attempts: null, error: null, errorCode: null, pollTransportErrors: 0, observationRecovered: false, recoveredBy: null };
  try {
    const created = await parseJsonResponse(await fetch(`${baseUrl}/analysis-sessions`, { method: 'POST', headers: { ...headers, 'Content-Type': 'application/json' }, body: JSON.stringify({ idempotencyKey, analysisSource: 'ai_visual', specimenType, imageCount: 1, clientCreatedAt: new Date().toISOString() }) }), `create[${ordinal}]`);
    record.analysisId = created?.session?.analysisId; assert.ok(record.analysisId);
    const form = new FormData();
    form.append('analysisId', record.analysisId); form.append('idempotencyKey', idempotencyKey); form.append('analysisSource', 'ai_visual'); form.append('specimenType', specimenType);
    form.append('specimenDecision', JSON.stringify({ status: 'accepted', effectiveType: specimenType, confidence: 1, source: CERTIFICATION_VERSION })); form.append('manualCounts', '{}');
    form.append('image', new Blob([image], { type: mimeFor(imagePath) }), path.basename(imagePath));
    const submitStartedAt = Date.now();
    let submitResponse;
    try { submitResponse = await fetch(`${baseUrl}/analyze-slide`, { method: 'POST', headers, body: form }); } catch (error) { throw new Error(`submit[${ordinal}] transport: ${error?.message || error}`); }
    record.httpStatus = submitResponse.status;
    if (submitResponse.status === 503 || submitResponse.status === 429) {
      const text = await submitResponse.text(); let body = {}; try { body = text ? JSON.parse(text) : {}; } catch {}
      const admission = classifyAdmissionControlResponse({ status: submitResponse.status, body, retryAfter: submitResponse.headers?.get?.('retry-after') ?? null });
      if (admission.controlled) {
        record.errorCode = admission.errorCode; record.admissionControlled = true; record.admissionClass = admission.admissionClass;
        record.queueBackpressured = admission.queueBackpressured; record.rateLimited = admission.rateLimited; record.backpressured = admission.queueBackpressured;
        record.submitLatencyMs = Date.now() - submitStartedAt;
        return record;
      }
      const error = new Error(`submit[${ordinal}]: HTTP ${submitResponse.status}: ${body?.error || body?.errorCode || 'unclassified admission response'}`);
      error.httpStatus = submitResponse.status; error.errorCode = body?.errorCode || body?.code || null; error.response = body; throw error;
    }
    const submit = await parseJsonResponse(submitResponse, `submit[${ordinal}]`);
    record.submitLatencyMs = Date.now() - submitStartedAt; record.submitAccepted = true; record.jobId = submit?.job?.jobId || null;
    assert.equal(submit.analysisId, record.analysisId); assert.equal(submit.queued, true);
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      try {
        const response = await fetchWithObservationTimeout(`${baseUrl}/analysis-sessions/${encodeURIComponent(record.analysisId)}/recovery`, { headers }, { timeoutMs: pollRequestTimeoutMs, label: `recovery[${ordinal}]` });
        const recovery = await parseJsonResponse(response, `recovery[${ordinal}]`);
        if (applyTerminal(record, recovery?.recovery?.session, submitStartedAt, 'recovery')) return record;
      } catch (error) { if ([401, 403, 404].includes(error?.httpStatus)) throw error; record.pollTransportErrors += 1; record.lastPollObservationError = String(error?.message || error); }
      await sleep(pollMs);
    }
    const reconciliation = await reconcileAuthoritativeSession({ baseUrl, headers, analysisId: record.analysisId, ordinal, submitStartedAt, requestTimeoutMs: pollRequestTimeoutMs });
    if (reconciliation.observed) {
      if (applyTerminal(record, reconciliation.session, submitStartedAt, 'authoritative_direct_read')) { record.observationRecovered = true; return record; }
      record.finalStatus = 'CLINICAL_EXECUTION_TIMEOUT'; record.attempts = Number(reconciliation.session?.attempt); record.errorCode = 'CLINICAL_EXECUTION_TIMEOUT'; record.error = `Authoritative session remained ${reconciliation.session?.status || 'non-terminal'} after ${timeoutMs}ms`; return record;
    }
    record.finalStatus = 'HARNESS_OBSERVATION_TIMEOUT'; record.errorCode = 'HARNESS_OBSERVATION_TIMEOUT'; record.error = `Could not observe authoritative session after ${timeoutMs}ms`; return record;
  } catch (error) { record.httpStatus = error?.httpStatus || record.httpStatus || null; record.errorCode = error?.errorCode || error?.response?.errorCode || error?.code || null; record.error = String(error?.message || error); return record; }
}

export async function main() {
  const baseUrl = normalizedBaseUrl(process.env.CELLCOUNT_VOLUME_BASE_URL);
  const apiToken = required('CELLCOUNT_VOLUME_API_TOKEN');
  const imagePath = path.resolve(required('CELLCOUNT_VOLUME_IMAGE'));
  const specimenType = String(process.env.CELLCOUNT_VOLUME_SPECIMEN_TYPE || 'PERIPHERAL_BLOOD').trim().toUpperCase();
  const levels = parseLevels(process.env.CELLCOUNT_VOLUME_LEVELS); assertHighVolumeUnlocked(levels, process.env.CELLCOUNT_VOLUME_CONFIRM);
  const expectedWorkers = positiveInt(process.env.CELLCOUNT_VOLUME_EXPECTED_WORKERS, 4, { min: 1, max: 32 });
  const pollMs = positiveInt(process.env.CELLCOUNT_VOLUME_POLL_MS, 1500, { min: 500, max: 10_000 });
  const pollRequestTimeoutMs = positiveInt(process.env.CELLCOUNT_VOLUME_POLL_REQUEST_TIMEOUT_MS, DEFAULT_POLL_REQUEST_TIMEOUT_MS, { min: 1000, max: 60_000 });
  const timeoutMs = positiveInt(process.env.CELLCOUNT_VOLUME_STAGE_TIMEOUT_MS, 1_800_000, { min: 60_000, max: 7_200_000 });
  const cooldownMs = positiveInt(process.env.CELLCOUNT_VOLUME_COOLDOWN_MS, 30_000, { min: 0, max: 300_000 });
  const image = await fs.readFile(imagePath); assert.ok(image.length > 0);
  const runtime = await parseJsonResponse(await fetch(`${baseUrl}/runtime-version`), 'runtime-version');
  assert.equal(runtime.analysisExecutionMode, 'queued'); assert.equal(runtime.analysisSessionStorage?.provider, 'postgres'); assert.equal(runtime.distributedAnalysisWorkerPool?.running, true);
  const workers = Number(runtime.distributedAnalysisWorkerPool?.concurrency || 0); assert.equal(workers, expectedWorkers, `Runtime worker concurrency ${workers} does not match expected ${expectedWorkers}`);
  const maxQueueDepth = Number(runtime.distributedAnalysisWorkerPool?.maxQueueDepth || 0); assert.ok(maxQueueDepth > 0, 'Runtime maxQueueDepth must be > 0');
  console.log(`[${CERTIFICATION_VERSION}] target=${baseUrl}`); console.log(`[${CERTIFICATION_VERSION}] specimenType=${specimenType} image=${path.basename(imagePath)} bytes=${image.length}`);
  console.log(`[${CERTIFICATION_VERSION}] workers=${workers} maxQueueDepth=${maxQueueDepth} levels=${levels.join(',')} failStop=true pollRequestTimeoutMs=${pollRequestTimeoutMs}`);
  const stages = [];
  for (const level of levels) {
    console.log(`[${CERTIFICATION_VERSION}] STAGE level=${level} starting`); const stageId = `${Date.now()}-${workers}w-${level}`; const startedAt = Date.now();
    const records = await Promise.all(Array.from({ length: level }, (_, i) => runOne({ baseUrl, apiToken, image, imagePath, specimenType, pollMs, timeoutMs, pollRequestTimeoutMs, stageId, ordinal: i + 1 })));
    const summary = summarizeStage({ level, startedAt, endedAt: Date.now(), records, maxQueueDepth }); stages.push(summary);
    console.log(JSON.stringify({ stage: summary, failures: records.filter((r) => r.error && r.queueBackpressured !== true && r.rateLimited !== true).map((r) => ({ ordinal: r.ordinal, httpStatus: r.httpStatus, errorCode: r.errorCode, admissionClass: r.admissionClass, finalStatus: r.finalStatus, pollTransportErrors: r.pollTransportErrors, recoveredBy: r.recoveredBy, error: r.error })) }, null, 2));
    if (!shouldContinueAfterStage(summary)) { console.log(`[${CERTIFICATION_VERSION}] FAIL-STOP level=${level}; higher-volume stages will not run.`); break; }
    if (cooldownMs > 0 && level !== levels.at(-1)) await sleep(cooldownMs);
  }
  const requestedAllRan = stages.length === levels.length;
  const certification = { certificationVersion: CERTIFICATION_VERSION, success: requestedAllRan && stages.every((s) => s.pass), runtime: { workerConcurrency: workers, maxQueueDepth, executionMode: runtime.analysisExecutionMode }, levelsRequested: levels, levelsExecuted: stages.map((s) => s.level), stages, gates: { requestedStagesCompleted: requestedAllRan, zeroDuplicateAnalysisIds: stages.every((s) => s.duplicateAnalysisIds === 0), noTerminalFailures: stages.every((s) => s.terminalFailures === 0), noUnexpectedErrors: stages.every((s) => s.unexpectedErrors === 0), allAcceptedComplete: stages.every((s) => s.completed === s.accepted), singleAttemptCleanPath: stages.every((s) => s.accepted === 0 ? true : s.maxAttempts === 1), admissionFullyAccounted: stages.every((s) => s.accounted === s.submitted), queueBackpressureSafelyClassified: stages.every((s) => s.queueBackpressured >= 0), httpRateLimitSafelyClassified: stages.every((s) => s.rateLimited >= 0), admissionControlTaxonomyExplicit: stages.every((s) => s.admissionControlled === s.queueBackpressured + s.rateLimited) } };
  console.log(JSON.stringify(certification, null, 2)); if (!certification.success) process.exitCode = 1;
}

const isEntrypoint = process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;
if (isEntrypoint) main().catch((error) => { console.error(`[${CERTIFICATION_VERSION}] FATAL`, error); process.exitCode = 1; });
