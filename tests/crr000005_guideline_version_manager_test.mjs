import assert from "node:assert/strict";
import test from "node:test";

import {
  GuidelineVersionManager,
  GuidelineVersionRepository,
  createGuidelineRuleBinding,
  createGuidelineVersion,
  createGuidelineVersionLibrary,
} from "../ai/clinicalRules/index.js";

function guideline(version, overrides = {}) {
  return createGuidelineVersion({
    id: "GUIDELINE-TEST",
    family: "TEST_FAMILY",
    version,
    title: `Test guideline ${version}`,
    status: "ACTIVE",
    effectiveFrom: "2026-01-01T00:00:00.000Z",
    ...overrides,
  });
}

function binding(
  guidelineVersion,
  ruleId,
  ruleVersion,
  overrides = {},
) {
  return createGuidelineRuleBinding({
    guidelineId: "GUIDELINE-TEST",
    guidelineVersion,
    ruleId,
    ruleVersion,
    status: "ACTIVE",
    rationale: "Test binding.",
    ...overrides,
  });
}

test("guideline version is immutable and normalized", () => {
  const value = guideline("1.0.0");

  assert.equal(Object.isFrozen(value), true);
  assert.equal(value.family, "TEST_FAMILY");
  assert.equal(value.status, "ACTIVE");
});

test("guideline version rejects invalid semantic version", () => {
  assert.throws(
    () => guideline("v1"),
    /semantic versioning/,
  );
});

test("repository rejects duplicated guideline versions", () => {
  const repository =
    new GuidelineVersionRepository();
  repository.registerGuideline(
    guideline("1.0.0"),
  );

  assert.throws(
    () =>
      repository.registerGuideline(
        guideline("1.0.0"),
      ),
    /already registered/,
  );
});

test("repository rejects binding to unknown guideline", () => {
  const repository =
    new GuidelineVersionRepository();

  assert.throws(
    () =>
      repository.registerBinding(
        binding("1.0.0", "RULE-1", "1.0.0"),
      ),
    /Unknown guideline/,
  );
});

test("repository resolves latest active guideline", () => {
  const repository =
    new GuidelineVersionRepository();

  repository.registerGuideline(
    guideline("1.0.0"),
  );
  repository.registerGuideline(
    guideline("2.0.0"),
  );

  const latest =
    repository.latestActiveForFamily(
      "TEST_FAMILY",
      new Date("2026-07-28T00:00:00.000Z"),
    );

  assert.equal(latest.version, "2.0.0");
});

test("manager resolves active guideline with bindings", () => {
  const repository =
    new GuidelineVersionRepository();
  repository.registerGuideline(
    guideline("1.0.0"),
  );
  repository.registerBinding(
    binding("1.0.0", "RULE-1", "1.0.0"),
  );

  const manager = new GuidelineVersionManager({
    repository,
  });

  const resolved =
    manager.resolveActiveGuideline({
      family: "TEST_FAMILY",
      at: new Date("2026-07-28T00:00:00.000Z"),
    });

  assert.equal(resolved.resolved, true);
  assert.equal(resolved.bindings.length, 1);
});

test("version comparison detects added changed and removed rules", () => {
  const repository =
    new GuidelineVersionRepository();

  repository.registerGuideline(
    guideline("1.0.0"),
  );
  repository.registerGuideline(
    guideline("2.0.0"),
  );

  repository.registerBinding(
    binding("1.0.0", "RULE-1", "1.0.0"),
  );
  repository.registerBinding(
    binding("1.0.0", "RULE-2", "1.0.0"),
  );

  repository.registerBinding(
    binding("2.0.0", "RULE-1", "2.0.0"),
  );
  repository.registerBinding(
    binding("2.0.0", "RULE-3", "1.0.0"),
  );

  const comparison =
    new GuidelineVersionManager({
      repository,
    }).compareVersions({
      guidelineId: "GUIDELINE-TEST",
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
    });

  assert.equal(comparison.summary.added, 1);
  assert.equal(comparison.summary.changed, 1);
  assert.equal(comparison.summary.removed, 1);
});

test("migration plan is deterministic from comparison", () => {
  const repository =
    new GuidelineVersionRepository();

  repository.registerGuideline(
    guideline("1.0.0"),
  );
  repository.registerGuideline(
    guideline("2.0.0"),
  );
  repository.registerBinding(
    binding("1.0.0", "RULE-1", "1.0.0"),
  );
  repository.registerBinding(
    binding("2.0.0", "RULE-1", "2.0.0"),
  );

  const plan =
    new GuidelineVersionManager({
      repository,
    }).buildMigrationPlan({
      guidelineId: "GUIDELINE-TEST",
      fromVersion: "1.0.0",
      toVersion: "2.0.0",
    });

  assert.equal(plan.actions.length, 1);
  assert.equal(
    plan.actions[0].type,
    "UPDATE_RULE_BINDING",
  );
});

test("guideline rule use is blocked when guideline is inactive", () => {
  const repository =
    new GuidelineVersionRepository();

  repository.registerGuideline(
    guideline("1.0.0", {
      status: "DEPRECATED",
    }),
  );
  repository.registerBinding(
    binding("1.0.0", "RULE-1", "1.0.0"),
  );

  const result =
    new GuidelineVersionManager({
      repository,
    }).canUseGuidelineRule({
      guidelineId: "GUIDELINE-TEST",
      guidelineVersion: "1.0.0",
      ruleId: "RULE-1",
      ruleVersion: "1.0.0",
    });

  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    "GUIDELINE_NOT_ACTIVE",
  );
});

test("guideline rule use can be blocked by scientific governance", () => {
  const repository =
    new GuidelineVersionRepository();

  repository.registerGuideline(
    guideline("1.0.0"),
  );
  repository.registerBinding(
    binding("1.0.0", "RULE-1", "1.0.0"),
  );

  const governanceEngine = {
    canUseRule() {
      return {
        allowed: false,
        reason: "NO_APPROVED_GOVERNANCE_RECORD",
      };
    },
  };

  const result =
    new GuidelineVersionManager({
      repository,
      governanceEngine,
    }).canUseGuidelineRule({
      guidelineId: "GUIDELINE-TEST",
      guidelineVersion: "1.0.0",
      ruleId: "RULE-1",
      ruleVersion: "1.0.0",
    });

  assert.equal(result.allowed, false);
  assert.equal(
    result.reason,
    "SCIENTIFIC_GOVERNANCE_BLOCKED",
  );
});

test("guideline library exposes repository and manager", () => {
  const library =
    createGuidelineVersionLibrary({
      guidelines: [guideline("1.0.0")],
      bindings: [
        binding(
          "1.0.0",
          "RULE-1",
          "1.0.0",
        ),
      ],
    });

  assert.ok(library.repository);
  assert.ok(library.manager);
  assert.equal(library.guidelines.length, 1);
});
