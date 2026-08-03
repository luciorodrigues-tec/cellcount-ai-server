import {
  featureConfidence,
} from "../similarityCalculator/ObservedFeatureIndex.js";

import {
  calculateEvidenceWeight,
} from "./EvidenceWeightCalculator.js";

import {
  createDifferentialEvidenceItem,
} from "./DifferentialEvidenceItem.js";

function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

function collectObserved(
  featureIds,
  {
    featureIndex,
    group,
    role,
    favors,
    diagnosticFactor,
    coverage,
    policy,
    statementFactory,
  },
) {
  return featureIds
    .map(
      (featureId) => {
        const confidence =
          featureConfidence(
            featureIndex,
            featureId,
          );

        if (
          confidence <
          policy
            .minimumObservedConfidence
        ) {
          return null;
        }

        const weighted =
          calculateEvidenceWeight({
            confidence,
            diagnosticFactor,
            coverage,
            policy,
          });

        return createDifferentialEvidenceItem({
          id:
            `${group}:${featureId}`,
          featureId,
          group,
          role,
          favors,
          confidence:
            round(confidence),
          coverage:
            round(coverage),
          diagnosticFactor:
            round(
              diagnosticFactor,
            ),
          weight:
            weighted.weight,
          strength:
            weighted.strength,
          observed: true,
          statement:
            statementFactory(
              featureId,
              confidence,
            ),
        });
      },
    )
    .filter(Boolean);
}

function collectMissing(
  featureIds,
  {
    featureIndex,
    group,
    role,
    favors,
    diagnosticFactor,
    coverage,
    policy,
    statementFactory,
  },
) {
  return featureIds
    .map(
      (featureId) => {
        const confidence =
          featureConfidence(
            featureIndex,
            featureId,
          );

        if (
          confidence >=
          policy
            .minimumObservedConfidence
        ) {
          return null;
        }

        const weighted =
          calculateEvidenceWeight({
            confidence: 1,
            diagnosticFactor,
            coverage,
            policy,
          });

        return createDifferentialEvidenceItem({
          id:
            `${group}:${featureId}`,
          featureId,
          group,
          role,
          favors,
          confidence: 0,
          coverage:
            round(coverage),
          diagnosticFactor:
            round(
              diagnosticFactor,
            ),
          weight:
            weighted.weight,
          strength:
            weighted.strength,
          observed: false,
          missing: true,
          statement:
            statementFactory(
              featureId,
            ),
        });
      },
    )
    .filter(Boolean);
}

export function collectSharedEvidence(
  orientedFeatures,
  context,
) {
  return collectObserved(
    orientedFeatures.shared,
    {
      ...context,
      group:
        "SHARED_EVIDENCE",
      role:
        "SHARED",
      favors:
        "BOTH",
      diagnosticFactor:
        context.policy
          .sharedRoleFactor,
      statementFactory:
        (featureId) =>
          `${featureId} foi observado e sustenta ambas as hipóteses.`,
    },
  );
}

export function collectWinnerEvidence(
  orientedFeatures,
  context,
) {
  const direct =
    collectObserved(
      orientedFeatures
        .winnerExclusive,
      {
        ...context,
        group:
          "WINNER_EVIDENCE",
        role:
          "WINNER_EXCLUSIVE",
        favors:
          context.pair
            .primaryCell,
        diagnosticFactor:
          context.policy
            .exclusiveRoleFactor,
        statementFactory:
          (featureId) =>
            `${featureId} favorece ${context.pair.primaryCell}.`,
      },
    );

  const exclusion =
    context.policy
      .includeExclusionEvidence
      ? collectObserved(
          orientedFeatures
            .alternativeExclusion,
          {
            ...context,
            group:
              "WINNER_EVIDENCE",
            role:
              "ALTERNATIVE_EXCLUSION",
            favors:
              context.pair
                .primaryCell,
            diagnosticFactor:
              context.policy
                .exclusionRoleFactor,
            statementFactory:
              (featureId) =>
                `${featureId} reduz a hipótese ${context.pair.alternativeCell} e favorece ${context.pair.primaryCell}.`,
          },
        )
      : [];

  return [
    ...direct,
    ...exclusion,
  ];
}

export function collectAlternativeEvidence(
  orientedFeatures,
  context,
) {
  const direct =
    collectObserved(
      orientedFeatures
        .alternativeExclusive,
      {
        ...context,
        group:
          "ALTERNATIVE_EVIDENCE",
        role:
          "ALTERNATIVE_EXCLUSIVE",
        favors:
          context.pair
            .alternativeCell,
        diagnosticFactor:
          context.policy
            .exclusiveRoleFactor,
        statementFactory:
          (featureId) =>
            `${featureId} favorece ${context.pair.alternativeCell}.`,
      },
    );

  const exclusion =
    context.policy
      .includeExclusionEvidence
      ? collectObserved(
          orientedFeatures
            .winnerExclusion,
          {
            ...context,
            group:
              "ALTERNATIVE_EVIDENCE",
            role:
              "WINNER_EXCLUSION",
            favors:
              context.pair
                .alternativeCell,
            diagnosticFactor:
              context.policy
                .exclusionRoleFactor,
            statementFactory:
              (featureId) =>
                `${featureId} reduz a hipótese ${context.pair.primaryCell} e favorece ${context.pair.alternativeCell}.`,
          },
        )
      : [];

  return [
    ...direct,
    ...exclusion,
  ];
}

