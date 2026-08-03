import assert from "node:assert/strict";
import test from "node:test";

import {
  DiagnosticKnowledgeBaseRepository,
  HematologyKnowledgePackInstaller,
  HematologyKnowledgePackLoader,
  createHematologyKnowledgePackLibrary,
} from "../ai/clinicalRules/index.js";

test("loader returns immutable pack metadata", () => {
  const pack =
    new HematologyKnowledgePackLoader().load();

  assert.equal(Object.isFrozen(pack), true);
  assert.equal(
    pack.clinicalCriteriaIncluded,
    false,
  );
});

test("pack contains four governed source records", () => {
  const pack =
    new HematologyKnowledgePackLoader().load();

  assert.equal(pack.sources.length, 4);
});

test("pack contains WHO ICC and ELN families", () => {
  const pack =
    new HematologyKnowledgePackLoader().load();

  const families = new Set(
    pack.classifications.map(
      (item) => item.family,
    ),
  );

  assert.equal(families.has("WHO"), true);
  assert.equal(families.has("ICC"), true);
  assert.equal(families.has("ELN"), true);
});

test("pack contains classification roots only", () => {
  const pack =
    new HematologyKnowledgePackLoader().load();

  assert.equal(
    pack.entities.every(
      (item) =>
        item.type === "CLASSIFICATION_NODE",
    ),
    true,
  );
});

test("validate mode does not mutate repository", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const installer =
    new HematologyKnowledgePackInstaller({
      repository,
      loader:
        new HematologyKnowledgePackLoader(),
    });

  const result =
    installer.install({ commit: false });

  assert.equal(result.status, "VALIDATED");
  assert.equal(
    repository.listClassifications().length,
    0,
  );
});

test("commit installs classifications and roots", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const installer =
    new HematologyKnowledgePackInstaller({
      repository,
      loader:
        new HematologyKnowledgePackLoader(),
    });

  const result =
    installer.install({ commit: true });

  assert.equal(result.status, "COMMITTED");
  assert.equal(
    repository.listClassifications().length,
    4,
  );
  assert.equal(
    repository.listEntities().length,
    4,
  );
});

test("pack exposes official-source metadata", () => {
  const pack =
    new HematologyKnowledgePackLoader().load();

  assert.equal(
    pack.sources.every(
      (item) =>
        item.sourceType ===
        "OFFICIAL_CLASSIFICATION",
    ),
    true,
  );
});

test("pack includes ICC myeloid DOI", () => {
  const pack =
    new HematologyKnowledgePackLoader().load();

  const source = pack.sources.find(
    (item) =>
      item.sourceId ===
      "ICC-MYELOID-2022",
  );

  assert.equal(
    source.doi,
    "10.1182/blood.2022015850",
  );
});

test("library exposes loader and optional installer", () => {
  const repository =
    new DiagnosticKnowledgeBaseRepository();

  const library =
    createHematologyKnowledgePackLibrary({
      repository,
    });

  assert.ok(library.loader);
  assert.ok(library.installer);
});

test("library without repository exposes no installer", () => {
  const library =
    createHematologyKnowledgePackLibrary();

  assert.ok(library.loader);
  assert.equal(library.installer, null);
});

test("safety statement avoids diagnostic finality", () => {
  const pack =
    new HematologyKnowledgePackLoader().load();

  assert.match(
    pack.safetyStatement,
    /does not contain diagnostic criteria/i,
  );
});
