import assert from "node:assert/strict";
import test from "node:test";

import {
  GuidelineId,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineId.js";

import {
  createGuidelineVersion,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineVersion.js";

import {
  createGuidelineScope,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineScope.js";

import {
  EvidenceLevel,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/EvidenceLevel.js";

import {
  RecommendationStrength,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/RecommendationStrength.js";

import {
  GuidelinePriority,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelinePriority.js";

import {
  createGuidelineCondition,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineCondition.js";

import {
  createGuidelineRecommendation,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineRecommendation.js";

import {
  createGuidelineOutcome,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineOutcome.js";

import {
  createGuidelineBranch,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineBranch.js";

import {
  createGuidelineNode,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineNode.js";

import {
  ClinicalGuideline,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/ClinicalGuideline.js";

import {
  ClinicalGuidelineRepository,
} from "../ai/clinicalGovernance/clinicalGuideline/repository/ClinicalGuidelineRepository.js";

import {
  ClinicalGuidelineContextMapper,
} from "../ai/clinicalGovernance/clinicalGuideline/integration/ClinicalGuidelineContextMapper.js";

import {
  ClinicalGuidelineAuditAdapter,
} from "../ai/clinicalGovernance/clinicalGuideline/integration/ClinicalGuidelineAuditAdapter.js";

import {
  ClinicalGuidelineProvenanceAdapter,
} from "../ai/clinicalGovernance/clinicalGuideline/integration/ClinicalGuidelineProvenanceAdapter.js";

import {
  createClinicalGuidelineLibrary,
} from "../ai/clinicalGovernance/clinicalGuideline/ClinicalGuidelineLibrary.js";

const fixedClock = () =>
  new Date("2026-07-30T03:00:00.000Z");

const makeGuideline = ({
  id = "GLN-INT-0001",
  version = "1.0.0",
  status = "ACTIVE",
  scope =
    createGuidelineScope({
      type: "GLOBAL",
    }),
  priority = 10,
} = {}) =>
  new ClinicalGuideline({
    guidelineId:
      new GuidelineId(id),
    name: "Blast Review",
    status,
    version:
      createGuidelineVersion({
        version,
        effectiveFrom:
          "2026-07-30T00:00:00.000Z",
      }),
    scope,
    priority:
      new GuidelinePriority(priority),
    entryNodeId: "N-1",
    nodes: [
      createGuidelineNode({
        nodeId: "N-1",
        type: "DECISION",
        label: "Blasts?",
        branchIds: ["B-1", "B-2"],
      }),
      createGuidelineNode({
        nodeId: "N-2",
        type: "RECOMMENDATION",
        label: "Review",
        recommendationIds: ["REC-1"],
        outcomeId: "O-1",
      }),
      createGuidelineNode({
        nodeId: "N-3",
        type: "OUTCOME",
        label: "Stop",
        outcomeId: "O-2",
      }),
    ],
    conditions: [
      createGuidelineCondition({
        conditionId: "C-1",
        expression:
          "blastSuspicion == true",
      }),
      createGuidelineCondition({
        conditionId: "C-2",
        expression:
          "blastSuspicion == false",
      }),
    ],
    branches: [
      createGuidelineBranch({
        branchId: "B-1",
        conditionId: "C-1",
        targetNodeId: "N-2",
        priority: 1,
      }),
      createGuidelineBranch({
        branchId: "B-2",
        conditionId: "C-2",
        targetNodeId: "N-3",
        priority: 2,
      }),
    ],
    recommendations: [
      createGuidelineRecommendation({
        recommendationId: "REC-1",
        text: "Manual review.",
        evidenceLevel:
          new EvidenceLevel("B"),
        strength:
          new RecommendationStrength("STRONG"),
        requiresHumanReview: true,
      }),
    ],
    outcomes: [
      createGuidelineOutcome({
        outcomeId: "O-1",
        type: "ESCALATE",
        label: "Escalate",
      }),
      createGuidelineOutcome({
        outcomeId: "O-2",
        type: "STOP",
        label: "Stop",
      }),
    ],
    createdAt:
      "2026-07-30T00:00:00.000Z",
  });

test("repository saves and retrieves version", () => {
  const repository =
    new ClinicalGuidelineRepository();

  const guideline = makeGuideline();

  repository.save(guideline);

  assert.equal(
    repository.getByVersion(
      "GLN-INT-0001",
      "1.0.0",
    ),
    guideline,
  );
});

test("repository rejects duplicate version", () => {
  const repository =
    new ClinicalGuidelineRepository();

  const guideline = makeGuideline();

  repository.save(guideline);

  assert.throws(
    () => repository.save(guideline),
    /already exists/,
  );
});

test("repository finds active guidelines", () => {
  const repository =
    new ClinicalGuidelineRepository();

  repository.save(makeGuideline());

  assert.equal(
    repository.findActive({
      at: fixedClock(),
    }).length,
    1,
  );
});

test("active guideline cannot be deleted", () => {
  const repository =
    new ClinicalGuidelineRepository();

  repository.save(makeGuideline());

  assert.throws(
    () =>
      repository.delete(
        "GLN-INT-0001",
        "1.0.0",
      ),
    /cannot be deleted/,
  );
});

test("repository filters scope", () => {
  const repository =
    new ClinicalGuidelineRepository();

  repository.save(
    makeGuideline({
      id: "GLN-INT-0002",
      scope:
        createGuidelineScope({
          type: "LABORATORY",
          targetId: "LAB-1",
        }),
    }),
  );

  assert.equal(
    repository.findByScope(
      "LABORATORY",
      "LAB-1",
    ).length,
    1,
  );
});

test("context mapper combines engine outputs", () => {
  const context =
    new ClinicalGuidelineContextMapper()
      .map({
        caseContext: {
          blastSuspicion: true,
        },
        confidenceCalibrationResult: {
          finalConfidenceScore: 0.8,
        },
        uncertaintyResult: {
          totalUncertaintyScore: 0.2,
        },
        safetyGateResult: {
          releaseAllowed: false,
          automationAllowed: false,
          requiresHumanReview: true,
        },
      });

  assert.equal(
    context.blastSuspicion,
    true,
  );

  assert.equal(
    context.confidence,
    0.8,
  );

  assert.equal(
    context.uncertainty,
    0.2,
  );
});

test("integration executes applicable guideline", () => {
  const library =
    createClinicalGuidelineLibrary({
      clock: fixedClock,
    });

  library.repository.save(
    makeGuideline(),
  );

  const result =
    library.integrationService.executeApplicable({
      caseContext: {
        blastSuspicion: true,
      },
    });

  assert.equal(
    result.guidelineCount,
    1,
  );

  assert.equal(
    result.primaryExecutionResult.outcome.type,
    "ESCALATE",
  );
});

test("integration orders guidelines by priority", () => {
  const library =
    createClinicalGuidelineLibrary({
      clock: fixedClock,
    });

  library.repository.save(
    makeGuideline({
      id: "GLN-INT-0003",
      priority: 50,
    }),
  );

  library.repository.save(
    makeGuideline({
      id: "GLN-INT-0004",
      priority: 5,
    }),
  );

  const result =
    library.integrationService.executeApplicable({
      caseContext: {
        blastSuspicion: false,
      },
    });

  assert.equal(
    result.primaryGuidelineId,
    "GLN-INT-0004",
  );
});

test("audit adapter creates execution payload", () => {
  const library =
    createClinicalGuidelineLibrary({
      clock: fixedClock,
    });

  const guideline = makeGuideline();

  const executionResult =
    library.engine.execute(
      guideline,
      {
        blastSuspicion: true,
      },
    );

  const payload =
    new ClinicalGuidelineAuditAdapter()
      .toAuditPayload({
        guideline,
        executionResult,
      });

  assert.equal(
    payload.outcomeType,
    "ESCALATE",
  );
});

test("provenance adapter creates nodes", () => {
  const library =
    createClinicalGuidelineLibrary({
      clock: fixedClock,
    });

  const guideline = makeGuideline();

  const executionResult =
    library.engine.execute(
      guideline,
      {
        blastSuspicion: true,
      },
    );

  const payload =
    new ClinicalGuidelineProvenanceAdapter()
      .toProvenancePayload({
        guideline,
        executionResult,
      });

  assert.equal(
    payload.guidelineNode.type,
    "RULE",
  );

  assert.equal(
    payload.outcomeNode.type,
    "DECISION",
  );
});

test("integration propagates human review", () => {
  const library =
    createClinicalGuidelineLibrary({
      clock: fixedClock,
    });

  library.repository.save(
    makeGuideline(),
  );

  const result =
    library.integrationService.executeApplicable({
      caseContext: {
        blastSuspicion: true,
      },
    });

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("library exposes exporter and repository", () => {
  const library =
    createClinicalGuidelineLibrary({
      clock: fixedClock,
    });

  const guideline =
    makeGuideline({
      id: "GLN-INT-0005",
    });

  library.repository.save(guideline);

  const exported =
    library.exporter.exportJson(
      guideline,
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

test("integration returns no execution without guidelines", () => {
  const library =
    createClinicalGuidelineLibrary({
      clock: fixedClock,
    });

  const result =
    library.integrationService.executeApplicable({
      caseContext: {
        blastSuspicion: true,
      },
    });

  assert.equal(
    result.guidelineCount,
    0,
  );

  assert.equal(
    result.primaryExecutionResult,
    null,
  );
});
