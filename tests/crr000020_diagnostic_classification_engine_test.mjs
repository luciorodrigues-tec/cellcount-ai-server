import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticClassificationEngine,
  DiagnosticClassificationRepository,
  createDiagnosticClassificationCandidate,
  createDiagnosticClassificationLibrary,
} from "../ai/clinicalRules/index.js";

const candidate = (
  id,
  criteriaSetId,
  overrides = {},
) =>
  createDiagnosticClassificationCandidate({
    id,
    classificationId: "CLASS-1",
    diseaseEntityId: id,
    criteriaSetId,
    label: id,
    ...overrides,
  });

const criteriaEngine = (statuses) => ({
  evaluateSet({ criteriaSetId }) {
    return {
      status:
        statuses[criteriaSetId] ||
        "NOT_MET",
      requiresHumanReview: false,
    };
  },
});

test("classification candidate is immutable", () => {
  const value =
    candidate("C-1", "SET-1");

  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(
      value.competingCandidateIds,
    ),
    true,
  );
});

test("repository rejects duplicate candidates", () => {
  const repository =
    new DiagnosticClassificationRepository();

  repository.registerCandidate(
    candidate("C-1", "SET-1"),
  );

  assert.throws(
    () =>
      repository.registerCandidate(
        candidate("C-1", "SET-1"),
      ),
    /already registered/,
  );
});

test("engine requires criteria engine", () => {
  assert.throws(
    () =>
      new DiagnosticClassificationEngine({
        repository:
          new DiagnosticClassificationRepository(),
      }),
    /requires a diagnostic criteria engine/,
  );
});

test("eligible candidate is selected", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [
        candidate("C-1", "SET-1", {
          precedence: 10,
        }),
      ],
      criteriaEngine:
        criteriaEngine({
          "SET-1": "MET",
        }),
    });

  const result =
    library.engine.evaluate();

  assert.equal(
    result.selectedClassification
      .candidateId,
    "C-1",
  );
});

test("higher precedence wins", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [
        candidate("C-1", "SET-1", {
          precedence: 1,
        }),
        candidate("C-2", "SET-2", {
          precedence: 5,
        }),
      ],
      criteriaEngine:
        criteriaEngine({
          "SET-1": "MET",
          "SET-2": "MET",
        }),
    });

  const result =
    library.engine.evaluate();

  assert.equal(
    result.selectedClassification
      .candidateId,
    "C-2",
  );
});

test("excluded criteria result is not eligible", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [
        candidate("C-1", "SET-1"),
      ],
      criteriaEngine:
        criteriaEngine({
          "SET-1": "EXCLUDED",
        }),
    });

  const result =
    library.engine.evaluate();

  assert.equal(
    result.selectedClassification,
    null,
  );
  assert.equal(result.excludedCount, 1);
});

test("indeterminate result requires review", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [
        candidate("C-1", "SET-1"),
      ],
      criteriaEngine:
        criteriaEngine({
          "SET-1": "INDETERMINATE",
        }),
    });

  const result =
    library.engine.evaluate();

  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("equal precedence creates tie review", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [
        candidate("C-1", "SET-1", {
          precedence: 5,
        }),
        candidate("C-2", "SET-2", {
          precedence: 5,
        }),
      ],
      criteriaEngine:
        criteriaEngine({
          "SET-1": "MET",
          "SET-2": "MET",
        }),
    });

  const result =
    library.engine.evaluate();

  assert.equal(result.topTie, true);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("competing eligible candidates create conflict", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [
        candidate("C-1", "SET-1", {
          competingCandidateIds: [
            "C-2",
          ],
        }),
        candidate("C-2", "SET-2", {
          competingCandidateIds: [
            "C-1",
          ],
        }),
      ],
      criteriaEngine:
        criteriaEngine({
          "SET-1": "MET",
          "SET-2": "MET",
        }),
    });

  const result =
    library.engine.evaluate();

  assert.equal(
    result.competitionConflicts.length,
    1,
  );
});

test("classification filter limits candidates", () => {
  const repository =
    new DiagnosticClassificationRepository();

  repository.registerCandidate(
    candidate("C-1", "SET-1"),
  );

  repository.registerCandidate(
    createDiagnosticClassificationCandidate({
      id: "C-2",
      classificationId: "CLASS-2",
      diseaseEntityId: "D-2",
      criteriaSetId: "SET-2",
      label: "C-2",
    }),
  );

  const engine =
    new DiagnosticClassificationEngine({
      repository,
      criteriaEngine:
        criteriaEngine({
          "SET-1": "MET",
          "SET-2": "MET",
        }),
    });

  const result =
    engine.evaluate({
      classificationId: "CLASS-1",
    });

  assert.equal(result.evaluatedCount, 1);
});

test("library exposes repository and engine", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [],
      criteriaEngine:
        criteriaEngine({}),
    });

  assert.ok(library.repository);
  assert.ok(library.engine);
});

test("explanation avoids diagnostic finality", () => {
  const library =
    createDiagnosticClassificationLibrary({
      candidates: [
        candidate("C-1", "SET-1"),
      ],
      criteriaEngine:
        criteriaEngine({
          "SET-1": "MET",
        }),
    });

  const result =
    library.engine.evaluate();

  assert.match(
    result.explanation.safetyStatement,
    /not a definitive diagnosis/i,
  );
});
