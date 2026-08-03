import {
  mergeDiagnosticRecommendationPolicy,
} from "../domain/DiagnosticRecommendationPolicy.js";

export const DIAGNOSTIC_RECOMMENDATION_ENGINE_VERSION =
  "CRR-000022-v1.0.0";

const PRIORITY_ORDER = Object.freeze({
  ROUTINE: 1,
  PRIORITY: 2,
  URGENT: 3,
  CRITICAL: 4,
});

function matchesRecommendation(
  recommendation,
  {
    hypothesisId,
    evidenceStatus,
    sourceTypes,
  },
) {
  if (
    recommendation.hypothesisId &&
    recommendation.hypothesisId !== hypothesisId
  ) {
    return false;
  }

  if (
    recommendation.triggerStatuses.length > 0 &&
    !recommendation.triggerStatuses.includes(evidenceStatus)
  ) {
    return false;
  }

  if (
    recommendation.requiredSourceTypes.length > 0 &&
    !recommendation.requiredSourceTypes.every(
      (type) => sourceTypes.has(type),
    )
  ) {
    return false;
  }

  return true;
}

export class DiagnosticRecommendationEngine {
  constructor({
    repository,
    policy = {},
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "DiagnosticRecommendationEngine requires a repository.",
      );
    }

    this.repository = repository;
    this.policy =
      mergeDiagnosticRecommendationPolicy(policy);
  }

  generate({
    hypothesisId,
    evidenceResult,
    classificationResult = null,
    criteriaResult = null,
    alerts = [],
  } = {}) {
    if (!hypothesisId || !String(hypothesisId).trim()) {
      throw new TypeError(
        "DiagnosticRecommendationEngine requires hypothesisId.",
      );
    }

    const sourceTypes = new Set(
      (evidenceResult?.details || [])
        .map((item) => item.sourceType)
        .filter(Boolean),
    );

    const evidenceStatus =
      String(
        evidenceResult?.status ||
        "INSUFFICIENT_EVIDENCE",
      ).toUpperCase();

    const candidates =
      this.repository.listRecommendations({
        status: "ACTIVE",
      })
      .filter((recommendation) =>
        matchesRecommendation(
          recommendation,
          {
            hypothesisId: String(hypothesisId),
            evidenceStatus,
            sourceTypes,
          },
        ),
      )
      .filter(
        (recommendation) =>
          this.policy.includeRoutineRecommendations ||
          recommendation.priority !== "ROUTINE",
      );

    const generated = candidates.map(
      (recommendation) =>
        Object.freeze({
          recommendationId:
            recommendation.id,
          hypothesisId:
            String(hypothesisId),
          type: recommendation.type,
          priority: recommendation.priority,
          title: recommendation.title,
          rationale: recommendation.rationale,
          action: recommendation.action,
          evidenceSourceIds:
            recommendation.evidenceSourceIds,
          requiresHumanReview:
            recommendation.requiresHumanReview,
          blocksAutomation:
            recommendation.blocksAutomation,
        }),
    );

    const deduplicated = [];

    for (const item of generated) {
      if (
        this.policy.deduplicateByAction &&
        deduplicated.some(
          (existing) =>
            existing.action === item.action,
        )
      ) {
        continue;
      }

      deduplicated.push(item);
    }

    const dynamicRecommendations = [];

    if (
      evidenceStatus === "CONFLICTED" &&
      this.policy.requireHumanReviewOnConflict
    ) {
      dynamicRecommendations.push(
        Object.freeze({
          recommendationId:
            "DYNAMIC-CONFLICT-REVIEW",
          hypothesisId:
            String(hypothesisId),
          type: "SPECIALIST_REVIEW",
          priority: "URGENT",
          title:
            "Revisão especializada por conflito de evidências",
          rationale:
            "Foram identificadas evidências materiais de suporte e oposição.",
          action:
            "Submeter os achados e a trilha de evidências à revisão hematológica.",
          evidenceSourceIds:
            Object.freeze([]),
          requiresHumanReview: true,
          blocksAutomation: true,
        }),
      );
    }

    if (
      evidenceStatus === "ABSTAINED" &&
      this.policy.requireHumanReviewOnAbstention
    ) {
      dynamicRecommendations.push(
        Object.freeze({
          recommendationId:
            "DYNAMIC-ABSTENTION-REVIEW",
          hypothesisId:
            String(hypothesisId),
          type: "SAFETY_ALERT",
          priority: "CRITICAL",
          title:
            "Análise bloqueada por condição de segurança",
          rationale:
            "Um sinal de abstenção ou bloqueio impediu a conclusão automatizada.",
          action:
            "Interromper automação e realizar revisão humana antes de qualquer conclusão.",
          evidenceSourceIds:
            Object.freeze([]),
          requiresHumanReview: true,
          blocksAutomation: true,
        }),
      );
    }

    if (
      classificationResult?.requiresHumanReview === true ||
      criteriaResult?.requiresHumanReview === true
    ) {
      dynamicRecommendations.push(
        Object.freeze({
          recommendationId:
            "DYNAMIC-CLASSIFICATION-REVIEW",
          hypothesisId:
            String(hypothesisId),
          type: "SPECIALIST_REVIEW",
          priority: "PRIORITY",
          title:
            "Revisão dos critérios e da classificação",
          rationale:
            "O motor de critérios ou classificação sinalizou revisão humana.",
          action:
            "Revisar critérios satisfeitos, exclusões, precedência e conflitos.",
          evidenceSourceIds:
            Object.freeze([]),
          requiresHumanReview: true,
          blocksAutomation: false,
        }),
      );
    }

    if (
      Array.isArray(alerts) &&
      alerts.length > 0
    ) {
      dynamicRecommendations.push(
        Object.freeze({
          recommendationId:
            "DYNAMIC-ALERT-CORRELATION",
          hypothesisId:
            String(hypothesisId),
          type: "CLINICAL_CORRELATION",
          priority: "PRIORITY",
          title:
            "Correlacionar alertas clínico-laboratoriais",
          rationale:
            "Há alertas estruturados associados à análise.",
          action:
            "Correlacionar os alertas com dados clínicos, hemograma, esfregaço e revisão especializada.",
          evidenceSourceIds:
            Object.freeze([]),
          requiresHumanReview: false,
          blocksAutomation: false,
        }),
      );
    }

    const combined = [
      ...deduplicated,
      ...dynamicRecommendations,
    ];

    const ranked = [...combined].sort(
      (a, b) =>
        PRIORITY_ORDER[b.priority] -
          PRIORITY_ORDER[a.priority] ||
        a.recommendationId.localeCompare(
          b.recommendationId,
        ),
    );

    const limited = ranked.slice(
      0,
      this.policy.maximumRecommendations,
    );

    const highestPriority =
      limited[0]?.priority || null;

    const criticalPresent =
      limited.some(
        (item) =>
          item.priority === "CRITICAL",
      );

    const requiresHumanReview =
      limited.some(
        (item) =>
          item.requiresHumanReview,
      ) ||
      (
        criticalPresent &&
        this.policy.requireHumanReviewOnCritical
      );

    const automationBlocked =
      limited.some(
        (item) =>
          item.blocksAutomation,
      ) ||
      (
        criticalPresent &&
        this.policy.blockAutomationOnCritical
      );

    return Object.freeze({
      engineVersion:
        DIAGNOSTIC_RECOMMENDATION_ENGINE_VERSION,
      hypothesisId: String(hypothesisId),
      evidenceStatus,
      recommendationCount:
        limited.length,
      highestPriority,
      requiresHumanReview,
      automationBlocked,
      recommendations:
        Object.freeze(limited),
      explanation: Object.freeze({
        summary:
          `${limited.length} recommendation(s) generated for hypothesis ${hypothesisId}.`,
        rationale:
          `Evidence status ${evidenceStatus}; highest priority ${highestPriority || "NONE"}; human review ${requiresHumanReview}; automation blocked ${automationBlocked}.`,
        safetyStatement:
          "Recommendations are clinical decision support and do not replace professional judgment or establish a definitive diagnosis.",
      }),
    });
  }
}
