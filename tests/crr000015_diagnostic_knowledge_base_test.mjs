import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticKnowledgeBaseEngine,
  DiagnosticKnowledgeBaseRepository,
  createDiagnosticClassification,
  createDiagnosticKnowledgeBaseLibrary,
  createDiagnosticKnowledgeEntity,
} from "../ai/clinicalRules/index.js";

const classification = (
  id = "CLASS-1",
  family = "WHO",
) =>
  createDiagnosticClassification({
    id,
    family,
    version: "1.0.0",
    title: `Classification ${id}`,
  });

const entity = (
  id,
  classificationId,
  type = "DISEASE_ENTITY",
  parentEntityId = null,
  label = id,
) =>
  createDiagnosticKnowledgeEntity({
    id,
    classificationId,
    type,
    label,
    parentEntityId,
  });

test("classification is immutable", () => {
  const value = classification();
  assert.equal(Object.isFrozen(value), true);
});

test("classification rejects unsupported family", () => {
  assert.throws(
    () => classification("C-1", "UNKNOWN"),
    /Unsupported classification family/,
  );
});

test("repository rejects unknown classification for entity", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  assert.throws(
    () =>
      repository.registerEntity(
        entity("E-1", "UNKNOWN"),
      ),
    /Unknown diagnostic classification/,
  );
});

test("repository registers classifications and entities", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  repository.registerClassification(
    classification(),
  );
  repository.registerEntity(
    entity("E-1", "CLASS-1"),
  );

  assert.equal(
    repository.listClassifications().length,
    1,
  );
  assert.equal(
    repository.listEntities().length,
    1,
  );
});

test("repository rejects duplicate entities", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  repository.registerClassification(
    classification(),
  );
  repository.registerEntity(
    entity("E-1", "CLASS-1"),
  );

  assert.throws(
    () =>
      repository.registerEntity(
        entity("E-1", "CLASS-1"),
      ),
    /already registered/,
  );
});

test("repository enforces known parent entity", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  repository.registerClassification(
    classification(),
  );

  assert.throws(
    () =>
      repository.registerEntity(
        entity(
          "E-2",
          "CLASS-1",
          "DISEASE_ENTITY",
          "MISSING",
        ),
      ),
    /Unknown parent diagnostic entity/,
  );
});

test("classification profile groups entities", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  repository.registerClassification(
    classification(),
  );
  repository.registerEntity(
    entity(
      "D-1",
      "CLASS-1",
      "DISEASE_ENTITY",
    ),
  );
  repository.registerEntity(
    entity(
      "C-1",
      "CLASS-1",
      "DIAGNOSTIC_CRITERION",
    ),
  );

  const profile =
    new DiagnosticKnowledgeBaseEngine({
      repository,
    }).classificationProfile("CLASS-1");

  assert.equal(profile.entityCount, 2);
  assert.equal(profile.diseaseEntities.length, 1);
  assert.equal(profile.criteria.length, 1);
});

test("classification comparison detects shared labels", () => {
  const library =
    createDiagnosticKnowledgeBaseLibrary({
      classifications: [
        classification("WHO-1", "WHO"),
        classification("ICC-1", "ICC"),
      ],
      entities: [
        entity(
          "WHO-D-1",
          "WHO-1",
          "DISEASE_ENTITY",
          null,
          "Shared disease",
        ),
        entity(
          "ICC-D-1",
          "ICC-1",
          "DISEASE_ENTITY",
          null,
          "Shared disease",
        ),
      ],
    });

  const comparison =
    library.engine.compareClassifications(
      "WHO-1",
      "ICC-1",
    );

  assert.deepEqual(
    comparison.sharedDiseaseLabels,
    ["shared disease"],
  );
});

test("hierarchy resolution returns ancestors and children", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  repository.registerClassification(
    classification(),
  );
  repository.registerEntity(
    entity(
      "ROOT",
      "CLASS-1",
      "DISEASE_CATEGORY",
    ),
  );
  repository.registerEntity(
    entity(
      "CHILD",
      "CLASS-1",
      "DISEASE_ENTITY",
      "ROOT",
    ),
  );

  const hierarchy =
    new DiagnosticKnowledgeBaseEngine({
      repository,
    }).resolveEntityHierarchy("CHILD");

  assert.equal(hierarchy.ancestors.length, 1);
  assert.equal(
    hierarchy.ancestors[0].id,
    "ROOT",
  );
});

test("profile safety statement avoids diagnostic finality", () => {
  const library =
    createDiagnosticKnowledgeBaseLibrary({
      classifications: [
        classification(),
      ],
    });

  const profile =
    library.engine.classificationProfile(
      "CLASS-1",
    );

  assert.match(
    profile.safetyStatement,
    /not a definitive diagnosis/i,
  );
});

test("library exposes repository and engine", () => {
  const library =
    createDiagnosticKnowledgeBaseLibrary({
      classifications: [
        classification(),
      ],
    });

  assert.ok(library.repository);
  assert.ok(library.engine);
});
