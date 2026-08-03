import {
  MorphologicPatternMatcher,
} from "./MorphologicPatternMatcher.js";

import {
  MorphologicPatternSimilarity,
} from "./MorphologicPatternSimilarity.js";

export const MORPHOLOGIC_PATTERN_RECOGNITION_KNOWLEDGE_ENGINE_VERSION =
  "CRR-000026-v1.0.0";

export class MorphologicPatternRecognitionKnowledgeEngine {
  constructor({
    repository,
    policy,
  } = {}) {
    if (!repository) {
      throw new TypeError(
        "MorphologicPatternRecognitionKnowledgeEngine requires a repository.",
      );
    }

    this.repository = repository;
    this.policy = policy;
    this.matcher =
      new MorphologicPatternMatcher({
        policy,
      });
    this.similarity =
      new MorphologicPatternSimilarity();
  }

  resolve(termOrId) {
    return (
      this.repository.getPattern(termOrId) ||
      this.repository.resolveTerm(termOrId)
    );
  }

  recognize({
    observedFeatureIds = [],
    type = null,
  } = {}) {
    const evaluations =
      this.repository
        .listPatterns({
          type,
          status: "ACTIVE",
        })
        .map((pattern) =>
          this.matcher.match(
            pattern,
            observedFeatureIds,
          ),
        );

    const ranked = [...evaluations].sort(
      (a, b) =>
        Number(b.matched) -
          Number(a.matched) ||
        b.score - a.score ||
        a.patternId.localeCompare(
          b.patternId,
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
        MORPHOLOGIC_PATTERN_RECOGNITION_KNOWLEDGE_ENGINE_VERSION,
      observedFeatureIds:
        Object.freeze([
          ...(Array.isArray(observedFeatureIds)
            ? observedFeatureIds
            : []
          ),
        ]),
      evaluatedCount:
        evaluations.length,
      matchedCount:
        matched.length,
      selectedPattern:
        top
          ? this.repository.getPattern(
              top.patternId,
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
      rankedMatches:
        Object.freeze(
          ranked.slice(
            0,
            this.policy.maximumResults,
          ),
        ),
      safetyStatement:
        "Morphologic pattern recognition organizes observed features and does not establish a definitive diagnosis.",
    });
  }

  comparePatterns(
    leftPatternId,
    rightPatternId,
  ) {
    const left =
      this.repository.getPattern(
        leftPatternId,
      );
    const right =
      this.repository.getPattern(
        rightPatternId,
      );

    if (!left || !right) {
      throw new Error(
        "Both morphologic patterns must be registered.",
      );
    }

    return this.similarity.compare(
      left,
      right,
    );
  }

  detectHierarchyCycle() {
    const visiting = new Set();
    const visited = new Set();

    const visit = (pattern) => {
      if (visiting.has(pattern.id)) {
        return true;
      }

      if (visited.has(pattern.id)) {
        return false;
      }

      visiting.add(pattern.id);

      if (pattern.parentPatternId) {
        const parent =
          this.repository.getPattern(
            pattern.parentPatternId,
          );

        if (parent && visit(parent)) {
          return true;
        }
      }

      visiting.delete(pattern.id);
      visited.add(pattern.id);
      return false;
    };

    for (
      const pattern of
      this.repository.listPatterns()
    ) {
      if (visit(pattern)) {
        return true;
      }
    }

    return false;
  }
}
