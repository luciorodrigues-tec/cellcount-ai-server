import assert from "node:assert/strict";
import test from "node:test";

import {
  DiseaseOntologyEngine,
  MedicalKnowledgeGraphEngine,
  MedicalKnowledgeGraphRepository,
  createMedicalKnowledgeEntity,
  createMedicalKnowledgeGraphLibrary,
  createMedicalKnowledgeRelation,
  mergeMedicalKnowledgeGraphPolicy,
} from "../ai/clinicalRules/index.js";

const disease = (id = "D-1") =>
  createMedicalKnowledgeEntity({
    id,
    type: "DISEASE",
    label: `Disease ${id}`,
  });

const finding = (id = "F-1") =>
  createMedicalKnowledgeEntity({
    id,
    type: "MORPHOLOGIC_FINDING",
    label: `Finding ${id}`,
  });

const testEntity = (id = "T-1") =>
  createMedicalKnowledgeEntity({
    id,
    type: "LABORATORY_TEST",
    label: `Test ${id}`,
  });

const relation = (
  id,
  sourceEntityId,
  targetEntityId,
  type,
) =>
  createMedicalKnowledgeRelation({
    id,
    sourceEntityId,
    targetEntityId,
    type,
  });

test("medical knowledge entity is immutable", () => {
  const value = disease();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.aliases), true);
});

test("medical knowledge relation is immutable", () => {
  const value = relation(
    "R-1",
    "D-1",
    "F-1",
    "HAS_FINDING",
  );
  assert.equal(Object.isFrozen(value), true);
  assert.equal(
    Object.isFrozen(value.evidenceSourceIds),
    true,
  );
});

test("repository rejects duplicate entities", () => {
  const repository =
    new MedicalKnowledgeGraphRepository({
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });
  repository.registerEntity(disease());

  assert.throws(
    () => repository.registerEntity(disease()),
    /already registered/,
  );
});

test("repository rejects unknown relation endpoints", () => {
  const repository =
    new MedicalKnowledgeGraphRepository({
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  assert.throws(
    () =>
      repository.registerRelation(
        relation(
          "R-1",
          "D-1",
          "F-1",
          "HAS_FINDING",
        ),
      ),
    /endpoints must be registered/,
  );
});

test("graph engine returns neighbors", () => {
  const repository =
    new MedicalKnowledgeGraphRepository({
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  repository.registerEntity(disease());
  repository.registerEntity(finding());
  repository.registerRelation(
    relation(
      "R-1",
      "D-1",
      "F-1",
      "HAS_FINDING",
    ),
  );

  const engine =
    new MedicalKnowledgeGraphEngine({
      repository,
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  const neighbors =
    engine.neighbors("D-1");

  assert.equal(neighbors.length, 1);
  assert.equal(
    neighbors[0].entity.id,
    "F-1",
  );
});

test("graph traversal returns connected nodes", () => {
  const repository =
    new MedicalKnowledgeGraphRepository({
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  repository.registerEntity(disease());
  repository.registerEntity(finding());
  repository.registerEntity(testEntity());

  repository.registerRelation(
    relation(
      "R-1",
      "D-1",
      "F-1",
      "HAS_FINDING",
    ),
  );
  repository.registerRelation(
    relation(
      "R-2",
      "F-1",
      "T-1",
      "ASSOCIATED_WITH",
    ),
  );

  const engine =
    new MedicalKnowledgeGraphEngine({
      repository,
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  const result =
    engine.traverse("D-1");

  assert.equal(result.nodeCount, 3);
  assert.equal(result.edgeCount, 2);
});

test("shortest path finds connected entities", () => {
  const repository =
    new MedicalKnowledgeGraphRepository({
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  repository.registerEntity(disease());
  repository.registerEntity(finding());
  repository.registerEntity(testEntity());

  repository.registerRelation(
    relation(
      "R-1",
      "D-1",
      "F-1",
      "HAS_FINDING",
    ),
  );
  repository.registerRelation(
    relation(
      "R-2",
      "F-1",
      "T-1",
      "ASSOCIATED_WITH",
    ),
  );

  const engine =
    new MedicalKnowledgeGraphEngine({
      repository,
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  const result =
    engine.shortestPath(
      "D-1",
      "T-1",
    );

  assert.equal(result.found, true);
  assert.equal(result.length, 2);
});

test("disease ontology builds disease profile", () => {
  const repository =
    new MedicalKnowledgeGraphRepository({
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  repository.registerEntity(disease());
  repository.registerEntity(finding());
  repository.registerEntity(testEntity());

  repository.registerRelation(
    relation(
      "R-1",
      "D-1",
      "F-1",
      "HAS_FINDING",
    ),
  );
  repository.registerRelation(
    relation(
      "R-2",
      "D-1",
      "T-1",
      "CONFIRMED_BY",
    ),
  );

  const graphEngine =
    new MedicalKnowledgeGraphEngine({
      repository,
      policy:
        mergeMedicalKnowledgeGraphPolicy(),
    });

  const ontology =
    new DiseaseOntologyEngine({
      graphEngine,
    });

  const profile =
    ontology.diseaseProfile("D-1");

  assert.equal(
    profile.morphologicFindings.length,
    1,
  );
  assert.equal(
    profile.confirmatoryTests.length,
    1,
  );
});

test("disease ontology compares disease profiles", () => {
  const library =
    createMedicalKnowledgeGraphLibrary({
      entities: [
        disease("D-1"),
        disease("D-2"),
        finding("F-1"),
      ],
      relations: [
        relation(
          "R-1",
          "D-1",
          "F-1",
          "HAS_FINDING",
        ),
        relation(
          "R-2",
          "D-2",
          "F-1",
          "HAS_FINDING",
        ),
      ],
    });

  const comparison =
    library.diseaseOntologyEngine
      .compareDiseases(
        "D-1",
        "D-2",
      );

  assert.deepEqual(
    comparison
      .sharedMorphologicFindingIds,
    ["F-1"],
  );
});

test("graph explanation avoids diagnostic finality", () => {
  const library =
    createMedicalKnowledgeGraphLibrary({
      entities: [disease()],
    });

  const explanation =
    library.graphEngine
      .explainEntity("D-1");

  assert.match(
    explanation.safetyStatement,
    /not a definitive diagnosis/i,
  );
});

test("library exposes repository and engines", () => {
  const library =
    createMedicalKnowledgeGraphLibrary({
      entities: [disease()],
    });

  assert.ok(library.repository);
  assert.ok(library.graphEngine);
  assert.ok(
    library.diseaseOntologyEngine,
  );
  assert.equal(library.entities.length, 1);
});
