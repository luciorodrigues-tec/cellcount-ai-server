import {
  mergeHematologicDiagnosticReasoningPolicy,
} from "../domain/HematologicDiagnosticReasoningPolicy.js";

export const HEMATOLOGIC_DIAGNOSTIC_REASONING_ENGINE_VERSION =
  "CRR-000028-v1.0.0";

function normalizeScore(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return 0;
  }
  return Math.max(0, Math.min(1, numeric));
}

function diseaseIdOf(candidate) {
  return (
    candidate?.diseaseId ||
    candidate?.diseaseEntityId ||
    candidate?.id ||
    candidate?.hypothesisId ||
    candidate?.candidateId ||
    null
  );
}

export class HematologicDiagnosticReasoningEngine {
  constructor({ policy = {} } = {}) {
    this.policy =
      mergeHematologicDiagnosticReasoningPolicy(policy);
  }

  reason(input) {
    if (!input?.caseId) {
      throw new TypeError(
        "HematologicDiagnosticReasoningEngine requires a valid input.",
      );
    }

    const patternScoreByDisease = new Map();
    for (const item of input.patternResult?.rankedMatches || []) {
      for (const diseaseId of item.relatedDiseaseIds || []) {
        patternScoreByDisease.set(
          String(diseaseId),
          Math.max(
            patternScoreByDisease.get(String(diseaseId)) || 0,
            normalizeScore(item.score),
          ),
        );
      }
    }

    const syndromeScoreByDisease = new Map();
    const selectedSyndrome =
      input.syndromeResult?.selectedSyndrome || null;

    if (selectedSyndrome) {
      for (const diseaseId of selectedSyndrome.relatedDiseaseIds || []) {
        syndromeScoreByDisease.set(
          String(diseaseId),
          normalizeScore(
            input.syndromeResult?.rankedSyndromes?.[0]?.score ?? 1,
          ),
        );
      }
    }

    const criteriaByDisease = new Map();
    for (const item of input.criteriaResults || []) {
      const diseaseId = String(item.diseaseEntityId || "");
      if (!diseaseId) continue;

      const statusScore =
        item.status === "MET"
          ? 1
          : item.status === "INDETERMINATE"
            ? 0.5
            : 0;

      criteriaByDisease.set(
        diseaseId,
        Math.max(
          criteriaByDisease.get(diseaseId) || 0,
          statusScore,
        ),
      );
    }

    const evidenceByDisease = new Map();
    const evidenceStatusByDisease = new Map();

    for (const item of input.evidenceScores || []) {
      const diseaseId = String(item.hypothesisId || "");
      if (!diseaseId) continue;

      const normalized = Math.max(
        0,
        normalizeScore(
          (Number(item.normalizedScore || 0) + 1) / 2,
        ),
      );

      evidenceByDisease.set(diseaseId, normalized);
      evidenceStatusByDisease.set(
        diseaseId,
        String(item.status || "INSUFFICIENT_EVIDENCE"),
      );
    }

    const selectedClassification =
      input.classificationResult?.selectedClassification || null;

    const classificationDiseaseId =
      diseaseIdOf(selectedClassification);

    const allDiseaseIds = new Set();

    for (const candidate of input.diseaseCandidates || []) {
      const id = diseaseIdOf(candidate);
      if (id) allDiseaseIds.add(String(id));
    }

    for (const map of [
      patternScoreByDisease,
      syndromeScoreByDisease,
      criteriaByDisease,
      evidenceByDisease,
    ]) {
      for (const id of map.keys()) {
        allDiseaseIds.add(id);
      }
    }

    if (classificationDiseaseId) {
      allDiseaseIds.add(String(classificationDiseaseId));
    }

    const reasoning = [];

    for (const diseaseId of allDiseaseIds) {
      const patternScore =
        patternScoreByDisease.get(diseaseId) || 0;
      const syndromeScore =
        syndromeScoreByDisease.get(diseaseId) || 0;
      const criteriaScore =
        criteriaByDisease.get(diseaseId) || 0;
      const evidenceScore =
        evidenceByDisease.get(diseaseId) || 0;
      const classificationScore =
        classificationDiseaseId === diseaseId
          ? 1
          : 0;

      let compositeScore =
        patternScore * this.policy.patternWeight +
        syndromeScore * this.policy.syndromeWeight +
        criteriaScore * this.policy.criteriaWeight +
        evidenceScore * this.policy.evidenceWeight +
        classificationScore *
          this.policy.classificationWeight;

      const evidenceStatus =
        evidenceStatusByDisease.get(diseaseId) ||
        "INSUFFICIENT_EVIDENCE";

      const conflicted =
        evidenceStatus === "CONFLICTED";

      const abstained =
        evidenceStatus === "ABSTAINED";

      if (conflicted) {
        compositeScore = Math.max(
          0,
          compositeScore -
            this.policy.conflictPenalty,
        );
      }

      if (abstained) {
        compositeScore = Math.max(
          0,
          compositeScore -
            this.policy.abstentionPenalty,
        );
      }

      const supported =
        compositeScore >=
          this.policy.minimumSupportScore &&
        !abstained;

      reasoning.push(
        Object.freeze({
          diseaseId,
          patternScore:
            Number(patternScore.toFixed(8)),
          syndromeScore:
            Number(syndromeScore.toFixed(8)),
          criteriaScore:
            Number(criteriaScore.toFixed(8)),
          evidenceScore:
            Number(evidenceScore.toFixed(8)),
          classificationScore:
            Number(classificationScore.toFixed(8)),
          compositeScore:
            Number(compositeScore.toFixed(8)),
          evidenceStatus,
          conflicted,
          abstained,
          supported,
          requiresHumanReview:
            (
              conflicted &&
              this.policy.requireHumanReviewOnConflict
            ) ||
            (
              abstained &&
              this.policy.requireHumanReviewOnAbstention
            ),
        }),
      );
    }

    const ranked = [...reasoning].sort(
      (a, b) =>
        Number(b.supported) -
          Number(a.supported) ||
        b.compositeScore -
          a.compositeScore ||
        a.diseaseId.localeCompare(
          b.diseaseId,
        ),
    );

    const supported =
      ranked.filter(
        (item) => item.supported,
      );

    const top = supported[0] || ranked[0] || null;

    const topTie =
      ranked.length > 1 &&
      top &&
      ranked[1].compositeScore ===
        top.compositeScore;

    const conflictDetected =
      ranked.some(
        (item) => item.conflicted,
      );

    const abstentionDetected =
      ranked.some(
        (item) => item.abstained,
      );

    return Object.freeze({
      engineVersion:
        HEMATOLOGIC_DIAGNOSTIC_REASONING_ENGINE_VERSION,
      caseId: input.caseId,
      evaluatedCount: ranked.length,
      supportedCount: supported.length,
      selectedHypothesis:
        top && top.supported
          ? top
          : null,
      topTie,
      conflictDetected,
      abstentionDetected,
      rankedHypotheses:
        Object.freeze(
          ranked.slice(
            0,
            this.policy.maximumHypotheses,
          ),
        ),
      requiresHumanReview:
        ranked.some(
          (item) =>
            item.requiresHumanReview,
        ) ||
        (
          topTie &&
          this.policy.requireHumanReviewOnTie
        ),
      automationBlocked:
        abstentionDetected &&
        this.policy.blockAutomationOnAbstention,
      explanation: Object.freeze({
        summary:
          top
            ? `Hematologic reasoning ranked ${top.diseaseId} with score ${top.compositeScore.toFixed(4)}.`
            : "No hematologic hypothesis was available for ranking.",
        rationale:
          "The score integrates morphologic patterns, syndromes, criteria, evidence, and classification.",
        safetyStatement:
          "Hematologic diagnostic reasoning is clinical decision support and does not establish a definitive diagnosis.",
      }),
    });
  }
}
