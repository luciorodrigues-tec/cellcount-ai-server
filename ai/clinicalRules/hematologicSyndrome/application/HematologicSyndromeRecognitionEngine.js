import {
  HematologicSyndromeMatcher,
} from "./HematologicSyndromeMatcher.js";

export const HEMATOLOGIC_SYNDROME_RECOGNITION_ENGINE_VERSION =
  "CRR-000027-v1.0.0";

export class HematologicSyndromeRecognitionEngine {
  constructor({
    repository,
    policy,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "HematologicSyndromeRecognitionEngine requires a repository.",
      );
    }

    this.repository = repository;
    this.policy = policy;
    this.matcher =
      new HematologicSyndromeMatcher({
        policy,
      });
  }

  recognize({
    matchedPatternIds = [],
    observedFeatureIds = [],
    type = null,
  } = {}) {
    const evaluations =
      this.repository
        .listSyndromes({
          type,
          status: "ACTIVE",
        })
        .map((syndrome) =>
          this.matcher.match(
            syndrome,
            {
              matchedPatternIds,
              observedFeatureIds,
            },
          ),
        );

    const ranked = [...evaluations].sort(
      (a, b) =>
        Number(b.matched) -
          Number(a.matched) ||
        b.score - a.score ||
        a.syndromeId.localeCompare(
          b.syndromeId,
        ),
    );

    const matched =
      ranked.filter(
        (item) => item.matched,
      );

    const top = matched[0] || null;
    const topTie =
      matched.length > 1 &&
      top &&
      matched[1].score === top.score;

    return Object.freeze({
      engineVersion:
        HEMATOLOGIC_SYNDROME_RECOGNITION_ENGINE_VERSION,
      evaluatedCount:
        evaluations.length,
      matchedCount:
        matched.length,
      selectedSyndrome:
        top
          ? this.repository.getSyndrome(
              top.syndromeId,
            )
          : null,
      topTie,
      requiresHumanReview:
        evaluations.some(
          (item) =>
            item.requiresHumanReview,
        ) ||
        (
          topTie &&
          this.policy.requireHumanReviewOnTie
        ),
      rankedSyndromes:
        Object.freeze(
          ranked.slice(
            0,
            this.policy.maximumResults,
          ),
        ),
      safetyStatement:
        "Hematologic syndrome recognition is structured decision support and does not establish a definitive diagnosis.",
    });
  }

  syndromeProfile(syndromeId) {
    const syndrome =
      this.repository.getSyndrome(
        syndromeId,
      );

    if (!syndrome) {
      throw new Error(
        `Unknown hematologic syndrome: ${syndromeId}`,
      );
    }

    return Object.freeze({
      syndrome,
      relations:
        Object.freeze(
          this.repository
            .listRelations()
            .filter(
              (item) =>
                item.sourceSyndromeId ===
                  syndromeId ||
                (
                  item.bidirectional &&
                  item.targetSyndromeId ===
                    syndromeId
                ),
            ),
        ),
      safetyStatement:
        "Syndrome profiles organize knowledge and do not establish a definitive diagnosis.",
    });
  }
}
