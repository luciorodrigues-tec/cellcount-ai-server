import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuditActor,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditActor.js";

import {
  createAuditCaseReference,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditCaseReference.js";

import {
  ClinicalAuditRepository,
} from "../ai/clinicalGovernance/clinicalAudit/repository/ClinicalAuditRepository.js";

import {
  ClinicalAuditReferenceMapper,
} from "../ai/clinicalGovernance/clinicalAudit/integration/ClinicalAuditReferenceMapper.js";

import {
  createClinicalAuditLibrary,
} from "../ai/clinicalGovernance/clinicalAudit/ClinicalAuditLibrary.js";

const fixedClock = () =>
  new Date("2026-07-29T15:00:00.000Z");

const actor =
  createAuditActor({
    id: "SYSTEM-CGL",
    type: "SYSTEM",
  });

const caseReference =
  createAuditCaseReference({
    caseId: "CASE-CGL-001",
    pseudonymizedPatientId:
      "PAT-CGL-001",
  });

const safetyGateResult = {
  caseId: "CASE-CGL-001",
  decision: "RELEASED",
  releaseAllowed: true,
  automationAllowed: true,
  requiresHumanReview: false,
  safetyScore: 1,
  selectedHypothesisId: "D-1",
};

test("repository saves and retrieves record", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      auditId: "AUD-CGL-0001",
      caseReference,
      actor,
      engineVersions: {
        "CRR-000034": {
          name: "Clinical Safety Gate Engine",
          version: "1.0.0",
        },
      },
      safetyGateResult,
    });

  assert.equal(
    library.repository.getByAuditId(
      "AUD-CGL-0001",
    ),
    record,
  );
});

test("repository rejects duplicate without replace", () => {
  const repository =
    new ClinicalAuditRepository();

  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      auditId: "AUD-CGL-0002",
      caseReference,
      actor,
      engineVersions: {
        "CRR-000034": {
          version: "1.0.0",
        },
      },
      safetyGateResult,
    });

  repository.save(record);

  assert.throws(
    () => repository.save(record),
    /already exists/,
  );
});

test("repository filters by case id", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  library.integrationService.captureClinicalCase({
    auditId: "AUD-CGL-0003",
    caseReference,
    actor,
    engineVersions: {
      "CRR-000034": {
        version: "1.0.0",
      },
    },
    safetyGateResult,
  });

  assert.equal(
    library.repository.findByCaseId(
      "CASE-CGL-001",
    ).length,
    1,
  );
});

test("sealed records cannot be deleted", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  library.integrationService.captureClinicalCase({
    auditId: "AUD-CGL-0004",
    caseReference,
    actor,
    engineVersions: {
      "CRR-000034": {
        version: "1.0.0",
      },
    },
    safetyGateResult,
  });

  assert.throws(
    () =>
      library.repository.delete(
        "AUD-CGL-0004",
      ),
    /cannot be deleted/,
  );
});

test("reference mapper maps engines", () => {
  const mapper =
    new ClinicalAuditReferenceMapper();

  const refs =
    mapper.mapEngines({
      "CRR-000034": {
        name: "Safety Gate",
        version: "1.0.0",
      },
    });

  assert.equal(refs.length, 1);
  assert.equal(
    refs[0].engineId,
    "CRR-000034",
  );
});

test("reference mapper maps evidence", () => {
  const mapper =
    new ClinicalAuditReferenceMapper();

  const refs =
    mapper.mapEvidence([
      {
        hypothesisId: "D-1",
        status: "SUPPORTED",
        normalizedScore: 0.8,
      },
    ]);

  assert.equal(refs.length, 1);
  assert.equal(
    refs[0].type,
    "MODEL_OUTPUT",
  );
});

test("integration service creates sealed record", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      auditId: "AUD-CGL-0005",
      caseReference,
      actor,
      engineVersions: {
        "CRR-000034": {
          version: "1.0.0",
        },
      },
      safetyGateResult,
    });

  assert.equal(record.status, "SEALED");
  assert.ok(record.integrity.hash);
});

test("integration captures decision confidence and uncertainty", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      auditId: "AUD-CGL-0006",
      caseReference,
      actor,
      engineVersions: {
        "CRR-000034": {
          version: "1.0.0",
        },
      },
      safetyGateResult,
      confidenceCalibrationResult: {
        finalConfidenceScore: 0.87,
      },
      uncertaintyResult: {
        totalUncertaintyScore: 0.13,
      },
    });

  assert.equal(
    record.decisionReferences[0].confidence,
    0.87,
  );

  assert.equal(
    record.decisionReferences[0].uncertainty,
    0.13,
  );
});

test("integration creates audit timeline events", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      auditId: "AUD-CGL-0007",
      caseReference,
      actor,
      engineVersions: {
        "CRR-000034": {
          version: "1.0.0",
        },
      },
      evidenceItems: [
        {
          hypothesisId: "D-1",
          status: "SUPPORTED",
        },
      ],
      safetyGateResult,
    });

  assert.equal(record.events.length, 4);
  assert.equal(
    record.timeline.events.at(-1).type,
    "SAFETY_GATE_DECIDED",
  );
});

test("integration creates snapshot and metrics", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      auditId: "AUD-CGL-0008",
      caseReference,
      actor,
      engineVersions: {
        "CRR-000034": {
          version: "1.0.0",
        },
      },
      safetyGateResult,
      durationMs: 250,
    });

  assert.equal(record.snapshots.length, 1);
  assert.equal(record.metrics.durationMs, 250);
});

test("library exposes replay and export", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      auditId: "AUD-CGL-0009",
      caseReference,
      actor,
      engineVersions: {
        "CRR-000034": {
          version: "1.0.0",
        },
      },
      safetyGateResult,
    });

  const replay =
    library.replayEngine.replay(record);

  const exported =
    library.exporter.exportJson(record);

  assert.ok(replay.eventCount > 0);
  assert.equal(
    exported.mimeType,
    "application/json",
  );
});

test("repository list filters status", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  library.integrationService.captureClinicalCase({
    auditId: "AUD-CGL-0010",
    caseReference,
    actor,
    engineVersions: {
      "CRR-000034": {
        version: "1.0.0",
      },
    },
    safetyGateResult,
  });

  assert.equal(
    library.repository.list({
      status: "SEALED",
    }).length,
    1,
  );
});

test("integration requires safety gate result", () => {
  const library =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  assert.throws(
    () =>
      library.integrationService.captureClinicalCase({
        auditId: "AUD-CGL-0011",
        caseReference,
        actor,
        engineVersions: {},
      }),
    /safetyGateResult is required/,
  );
});
