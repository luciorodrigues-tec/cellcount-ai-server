import test from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyForensicRecord,
  summarizeForensics,
  FORENSICS_VERSION,
} from '../scripts/diagnoseFourWorkerStall.mjs';

function rec({ jobStatus='PROCESSING', sessionStatus='PROCESSING', createdAt='2026-08-20T20:00:00.000Z', completedAt=null, jobLease='2026-08-20T20:20:00.000Z', sessionLease='2026-08-20T20:20:00.000Z', workerId='w1' } = {}) {
  return {
    job: { status: jobStatus, createdAt, completedAt, leaseExpiresAt: jobLease, workerId },
    session: { status: sessionStatus, createdAt, completedAt, leaseExpiresAt: sessionLease },
  };
}

test('INF-SCALE-001.2F.1 classifies active dual-lease execution stall without exposing tokens', () => {
  assert.equal(FORENSICS_VERSION, 'INF-SCALE-001.2F.1');
  const r = classifyForensicRecord(rec(), { nowMs: Date.parse('2026-08-20T20:10:00.000Z') });
  assert.equal(r.diagnosis, 'ACTIVE_EXECUTION_OR_UPSTREAM_STALL');
  assert.equal(r.jobLeaseExpired, false);
  assert.equal(r.sessionLeaseExpired, false);
});

test('INF-SCALE-001.2F.1 distinguishes orphaned expired leases from upstream stall', () => {
  const r = classifyForensicRecord(rec({ jobLease:'2026-08-20T20:05:00.000Z', sessionLease:'2026-08-20T20:05:00.000Z' }), { nowMs: Date.parse('2026-08-20T20:10:00.000Z') });
  assert.equal(r.diagnosis, 'ORPHANED_OR_EXPIRED_DUAL_LEASE');
  assert.equal(r.jobLeaseExpired, true);
  assert.equal(r.sessionLeaseExpired, true);
});

test('INF-SCALE-001.2F.1 detects late completion after 15-minute harness timeout', () => {
  const r = classifyForensicRecord(rec({ jobStatus:'COMPLETED', sessionStatus:'COMPLETED', completedAt:'2026-08-20T20:16:00.000Z', jobLease:null, sessionLease:null }), { nowMs: Date.parse('2026-08-20T20:17:00.000Z'), timeoutMs:900000 });
  assert.equal(r.diagnosis, 'LATE_COMPLETION_AFTER_HARNESS_TIMEOUT');
  assert.equal(r.exceededHarnessTimeout, true);
});

test('INF-SCALE-001.2F.1 summary counts workers and diagnoses independently', () => {
  const nowMs = Date.parse('2026-08-20T20:10:00.000Z');
  const records = [
    { ...rec({workerId:'w1'}), forensic: classifyForensicRecord(rec({workerId:'w1'}), {nowMs}) },
    { ...rec({workerId:'w2', jobLease:'2026-08-20T20:05:00.000Z', sessionLease:'2026-08-20T20:05:00.000Z'}), forensic: classifyForensicRecord(rec({workerId:'w2', jobLease:'2026-08-20T20:05:00.000Z', sessionLease:'2026-08-20T20:05:00.000Z'}), {nowMs}) },
  ];
  const s = summarizeForensics(records);
  assert.equal(s.records, 2);
  assert.equal(s.distinctWorkersObserved, 2);
  assert.equal(s.diagnoses.ACTIVE_EXECUTION_OR_UPSTREAM_STALL, 1);
  assert.equal(s.diagnoses.ORPHANED_OR_EXPIRED_DUAL_LEASE, 1);
});
