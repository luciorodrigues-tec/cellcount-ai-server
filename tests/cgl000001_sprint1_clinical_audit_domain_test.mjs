import assert from "node:assert/strict";
import test from "node:test";

import {
  AuditId,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditId.js";

import {
  createAuditActor,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditActor.js";

import {
  createAuditCaseReference,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditCaseReference.js";

import {
  createAuditEngineReference,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditEngineReference.js";

import {
  createAuditEvidenceReference,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditEvidenceReference.js";

import {
  createAuditDecisionReference,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditDecisionReference.js";

import {
  createAuditEvent,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditEvent.js";

import {
  createAuditTimeline,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditTimeline.js";

import {
  createAuditIntegrity,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditIntegrity.js";

import {
  AuditRecord,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditRecord.js";

const actor = () =>
  createAuditActor({
    id: "SYSTEM-1",
    type: "SYSTEM",
  });

const caseRef = () =>
  createAuditCaseReference({
    caseId: "CASE-001",
    pseudonymizedPatientId: "PAT-001",
  });

test("AuditId validates format", () => {
  assert.throws(
    () => new AuditId("invalid"),
    /must match/,
  );

  const id =
    new AuditId("AUD-CASE-0001");

  assert.equal(
    id.toString(),
    "AUD-CASE-0001",
  );
});

test("AuditActor is immutable", () => {
  const value = actor();
  assert.equal(Object.isFrozen(value), true);
});

test("AuditCaseReference requires caseId", () => {
  assert.throws(
    () =>
      createAuditCaseReference({}),
    /caseId is required/,
  );
});

test("AuditEngineReference requires version", () => {
  assert.throws(
    () =>
      createAuditEngineReference({
        engineId: "E-1",
        name: "Engine",
      }),
    /version is required/,
  );
});

test("AuditEvidenceReference rejects unsupported type", () => {
  assert.throws(
    () =>
      createAuditEvidenceReference({
        evidenceId: "EV-1",
        type: "UNKNOWN",
        source: "test",
      }),
    /Unsupported audit evidence type/,
  );
});

test("AuditDecisionReference validates confidence", () => {
  assert.throws(
    () =>
      createAuditDecisionReference({
        decisionId: "D-1",
        decisionType: "SAFETY_GATE",
        outcome: "RELEASED",
        confidence: 2,
      }),
    /between 0 and 1/,
  );
});

test("AuditEvent validates sequence", () => {
  assert.throws(
    () =>
      createAuditEvent({
        eventId: "EVT-1",
        type: "CASE_OPENED",
        occurredAt:
          "2026-07-29T00:00:00.000Z",
        sequence: 0,
        actor: actor(),
      }),
    /positive integer/,
  );
});

test("AuditTimeline sorts events", () => {
  const timeline =
    createAuditTimeline([
      createAuditEvent({
        eventId: "EVT-2",
        type: "ENGINE_COMPLETED",
        occurredAt:
          "2026-07-29T00:00:02.000Z",
        sequence: 2,
        actor: actor(),
      }),
      createAuditEvent({
        eventId: "EVT-1",
        type: "CASE_OPENED",
        occurredAt:
          "2026-07-29T00:00:01.000Z",
        sequence: 1,
        actor: actor(),
      }),
    ]);

  assert.equal(
    timeline.events[0].eventId,
    "EVT-1",
  );
});

test("AuditTimeline rejects duplicate sequence", () => {
  const event =
    createAuditEvent({
      eventId: "EVT-1",
      type: "CASE_OPENED",
      occurredAt:
        "2026-07-29T00:00:01.000Z",
      sequence: 1,
      actor: actor(),
    });

  assert.throws(
    () =>
      createAuditTimeline([
        event,
        { ...event, eventId: "EVT-2" },
      ]),
    /Duplicate audit event sequence/,
  );
});

test("open AuditRecord is immutable", () => {
  const record =
    new AuditRecord({
      auditId:
        new AuditId("AUD-CASE-0001"),
      caseReference: caseRef(),
      actor: actor(),
    });

  assert.equal(Object.isFrozen(record), true);
  assert.equal(record.isSealed(), false);
});

test("sealed AuditRecord requires engines", () => {
  assert.throws(
    () =>
      new AuditRecord({
        auditId:
          new AuditId("AUD-CASE-0002"),
        caseReference: caseRef(),
        actor: actor(),
        status: "SEALED",
        decisionReferences: [
          createAuditDecisionReference({
            decisionId: "D-1",
            decisionType: "SAFETY_GATE",
            outcome: "RELEASED",
          }),
        ],
        integrity:
          createAuditIntegrity({
            hash: "abc",
          }),
      }),
    /requires engine references/,
  );
});

test("sealed AuditRecord requires integrity", () => {
  assert.throws(
    () =>
      new AuditRecord({
        auditId:
          new AuditId("AUD-CASE-0003"),
        caseReference: caseRef(),
        actor: actor(),
        status: "SEALED",
        engineReferences: [
          createAuditEngineReference({
            engineId: "E-1",
            name: "Engine",
            version: "1.0.0",
          }),
        ],
        decisionReferences: [
          createAuditDecisionReference({
            decisionId: "D-1",
            decisionType: "SAFETY_GATE",
            outcome: "RELEASED",
          }),
        ],
      }),
    /requires integrity data/,
  );
});

test("sealed AuditRecord cannot mutate by default", () => {
  const record =
    new AuditRecord({
      auditId:
        new AuditId("AUD-CASE-0004"),
      caseReference: caseRef(),
      actor: actor(),
      status: "SEALED",
      engineReferences: [
        createAuditEngineReference({
          engineId: "E-1",
          name: "Engine",
          version: "1.0.0",
        }),
      ],
      decisionReferences: [
        createAuditDecisionReference({
          decisionId: "D-1",
          decisionType: "SAFETY_GATE",
          outcome: "RELEASED",
        }),
      ],
      integrity:
        createAuditIntegrity({
          hash: "abc",
        }),
    });

  assert.equal(
    record.canMutate(),
    false,
  );
});
