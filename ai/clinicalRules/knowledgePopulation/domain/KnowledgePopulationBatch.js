export const KNOWLEDGE_POPULATION_BATCH_SCHEMA_VERSION =
  "CRR-000016-v1";

function freezeRecords(values = []) {
  return Object.freeze(
    (Array.isArray(values) ? values : []).map(
      (value) =>
        value && typeof value === "object"
          ? Object.freeze({ ...value })
          : value,
    ),
  );
}

export function createKnowledgePopulationBatch({
  batchId,
  classification,
  entities = [],
  sourceManifest,
  mode = "VALIDATE_ONLY",
  metadata = {},
} = {}) {
  if (!batchId || !String(batchId).trim()) {
    throw new TypeError(
      "KnowledgePopulationBatch.batchId is required.",
    );
  }

  if (!classification || typeof classification !== "object") {
    throw new TypeError(
      "KnowledgePopulationBatch.classification is required.",
    );
  }

  if (!sourceManifest || typeof sourceManifest !== "object") {
    throw new TypeError(
      "KnowledgePopulationBatch.sourceManifest is required.",
    );
  }

  return Object.freeze({
    schemaVersion:
      KNOWLEDGE_POPULATION_BATCH_SCHEMA_VERSION,
    batchId: String(batchId).trim(),
    classification: Object.freeze({
      ...classification,
    }),
    entities: freezeRecords(entities),
    sourceManifest: Object.freeze({
      ...sourceManifest,
    }),
    mode: String(mode).trim().toUpperCase(),
    metadata: Object.freeze({
      ...(metadata && typeof metadata === "object"
        ? metadata
        : {}),
    }),
  });
}