export function collectMissingEvidence(
  orientedFeatures,
  context,
) {
  const missing = [];

  if (
    context.policy
      .includeMissingSharedFeatures ===
      true
  ) {
    missing.push(
      ...collectMissing(
        orientedFeatures.shared,
        {
          ...context,
          group:
            "MISSING_EVIDENCE",
          role:
            "MISSING_SHARED",
          favors:
            "BOTH",
          diagnosticFactor:
            context.policy
              .missingRoleFactor,
          statementFactory:
            (featureId) =>
              `${featureId} era compartilhado entre as hipóteses, mas não foi observado.`,
        },
      ),
    );
  }

  if (
    context.policy
      .includeMissingExclusiveFeatures ===
      true
  ) {
    missing.push(
      ...collectMissing(
        orientedFeatures
          .winnerExclusive,
        {
          ...context,
          group:
            "MISSING_EVIDENCE",
          role:
            "MISSING_WINNER_EXCLUSIVE",
          favors:
            context.pair
              .primaryCell,
          diagnosticFactor:
            context.policy
              .missingRoleFactor,
          statementFactory:
            (featureId) =>
              `${featureId} era esperado para ${context.pair.primaryCell}, mas não foi observado.`,
        },
      ),
    );

    missing.push(
      ...collectMissing(
        orientedFeatures
          .alternativeExclusive,
        {
          ...context,
          group:
            "MISSING_EVIDENCE",
          role:
            "MISSING_ALTERNATIVE_EXCLUSIVE",
          favors:
            context.pair
              .alternativeCell,
          diagnosticFactor:
            context.policy
              .missingRoleFactor,
          statementFactory:
            (featureId) =>
              `${featureId} era esperado para ${context.pair.alternativeCell}, mas não foi observado.`,
        },
      ),
    );
  }

  return missing;
}

export function collectConflictEvidence(
  orientedFeatures,
  context,
) {
  const winnerObserved =
    new Set(
      collectObserved(
        orientedFeatures
          .winnerExclusive,
        {
          ...context,
          group:
            "CONFLICT_EVIDENCE",
          role:
            "WINNER_CONFLICT_SOURCE",
          favors:
            context.pair
              .primaryCell,
          diagnosticFactor:
            context.policy
              .conflictRoleFactor,
          statementFactory:
            (featureId) =>
              `${featureId} sustenta ${context.pair.primaryCell}.`,
        },
      ).map(
        (item) =>
          item.featureId,
      ),
    );

  const alternativeObserved =
    new Set(
      collectObserved(
        orientedFeatures
          .alternativeExclusive,
        {
          ...context,
          group:
            "CONFLICT_EVIDENCE",
          role:
            "ALTERNATIVE_CONFLICT_SOURCE",
          favors:
            context.pair
              .alternativeCell,
          diagnosticFactor:
            context.policy
              .conflictRoleFactor,
          statementFactory:
            (featureId) =>
              `${featureId} sustenta ${context.pair.alternativeCell}.`,
        },
      ).map(
        (item) =>
          item.featureId,
      ),
    );

  if (
    winnerObserved.size === 0 ||
    alternativeObserved.size === 0
  ) {
    return [];
  }

  const evidence = [];

  for (const featureId of winnerObserved) {
    const confidence =
      featureConfidence(
        context.featureIndex,
        featureId,
      );

    const weighted =
      calculateEvidenceWeight({
        confidence,
        diagnosticFactor:
          context.policy
            .conflictRoleFactor,
        coverage:
          context.coverage,
        policy:
          context.policy,
      });

    evidence.push(
      createDifferentialEvidenceItem({
        id:
          `CONFLICT_EVIDENCE:${featureId}:WINNER`,
        featureId,
        group:
          "CONFLICT_EVIDENCE",
        role:
          "CROSS_HYPOTHESIS_CONFLICT",
        favors:
          context.pair
            .primaryCell,
        confidence,
        coverage:
          context.coverage,
        diagnosticFactor:
          context.policy
            .conflictRoleFactor,
        weight:
          weighted.weight,
        strength:
          weighted.strength,
        observed: true,
        conflicting: true,
        statement:
          `${featureId} favorece ${context.pair.primaryCell}, enquanto também existem achados exclusivos da hipótese alternativa.`,
      }),
    );
  }

  for (const featureId of alternativeObserved) {
    const confidence =
      featureConfidence(
        context.featureIndex,
        featureId,
      );

    const weighted =
      calculateEvidenceWeight({
        confidence,
        diagnosticFactor:
          context.policy
            .conflictRoleFactor,
        coverage:
          context.coverage,
        policy:
          context.policy,
      });

    evidence.push(
      createDifferentialEvidenceItem({
        id:
          `CONFLICT_EVIDENCE:${featureId}:ALTERNATIVE`,
        featureId,
        group:
          "CONFLICT_EVIDENCE",
        role:
          "CROSS_HYPOTHESIS_CONFLICT",
        favors:
          context.pair
            .alternativeCell,
        confidence,
        coverage:
          context.coverage,
        diagnosticFactor:
          context.policy
            .conflictRoleFactor,
        weight:
          weighted.weight,
        strength:
          weighted.strength,
        observed: true,
        conflicting: true,
        statement:
          `${featureId} favorece ${context.pair.alternativeCell}, enquanto também existem achados exclusivos do vencedor.`,
      }),
    );
  }

  return evidence;
}
