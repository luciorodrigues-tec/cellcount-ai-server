import assert from "node:assert/strict";
import test from "node:test";

import {
  RuleEvidenceRepository,
  ScientificEvidenceCatalogService,
  ScientificGovernanceEngine,
  ScientificGovernanceRepository,
  createEvidenceGovernanceRecord,
  createEvidenceSource,
  createRuleEvidenceBinding,
  createScientificGovernanceLibrary,
  createScientificReviewer,
} from "../ai/clinicalRules/index.js";

function reviewer(id, roles) {
  return createScientificReviewer({
    id,
    displayName: id,
    roles,
    credentials: ["TEST"],
  });
}

function evidenceRepository() {
  const repository =
    new RuleEvidenceRepository();

  repository.registerSource(
    createEvidenceSource({
      id: "SRC-001",
      title: "Structured guideline",
      sourceType: "GUIDELINE",
      citation: "Test guideline citation.",
      year: 2026,
    }),
  );

  repository.registerBinding(
    createRuleEvidenceBinding({
      ruleId: "RULE-001",
      ruleVersion: "1.0.0",
      evidenceLevel: "GUIDELINE",
      sourceIds: ["SRC-001"],
      rationale: "Direct structured support.",
      status: "ACTIVE",
    }),
  );

  return repository;
}

function approvedRecord(overrides = {}) {
  return createEvidenceGovernanceRecord({
    id: "GOV-001",
    ruleId: "RULE-001",
    ruleVersion: "1.0.0",
    evidenceBindingKey: "RULE-001@1.0.0",
    status: "APPROVED",
    submittedBy: "AUTHOR-001",
    submittedAt: "2026-07-28T10:00:00.000Z",
    reviewerIds: [
      "SCIENTIFIC-001",
      "CLINICAL-001",
    ],
    approverIds: ["APPROVER-001"],
    decision: "APPROVE",
    decisionRationale:
      "Evidence package reviewed and approved.",
    decidedAt: "2026-07-28T11:00:00.000Z",
    effectiveFrom: "2026-07-28T12:00:00.000Z",
    ...overrides,
  });
}

function governanceRepository() {
  const repository =
    new ScientificGovernanceRepository();

  repository.registerReviewer(
    reviewer("AUTHOR-001", ["AUTHOR"]),
  );
  repository.registerReviewer(
    reviewer(
      "SCIENTIFIC-001",
      ["SCIENTIFIC_REVIEWER"],
    ),
  );
  repository.registerReviewer(
    reviewer(
      "CLINICAL-001",
      ["CLINICAL_REVIEWER"],
    ),
  );
  repository.registerReviewer(
    reviewer("APPROVER-001", ["APPROVER"]),
  );

  return repository;
}

test("scientific reviewer is immutable", () => {
  const value = reviewer(
    "REVIEWER-001",
    ["SCIENTIFIC_REVIEWER"],
  );

  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.roles), true);
});

test("scientific reviewer rejects unsupported roles", () => {
  assert.throws(
    () => reviewer("REVIEWER-001", ["UNKNOWN"]),
    /Unsupported reviewer role/,
  );
});

test("governance record preserves versioned rule identity", () => {
  const record = approvedRecord();

  assert.equal(record.ruleId, "RULE-001");
  assert.equal(record.ruleVersion, "1.0.0");
  assert.equal(record.status, "APPROVED");
});

test("governance repository rejects duplicated reviewers", () => {
  const repository =
    new ScientificGovernanceRepository();
  const value = reviewer(
    "REVIEWER-001",
    ["SCIENTIFIC_REVIEWER"],
  );

  repository.registerReviewer(value);

  assert.throws(
    () => repository.registerReviewer(value),
    /already registered/,
  );
});

test("governance engine requires reviewer role coverage", () => {
  const repository = governanceRepository();
  const engine = new ScientificGovernanceEngine({
    repository,
    evidenceRepository: evidenceRepository(),
  });

  const evaluation = engine.evaluate(
    approvedRecord({
      reviewerIds: ["SCIENTIFIC-001"],
    }),
  );

  assert.equal(evaluation.valid, false);
  assert.match(
    evaluation.errors.join(" "),
    /CLINICAL_REVIEWER/,
  );
});

test("governance engine rejects self approval", () => {
  const repository = governanceRepository();
  repository.registerReviewer(
    reviewer(
      "AUTHOR-APPROVER",
      ["AUTHOR", "APPROVER"],
    ),
  );

  const engine = new ScientificGovernanceEngine({
    repository,
    evidenceRepository: evidenceRepository(),
  });

  const evaluation = engine.evaluate(
    approvedRecord({
      submittedBy: "AUTHOR-APPROVER",
      approverIds: ["AUTHOR-APPROVER"],
    }),
  );

  assert.equal(evaluation.valid, false);
  assert.match(
    evaluation.errors.join(" "),
    /Self-approval/,
  );
});

test("approved governance record is registered", () => {
  const repository = governanceRepository();
  const engine = new ScientificGovernanceEngine({
    repository,
    evidenceRepository: evidenceRepository(),
  });

  const result = engine.approve(
    approvedRecord(),
  );

  assert.equal(result.approved, true);
  assert.equal(
    repository.latestForRule(
      "RULE-001",
      "1.0.0",
    ).id,
    "GOV-001",
  );
});

test("governance engine blocks use before effective date", () => {
  const repository = governanceRepository();
  const engine = new ScientificGovernanceEngine({
    repository,
    evidenceRepository: evidenceRepository(),
  });

  engine.approve(approvedRecord());

  const result = engine.canUseRule(
    "RULE-001",
    "1.0.0",
    new Date("2026-07-28T11:59:59.000Z"),
  );

  assert.equal(result.allowed, false);
  assert.equal(result.reason, "NOT_YET_EFFECTIVE");
});

test("governance engine allows approved effective rule", () => {
  const repository = governanceRepository();
  const engine = new ScientificGovernanceEngine({
    repository,
    evidenceRepository: evidenceRepository(),
  });

  engine.approve(approvedRecord());

  const result = engine.canUseRule(
    "RULE-001",
    "1.0.0",
    new Date("2026-07-28T12:00:01.000Z"),
  );

  assert.equal(result.allowed, true);
  assert.equal(
    result.reason,
    "APPROVED_AND_EFFECTIVE",
  );
});

test("scientific catalog combines evidence and governance", () => {
  const governanceRepo = governanceRepository();
  const evidenceRepo = evidenceRepository();
  const engine = new ScientificGovernanceEngine({
    repository: governanceRepo,
    evidenceRepository: evidenceRepo,
  });

  engine.approve(approvedRecord());

  const catalog =
    new ScientificEvidenceCatalogService({
      evidenceRepository: evidenceRepo,
      governanceRepository: governanceRepo,
      governanceEngine: engine,
    });

  const entry = catalog.catalogEntryForRule(
    "RULE-001",
    "1.0.0",
    new Date("2026-07-28T12:00:01.000Z"),
  );

  assert.equal(
    entry.evidence.completeness,
    "COMPLETE",
  );
  assert.equal(entry.governance.status, "APPROVED");
  assert.equal(entry.usability.allowed, true);
});

test("governance library exposes integrated components", () => {
  const library =
    createScientificGovernanceLibrary({
      evidenceRepository: evidenceRepository(),
      reviewers: [
        reviewer("AUTHOR-001", ["AUTHOR"]),
      ],
    });

  assert.ok(library.evidenceRepository);
  assert.ok(library.governanceRepository);
  assert.ok(library.governanceEngine);
  assert.ok(library.catalogService);
});
