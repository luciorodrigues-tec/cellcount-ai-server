import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticCriteriaEngine,
  DiagnosticCriteriaRepository,
  createDiagnosticCriteriaLibrary,
  createDiagnosticCriteriaSet,
  createDiagnosticCriterion,
} from "../ai/clinicalRules/index.js";

const criterion = (
  id,
  type,
  featureIds,
  overrides = {},
) =>
  createDiagnosticCriterion({
    id,
    classificationId: "CLASS-1",
    diseaseEntityId: "D-1",
    type,
    label: id,
    featureIds,
    ...overrides,
  });

const criteriaSet = (overrides = {}) =>
  createDiagnosticCriteriaSet({
    id: "SET-1",
    classificationId: "CLASS-1",
    diseaseEntityId: "D-1",
    title: "Test criteria set",
    criterionIds: [
      "REQ-1",
      "MAJ-1",
      "MIN-1",
      "EXC-1",
    ],
    minimumMajor: 1,
    minimumMinor: 1,
    minimumScore: 2,
    ...overrides,
  });

test("diagnostic criterion is immutable", () => {
  const value =
    criterion("REQ-1", "REQUIRED", ["F-1"]);

  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.featureIds),
    true,
  );
});

test("criterion rejects unsupported type", () => {
  assert.throws(
    () =>
      criterion(
        "C-1",
        "UNKNOWN",
        ["F-1"],
      ),
    /Unsupported diagnostic criterion type/,
  );
});

test("repository rejects unknown criterion in set", () => {
  const repository =
    new DiagnosticCriteriaRepository();

  assert.throws(
    () =>
      repository.registerSet(
        createDiagnosticCriteriaSet({
          id: "SET-X",
          classificationId: "CLASS-1",
          diseaseEntityId: "D-1",
          title: "Set",
          criterionIds: ["MISSING"],
        }),
      ),
    /Unknown diagnostic criterion/,
  );
});

test("engine marks criteria set as met", () => {
  const library =
    createDiagnosticCriteriaLibrary({
      criteria: [
        criterion("REQ-1", "REQUIRED", ["F-REQ"]),
        criterion("MAJ-1", "MAJOR", ["F-MAJ"]),
        criterion("MIN-1", "MINOR", ["F-MIN"]),
        criterion("EXC-1", "EXCLUSION", ["F-EXC"]),
      ],
      sets: [criteriaSet()],
    });

  const result =
    library.engine.evaluateSet({
      criteriaSetId: "SET-1",
      observedFeatureIds: [
        "F-REQ",
        "F-MAJ",
        "F-MIN",
      ],
    });

  assert.equal(result.status, "MET");
  assert.equal(result.score, 3);
});

test("missing required criterion prevents match", () => {
  const library =
    createDiagnosticCriteriaLibrary({
      criteria: [
        criterion("REQ-1", "REQUIRED", ["F-REQ"]),
        criterion("MAJ-1", "MAJOR", ["F-MAJ"]),
        criterion("MIN-1", "MINOR", ["F-MIN"]),
        criterion("EXC-1", "EXCLUSION", ["F-EXC"]),
      ],
      sets: [criteriaSet()],
    });

  const result =
    library.engine.evaluateSet({
      criteriaSetId: "SET-1",
      observedFeatureIds: [
        "F-MAJ",
        "F-MIN",
      ],
    });

  assert.equal(
    result.reason,
    "REQUIRED_CRITERION_MISSING",
  );
});

