import assert from "node:assert/strict";
import test from "node:test";

import {
  HematologicDiseaseKnowledgeEngine,
} from "../ai/clinicalRules/hematologicDisease/application/HematologicDiseaseKnowledgeEngine.js";

import {
  HematologicDiseaseKnowledgeRepository,
} from "../ai/clinicalRules/hematologicDisease/repository/HematologicDiseaseKnowledgeRepository.js";

import {
  createHematologicDisease,
} from "../ai/clinicalRules/hematologicDisease/domain/HematologicDisease.js";

import {
  createHematologicDiseaseRelation,
} from "../ai/clinicalRules/hematologicDisease/domain/HematologicDiseaseRelation.js";

import {
  mergeHematologicDiseaseKnowledgePolicy,
} from "../ai/clinicalRules/hematologicDisease/domain/HematologicDiseaseKnowledgePolicy.js";

import {
  createHematologicDiseaseKnowledgeLibrary,
} from "../ai/clinicalRules/hematologicDisease/HematologicDiseaseKnowledgeLibrary.js";

const disease = (
  id = "D-1",
  overrides = {},
) =>
  createHematologicDisease({
    id,
    preferredName: `Disease ${id}`,
    family: "MYELOID",
    ...overrides,
  });

test("disease is immutable", () => {
  const value = disease();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.aliases),
    true,
  );
});

test("disease rejects unsupported family", () => {
  assert.throws(
    () =>
      disease("D-1", {
        family: "UNKNOWN",
      }),
    /Unsupported hematologic disease family/,
  );
});

test("repository resolves alias", () => {
  const repository =
    new HematologicDiseaseKnowledgeRepository({
      policy:
        mergeHematologicDiseaseKnowledgePolicy(),
    });

  repository.registerDisease(
    disease("D-1", {
      aliases: ["Alias 1"],
    }),
  );

  assert.equal(
    repository.resolveTerm("Alias 1").id,
    "D-1",
  );
});

test("repository rejects unknown parent", () => {
  const repository =
    new HematologicDiseaseKnowledgeRepository({
      policy:
        mergeHematologicDiseaseKnowledgePolicy(),
    });

  assert.throws(
    () =>
      repository.registerDisease(
        disease("D-2", {
          parentDiseaseId: "MISSING",
        }),
      ),
    /Unknown parent hematologic disease/,
  );
});

test("repository rejects unknown relation source", () => {
  const repository =
    new HematologicDiseaseKnowledgeRepository({
      policy:
        mergeHematologicDiseaseKnowledgePolicy(),
    });

  assert.throws(
    () =>
      repository.registerRelation(
        createHematologicDiseaseRelation({
          id: "R-1",
          sourceDiseaseId: "MISSING",
          targetId: "X",
          type: "ASSOCIATED_WITH",
        }),
      ),
    /Unknown source hematologic disease/,
  );
});

test("engine builds disease profile", () => {
  const library =
    createHematologicDiseaseKnowledgeLibrary({
      diseases: [
        disease("D-1", {
          morphologyFeatureIds: ["F-1"],
          classificationIds: ["C-1"],
        }),
      ],
    });

  const profile =
    library.engine.diseaseProfile("D-1");

  assert.deepEqual(
    profile.morphologyFeatureIds,
    ["F-1"],
  );
  assert.deepEqual(
    profile.classificationIds,
    ["C-1"],
  );
});

test("engine compares diseases", () => {
  const library =
    createHematologicDiseaseKnowledgeLibrary({
      diseases: [
        disease("D-1", {
          morphologyFeatureIds: ["F-1", "F-2"],
        }),
        disease("D-2", {
          morphologyFeatureIds: ["F-2", "F-3"],
        }),
      ],
    });

  const result =
    library.engine.compareDiseases(
      "D-1",
      "D-2",
    );

  assert.deepEqual(
    result.sharedMorphologyFeatureIds,
    ["F-2"],
  );
});

test("repository filters by family", () => {
  const library =
    createHematologicDiseaseKnowledgeLibrary({
      diseases: [
        disease("D-1"),
        disease("D-2", {
          family: "LYMPHOID",
        }),
      ],
    });

  assert.equal(
    library.repository.listDiseases({
      family: "LYMPHOID",
    }).length,
    1,
  );
});

test("engine detects hierarchy cycles", () => {
  const repository =
    new HematologicDiseaseKnowledgeRepository({
      policy: {
        ...mergeHematologicDiseaseKnowledgePolicy(),
        rejectUnknownParents: false,
      },
    });

  repository._diseases.set(
    "A",
    disease("A", {
      parentDiseaseId: "B",
    }),
  );
  repository._diseases.set(
    "B",
    disease("B", {
      parentDiseaseId: "A",
    }),
  );

  const engine =
    new HematologicDiseaseKnowledgeEngine({
      repository,
      policy:
        mergeHematologicDiseaseKnowledgePolicy(),
    });

  assert.equal(
    engine.detectHierarchyCycle(),
    true,
  );
});

test("relations are included in profile", () => {
  const library =
    createHematologicDiseaseKnowledgeLibrary({
      diseases: [disease("D-1")],
      relations: [
        createHematologicDiseaseRelation({
          id: "R-1",
          sourceDiseaseId: "D-1",
          targetId: "F-1",
          type: "HAS_MORPHOLOGIC_FEATURE",
        }),
      ],
    });

  assert.equal(
    library.engine
      .diseaseProfile("D-1")
      .relations.length,
    1,
  );
});

test("library exposes repository and engine", () => {
  const library =
    createHematologicDiseaseKnowledgeLibrary();

  assert.ok(library.repository);
  assert.ok(library.engine);
});

test("safety statement avoids diagnostic finality", () => {
  const library =
    createHematologicDiseaseKnowledgeLibrary({
      diseases: [disease("D-1")],
    });

  const profile =
    library.engine.diseaseProfile("D-1");

  assert.match(
    profile.safetyStatement,
    /does not establish a definitive diagnosis/i,
  );
});
