import {
  normalizeDetectedFeatures,
} from "./FeatureNormalizer.js";

import {
  createMatchEvidence,
} from "./MatchEvidence.js";

import {
  calculateCoverage,
} from "./CoverageCalculator.js";

import {
  createMatchResult,
} from "./MatchResult.js";

function bestFeatureMatch(
  expectedFeatureId,
  detected,
  similarityEngine,
  threshold,
) {
  let best = null;

  for (
    const candidate
    of detected.values()
  ) {
    const similarity =
      similarityEngine.score(
        expectedFeatureId,
        candidate.featureId,
      );

    const effective =
      candidate.confidence *
      similarity;

    if (
      similarity >= threshold &&
      (
        !best ||
        effective >
          best.effective
      )
    ) {
      best = {
        candidate,
        similarity,
        effective,
      };
    }
  }

  return best;
}

function matchRules({
  cellId,
  rules,
  role,
  detected,
  similarityEngine,
  threshold,
}) {
  const evidence = [];

  for (const rule of rules) {
    const best =
      bestFeatureMatch(
        rule.featureId,
        detected,
        similarityEngine,
        threshold,
      );

    evidence.push(
      createMatchEvidence({
        cellId,
        featureId:
          rule.featureId,
        role,
        detected:
          Boolean(best),
        detectedFeatureId:
          best?.candidate
            ?.featureId || null,
        confidence:
          best?.candidate
            ?.confidence || 0,
        similarity:
          best?.similarity || 0,
        weight:
          rule.weight,
        matched:
          Boolean(best),
        sourceCriterionId:
          rule.sourceCriterionId,
        label:
          rule.label,
      }),
    );
  }

  return evidence;
}

export class FeatureMatcher {
  constructor({
    criteriaRegistry,
    aliasRegistry,
    similarityEngine,
    similarityThreshold = 0.8,
  } = {}) {
    if (!criteriaRegistry) {
      throw new TypeError(
        "criteriaRegistry is required.",
      );
    }

    if (!aliasRegistry) {
      throw new TypeError(
        "aliasRegistry is required.",
      );
    }

    if (!similarityEngine) {
      throw new TypeError(
        "similarityEngine is required.",
      );
    }

    this.criteriaRegistry =
      criteriaRegistry;
    this.aliasRegistry =
      aliasRegistry;
    this.similarityEngine =
      similarityEngine;
    this.similarityThreshold =
      similarityThreshold;
  }

  match(
    detectedFeatures,
    {
      specimenType,
    } = {},
  ) {
    const detected =
      normalizeDetectedFeatures(
        detectedFeatures,
        {
          aliasRegistry:
            this.aliasRegistry,
        },
      );

    return this.criteriaRegistry
      .list({
        specimenType,
      })
      .map(
        (definition) =>
          this.matchDefinition(
            definition,
            detected,
          ),
      );
  }

  matchDefinition(
    definition,
    detected,
  ) {
    const groups = {
      required:
        matchRules({
          cellId:
            definition.cellId,
          rules:
            definition.required,
          role: "required",
          detected,
          similarityEngine:
            this.similarityEngine,
          threshold:
            this.similarityThreshold,
        }),
      supportive:
        matchRules({
          cellId:
            definition.cellId,
          rules:
            definition.supportive,
          role: "supportive",
          detected,
          similarityEngine:
            this.similarityEngine,
          threshold:
            this.similarityThreshold,
        }),
      negative:
        matchRules({
          cellId:
            definition.cellId,
          rules:
            definition.negative,
          role: "negative",
          detected,
          similarityEngine:
            this.similarityEngine,
          threshold:
            this.similarityThreshold,
        }),
      exclusion:
        matchRules({
          cellId:
            definition.cellId,
          rules:
            definition.exclusion,
          role: "exclusion",
          detected,
          similarityEngine:
            this.similarityEngine,
          threshold:
            this.similarityThreshold,
        }),
      limitation:
        matchRules({
          cellId:
            definition.cellId,
          rules:
            definition.limitation,
          role: "limitation",
          detected,
          similarityEngine:
            this.similarityEngine,
          threshold:
            this.similarityThreshold,
        }),
    };

    const countMatched =
      (items) =>
        items.filter(
          (item) =>
            item.matched,
        ).length;

    const requiredMatched =
      countMatched(
        groups.required,
      );

    const supportiveMatched =
      countMatched(
        groups.supportive,
      );

    const negativeMatched =
      countMatched(
        groups.negative,
      );

    const exclusionMatched =
      countMatched(
        groups.exclusion,
      );

    const limitationMatched =
      countMatched(
        groups.limitation,
      );

    const coverage =
      calculateCoverage({
        requiredMatched,
        requiredTotal:
          groups.required.length,
        supportiveMatched,
        supportiveTotal:
          groups.supportive.length,
        negativeMatched,
        negativeTotal:
          groups.negative.length,
        exclusionMatched,
        exclusionTotal:
          groups.exclusion.length,
      });

    const evidence = [
      ...groups.required,
      ...groups.supportive,
      ...groups.negative,
      ...groups.exclusion,
      ...groups.limitation,
    ];

    return createMatchResult({
      cellId:
        definition.cellId,
      criteriaId:
        definition.id,
      specimenTypes:
        definition.specimenTypes,
      requiredMatched,
      requiredTotal:
        groups.required.length,
      supportiveMatched,
      supportiveTotal:
        groups.supportive.length,
      negativeMatched,
      negativeTotal:
        groups.negative.length,
      exclusionMatched,
      exclusionTotal:
        groups.exclusion.length,
      limitationMatched,
      limitationTotal:
        groups.limitation.length,
      excluded:
        exclusionMatched > 0,
      coverage,
      evidence,
      detectedFeatures:
        [...detected.values()],
      unmatchedRequired:
        groups.required
          .filter(
            (item) =>
              !item.matched,
          )
          .map(
            (item) =>
              item.featureId,
          ),
      matchedFeatureIds:
        evidence
          .filter(
            (item) =>
              item.matched,
          )
          .map(
            (item) =>
              item.featureId,
          ),
    });
  }
}
