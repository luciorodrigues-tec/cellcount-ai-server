import {
  createKnowledgePopulationBatch,
} from "../domain/KnowledgePopulationBatch.js";

import {
  createKnowledgeSourceManifest,
} from "../domain/KnowledgeSourceManifest.js";

export class StructuredClassificationImportAdapter {
  toBatch(payload = {}) {
    const sourceManifest =
      createKnowledgeSourceManifest(
        payload.sourceManifest,
      );

    return createKnowledgePopulationBatch({
      batchId: payload.batchId,
      classification:
        payload.classification,
      entities: payload.entities || [],
      sourceManifest,
      mode:
        payload.mode || "VALIDATE_ONLY",
      metadata:
        payload.metadata || {},
    });
  }
}
