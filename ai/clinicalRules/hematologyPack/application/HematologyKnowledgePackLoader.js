import sourceCatalog from "../data/sourceCatalog.json" with { type: "json" };
import classificationRoots from "../data/classificationRoots.json" with { type: "json" };

import {
  createDiagnosticClassification,
  createDiagnosticKnowledgeEntity,
} from "../../index.js";

export const HEMATOLOGY_KNOWLEDGE_PACK_VERSION =
  "CRR-000017-v1.0.0";

export class HematologyKnowledgePackLoader {
  load() {
    const classifications =
      classificationRoots.classifications.map(
        (item) =>
          createDiagnosticClassification(item),
      );

    const entities =
      classificationRoots.entities.map(
        (item) =>
          createDiagnosticKnowledgeEntity(item),
      );

    return Object.freeze({
      packId: sourceCatalog.packId,
      packVersion:
        HEMATOLOGY_KNOWLEDGE_PACK_VERSION,
      scope: sourceCatalog.scope,
      clinicalCriteriaIncluded:
        sourceCatalog.clinicalCriteriaIncluded === true,
      sources: Object.freeze(
        sourceCatalog.sources.map((item) =>
          Object.freeze({ ...item }),
        ),
      ),
      classifications:
        Object.freeze(classifications),
      entities: Object.freeze(entities),
      safetyStatement:
        "This pack contains bibliographic metadata and classification roots only; it does not contain diagnostic criteria or create a definitive diagnosis.",
    });
  }
}
