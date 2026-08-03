import {
  createDiagnosticClassification,
  createDiagnosticKnowledgeEntity,
} from "../../index.js";

import {
  mergeKnowledgePopulationPolicy,
} from "../domain/KnowledgePopulationPolicy.js";

import {
  validateKnowledgePopulationBatch,
} from "./KnowledgePopulationValidator.js";

export const WHO_ICC_ELN_KNOWLEDGE_POPULATION_ENGINE_VERSION =
  "CRR-000016-v1.0.0";

export class WhoIccElnKnowledgePopulationEngine {
  constructor({
    repository,
    policy = {},
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "WhoIccElnKnowledgePopulationEngine requires a diagnostic knowledge repository.",
      );
    }

    this.repository = repository;
    this.policy =
      mergeKnowledgePopulationPolicy(policy);
  }

  execute(batch) {
    const validation =
      validateKnowledgePopulationBatch(
        batch,
        this.policy,
      );

    if (!validation.valid) {
      return Object.freeze({
        engineVersion:
          WHO_ICC_ELN_KNOWLEDGE_POPULATION_ENGINE_VERSION,
        batchId: batch?.batchId || null,
        status: "REJECTED",
        mode: batch?.mode || null,
        validation,
        committed: false,
        classificationId: null,
        entityCount: 0,
        requiresHumanReview: true,
      });
    }

    const classification =
      createDiagnosticClassification({
        ...batch.classification,
        sourceIds: [
          ...(batch.classification.sourceIds || []),
          batch.sourceManifest.sourceId,
        ],
      });

    const entities = batch.entities.map(
      (item) =>
        createDiagnosticKnowledgeEntity({
          ...item,
          classificationId:
            classification.id,
          evidenceSourceIds: [
            ...(item.evidenceSourceIds || []),
            batch.sourceManifest.sourceId,
          ],
        }),
    );

    const canCommit =
      batch.mode === "COMMIT" &&
      this.policy.allowCommit;

    if (canCommit) {
      this.repository.registerClassification(
        classification,
      );

      for (const entity of entities) {
        this.repository.registerEntity(entity);
      }
    }

    return Object.freeze({
      engineVersion:
        WHO_ICC_ELN_KNOWLEDGE_POPULATION_ENGINE_VERSION,
      batchId: batch.batchId,
      status:
        canCommit
          ? "COMMITTED"
          : batch.mode === "COMMIT"
            ? "COMMIT_BLOCKED"
            : "VALIDATED",
      mode: batch.mode,
      validation,
      committed: canCommit,
      classificationId:
        classification.id,
      entityCount: entities.length,
      classification,
      entities: Object.freeze(entities),
      sourceManifest:
        batch.sourceManifest,
      requiresHumanReview:
        !canCommit &&
        batch.mode === "COMMIT",
      safetyStatement:
        "Knowledge population requires governed scientific review and does not create a definitive diagnosis.",
    });
  }
}
