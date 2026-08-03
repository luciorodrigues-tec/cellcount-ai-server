import assert from "node:assert/strict";
import test from "node:test";

import {
  createMorphologicPattern,
} from "../ai/clinicalRules/morphologicPattern/domain/MorphologicPattern.js";

import {
  createMorphologicPatternRelation,
} from "../ai/clinicalRules/morphologicPattern/domain/MorphologicPatternRelation.js";

import {
  mergeMorphologicPatternPolicy,
} from "../ai/clinicalRules/morphologicPattern/domain/MorphologicPatternPolicy.js";

import {
  MorphologicPatternKnowledgeRepository,
} from "../ai/clinicalRules/morphologicPattern/repository/MorphologicPatternKnowledgeRepository.js";

import {
  MorphologicPatternRecognitionKnowledgeEngine,
} from "../ai/clinicalRules/morphologicPattern/application/MorphologicPatternRecognitionKnowledgeEngine.js";

import {
  MorphologicPatternSimilarity,
} from "../ai/clinicalRules/morphologicPattern/application/MorphologicPatternSimilarity.js";

import {
  createMorphologicPatternRecognitionLibrary,
} from "../ai/clinicalRules/morphologicPattern/MorphologicPatternRecognitionLibrary.js";

const pattern = (
  id = "P-1",
  overrides = {},
) =>
  createMorphologicPattern({
    id,
    preferredName: `Pattern ${id}`,
    type: "COMPOSITE",
    requiredFeatureIds: ["F-1"],
    supportiveFeatureIds: ["F-2"],
    minimumScore: 0.5,
    status: "ACTIVE",
    ...overrides,
  });

test("pattern is immutable", () => {
  const value = pattern();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.requiredFeatureIds),
    true,
  );
});

test("pattern rejects unsupported type", () => {
  assert.throws(
    () =>
      pattern("P-1", {
        type: "UNKNOWN",
      }),
    /Unsupported morphologic pattern type/,
  );
});

test("repository resolves aliases", () => {
  const repository =
    new MorphologicPatternKnowledgeRepository({
      policy:
        mergeMorphologicPatternPolicy(),
    });

  repository.registerPattern(
    pattern("P-1", {
      aliases: ["Alias P1"],
    }),
  );

  assert.equal(
    repository.resolveTerm("Alias P1").id,
    "P-1",
  );
});

test("repository rejects unknown parent", () => {
  const repository =
    new MorphologicPatternKnowledgeRepository({
      policy:
        mergeMorphologicPatternPolicy(),
    });

  assert.throws(
    () =>
      repository.registerPattern(
        pattern("P-2", {
          parentPatternId: "MISSING",
        }),
      ),
    /Unknown parent morphologic pattern/,
  );
});

test("repository rejects unknown relation endpoints", () => {
  const repository =
    new MorphologicPatternKnowledgeRepository({
      policy:
        mergeMorphologicPatternPolicy(),
    });

  assert.throws(
    () =>
      repository.registerRelation(
        createMorphologicPatternRelation({
          id: "R-1",
          sourcePatternId: "P-1",
          targetPatternId: "P-2",
          type: "OVERLAPS_WITH",
        }),
      ),
    /endpoints must be registered/,
  );
});

test("matcher recognizes complete pattern", () => {
  const library =
    createMorphologicPatternRecognitionLibrary({
      patterns: [pattern("P-1")],
    });

  const result =
    library.engine.recognize({
      observedFeatureIds: [
        "F-1",
        "F-2",
      ],
    });

  assert.equal(result.matchedCount, 1);
  assert.equal(
    result.selectedPattern.id,
    "P-1",
  );
});

test("exclusion feature blocks recognition", () => {
  const library =
    createMorphologicPatternRecognitionLibrary({
      patterns: [
        pattern("P-1", {
          exclusionFeatureIds: ["F-X"],
        }),
      ],
    });

  const result =
    library.engine.recognize({
      observedFeatureIds: [
        "F-1",
        "F-2",
        "F-X",
      ],
    });

  assert.equal(result.matchedCount, 0);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("weighted features affect score", () => {
  const library =
    createMorphologicPatternRecognitionLibrary({
      patterns: [
        pattern("P-1", {
          requiredFeatureIds: [],
          supportiveFeatureIds: [],
          weightedFeatures: [
            {
              featureId: "F-1",
              weight: 0.8,
            },
            {
              featureId: "F-2",
              weight: 0.2,
            },
          ],
          minimumRequiredMatches: 0,
          minimumSupportiveMatches: 0,
          minimumScore: 0.7,
        }),
      ],
    });

  const result =
    library.engine.recognize({
      observedFeatureIds: ["F-1"],
    });

  assert.equal(
    result.rankedMatches[0].score,
    0.8,
  );
  assert.equal(result.matchedCount, 1);
});

test("similarity reports shared features", () => {
  const similarity =
    new MorphologicPatternSimilarity();

  const result =
    similarity.compare(
      pattern("P-1", {
        requiredFeatureIds: ["F-1", "F-2"],
        supportiveFeatureIds: [],
      }),
      pattern("P-2", {
        requiredFeatureIds: ["F-2", "F-3"],
        supportiveFeatureIds: [],
      }),
    );

  assert.deepEqual(
    result.sharedFeatureIds,
    ["F-2"],
  );
});

test("engine compares registered patterns", () => {
  const library =
    createMorphologicPatternRecognitionLibrary({
      patterns: [
        pattern("P-1"),
        pattern("P-2", {
          requiredFeatureIds: ["F-1"],
          supportiveFeatureIds: ["F-3"],
        }),
      ],
    });

  const result =
    library.engine.comparePatterns(
      "P-1",
      "P-2",
    );

  assert.ok(result.similarityScore > 0);
});

test("engine detects top tie", () => {
  const library =
    createMorphologicPatternRecognitionLibrary({
      patterns: [
        pattern("P-1"),
        pattern("P-2"),
      ],
    });

  const result =
    library.engine.recognize({
      observedFeatureIds: [
        "F-1",
        "F-2",
      ],
    });

  assert.equal(result.topTie, true);
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("engine detects hierarchy cycle", () => {
  const repository =
    new MorphologicPatternKnowledgeRepository({
      policy: {
        ...mergeMorphologicPatternPolicy(),
        rejectUnknownParents: false,
      },
    });

  repository._patterns.set(
    "A",
    pattern("A", {
      parentPatternId: "B",
    }),
  );
  repository._patterns.set(
    "B",
    pattern("B", {
      parentPatternId: "A",
    }),
  );

  const engine =
    new MorphologicPatternRecognitionKnowledgeEngine({
      repository,
      policy:
        mergeMorphologicPatternPolicy(),
    });

  assert.equal(
    engine.detectHierarchyCycle(),
    true,
  );
});

test("safety statement avoids diagnostic finality", () => {
  const library =
    createMorphologicPatternRecognitionLibrary({
      patterns: [pattern("P-1")],
    });

  const result =
    library.engine.recognize({
      observedFeatureIds: ["F-1"],
    });

  assert.match(
    result.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
