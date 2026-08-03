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
  GuidelineConditionEvaluator,
} from "../ai/clinicalGovernance/clinicalGuideline/application/GuidelineConditionEvaluator.js";

import {
  GuidelineNavigator,
} from "../ai/clinicalGovernance/clinicalGuideline/application/GuidelineNavigator.js";

import {
  GuidelineValidationService,
} from "../ai/clinicalGovernance/clinicalGuideline/application/GuidelineValidationService.js";

import {
  GuidelineSerializer,
} from "../ai/clinicalGovernance/clinicalGuideline/application/GuidelineSerializer.js";

import {
  GuidelineExporter,
} from "../ai/clinicalGovernance/clinicalGuideline/application/GuidelineExporter.js";

import {
  ClinicalGuidelineEngine,
} from "../ai/clinicalGovernance/clinicalGuideline/application/ClinicalGuidelineEngine.js";

const fixedClock = () =>
  new Date("2026-07-30T00:00:00.000Z");

const guideline = ({
  status = "ACTIVE",
} = {}) =>
  new ClinicalGuideline({
    guidelineId:
      new GuidelineId("GLN-APP-0001"),
    name: "Blast Review",
    status,
    version:
      createGuidelineVersion({
        version: "1.0.0",
        effectiveFrom:
          "2026-07-29T00:00:00.000Z",
      }),
    scope:
      createGuidelineScope({
        type: "GLOBAL",
      }),
    priority:
      new GuidelinePriority(10),
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
        text:
          "Manual hematologist review.",
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
      "2026-07-29T00:00:00.000Z",
  });

test("condition evaluator compares values", () => {
  const result =
    new GuidelineConditionEvaluator()
      .evaluate(
        "confidence >= 0.8",
        { confidence: 0.9 },
      );

  assert.equal(result.matched, true);
});

test("navigator returns node", () => {
  const node =
    new GuidelineNavigator()
      .getNode(
        guideline(),
        "N-1",
      );

  assert.equal(node.nodeId, "N-1");
});

test("navigator detects cycle", () => {
  assert.throws(
    () =>
      new GuidelineNavigator()
        .assertTransition({
          visitedNodeIds: ["N-1"],
          nextNodeId: "N-1",
        }),
    /cycle detected/,
  );
});

test("validation accepts valid guideline", () => {
  const result =
    new GuidelineValidationService()
      .validate(guideline());

  assert.equal(result.valid, true);
});

test("engine follows true branch", () => {
  const result =
    new ClinicalGuidelineEngine({
      clock: fixedClock,
    }).execute(
      guideline(),
      {
        blastSuspicion: true,
      },
    );

  assert.equal(
    result.outcome.type,
    "ESCALATE",
  );

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("engine follows false branch", () => {
  const result =
    new ClinicalGuidelineEngine({
      clock: fixedClock,
    }).execute(
      guideline(),
      {
        blastSuspicion: false,
      },
    );

  assert.equal(
    result.outcome.type,
    "STOP",
  );
});

test("engine records visited nodes", () => {
  const result =
    new ClinicalGuidelineEngine({
      clock: fixedClock,
    }).execute(
      guideline(),
      {
        blastSuspicion: true,
      },
    );

  assert.deepEqual(
    result.visitedNodes,
    ["N-1", "N-2"],
  );
});

test("engine records selected branch", () => {
  const result =
    new ClinicalGuidelineEngine({
      clock: fixedClock,
    }).execute(
      guideline(),
      {
        blastSuspicion: true,
      },
    );

  assert.equal(
    result.selectedBranches[0].branchId,
    "B-1",
  );
});

test("engine rejects inactive guideline", () => {
  assert.throws(
    () =>
      new ClinicalGuidelineEngine({
        clock: fixedClock,
      }).execute(
        guideline({
          status: "DRAFT",
        }),
        {},
      ),
    /not active/,
  );
});

test("serializer round-trips guideline", () => {
  const serializer =
    new GuidelineSerializer();

  const restored =
    serializer.deserialize(
      serializer.serialize(
        guideline(),
      ),
    );

  assert.equal(
    restored.guidelineId.toString(),
    "GLN-APP-0001",
  );
});

test("exporter creates JSON payload", () => {
  const exported =
    new GuidelineExporter()
      .exportJson(guideline());

  assert.equal(
    exported.mimeType,
    "application/json",
  );
});

test("execution result contains safety statement", () => {
  const result =
    new ClinicalGuidelineEngine({
      clock: fixedClock,
    }).execute(
      guideline(),
      {
        blastSuspicion: false,
      },
    );

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});

test("unmatched branch holds execution", () => {
  const result =
    new ClinicalGuidelineEngine({
      clock: fixedClock,
    }).execute(
      guideline(),
      {
        blastSuspicion: null,
      },
    );

  assert.equal(
    result.status,
    "HELD",
  );
});
