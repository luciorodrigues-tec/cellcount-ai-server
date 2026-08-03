import assert from "node:assert/strict";
import test from "node:test";

import {
  MorphologicFeatureOntologyEngine,
  MorphologicFeatureOntologyRepository,
  createMorphologicFeature,
  createMorphologicFeatureOntologyLibrary,
  createMorphologicFeatureRelation,
  mergeMorphologicOntologyPolicy,
} from "../ai/clinicalRules/index.js";

const feature = (
  id = "F-1",
  overrides = {},
) =>
  createMorphologicFeature({
    id,
    preferredName: `Feature ${id}`,
    category: "LEUKOCYTE",
    lineage: "MYELOID",
    ...overrides,
  });

const relation = (
  id,
  sourceFeatureId,
  targetFeatureId,
  type = "RELATED_TO",
  overrides = {},
) =>
  createMorphologicFeatureRelation({
    id,
    sourceFeatureId,
    targetFeatureId,
    type,
    ...overrides,
  });

test("morphologic feature is immutable", () => {
  const value = feature();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.synonyms), true);
});

test("feature rejects unsupported lineage", () => {
  assert.throws(
    () => feature("F-1", { lineage: "UNKNOWN" }),
    /Unsupported morphologic lineage/,
  );
});

test("repository resolves synonyms", () => {
  const repository =
    new MorphologicFeatureOntologyRepository({
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  repository.registerFeature(
    feature("F-1", {
      preferredName: "Auer rod",
      synonyms: ["Auer body"],
    }),
  );

  assert.equal(
    repository.resolveTerm("Auer body").id,
    "F-1",
  );
});

test("repository rejects unknown parent", () => {
  const repository =
    new MorphologicFeatureOntologyRepository({
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  assert.throws(
    () =>
      repository.registerFeature(
        feature("F-2", {
          parentFeatureId: "MISSING",
        }),
      ),
    /Unknown parent morphologic feature/,
  );
});

test("repository rejects unknown relation endpoints", () => {
  const repository =
    new MorphologicFeatureOntologyRepository({
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  assert.throws(
    () =>
      repository.registerRelation(
        relation(
          "R-1",
          "F-1",
          "F-2",
        ),
      ),
    /endpoints must be registered/,
  );
});

test("engine returns hierarchy", () => {
  const repository =
    new MorphologicFeatureOntologyRepository({
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  repository.registerFeature(
    feature("ROOT"),
  );
  repository.registerFeature(
    feature("CHILD", {
      parentFeatureId: "ROOT",
    }),
  );

  const engine =
    new MorphologicFeatureOntologyEngine({
      repository,
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  const result =
    engine.hierarchy("CHILD");

  assert.equal(result.ancestors.length, 1);
  assert.equal(result.ancestors[0].id, "ROOT");
});

test("engine returns related features", () => {
  const repository =
    new MorphologicFeatureOntologyRepository({
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  repository.registerFeature(feature("F-1"));
  repository.registerFeature(feature("F-2"));
  repository.registerRelation(
    relation(
      "R-1",
      "F-1",
      "F-2",
      "CO_OCCURS_WITH",
    ),
  );

  const engine =
    new MorphologicFeatureOntologyEngine({
      repository,
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  const result =
    engine.relatedFeatures("F-1");

  assert.equal(result.length, 1);
  assert.equal(result[0].feature.id, "F-2");
});

test("library filters features by lineage", () => {
  const library =
    createMorphologicFeatureOntologyLibrary({
      features: [
        feature("F-1", {
          lineage: "MYELOID",
        }),
        feature("F-2", {
          lineage: "LYMPHOID",
        }),
      ],
    });

  assert.equal(
    library.repository.listFeatures({
      lineage: "MYELOID",
    }).length,
    1,
  );
});

test("library detects hierarchy cycles", () => {
  const repository =
    new MorphologicFeatureOntologyRepository({
      policy: {
        ...mergeMorphologicOntologyPolicy(),
        rejectHierarchyCycles: false,
      },
    });

  repository._features.set(
    "A",
    feature("A", {
      parentFeatureId: "B",
    }),
  );
  repository._features.set(
    "B",
    feature("B", {
      parentFeatureId: "A",
    }),
  );

  const engine =
    new MorphologicFeatureOntologyEngine({
      repository,
      policy:
        mergeMorphologicOntologyPolicy(),
    });

  assert.equal(
    engine.detectHierarchyCycle(),
    true,
  );
});

test("explanation avoids diagnostic finality", () => {
  const library =
    createMorphologicFeatureOntologyLibrary({
      features: [feature("F-1")],
    });

  const explanation =
    library.engine.explainFeature("F-1");

  assert.match(
    explanation.safetyStatement,
    /does not create a definitive diagnosis/i,
  );
});

test("library exposes repository and engine", () => {
  const library =
    createMorphologicFeatureOntologyLibrary({
      features: [feature("F-1")],
    });

  assert.ok(library.repository);
  assert.ok(library.engine);
});
