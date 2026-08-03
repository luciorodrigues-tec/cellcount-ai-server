import assert from "node:assert/strict";
import test from "node:test";

import {
  PolicyId,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyId.js";

import {
  createPolicyScope,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyScope.js";

import {
  createPolicyVersion,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyVersion.js";

import {
  createPolicyRule,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyRule.js";

import {
  ClinicalPolicy,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/ClinicalPolicy.js";

import {
  ClinicalPolicyRepository,
} from "../ai/clinicalGovernance/clinicalPolicy/repository/ClinicalPolicyRepository.js";

import {
  ClinicalPolicyContextMapper,
} from "../ai/clinicalGovernance/clinicalPolicy/integration/ClinicalPolicyContextMapper.js";

import {
  ClinicalPolicyAuditAdapter,
} from "../ai/clinicalGovernance/clinicalPolicy/integration/ClinicalPolicyAuditAdapter.js";

import {
  ClinicalPolicyProvenanceAdapter,
} from "../ai/clinicalGovernance/clinicalPolicy/integration/ClinicalPolicyProvenanceAdapter.js";

import {
  createClinicalPolicyLibrary,
} from "../ai/clinicalGovernance/clinicalPolicy/ClinicalPolicyLibrary.js";

const fixedClock = () =>
  new Date("2026-07-29T22:00:00.000Z");

const makePolicy = ({
  id = "POL-INT-0001",
  version = "1.0.0",
  status = "ACTIVE",
  scope =
    createPolicyScope({
      type: "GLOBAL",
    }),
  rules = [
    createPolicyRule({
      ruleId: "R-1",
      condition:
        "confidence < 0.65",
      effect:
        "REQUIRE_REVIEW",
      priority: 10,
    }),
  ],
} = {}) =>
  new ClinicalPolicy({
    policyId:
      new PolicyId(id),
    name: "Policy",
    status,
    scope,
    version:
      createPolicyVersion({
        version,
        effectiveFrom:
          "2026-07-29T00:00:00.000Z",
      }),
    rules,
    createdAt:
      "2026-07-29T00:00:00.000Z",
  });

test("repository saves and retrieves version", () => {
  const repository =
    new ClinicalPolicyRepository();

  const policy = makePolicy();

  repository.save(policy);

  assert.equal(
    repository.getByVersion(
      "POL-INT-0001",
      "1.0.0",
    ),
    policy,
  );
});

test("repository rejects duplicate version", () => {
  const repository =
    new ClinicalPolicyRepository();

  const policy = makePolicy();

  repository.save(policy);

  assert.throws(
    () => repository.save(policy),
    /already exists/,
  );
});

test("repository finds active policies", () => {
  const repository =
    new ClinicalPolicyRepository();

  repository.save(makePolicy());

  assert.equal(
    repository.findActive({
      at: fixedClock(),
    }).length,
    1,
  );
});

test("active policy cannot be deleted", () => {
  const repository =
    new ClinicalPolicyRepository();

  repository.save(makePolicy());

  assert.throws(
    () =>
      repository.delete(
        "POL-INT-0001",
        "1.0.0",
      ),
    /cannot be deleted/,
  );
});

test("repository filters laboratory scope", () => {
  const repository =
    new ClinicalPolicyRepository();

  repository.save(
    makePolicy({
      id: "POL-INT-0002",
      scope:
        createPolicyScope({
          type: "LABORATORY",
          targetId: "LAB-1",
        }),
    }),
  );

  assert.equal(
    repository.findByLaboratory(
      "LAB-1",
    ).length,
    1,
  );
});

test("context mapper combines safety values", () => {
  const context =
    new ClinicalPolicyContextMapper()
      .map({
        laboratoryId: "LAB-1",
        safetyGateResult: {
          releaseAllowed: true,
          automationAllowed: false,
          requiresHumanReview: true,
          safetyScore: 0.7,
        },
        confidenceCalibrationResult: {
          finalConfidenceScore: 0.8,
        },
        uncertaintyResult: {
          totalUncertaintyScore: 0.2,
        },
      });

  assert.equal(context.confidence, 0.8);
  assert.equal(context.uncertainty, 0.2);
  assert.equal(
    context.automationAllowed,
    false,
  );
});

test("integration resolves applicable policy", () => {
  const library =
    createClinicalPolicyLibrary({
      clock: fixedClock,
    });

  library.repository.save(
    makePolicy(),
  );

  const result =
    library.integrationService.evaluate({
      confidenceCalibrationResult: {
        finalConfidenceScore: 0.5,
      },
    });

  assert.equal(
    result.decision.decision,
    "REQUIRE_REVIEW",
  );
});

test("integration resolves deny precedence", () => {
  const library =
    createClinicalPolicyLibrary({
      clock: fixedClock,
    });

  library.repository.save(
    makePolicy({
      id: "POL-INT-0003",
      rules: [
        createPolicyRule({
          ruleId: "R-ALLOW",
          condition: "confidence >= 0",
          effect: "ALLOW",
          priority: 20,
        }),
      ],
    }),
  );

  library.repository.save(
    makePolicy({
      id: "POL-INT-0004",
      rules: [
        createPolicyRule({
          ruleId: "R-DENY",
          condition: "uncertainty > 0.4",
          effect: "DENY",
          priority: 1,
        }),
      ],
    }),
  );

  const result =
    library.integrationService.evaluate({
      confidenceCalibrationResult: {
        finalConfidenceScore: 0.9,
      },
      uncertaintyResult: {
        totalUncertaintyScore: 0.8,
      },
    });

  assert.equal(
    result.decision.decision,
    "DENY",
  );
});

test("audit adapter creates policy payload", () => {
  const adapter =
    new ClinicalPolicyAuditAdapter();

  const policy = makePolicy();

  const result = {
    decision: {
      decision: "ALLOW",
      matchedRuleIds: [],
      requiresHumanReview: false,
    },
    activeOverrides: [],
  };

  const payload =
    adapter.toAuditPayload({
      policy,
      result,
    });

  assert.equal(
    payload.policyVersion,
    "1.0.0",
  );
});

test("provenance adapter creates nodes", () => {
  const adapter =
    new ClinicalPolicyProvenanceAdapter();

  const payload =
    adapter.toProvenancePayload({
      policy: makePolicy(),
      result: {
        decision: {
          decision: "ALLOW",
          matchedRuleIds: [],
          requiresHumanReview: false,
        },
        evaluations: [],
      },
    });

  assert.equal(
    payload.policyNode.type,
    "RULE",
  );

  assert.equal(
    payload.decisionNode.type,
    "DECISION",
  );
});

test("scope-specific policy is applied", () => {
  const library =
    createClinicalPolicyLibrary({
      clock: fixedClock,
    });

  library.repository.save(
    makePolicy({
      id: "POL-INT-0005",
      scope:
        createPolicyScope({
          type: "ENGINE",
          targetId: "CRR-000034",
        }),
    }),
  );

  const result =
    library.integrationService.evaluate({
      engineId: "CRR-000034",
      confidenceCalibrationResult: {
        finalConfidenceScore: 0.5,
      },
    });

  assert.equal(
    result.applicablePolicyCount,
    1,
  );
});

test("library exposes repository and exporter", () => {
  const library =
    createClinicalPolicyLibrary({
      clock: fixedClock,
    });

  const policy = makePolicy({
    id: "POL-INT-0006",
  });

  library.repository.save(policy);

  const exported =
    library.exporter.exportJson(policy);

  assert.equal(
    exported.mimeType,
    "application/json",
  );

  assert.equal(
    library.repository.count(),
    1,
  );
});

test("integration returns no decision without policies", () => {
  const library =
    createClinicalPolicyLibrary({
      clock: fixedClock,
    });

  const result =
    library.integrationService.evaluate({
      caseContext: {},
    });

  assert.equal(
    result.decision,
    null,
  );

  assert.equal(
    result.applicablePolicyCount,
    0,
  );
});
