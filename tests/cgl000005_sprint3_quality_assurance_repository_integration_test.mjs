import assert from "node:assert/strict";
import test from "node:test";

import {
  createQualityPeriod,
} from "../ai/clinicalGovernance/qualityAssurance/domain/QualityPeriod.js";

import {
  QualityAssuranceRepository,
} from "../ai/clinicalGovernance/qualityAssurance/repository/QualityAssuranceRepository.js";

import {
  QualityAssuranceContextMapper,
} from "../ai/clinicalGovernance/qualityAssurance/integration/QualityAssuranceContextMapper.js";

import {
  QualityAssuranceAuditAdapter,
} from "../ai/clinicalGovernance/qualityAssurance/integration/QualityAssuranceAuditAdapter.js";

import {
  QualityAssuranceProvenanceAdapter,
} from "../ai/clinicalGovernance/qualityAssurance/integration/QualityAssuranceProvenanceAdapter.js";

import {
  createQualityAssuranceLibrary,
} from "../ai/clinicalGovernance/qualityAssurance/QualityAssuranceLibrary.js";

const fixedClock = () =>
  new Date("2026-07-30T09:00:00.000Z");

const period =
  createQualityPeriod({
    startedAt:
      "2026-07-01T00:00:00.000Z",
    endedAt:
      "2026-07-31T23:59:59.000Z",
  });

const evaluate = (
  library,
  {
    id = "QAE-INT-0001",
    caseId = "CASE-1",
    confidence = 0.9,
    uncertainty = 0.2,
    validated = true,
    releaseAllowed = true,
  } = {},
) =>
  library.integrationService.evaluateClinicalCase({
    qualityAssuranceId: id,
    caseId,
    period,
    confidenceCalibrationResult: {
      finalConfidenceScore:
        confidence,
    },
    uncertaintyResult: {
      totalUncertaintyScore:
        uncertainty,
    },
    validationResult: {
      validated,
    },
    safetyGateResult: {
      releaseAllowed,
    },
    auditRecord: {
      auditId: {
        toString: () => "AUD-1",
      },
    },
    provenanceRecord: {
      provenanceId: {
        toString: () => "PROV-1",
      },
    },
    policyResult: {
      decision: {
        decision: "ALLOW",
      },
    },
    guidelineResult: {
      primaryExecutionResult: {
        status: "COMPLETED",
      },
    },
  });

test("repository saves and retrieves record", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result = evaluate(library);

  assert.equal(
    library.repository
      .getByQualityAssuranceId(
        "QAE-INT-0001",
      ),
    result.record,
  );
});

test("repository rejects duplicate record", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  evaluate(library);

  assert.throws(
    () => evaluate(library),
    /already exists/,
  );
});

test("repository finds by case id", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  evaluate(library, {
    id: "QAE-INT-0002",
    caseId: "CASE-2",
  });

  assert.equal(
    library.repository
      .findByCaseId("CASE-2")
      .length,
    1,
  );
});

test("repository filters non-conforming status", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  evaluate(library, {
    id: "QAE-INT-0003",
    confidence: 0.3,
  });

  assert.equal(
    library.repository
      .findByStatus("NON_CONFORMING")
      .length,
    1,
  );
});

test("critical records cannot be deleted", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result =
    evaluate(library, {
      id: "QAE-INT-0004",
      validated: false,
      releaseAllowed: false,
    });

  assert.equal(
    result.record.hasCriticalAlert(),
    true,
  );

  assert.throws(
    () =>
      library.repository.delete(
        "QAE-INT-0004",
      ),
    /critical alerts cannot be deleted/,
  );
});

test("context mapper creates engine metrics", () => {
  const metrics =
    new QualityAssuranceContextMapper()
      .mapMetrics({
        confidenceCalibrationResult: {
          finalConfidenceScore: 0.8,
        },
        uncertaintyResult: {
          totalUncertaintyScore: 0.2,
        },
      });

  assert.equal(
    metrics.some(
      (metric) =>
        metric.metricId ===
        "QA-CONFIDENCE",
    ),
    true,
  );

  assert.equal(
    metrics.some(
      (metric) =>
        metric.metricId ===
        "QA-UNCERTAINTY",
    ),
    true,
  );
});

test("integration produces conforming record", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result =
    evaluate(library, {
      id: "QAE-INT-0005",
    });

  assert.equal(
    result.record.evaluations[0].status,
    "CONFORMING",
  );
});

test("integration produces quality findings", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result =
    evaluate(library, {
      id: "QAE-INT-0006",
      confidence: 0.2,
    });

  assert.equal(
    result.record.findings.length > 0,
    true,
  );
});

test("audit adapter creates quality payload", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result =
    evaluate(library, {
      id: "QAE-INT-0007",
    });

  const payload =
    new QualityAssuranceAuditAdapter()
      .toAuditPayload(
        result.record,
      );

  assert.equal(
    payload.qualityAssuranceId,
    "QAE-INT-0007",
  );
});

test("provenance adapter creates nodes", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result =
    evaluate(library, {
      id: "QAE-INT-0008",
    });

  const payload =
    new QualityAssuranceProvenanceAdapter()
      .toProvenancePayload(
        result.record,
      );

  assert.equal(
    payload.qualityNode.type,
    "OBSERVATION",
  );

  assert.equal(
    payload.reportNode.type,
    "REPORT",
  );
});

test("repository finds critical records", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  evaluate(library, {
    id: "QAE-INT-0009",
    validated: false,
    releaseAllowed: false,
  });

  assert.equal(
    library.repository
      .findWithCriticalAlerts()
      .length,
    1,
  );
});

test("library exposes exporter and repository", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result =
    evaluate(library, {
      id: "QAE-INT-0010",
    });

  const exported =
    library.exporter.exportJson(
      result.record,
    );

  assert.equal(
    exported.mimeType,
    "application/json",
  );

  assert.equal(
    library.repository.count(),
    1,
  );
});

test("integration stores audit and provenance ids", () => {
  const library =
    createQualityAssuranceLibrary({
      clock: fixedClock,
    });

  const result =
    evaluate(library, {
      id: "QAE-INT-0011",
    });

  assert.equal(
    result.record.metadata.auditId,
    "AUD-1",
  );

  assert.equal(
    result.record.metadata.provenanceId,
    "PROV-1",
  );
});
