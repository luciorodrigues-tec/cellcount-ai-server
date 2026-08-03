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
  createPolicyOverride,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/PolicyOverride.js";

import {
  ClinicalPolicy,
} from "../ai/clinicalGovernance/clinicalPolicy/domain/ClinicalPolicy.js";

import {
  PolicyConditionEvaluator,
} from "../ai/clinicalGovernance/clinicalPolicy/application/PolicyConditionEvaluator.js";

import {
  PolicyScopeResolver,
} from "../ai/clinicalGovernance/clinicalPolicy/application/PolicyScopeResolver.js";

import {
  PolicyOverrideResolver,
} from "../ai/clinicalGovernance/clinicalPolicy/application/PolicyOverrideResolver.js";

import {
  PolicyConflictResolver,
} from "../ai/clinicalGovernance/clinicalPolicy/application/PolicyConflictResolver.js";

import {
  PolicySerializer,
} from "../ai/clinicalGovernance/clinicalPolicy/application/PolicySerializer.js";

import {
  PolicyExporter,
} from "../ai/clinicalGovernance/clinicalPolicy/application/PolicyExporter.js";

import {
  ClinicalPolicyEngine,
} from "../ai/clinicalGovernance/clinicalPolicy/application/ClinicalPolicyEngine.js";

const policy = (overrides = {}) =>
  new ClinicalPolicy({
    policyId:
      new PolicyId("POL-APP-0001"),
    name: "Release Policy",
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
        ruleId: "R-1",
        condition:
          "confidence < 0.65",
        effect: "REQUIRE_REVIEW",
        priority: 10,
      }),
      createPolicyRule({
        ruleId: "R-2",
        condition:
          "uncertainty > 0.35",
        effect: "DENY",
        priority: 5,
      }),
    ],
    createdAt:
      "2026-07-29T00:00:00.000Z",
    ...overrides,
  });

test("condition evaluator compares numeric values", () => {
  const evaluator =
    new PolicyConditionEvaluator();

  assert.equal(
    evaluator.evaluate(
      "confidence >= 0.8",
      { confidence: 0.9 },
    ),
    true,
  );
});

test("scope resolver matches laboratory", () => {
  const resolver =
    new PolicyScopeResolver();

  assert.equal(
    resolver.matches(
      createPolicyScope({
        type: "LABORATORY",
        targetId: "LAB-1",
      }),
      { laboratoryId: "LAB-1" },
    ),
    true,
  );
});

test("override resolver excludes expired override", () => {
  const resolver =
    new PolicyOverrideResolver();

  const active =
    resolver.resolve([
      createPolicyOverride({
        overrideId: "O-1",
        targetRuleId: "R-1",
        reason: "Expired",
        approvedBy: "U-1",
        validUntil:
          "2026-01-01T00:00:00.000Z",
      }),
    ], {
      now:
        new Date("2026-07-29T00:00:00.000Z"),
    });

  assert.equal(active.length, 0);
});

test("engine returns deny on blocking rule", () => {
  const result =
    new ClinicalPolicyEngine()
      .evaluate(
        policy(),
        {
          confidence: 0.9,
          uncertainty: 0.8,
        },
      );

  assert.equal(
    result.decision.decision,
    "DENY",
  );
});

test("engine requires review on low confidence", () => {
  const result =
    new ClinicalPolicyEngine()
      .evaluate(
        policy(),
        {
          confidence: 0.5,
          uncertainty: 0.2,
        },
      );

  assert.equal(
    result.decision.decision,
    "REQUIRE_REVIEW",
  );
});

test("engine allows when no rule matches", () => {
  const result =
    new ClinicalPolicyEngine()
      .evaluate(
        policy(),
        {
          confidence: 0.9,
          uncertainty: 0.2,
        },
      );

  assert.equal(
    result.decision.decision,
    "ALLOW",
  );
});

test("inactive policy is not applicable", () => {
  const result =
    new ClinicalPolicyEngine()
      .evaluate(
        policy({
          status: "DRAFT",
        }),
        {},
      );

  assert.equal(result.applicable, false);
});

test("scope mismatch is not applicable", () => {
  const scoped =
    policy({
      scope:
        createPolicyScope({
          type: "LABORATORY",
          targetId: "LAB-1",
        }),
    });

  const result =
    new ClinicalPolicyEngine()
      .evaluate(
        scoped,
        {
          laboratoryId: "LAB-2",
        },
      );

  assert.equal(result.applicable, false);
});

test("override suppresses matched rule", () => {
  const overridden =
    policy({
      overrides: [
        createPolicyOverride({
          overrideId: "O-2",
          targetRuleId: "R-1",
          reason: "Approved exception",
          approvedBy: "U-1",
        }),
      ],
    });

  const result =
    new ClinicalPolicyEngine()
      .evaluate(
        overridden,
        {
          confidence: 0.5,
          uncertainty: 0.2,
        },
      );

  assert.equal(
    result.decision.decision,
    "ALLOW",
  );
});

test("conflict resolver applies precedence", () => {
  const resolver =
    new PolicyConflictResolver();

  const selected =
    resolver.resolve([
      { decision: "ALLOW" },
      { decision: "DENY" },
    ]);

  assert.equal(
    selected.decision,
    "DENY",
  );
});

test("serializer round-trips policy", () => {
  const serializer =
    new PolicySerializer();

  const restored =
    serializer.deserialize(
      serializer.serialize(policy()),
    );

  assert.equal(
    restored.policyId.toString(),
    "POL-APP-0001",
  );
});

test("exporter creates JSON payload", () => {
  const exported =
    new PolicyExporter()
      .exportJson(policy());

  assert.equal(
    exported.mimeType,
    "application/json",
  );
});

test("engine rejects invalid active policy", () => {
  const invalid =
    new ClinicalPolicy({
      policyId:
        new PolicyId("POL-APP-0002"),
      name: "Invalid Active",
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
      createdAt:
        "2026-07-29T00:00:00.000Z",
    });

  assert.throws(
    () =>
      new ClinicalPolicyEngine()
        .evaluate(invalid, {}),
    /Invalid clinical policy/,
  );
});
