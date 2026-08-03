import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticKnowledgeBaseRepository,
  StructuredClassificationImportAdapter,
  WhoIccElnKnowledgePopulationEngine,
  createKnowledgePopulationBatch,
  createKnowledgeSourceManifest,
  mergeKnowledgePopulationPolicy,
  validateKnowledgePopulationBatch,
} from "../ai/clinicalRules/index.js";

const source = (overrides = {}) =>
  createKnowledgeSourceManifest({
    sourceId: "SRC-001",
    title: "Official classification source",
    publisher: "Official publisher",
    publicationYear: 2026,
    classificationFamily: "WHO",
    version: "1.0.0",
    checksum: "abc123",
    reviewedBy: ["Reviewer A", "Reviewer B"],
    approvalStatus: "APPROVED",
    ...overrides,
  });

const batch = (overrides = {}) =>
  createKnowledgePopulationBatch({
    batchId: "BATCH-001",
    classification: {
      id: "WHO-TEST",
      family: "WHO",
      version: "1.0.0",
      title: "WHO test classification",
    },
    entities: [
      {
        id: "ROOT",
        type: "DISEASE_CATEGORY",
        label: "Root",
      },
      {
        id: "D-1",
        type: "DISEASE_ENTITY",
        label: "Disease 1",
        parentEntityId: "ROOT",
      },
    ],
    sourceManifest: source(),
    mode: "VALIDATE_ONLY",
    ...overrides,
  });

test("population batch is immutable", () => {
  const value = batch();
  assert.equal(Object.isFrozen(value), true);
  assert.equal(Object.isFrozen(value.entities), true);
});

test("validator accepts governed WHO batch", () => {
  const validation =
    validateKnowledgePopulationBatch(
      batch(),
      mergeKnowledgePopulationPolicy(),
    );

  assert.equal(validation.valid, true);
});

test("validator rejects unsupported family", () => {
  const value = batch({
    classification: {
      id: "OTHER-1",
      family: "OTHER",
      version: "1.0.0",
      title: "Other",
    },
  });

  const validation =
    validateKnowledgePopulationBatch(
      value,
      mergeKnowledgePopulationPolicy(),
    );

  assert.equal(validation.valid, false);
});

test("validator rejects duplicate ids", () => {
  const value = batch({
    entities: [
      {
        id: "DUP",
        type: "DISEASE_ENTITY",
        label: "A",
      },
      {
        id: "DUP",
        type: "DISEASE_ENTITY",
        label: "B",
      },
    ],
  });

  const validation =
    validateKnowledgePopulationBatch(
      value,
      mergeKnowledgePopulationPolicy(),
    );

  assert.equal(validation.valid, false);
});

test("validator rejects unknown parent reference", () => {
  const value = batch({
    entities: [
      {
        id: "D-1",
        type: "DISEASE_ENTITY",
        label: "Disease",
        parentEntityId: "MISSING",
      },
    ],
  });

  const validation =
    validateKnowledgePopulationBatch(
      value,
      mergeKnowledgePopulationPolicy(),
    );

  assert.equal(validation.valid, false);
});

test("engine validates without committing by default", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const result =
    new WhoIccElnKnowledgePopulationEngine({
      repository,
    }).execute(batch());

  assert.equal(result.status, "VALIDATED");
  assert.equal(result.committed, false);
  assert.equal(
    repository.listClassifications().length,
    0,
  );
});

test("commit remains blocked unless explicitly enabled", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const result =
    new WhoIccElnKnowledgePopulationEngine({
      repository,
    }).execute(
      batch({ mode: "COMMIT" }),
    );

  assert.equal(
    result.status,
    "COMMIT_BLOCKED",
  );
  assert.equal(
    result.requiresHumanReview,
    true,
  );
});

test("approved governed batch commits when policy enables it", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const engine =
    new WhoIccElnKnowledgePopulationEngine({
      repository,
      policy: {
        allowCommit: true,
      },
    });

  const result =
    engine.execute(
      batch({ mode: "COMMIT" }),
    );

  assert.equal(result.status, "COMMITTED");
  assert.equal(result.committed, true);
  assert.equal(
    repository.listClassifications().length,
    1,
  );
  assert.equal(
    repository.listEntities().length,
    2,
  );
});

test("commit rejects missing checksum", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const result =
    new WhoIccElnKnowledgePopulationEngine({
      repository,
      policy: {
        allowCommit: true,
      },
    }).execute(
      batch({
        mode: "COMMIT",
        sourceManifest: source({
          checksum: null,
        }),
      }),
    );

  assert.equal(result.status, "REJECTED");
});

test("adapter creates governed batch", () => {
  const adapter =
    new StructuredClassificationImportAdapter();

  const result =
    adapter.toBatch({
      batchId: "BATCH-001",
      classification: {
        id: "WHO-TEST",
        family: "WHO",
        version: "1.0.0",
        title: "WHO test classification",
      },
      entities: [],
      sourceManifest: {
        sourceId: "SRC-001",
        title: "Official classification source",
        publisher: "Official publisher",
        publicationYear: 2026,
        classificationFamily: "WHO",
        version: "1.0.0",
      },
    });

  assert.equal(result.batchId, "BATCH-001");
});

test("safety statement avoids diagnostic finality", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const result =
    new WhoIccElnKnowledgePopulationEngine({
      repository,
    }).execute(batch());

  assert.match(
    result.safetyStatement,
    /does not create a definitive diagnosis/i,
  );
});
