import assert from "node:assert/strict";
import test from "node:test";

import {
  createHematologicSyndrome,
} from "../ai/clinicalRules/hematologicSyndrome/domain/HematologicSyndrome.js";

import {
  createHematologicSyndromeRelation,
} from "../ai/clinicalRules/hematologicSyndrome/domain/HematologicSyndromeRelation.js";

import {
  createHematologicSyndromeRecognitionLibrary,
} from "../ai/clinicalRules/hematologicSyndrome/HematologicSyndromeRecognitionLibrary.js";

import {
  HematologicSyndromeRepository,
} from "../ai/clinicalRules/hematologicSyndrome/repository/HematologicSyndromeRepository.js";

import {
  mergeHematologicSyndromePolicy,
} from "../ai/clinicalRules/hematologicSyndrome/domain/HematologicSyndromePolicy.js";

const syndrome = (
  id = "S-1",
  overrides = {},
) =>
  createHematologicSyndrome({
    id,
    preferredName: `Syndrome ${id}`,
    type: "COMPOSITE",
    requiredPatternIds: ["P-1"],
    supportivePatternIds: ["P-2"],
    minimumScore: 0.5,
    status: "ACTIVE",
    ...overrides,
  });

test("syndrome is immutable", () => {
  const value = syndrome();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.requiredPatternIds),
    true,
  );
});

test("syndrome rejects unsupported type", () => {
  assert.throws(
    () =>
      syndrome("S-1", {
        type: "UNKNOWN",
      }),
    /Unsupported hematologic syndrome type/,
  );
});

test("repository rejects duplicate syndrome", () => {
  const repository =
    new HematologicSyndromeRepository({
      policy:
        mergeHematologicSyndromePolicy(),
    });

  repository.registerSyndrome(
    syndrome("S-1"),
  );

  assert.throws(
    () =>
      repository.registerSyndrome(
        syndrome("S-1"),
      ),
    /already registered/,
  );
});

test("repository rejects unknown relation endpoints", () => {
  const repository =
    new HematologicSyndromeRepository({
      policy:
        mergeHematologicSyndromePolicy(),
    });

  assert.throws(
    () =>
      repository.registerRelation(
        createHematologicSyndromeRelation({
          id: "R-1",
          sourceSyndromeId: "S-1",
          targetSyndromeId: "S-2",
          type: "OVERLAPS_WITH",
        }),
      ),
    /endpoints must be registered/,
  );
});

test("engine recognizes syndrome from patterns", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [syndrome("S-1")],
    });

  const result =
    library.engine.recognize({
      matchedPatternIds: [
        "P-1",
        "P-2",
      ],
    });

  assert.equal(result.matchedCount, 1);
  assert.equal(
    result.selectedSyndrome.id,
    "S-1",
  );
});

test("required feature is enforced", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [
        syndrome("S-1", {
          requiredFeatureIds: ["F-1"],
        }),
      ],
    });

  const result =
    library.engine.recognize({
      matchedPatternIds: [
        "P-1",
        "P-2",
      ],
      observedFeatureIds: [],
    });

  assert.equal(result.matchedCount, 0);
});

test("exclusion pattern blocks recognition", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [
        syndrome("S-1", {
          exclusionPatternIds: ["P-X"],
        }),
      ],
    });

  const result =
    library.engine.recognize({
      matchedPatternIds: [
        "P-1",
        "P-2",
        "P-X",
      ],
    });

  assert.equal(result.matchedCount, 0);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("ranking selects higher score", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [
        syndrome("S-1"),
        syndrome("S-2", {
          requiredPatternIds: ["P-3"],
          supportivePatternIds: [],
          minimumScore: 1,
        }),
      ],
    });

  const result =
    library.engine.recognize({
      matchedPatternIds: [
        "P-1",
        "P-2",
      ],
    });

  assert.equal(
    result.selectedSyndrome.id,
    "S-1",
  );
});

test("equal matches require human review", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [
        syndrome("S-1"),
        syndrome("S-2"),
      ],
    });

  const result =
    library.engine.recognize({
      matchedPatternIds: [
        "P-1",
        "P-2",
      ],
    });

  assert.equal(result.topTie, true);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("repository filters syndrome type", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [
        syndrome("S-1"),
        syndrome("S-2", {
          type: "HEMOLYSIS",
        }),
      ],
    });

  assert.equal(
    library.repository.listSyndromes({
      type: "HEMOLYSIS",
    }).length,
    1,
  );
});

test("profile contains relations", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [
        syndrome("S-1"),
        syndrome("S-2"),
      ],
      relations: [
        createHematologicSyndromeRelation({
          id: "R-1",
          sourceSyndromeId: "S-1",
          targetSyndromeId: "S-2",
          type: "OVERLAPS_WITH",
          bidirectional: true,
        }),
      ],
    });

  assert.equal(
    library.engine
      .syndromeProfile("S-1")
      .relations.length,
    1,
  );
});

test("library exposes repository and engine", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary();

  assert.ok(library.repository);
  assert.ok(library.engine);
});

test("safety statement avoids diagnostic finality", () => {
  const library =
    createHematologicSyndromeRecognitionLibrary({
      syndromes: [syndrome("S-1")],
    });

  const result =
    library.engine.recognize({
      matchedPatternIds: ["P-1"],
    });

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
