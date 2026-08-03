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
  ExecutionMode,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/ExecutionMode.js";

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
  createGuidelineReference,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineReference.js";

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
  createGuidelineStep,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/GuidelineStep.js";

import {
  ClinicalGuideline,
} from "../ai/clinicalGovernance/clinicalGuideline/domain/ClinicalGuideline.js";

test("GuidelineId validates format", () => {
  assert.throws(
    () => new GuidelineId("invalid"),
    /must match/,
  );

  assert.equal(
    new GuidelineId("GLN-CLIN-0001").toString(),
    "GLN-CLIN-0001",
  );
});

test("global scope does not require target", () => {
  const scope =
    createGuidelineScope({
      type: "GLOBAL",
    });

  assert.equal(scope.targetId, null);
});

test("non-global scope requires target", () => {
  assert.throws(
    () =>
      createGuidelineScope({
        type: "LABORATORY",
      }),
    /targetId is required/,
  );
});

test("evidence level validates value", () => {
  assert.throws(
    () => new EvidenceLevel("Z"),
    /Unsupported evidence level/,
  );
});

test("recommendation strength validates value", () => {
  assert.throws(
    () => new RecommendationStrength("UNKNOWN"),
    /Unsupported recommendation strength/,
  );
});

test("execution mode validates value", () => {
  assert.throws(
    () => new ExecutionMode("UNKNOWN"),
    /Unsupported execution mode/,
  );
});

test("guideline priority validates range", () => {
  assert.throws(
    () => new GuidelinePriority(0),
    /between 1 and 1000/,
  );
});

test("recommendation requires evidence metadata", () => {
  assert.throws(
    () =>
      createGuidelineRecommendation({
        recommendationId: "REC-1",
        text: "Review smear",
      }),
    /requires evidenceLevel and strength/,
  );
});

test("reference is immutable", () => {
  const value =
    createGuidelineReference({
      referenceId: "REF-1",
      organization: "ICSH",
      title: "Guideline",
    });

  assert.equal(Object.isFrozen(value), true);
});

test("branch validates priority", () => {
  assert.throws(
    () =>
      createGuidelineBranch({
        branchId: "B-1",
        conditionId: "C-1",
        targetNodeId: "N-2",
        priority: 0,
      }),
    /positive integer/,
  );
});

test("clinical guideline rejects unknown entry node", () => {
  assert.throws(
    () =>
      new ClinicalGuideline({
        guidelineId:
          new GuidelineId("GLN-CLIN-0002"),
        name: "Guideline",
        status: "ACTIVE",
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
        entryNodeId: "N-404",
        nodes: [],
        createdAt:
          "2026-07-29T00:00:00.000Z",
      }),
    /must reference an existing node/,
  );
});

test("clinical guideline sorts steps and branches", () => {
  const guideline =
    new ClinicalGuideline({
      guidelineId:
        new GuidelineId("GLN-CLIN-0003"),
      name: "Guideline",
      status: "ACTIVE",
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
          type: "START",
          label: "Start",
        }),
        createGuidelineNode({
          nodeId: "N-2",
          type: "OUTCOME",
          label: "End",
        }),
      ],
      conditions: [
        createGuidelineCondition({
          conditionId: "C-1",
          expression: "blastSuspicion == true",
        }),
      ],
      branches: [
        createGuidelineBranch({
          branchId: "B-2",
          conditionId: "C-1",
          targetNodeId: "N-2",
          priority: 20,
        }),
        createGuidelineBranch({
          branchId: "B-1",
          conditionId: "C-1",
          targetNodeId: "N-2",
          priority: 10,
        }),
      ],
      outcomes: [
        createGuidelineOutcome({
          outcomeId: "O-1",
          type: "COMPLETE",
          label: "Complete",
        }),
      ],
      steps: [
        createGuidelineStep({
          stepId: "S-2",
          order: 2,
          nodeId: "N-2",
          executionMode:
            new ExecutionMode("MANUAL"),
        }),
        createGuidelineStep({
          stepId: "S-1",
          order: 1,
          nodeId: "N-1",
          executionMode:
            new ExecutionMode("ASSISTED"),
        }),
      ],
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(guideline.steps[0].stepId, "S-1");
  assert.equal(guideline.branches[0].branchId, "B-1");
  assert.equal(guideline.isActive(), true);
});

test("clinical guideline is immutable", () => {
  const guideline =
    new ClinicalGuideline({
      guidelineId:
        new GuidelineId("GLN-CLIN-0004"),
      name: "Guideline",
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
          type: "START",
          label: "Start",
        }),
      ],
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(Object.isFrozen(guideline), true);
});
