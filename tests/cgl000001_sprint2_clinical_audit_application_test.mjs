import assert from "node:assert/strict";
import test from "node:test";

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
  createAuditDecisionReference,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditDecisionReference.js";

import {
  ClinicalAuditEngine,
} from "../ai/clinicalGovernance/clinicalAudit/application/ClinicalAuditEngine.js";

import {
  AuditIntegrityCalculator,
} from "../ai/clinicalGovernance/clinicalAudit/application/AuditIntegrityCalculator.js";

import {
  AuditSignatureGenerator,
} from "../ai/clinicalGovernance/clinicalAudit/application/AuditSignatureGenerator.js";

import {
  AuditReplayEngine,
} from "../ai/clinicalGovernance/clinicalAudit/application/AuditReplayEngine.js";

import {
  AuditSerializer,
} from "../ai/clinicalGovernance/clinicalAudit/application/AuditSerializer.js";

import {
  AuditExporter,
} from "../ai/clinicalGovernance/clinicalAudit/application/AuditExporter.js";

import {
  AuditQueryService,
} from "../ai/clinicalGovernance/clinicalAudit/application/AuditQueryService.js";

const fixedClock = () =>
  new Date("2026-07-29T12:00:00.000Z");

const actor = createAuditActor({
  id: "SYSTEM-1",
  type: "SYSTEM",
});

const caseReference =
  createAuditCaseReference({
    caseId: "CASE-APP-001",
    pseudonymizedPatientId:
      "PAT-APP-001",
  });

test("ClinicalAuditEngine opens audit record", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  const record =
    engine.open({
      auditId:
        "AUD-APP-0001",
      caseReference,
      actor,
    });

  assert.equal(record.status, "OPEN");
  assert.equal(record.events.length, 1);
});

test("appendEvent increments sequence", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  let record = engine.open({
    auditId:
      "AUD-APP-0002",
    caseReference,
    actor,
  });

  record =
    engine.appendEvent(
      record,
      {
        eventId:
          "AUD-APP-0002-EVT-0002",
        type: "ENGINE_STARTED",
      },
    );

  assert.equal(
    record.events[1].sequence,
    2,
  );
});

test("snapshot builder adds hashed snapshot", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  let record = engine.open({
    auditId:
      "AUD-APP-0003",
    caseReference,
    actor,
  });

  record =
    engine.addSnapshot(
      record,
      {
        snapshotId: "SNAP-1",
        sequence: 1,
        state: { stage: "opened" },
      },
    );

  assert.equal(
    record.snapshots.length,
    1,
  );

  assert.ok(
    record.snapshots[0].stateHash,
  );
});

test("integrity calculator is deterministic", () => {
  const calculator =
    new AuditIntegrityCalculator();

  const first =
    calculator.calculate({
      b: 2,
      a: 1,
    });

  const second =
    calculator.calculate({
      a: 1,
      b: 2,
    });

  assert.equal(
    first.hash,
    second.hash,
  );
});

test("integrity calculator detects tampering", () => {
  const calculator =
    new AuditIntegrityCalculator();

  const integrity =
    calculator.calculate({
      value: 1,
    });

  assert.equal(
    calculator.verify(
      { value: 2 },
      integrity,
    ),
    false,
  );
});

test("signature generator signs and verifies", () => {
  const generator =
    new AuditSignatureGenerator({
      secret: "test-secret",
      clock: fixedClock,
    });

  const signature =
    generator.generate({
      signatureId: "SIG-1",
      value: { audit: 1 },
    });

  assert.equal(
    generator.verify(
      { audit: 1 },
      signature,
    ),
    true,
  );
});

test("signature verification rejects changed value", () => {
  const generator =
    new AuditSignatureGenerator({
      secret: "test-secret",
      clock: fixedClock,
    });

  const signature =
    generator.generate({
      signatureId: "SIG-2",
      value: { audit: 1 },
    });

  assert.equal(
    generator.verify(
      { audit: 2 },
      signature,
    ),
    false,
  );
});

test("replay engine replays events in order", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  let record = engine.open({
    auditId:
      "AUD-APP-0004",
    caseReference,
    actor,
  });

  record =
    engine.appendEvent(
      record,
      {
        eventId:
          "AUD-APP-0004-EVT-0002",
        type: "ENGINE_STARTED",
      },
    );

  const replay =
    new AuditReplayEngine()
      .replay(record);

  assert.equal(
    replay.eventCount,
    2,
  );

  assert.equal(
    replay.frames[1].sequence,
    2,
  );
});

test("serializer round-trips open record", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  const record =
    engine.open({
      auditId:
        "AUD-APP-0005",
      caseReference,
      actor,
    });

  const serializer =
    new AuditSerializer();

  const restored =
    serializer.deserialize(
      serializer.serialize(record),
    );

  assert.equal(
    restored.auditId.toString(),
    record.auditId.toString(),
  );
});

test("exporter creates JSON payload", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  const record =
    engine.open({
      auditId:
        "AUD-APP-0006",
      caseReference,
      actor,
    });

  const exported =
    new AuditExporter()
      .exportJson(record);

  assert.equal(
    exported.mimeType,
    "application/json",
  );

  assert.match(
    exported.fileName,
    /\.json$/,
  );
});

test("query service finds event types", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  let record = engine.open({
    auditId:
      "AUD-APP-0007",
    caseReference,
    actor,
  });

  record =
    engine.appendEvent(
      record,
      {
        eventId:
          "AUD-APP-0007-EVT-0002",
        type: "ENGINE_STARTED",
      },
    );

  const found =
    new AuditQueryService()
      .findEventsByType(
        record,
        "ENGINE_STARTED",
      );

  assert.equal(found.length, 1);
});

test("seal requires engine and decision references", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  const record =
    engine.open({
      auditId:
        "AUD-APP-0008",
      caseReference,
      actor,
    });

  assert.throws(
    () => engine.seal(record),
    /requires engine references/,
  );
});

test("seal produces immutable sealed record", () => {
  const engine =
    new ClinicalAuditEngine({
      clock: fixedClock,
    });

  const opened =
    engine.open({
      auditId:
        "AUD-APP-0009",
      caseReference,
      actor,
    });

  const ready =
    new opened.constructor({
      auditId: opened.auditId,
      caseReference:
        opened.caseReference,
      actor: opened.actor,
      status: "OPEN",
      events: opened.events,
      engineReferences: [
        createAuditEngineReference({
          engineId: "CRR-000034",
          name:
            "Clinical Safety Gate Engine",
          version: "1.0.0",
        }),
      ],
      decisionReferences: [
        createAuditDecisionReference({
          decisionId: "DEC-1",
          decisionType:
            "SAFETY_GATE",
          outcome: "RELEASED",
        }),
      ],
    });

  const sealed =
    engine.seal(ready);

  assert.equal(
    sealed.status,
    "SEALED",
  );

  assert.equal(
    sealed.canMutate(),
    false,
  );

  assert.ok(
    sealed.integrity.hash,
  );
});
