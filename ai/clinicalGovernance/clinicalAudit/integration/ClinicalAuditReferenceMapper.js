import {
  createAuditEngineReference,
} from "../domain/AuditEngineReference.js";

import {
  createAuditEvidenceReference,
} from "../domain/AuditEvidenceReference.js";

import {
  createAuditDecisionReference,
} from "../domain/AuditDecisionReference.js";

import {
  createAuditReviewReference,
} from "../domain/AuditReviewReference.js";

export const CLINICAL_AUDIT_REFERENCE_MAPPER_VERSION =
  "CGL-000001-S3-v1.0.0";

export class ClinicalAuditReferenceMapper {
  mapEngines(engineVersions = {}) {
    return Object.freeze(
      Object.entries(engineVersions).map(
        ([engineId, descriptor]) =>
          createAuditEngineReference({
            engineId,
            name:
              descriptor?.name ||
              engineId,
            version:
              descriptor?.version ||
              "UNKNOWN",
            policyVersion:
              descriptor?.policyVersion ||
              null,
            checksum:
              descriptor?.checksum ||
              null,
            metadata:
              descriptor?.metadata ||
              {},
          }),
      ),
    );
  }

  mapEvidence(evidenceItems = []) {
    return Object.freeze(
      (Array.isArray(evidenceItems)
        ? evidenceItems
        : []
      ).map((item, index) =>
        createAuditEvidenceReference({
          evidenceId:
            item.evidenceId ||
            item.id ||
            `EVIDENCE-${index + 1}`,
          type:
            item.type ||
            "MODEL_OUTPUT",
          source:
            item.source ||
            "CLINICAL_PIPELINE",
          hash:
            item.hash ||
            null,
          summary:
            item.summary ||
            item.explanation?.summary ||
            null,
          metadata: {
            hypothesisId:
              item.hypothesisId ||
              null,
            status:
              item.status ||
              null,
            score:
              item.normalizedScore ??
              item.score ??
              null,
          },
        }),
      ),
    );
  }

  mapDecision({
    safetyGateResult,
    confidenceCalibrationResult,
    uncertaintyResult,
  } = {}) {
    if (!safetyGateResult) {
      throw new TypeError(
        "ClinicalAuditReferenceMapper requires safetyGateResult.",
      );
    }

    return createAuditDecisionReference({
      decisionId:
        safetyGateResult.decisionId ||
        `SAFETY-${safetyGateResult.caseId || "UNKNOWN"}`,
      decisionType:
        "SAFETY_GATE",
      outcome:
        safetyGateResult.decision ||
        "HELD",
      selectedHypothesisId:
        safetyGateResult.selectedHypothesisId ||
        null,
      confidence:
        confidenceCalibrationResult?.finalConfidenceScore ??
        null,
      uncertainty:
        uncertaintyResult?.totalUncertaintyScore ??
        null,
      metadata: {
        releaseAllowed:
          safetyGateResult.releaseAllowed === true,
        automationAllowed:
          safetyGateResult.automationAllowed === true,
        requiresHumanReview:
          safetyGateResult.requiresHumanReview === true,
        safetyScore:
          safetyGateResult.safetyScore ??
          null,
      },
    });
  }

  mapReviews(reviews = []) {
    return Object.freeze(
      (Array.isArray(reviews) ? reviews : []).map(
        (review, index) =>
          createAuditReviewReference({
            reviewId:
              review.reviewId ||
              review.id ||
              `REVIEW-${index + 1}`,
            reviewerId:
              review.reviewerId ||
              review.actorId ||
              "UNKNOWN",
            status:
              review.status ||
              "PENDING",
            reviewedAt:
              review.reviewedAt ||
              null,
            note:
              review.note ||
              null,
            metadata:
              review.metadata ||
              {},
          }),
      ),
    );
  }
}