test("exclusion criterion overrides positive criteria", () => {
  const library =
    createDiagnosticCriteriaLibrary({
      criteria: [
        criterion("REQ-1", "REQUIRED", ["F-REQ"]),
        criterion("MAJ-1", "MAJOR", ["F-MAJ"]),
        criterion("MIN-1", "MINOR", ["F-MIN"]),
        criterion("EXC-1", "EXCLUSION", ["F-EXC"]),
      ],
      sets: [criteriaSet()],
    });

  const result =
    library.engine.evaluateSet({
      criteriaSetId: "SET-1",
      observedFeatureIds: [
        "F-REQ",
        "F-MAJ",
        "F-MIN",
        "F-EXC",
      ],
    });

  assert.equal(result.status, "EXCLUDED");
  assert.equal(result.conflictDetected, true);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("ALL operator requires all features", () => {
  const repository =
    new DiagnosticCriteriaRepository();

  repository.registerCriterion(
    criterion(
      "REQ-1",
      "REQUIRED",
      ["F-1", "F-2"],
      { operator: "ALL" },
    ),
  );
  repository.registerSet(
    createDiagnosticCriteriaSet({
      id: "SET-ALL",
      classificationId: "CLASS-1",
      diseaseEntityId: "D-1",
      title: "All",
      criterionIds: ["REQ-1"],
    }),
  );

  const engine =
    new DiagnosticCriteriaEngine({
      repository,
    });

  const result =
    engine.evaluateSet({
      criteriaSetId: "SET-ALL",
      observedFeatureIds: ["F-1"],
    });

  assert.equal(
    result.requiredSatisfied,
    false,
  );
});

test("COUNT_AT_LEAST operator respects requiredCount", () => {
  const repository =
    new DiagnosticCriteriaRepository();

  repository.registerCriterion(
    criterion(
      "MAJ-1",
      "MAJOR",
      ["F-1", "F-2", "F-3"],
      {
        operator: "COUNT_AT_LEAST",
        requiredCount: 2,
      },
    ),
  );
  repository.registerSet(
    createDiagnosticCriteriaSet({
      id: "SET-COUNT",
      classificationId: "CLASS-1",
      diseaseEntityId: "D-1",
      title: "Count",
      criterionIds: ["MAJ-1"],
      minimumMajor: 1,
    }),
  );

  const engine =
    new DiagnosticCriteriaEngine({
      repository,
    });

  const result =
    engine.evaluateSet({
      criteriaSetId: "SET-COUNT",
      observedFeatureIds: ["F-1", "F-2"],
    });

  assert.equal(result.status, "MET");
});

test("threshold criterion evaluates measurement", () => {
  const repository =
    new DiagnosticCriteriaRepository();

  repository.registerCriterion(
    criterion(
      "THR-1",
      "THRESHOLD",
      [],
      {
        operator: "THRESHOLD_GTE",
        threshold: 20,
      },
    ),
  );
  repository.registerSet(
    createDiagnosticCriteriaSet({
      id: "SET-THR",
      classificationId: "CLASS-1",
      diseaseEntityId: "D-1",
      title: "Threshold",
      criterionIds: ["THR-1"],
      minimumScore: 1,
    }),
  );

  const result =
    new DiagnosticCriteriaEngine({
      repository,
    }).evaluateSet({
      criteriaSetId: "SET-THR",
      measurements: {
        "THR-1": 25,
      },
    });

  assert.equal(result.status, "MET");
});

test("library exposes repository and engine", () => {
  const library =
    createDiagnosticCriteriaLibrary({
      criteria: [],
      sets: [],
    });

  assert.ok(library.repository);
  assert.ok(library.engine);
});

test("explanation avoids diagnostic finality", () => {
  const library =
    createDiagnosticCriteriaLibrary({
      criteria: [
        criterion("REQ-1", "REQUIRED", ["F-REQ"]),
      ],
      sets: [
        createDiagnosticCriteriaSet({
          id: "SET-1",
          classificationId: "CLASS-1",
          diseaseEntityId: "D-1",
          title: "Set",
          criterionIds: ["REQ-1"],
        }),
      ],
    });

  const result =
    library.engine.evaluateSet({
      criteriaSetId: "SET-1",
      observedFeatureIds: ["F-REQ"],
    });

  assert.match(
    result.explanation.safetyStatement,
    /not a definitive diagnosis/i,
  );
});
