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
  createPolicyThreshold,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyThreshold.js";

import {
  createPolicyRule,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyRule.js";

import {
  createPolicyOverride,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyOverride.js";

import {
  createPolicyConstraint,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyConstraint.js";

import {
  createPolicyDecision,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyDecision.js";

import {
  ClinicalPolicy,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/ClinicalPolicy.js";

test("PolicyId validates format", () => {
  assert.throws(
    () => new PolicyId("invalid"),
    /must match/,
  );

  assert.equal(
    new PolicyId("POL-CLIN-0001").toString(),
    "POL-CLIN-0001",
  );
});

test("global scope does not require target", () => {
  const scope =
    createPolicyScope({
      type: "GLOBAL",
    });

  assert.equal(scope.targetId, null);
});

test("non-global scope requires target", () => {
  assert.throws(
    () =>
      createPolicyScope({
        type: "LABORATORY",
      }),
    /targetId is required/,
  );
});

test("policy version requires effectiveFrom", () => {
  assert.throws(
    () =>
      createPolicyVersion({
        version: "1.0.0",
      }),
    /effectiveFrom is required/,
  );
});

test("threshold validates numeric value", () => {
  assert.throws(
    () =>
      createPolicyThreshold({
        key: "minConfidence",
        value: "x",
      }),
    /must be numeric/,
  );
});

test("threshold validates bounds", () => {
  assert.throws(
    () =>
      createPolicyThreshold({
        key: "maxUncertainty",
        value: 2,
        maximum: 1,
      }),
    /above maximum/,
  );
});

test("policy rule validates effect", () => {
  assert.throws(
    () =>
      createPolicyRule({
        ruleId: "R-1",
        condition: "x",
        effect: "UNKNOWN",
      }),
    /Unsupported policy rule effect/,
  );
});

test("policy override is immutable", () => {
  const value =
    createPolicyOverride({
      overrideId: "O-1",
      targetRuleId: "R-1",
      reason: "Emergency",
      approvedBy: "USER-1",
    });

  assert.equal(Object.isFrozen(value), true);
});

test("policy constraint is immutable", () => {
  const value =
    createPolicyConstraint({
      constraintId: "C-1",
      type: "REQUIRED_FIELD",
      value: "caseId",
    });

  assert.equal(Object.isFrozen(value), true);
});

test("policy decision is immutable", () => {
  const value =
    createPolicyDecision({
      policyId: "POL-1",
      decision: "ALLOW",
    });

  assert.equal(Object.isFrozen(value), true);
});

test("clinical policy rejects duplicate rules", () => {
  const rule =
    createPolicyRule({
      ruleId: "R-1",
      condition: "x",
      effect: "ALLOW",
    });

  assert.throws(
    () =>
      new ClinicalPolicy({
        policyId:
          new PolicyId("POL-CLIN-0002"),
        name: "Policy",
        scope:
          createPolicyScope({
            type: "GLOBAL",
          }),
        version:
          createPolicyVersion({
            version: "1.0.0",
            effectiveFrom:
              "2026-07-29T00:00:00.000Z",
          }),
        rules: [rule, rule],
        createdAt:
          "2026-07-29T00:00:00.000Z",
      }),
    /duplicate rule ids/,
  );
});

test("clinical policy sorts rules by priority", () => {
  const policy =
    new ClinicalPolicy({
      policyId:
        new PolicyId("POL-CLIN-0003"),
      name: "Policy",
      status: "ACTIVE",
      scope:
        createPolicyScope({
          type: "GLOBAL",
        }),
      version:
        createPolicyVersion({
          version: "1.0.0",
          effectiveFrom:
            "2026-07-29T00:00:00.000Z",
        }),
      rules: [
        createPolicyRule({
          ruleId: "R-2",
          condition: "b",
          effect: "WARN",
          priority: 20,
        }),
        createPolicyRule({
          ruleId: "R-1",
          condition: "a",
          effect: "ALLOW",
          priority: 10,
        }),
      ],
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(
    policy.rules[0].ruleId,
    "R-1",
  );
  assert.equal(policy.isActive(), true);
});

test("clinical policy is immutable", () => {
  const policy =
    new ClinicalPolicy({
      policyId:
        new PolicyId("POL-CLIN-0004"),
      name: "Policy",
      scope:
        createPolicyScope({
          type: "GLOBAL",
        }),
      version:
        createPolicyVersion({
          version: "1.0.0",
          effectiveFrom:
            "2026-07-29T00:00:00.000Z",
        }),
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.equal(Object.isFrozen(policy), true);
});
