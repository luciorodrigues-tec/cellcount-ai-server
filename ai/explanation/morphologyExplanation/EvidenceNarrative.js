function round(value) {
  return Number(
    Number(value || 0)
      .toFixed(6),
  );
}

function contributionImpact(item) {
  return (
    Number(
      item.appliedContribution || 0,
    ) -
    Number(item.penalty || 0)
  );
}

function sortByAbsoluteImpact(
  first,
  second,
) {
  return (
    Math.abs(
      contributionImpact(second),
    ) -
    Math.abs(
      contributionImpact(first),
    )
  );
}

export function buildEvidenceNarrative(
  winner,
  policy,
) {
  const sourceScore =
    winner?.candidate?.sourceScore || {};

  const contributions =
    [
      ...(sourceScore
        .contributions || []),
    ];

  const supportingEvidence =
    contributions
      .filter(
        (item) =>
          item.matched === true &&
          (
            item.role === "required" ||
            item.role === "supportive"
          ) &&
          Number(
            item.appliedContribution || 0,
          ) > 0,
      )
      .sort(sortByAbsoluteImpact)
      .slice(
        0,
        policy.maxSupportingEvidence,
      )
      .map(
        (item) =>
          Object.freeze({
            featureId:
              item.featureId,
            label:
              item.label ||
              item.featureId,
            role:
              item.role,
            confidence:
              round(item.confidence),
            similarity:
              round(item.similarity),
            weight:
              round(item.weight),
            contribution:
              round(
                item.appliedContribution,
              ),
            sourceCriterionId:
              item.sourceCriterionId,
            statement:
              `${item.label || item.featureId} sustentou a hipótese com contribuição ${round(item.appliedContribution)}.`,
          }),
      );

  const contradictoryEvidence =
    contributions
      .filter(
        (item) =>
          item.matched === true &&
          (
            item.role === "negative" ||
            item.role === "exclusion" ||
            item.role === "limitation"
          ) &&
          Number(item.penalty || 0) > 0,
      )
      .sort(sortByAbsoluteImpact)
      .slice(
        0,
        policy.maxContradictoryEvidence,
      )
      .map(
        (item) =>
          Object.freeze({
            featureId:
              item.featureId,
            label:
              item.label ||
              item.featureId,
            role:
              item.role,
            confidence:
              round(item.confidence),
            similarity:
              round(item.similarity),
            weight:
              round(item.weight),
            penalty:
              round(item.penalty),
            sourceCriterionId:
              item.sourceCriterionId,
            statement:
              `${item.label || item.featureId} reduziu a força da hipótese com penalidade ${round(item.penalty)}.`,
          }),
      );

  const matchEvidence =
    winner?.candidate
      ?.sourceScore
      ?.summary || {};

  const rawEvidence =
    winner?.candidate
      ?.sourceScore
      ?.contributions || [];

  const missingRequiredEvidence =
    rawEvidence
      .filter(
        (item) =>
          item.role === "required" &&
          item.matched !== true,
      )
      .slice(
        0,
        policy.maxMissingRequiredEvidence,
      )
      .map(
        (item) =>
          Object.freeze({
            featureId:
              item.featureId,
            label:
              item.label ||
              item.featureId,
            sourceCriterionId:
              item.sourceCriterionId,
            statement:
              `${item.label || item.featureId} era obrigatório, mas não foi identificado.`,
          }),
      );

  return Object.freeze({
    supportingEvidence:
      Object.freeze(
        supportingEvidence,
      ),
    contradictoryEvidence:
      Object.freeze(
        contradictoryEvidence,
      ),
    missingRequiredEvidence:
      Object.freeze(
        missingRequiredEvidence,
      ),
    coverage: Object.freeze({
      overall:
        Number(
          winner?.coverage || 0,
        ),
      requiredMatched:
        Number(
          matchEvidence
            .requiredMatched || 0,
        ),
      requiredTotal:
        Number(
          matchEvidence
            .requiredTotal || 0,
        ),
      supportiveMatched:
        Number(
          matchEvidence
            .supportiveMatched || 0,
        ),
      supportiveTotal:
        Number(
          matchEvidence
            .supportiveTotal || 0,
        ),
    }),
  });
}
