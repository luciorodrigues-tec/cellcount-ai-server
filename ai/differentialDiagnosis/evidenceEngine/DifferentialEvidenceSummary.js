function countStrength(
  items,
  strength,
) {
  return items.filter(
    (item) =>
      item.strength === strength,
  ).length;
}

function averageWeight(
  items,
) {
  if (items.length === 0) {
    return 0;
  }

  return Number(
    (
      items.reduce(
        (sum, item) =>
          sum +
          Number(item.weight || 0),
        0,
      ) /
      items.length
    ).toFixed(6),
  );
}

export function buildDifferentialEvidenceSummary({
  pair,
  sharedEvidence,
  winnerEvidence,
  alternativeEvidence,
  missingEvidence,
  conflictEvidence,
  coverage,
}) {
  const weightedEvidence = [
    ...sharedEvidence,
    ...winnerEvidence,
    ...alternativeEvidence,
    ...missingEvidence,
    ...conflictEvidence,
  ].sort(
    (first, second) =>
      Number(second.weight || 0) -
      Number(first.weight || 0),
  );

  const winnerWeight =
    winnerEvidence.reduce(
      (sum, item) =>
        sum +
        Number(item.weight || 0),
      0,
    );

  const alternativeWeight =
    alternativeEvidence.reduce(
      (sum, item) =>
        sum +
        Number(item.weight || 0),
      0,
    );

  const balance =
    Number(
      (
        winnerWeight -
        alternativeWeight
      ).toFixed(6),
    );

  return Object.freeze({
    headline:
      balance > 0
        ? `As evidências diferenciais favorecem ${pair.primaryCell}.`
        : balance < 0
          ? `As evidências diferenciais favorecem ${pair.alternativeCell}.`
          : "As evidências diferenciais permanecem equilibradas.",
    balance,
    winnerWeight:
      Number(
        winnerWeight.toFixed(6),
      ),
    alternativeWeight:
      Number(
        alternativeWeight.toFixed(6),
      ),
    averageWeight:
      averageWeight(
        weightedEvidence,
      ),
    highStrength:
      countStrength(
        weightedEvidence,
        "HIGH",
      ),
    moderateStrength:
      countStrength(
        weightedEvidence,
        "MODERATE",
      ),
    lowStrength:
      countStrength(
        weightedEvidence,
        "LOW",
      ),
    coverage:
      Number(coverage || 0),
    narrative:
      `${sharedEvidence.length} evidências compartilhadas, ${winnerEvidence.length} evidências favoráveis ao vencedor, ${alternativeEvidence.length} favoráveis à alternativa, ${missingEvidence.length} ausentes e ${conflictEvidence.length} conflitantes.`,
    weightedEvidence:
      Object.freeze(
        weightedEvidence,
      ),
  });
}
