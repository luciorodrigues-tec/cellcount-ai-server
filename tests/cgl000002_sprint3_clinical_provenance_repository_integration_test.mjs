import assert from "node:assert/strict";
import test from "node:test";

import {
  createAuditActor,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditActor.js";

import {
  createAuditCaseReference,
} from "../ai/clinicalGovernance/clinicalAudit/domain/AuditCaseReference.js";

import {
  createClinicalAuditLibrary,
} from "../ai/clinicalGovernance/clinicalAudit/ClinicalAuditLibrary.js";

import {
  ClinicalProvenanceRepository,
} from "../ai/clinicalGovernance/clinicalProvenance/repository/ClinicalProvenanceRepository.js";

import {
  ClinicalProvenanceReferenceMapper,
} from "../ai/clinicalGovernance/clinicalProvenance/integration/ClinicalProvenanceReferenceMapper.js";

import {
  createClinicalProvenanceLibrary,
} from "../ai/clinicalGovernance/clinicalProvenance/ClinicalProvenanceLibrary.js";

const fixedClock = () =>
  new Date("2026-07-29T20:00:00.000Z");

const safetyGateResult = {
  caseId: "CASE-PROV-001",
  decision: "RELEASED",
  releaseAllowed: true,
  automationAllowed: true,
  requiresHumanReview: false,
  safetyScore: 0.95,
  selectedHypothesisId: "HYP-1",
};

test("repository saves and retrieves provenance", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      provenanceId: "PROV-INT-0001",
      caseId: "CASE-PROV-001",
      safetyGateResult,
    });

  assert.equal(
    library.repository.getByProvenanceId(
      "PROV-INT-0001",
    ),
    record,
  );
});

test("repository rejects duplicate without replace", () => {
  const repository =
    new ClinicalProvenanceRepository();

  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      provenanceId: "PROV-INT-0002",
      caseId: "CASE-PROV-002",
      safetyGateResult,
    });

  repository.save(record);

  assert.throws(
    () => repository.save(record),
    /already exists/,
  );
});

test("repository finds by case id", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  library.integrationService.captureClinicalCase({
    provenanceId: "PROV-INT-0003",
    caseId: "CASE-PROV-003",
    safetyGateResult,
  });

  assert.equal(
    library.repository.findByCaseId(
      "CASE-PROV-003",
    ).length,
    1,
  );
});

test("reference mapper maps source nodes", () => {
  const mapper =
    new ClinicalProvenanceReferenceMapper();

  const nodes =
    mapper.mapSources([
      {
        id: "IMG-1",
        type: "IMAGE",
        source: "upload",
        label: "Slide image",
      },
    ]);

  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].type, "SOURCE");
});

test("reference mapper maps evidence nodes", () => {
  const mapper =
    new ClinicalProvenanceReferenceMapper();

  const nodes =
    mapper.mapEvidenceItems([
      {
        id: "EV-1",
        type: "MORPHOLOGY",
        summary: "Atypical lymphocyte",
        hypothesisId: "HYP-1",
      },
    ]);

  assert.equal(nodes.length, 1);
  assert.equal(nodes[0].type, "MORPHOLOGY");
});

test("integration creates decision lineage", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      provenanceId: "PROV-INT-0004",
      caseId: "CASE-PROV-004",
      sources: [
        {
          nodeId: "SRC-1",
          id: "IMG-1",
          type: "IMAGE",
          source: "upload",
          label: "Image",
        },
      ],
      evidenceItems: [
        {
          nodeId: "EV-1",
          type: "MORPHOLOGY",
          summary: "Morphology",
        },
      ],
      selectedHypothesis: {
        hypothesisId: "HYP-1",
        label: "Hypothesis 1",
      },
      relationships: [
        {
          edgeId: "EDGE-1",
          fromNodeId: "SRC-1",
          toNodeId: "EV-1",
          relationship: "DERIVED_FROM",
        },
        {
          edgeId: "EDGE-2",
          fromNodeId: "EV-1",
          toNodeId: "HYP-1",
          relationship: "SUPPORTS",
        },
      ],
      safetyGateResult,
    });

  assert.equal(record.lineages.length, 1);
  assert.equal(
    record.lineages[0].ancestorNodeIds.includes("SRC-1"),
    true,
  );
});

test("integration maps transformations and steps", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      provenanceId: "PROV-INT-0005",
      caseId: "CASE-PROV-005",
      transformations: [
        {
          id: "T-1",
          name: "Classification",
          engineId: "CRR-000020",
          engineVersion: "1.0.0",
        },
      ],
      pipelineSteps: [
        {
          id: "S-1",
          order: 1,
          name: "Classification",
          transformationIds: ["T-1"],
        },
      ],
      safetyGateResult,
    });

  assert.equal(record.transformations.length, 1);
  assert.equal(record.pipelineSteps.length, 1);
});

test("repository finds by node id", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  library.integrationService.captureClinicalCase({
    provenanceId: "PROV-INT-0006",
    caseId: "CASE-PROV-006",
    evidenceItems: [
      {
        nodeId: "NODE-X",
        type: "FEATURE",
        label: "Feature X",
      },
    ],
    safetyGateResult,
  });

  assert.equal(
    library.repository.findByNodeId(
      "NODE-X",
    ).length,
    1,
  );
});

test("repository finds by hypothesis id", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  library.integrationService.captureClinicalCase({
    provenanceId: "PROV-INT-0007",
    caseId: "CASE-PROV-007",
    selectedHypothesis: {
      hypothesisId: "HYP-SEARCH",
      label: "Hypothesis Search",
    },
    safetyGateResult,
  });

  assert.equal(
    library.repository.findByHypothesisId(
      "HYP-SEARCH",
    ).length,
    1,
  );
});

test("integration links existing audit", () => {
  const auditLibrary =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  auditLibrary.integrationService.captureClinicalCase({
    auditId: "AUD-PROV-0001",
    caseReference:
      createAuditCaseReference({
        caseId: "CASE-PROV-008",
      }),
    actor:
      createAuditActor({
        id: "SYSTEM-PROV",
        type: "SYSTEM",
      }),
    engineVersions: {
      "CRR-000034": {
        version: "1.0.0",
      },
    },
    safetyGateResult,
  });

  const provenanceLibrary =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
      auditRepository:
        auditLibrary.repository,
    });

  const record =
    provenanceLibrary.integrationService.captureClinicalCase({
      provenanceId: "PROV-INT-0008",
      caseId: "CASE-PROV-008",
      auditId: "AUD-PROV-0001",
      safetyGateResult,
    });

  assert.equal(
    record.metadata.auditId,
    "AUD-PROV-0001",
  );
});

test("missing linked audit is rejected", () => {
  const auditLibrary =
    createClinicalAuditLibrary({
      clock: fixedClock,
    });

  const provenanceLibrary =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
      auditRepository:
        auditLibrary.repository,
    });

  assert.throws(
    () =>
      provenanceLibrary.integrationService.captureClinicalCase({
        provenanceId: "PROV-INT-0009",
        caseId: "CASE-PROV-009",
        auditId: "AUD-MISSING",
        safetyGateResult,
      }),
    /Linked audit record not found/,
  );
});

test("library exposes export and integrity tools", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  const record =
    library.integrationService.captureClinicalCase({
      provenanceId: "PROV-INT-0010",
      caseId: "CASE-PROV-010",
      safetyGateResult,
    });

  const exported =
    library.exporter.exportJson(record);

  const integrity =
    library.integrityCalculator.calculate(record);

  assert.equal(
    exported.mimeType,
    "application/json",
  );

  assert.ok(integrity.hash);
});

test("integration requires safety gate result", () => {
  const library =
    createClinicalProvenanceLibrary({
      clock: fixedClock,
    });

  assert.throws(
    () =>
      library.integrationService.captureClinicalCase({
        provenanceId: "PROV-INT-0011",
        caseId: "CASE-PROV-011",
      }),
    /safetyGateResult is required/,
  );
});
